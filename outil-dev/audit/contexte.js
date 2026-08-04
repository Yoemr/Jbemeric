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
  const classesJs = new Set()
  for (const f of js) {
    for (const m of f.source.matchAll(/class=\\?["']([a-zA-Z][a-zA-Z0-9 _-]*)/g)) {
      m[1].split(/\s+/).filter(Boolean).forEach(c => classesJs.add(c))
    }
    for (const m of f.source.matchAll(/classList\.(?:add|toggle|remove)\(\s*'([a-zA-Z][\w-]*)'/g)) {
      classesJs.add(m[1])
    }
  }

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
