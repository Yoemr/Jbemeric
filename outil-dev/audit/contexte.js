// contexte.js : lecture unique du site, partagee par toutes les regles.
//
// Le but est qu'une regle ne relise jamais le disque. Elle recoit un contexte
// deja construit et se contente de le questionner. C'est ce qui rend l'audit
// instantane meme avec vingt regles.

const fs = require('fs')
const path = require('path')

const RACINE = path.resolve(__dirname, '..', '..')

// Dossiers hors perimetre. old/ est une archive assumee, node_modules et .git
// n'ont rien a faire ici.
const EXCLUS = ['old', '.git', 'node_modules', '.claude', 'docs']

function listerFichiers(ext) {
  const trouves = []
  ;(function parcourir(dossier) {
    for (const entree of fs.readdirSync(dossier, { withFileTypes: true })) {
      if (entree.name.startsWith('.') && entree.name !== '.htaccess') continue
      const complet = path.join(dossier, entree.name)
      const relatif = path.relative(RACINE, complet)
      if (EXCLUS.some(e => relatif === e || relatif.startsWith(e + path.sep))) continue
      if (entree.isDirectory()) parcourir(complet)
      else if (ext.some(x => entree.name.endsWith(x))) trouves.push(relatif)
    }
  })(RACINE)
  return trouves.sort()
}

function lire(relatif) {
  return fs.readFileSync(path.join(RACINE, relatif), 'utf8')
}

// Retire les commentaires HTML, JS et CSS d'une source, pour distinguer ce que
// le visiteur voit de ce que seul un developpeur lit.
function sansCommentaires(source, type) {
  if (type === 'html') return source.replace(/<!--[\s\S]*?-->/g, '')
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

// Le bloc jbe-content-cache contient du texte saisi par JB dans le
// live-editor. Aucune regle ne doit le juger : ce n'est pas notre ecriture.
function sansCacheLiveEditor(html) {
  return html.replace(/<script id="jbe-content-cache"[\s\S]*?<\/script>/g, '')
}

function construire() {
  const pages = listerFichiers(['.html']).map(chemin => {
    const html = lire(chemin)
    const utile = sansCacheLiveEditor(html)
    return {
      chemin,
      html,
      utile,                                   // sans le cache live-editor
      visible: sansCommentaires(utile, 'html'), // sans les commentaires non plus
      classes: new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean)),
      ids: new Set([...html.matchAll(/\bid="([^"]*)"/g)].map(m => m[1])),
      balises: new Set([...html.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)].map(m => m[1].toLowerCase())),
      // Le ?v=21 de cache-busting est retire, sinon aucune feuille ne se
      // reconnait et l'audit croit qu'elles ne sont chargees par personne.
      feuilles: [...html.matchAll(/href="([^"]*\.css)(?:\?[^"]*)?"/g)].map(m => m[1].replace(/^\.?\//, '')),
      // Sans les blocs script : leurs chaines contiennent des src= et des
      // href= construits par concatenation, qui ne sont pas des liens.
      sansScripts: sansCacheLiveEditor(html).replace(/<script[\s\S]*?<\/script>/gi, ''),
    }
  })

  const css = listerFichiers(['.css']).map(chemin => {
    const source = lire(chemin)
    return { chemin, source, code: sansCommentaires(source, 'css') }
  })

  const js = listerFichiers(['.js']).map(chemin => {
    const source = lire(chemin)
    return { chemin, source, code: sansCommentaires(source, 'js') }
  })

  // Classes que les scripts savent fabriquer. Indispensable : sans elles, une
  // regle declarerait morts des styles qui servent a du contenu injecte.
  //
  // Piege trouve le 7 aout : ne lire que le prefixe litteral de class=" ne
  // suffit pas. palmares.js ecrit
  //
  //   'class="pal-year pal-year--heavy' + (isHL ? ' pal-year--highlight' : '')
  //
  // et « pal-year--highlight » echappait a la capture. 107 selecteurs de
  // palmares.css sur 332 etaient declares morts pour cette seule raison.
  //
  // On lit donc aussi les chaines qui suivent immediatement un class=, dans une
  // fenetre courte, et on ne garde que celles qui ressemblent a une liste de
  // classes. La regle se trompe alors du bon cote : retenir un style inutile
  // coute quelques lignes, en supprimer un vivant casse une page.
  const FENETRE = 220
  const RESSEMBLE_A_DES_CLASSES = /^[\s]*[a-zA-Z][\w-]*(?:\s+[a-zA-Z][\w-]*)*[\s]*$/
  const classesJs = new Set()
  const prefixesJs = new Set()   // « pal-packed-grid-- » suivi d'un nombre calcule

  function retenir(brut) {
    for (const c of brut.split(/\s+/).filter(Boolean)) {
      if (c.endsWith('-')) prefixesJs.add(c)
      else classesJs.add(c)
    }
  }

  for (const f of js) {
    for (const m of f.source.matchAll(/class=\\?["']/g)) {
      const zone = f.source.slice(m.index, m.index + FENETRE)
      for (const s of zone.matchAll(/["'`]([^"'`\n]*)["'`]/g)) {
        if (RESSEMBLE_A_DES_CLASSES.test(s[1])) retenir(s[1])
      }
      // Le tout premier litteral colle a class=" n'est pas entoure de deux
      // quotes dans la fenetre, il se lit a part.
      const direct = zone.match(/^class=\\?["']([a-zA-Z][\w -]*)/)
      if (direct) retenir(direct[1])
    }
    for (const m of f.source.matchAll(/classList\.(?:add|toggle|remove)\(\s*'([a-zA-Z][\w-]*)'/g)) {
      classesJs.add(m[1])
    }
  }
  // Une classe construite par concatenation, « pal-packed-grid--' + n », laisse
  // un prefixe. Tout selecteur qui commence par lui est considere vivant.
  classesJs.prefixes = prefixesJs

  // Meme raison pour les balises. palmares.html ne contient aucun <a> ecrit a
  // la main, tout son contenu est fabrique par palmares.js. Sans ceci, le
  // selecteur « a » de palmares.css passait pour mort.
  const balisesJs = new Set()
  for (const f of js) {
    for (const m of f.source.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)[\s>]/g)) balisesJs.add(m[1].toLowerCase())
  }
  classesJs.balises = balisesJs

  // Et pour les identifiants, meme famille de piege, refermee avant qu'elle ne
  // serve : une page rendue en JavaScript n'a aucun de ses id dans son HTML.
  // Une regle en #quelque-chose y passerait pour morte. Aucun cas reel au
  // 7 aout, mais c'est la troisieme fois que ce trou coute cher.
  const idsJs = new Set()
  for (const f of js) {
    for (const m of f.source.matchAll(/\bid=\\?["']([a-zA-Z][\w-]*)/g)) idsJs.add(m[1])
    for (const m of f.source.matchAll(/getElementById\(\s*['"]([a-zA-Z][\w-]*)['"]/g)) idsJs.add(m[1])
  }
  classesJs.ids = idsJs

  // Chemins declares par routes.js, source de verite des URLs construites en JS.
  const routes = {}
  const fichierRoutes = js.find(f => f.chemin.endsWith('routes.js'))
  if (fichierRoutes) {
    for (const m of fichierRoutes.source.matchAll(/^\s*([a-zA-Z]+)\s*:\s*'([^']+)'/gm)) {
      routes[m[1]] = m[2]
    }
  }

  return { racine: RACINE, pages, css, js, classesJs, routes, lire }
}

module.exports = { construire, RACINE }
