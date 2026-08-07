// Regle : sante des feuilles de style.
//
// Deux familles de defauts, tous rencontres reellement le 4 aout 2026.
//
// 1. Le selecteur mort. Une regle qui ne peut correspondre a aucun element des
//    pages qui chargent la feuille. contact.css en portait 131 sur 142.
//
// 2. Le piege de structure. Deux blocs :root dans un meme fichier ont la meme
//    specificite : le dernier gagne pour tout le document, y compris pour les
//    regles ecrites entre les deux. paddock.css en avait deux, contradictoires.
//
// Precaution majeure sur les selecteurs morts : les classes fabriquees par le
// JavaScript comptent comme presentes. Sans cela, l'audit conseillerait de
// supprimer le style du calendrier de track.html, construit par track-render.js.
//
// Deuxieme precaution, du meme genre mais plus vicieuse, trouvee le 7 aout.
// index.html ne contient presque rien : sync-mirror.js va chercher des sections
// entieres dans academie.html et coaching.html et les lui injecte. Les classes
// de ce balisage n'apparaissent ni dans index.html, ni en clair dans le script,
// puisqu'elles voyagent dans un innerHTML.
//
// Resultat avant correction : 114 selecteurs d'index.css sur 286 declares morts,
// soit 40 %, alors qu'ils habillent la page d'accueil. Suivre ce conseil aurait
// depouille le haut de l'entonnoir.
//
// D'ou la notion de page aspiree : si une page charge un script qui va chercher
// une autre page en .html, elle herite du vocabulaire de cette page. C'est
// deduit du code, pas d'une liste ecrite a la main, donc un futur miroir sera
// pris en compte tout seul.

function selecteursDe(code) {
  const aplati = code.replace(/@media[^{]*\{/g, '')
  const sortie = []
  for (const m of aplati.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const s of m[1].split(',')) {
      const sel = s.trim()
      if (sel && !sel.startsWith('@')) sortie.push(sel)
    }
  }
  return sortie
}

function peutCorrespondre(sel, classes, ids, balises, prefixes) {
  if (sel.startsWith(':root') || sel.startsWith('*') || /^[\d.]+%$/.test(sel) || sel === 'from' || sel === 'to') return true
  const cls = [...sel.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(m => m[1])
  const idz = [...sel.matchAll(/#([A-Za-z_][\w-]*)/g)].map(m => m[1])
  const connue = c => classes.has(c) || [...prefixes].some(p => c.startsWith(p))
  if (cls.length && !cls.every(connue)) return false
  if (idz.length && !idz.every(i => ids.has(i))) return false
  if (!cls.length && !idz.length) {
    const base = (sel.match(/^([a-zA-Z][a-zA-Z0-9]*)/) || [])[1]
    if (base && !balises.has(base.toLowerCase())) return false
  }
  return true
}

// Pages dont le balisage peut atterrir dans « page » a l'execution, parce
// qu'un de ses scripts va les chercher. On lit f.code, sans les commentaires :
// un « Chargé par academie.html » en commentaire ne prouve rien.
function pagesAspirees(page, ctx) {
  const sources = [...page.utile.matchAll(/<script[^>]*\ssrc="([^"?]+)"/g)].map(m => m[1].replace(/^\.?\//, ''))
  const trouvees = new Set()
  for (const src of sources) {
    const script = ctx.js.find(j => j.chemin === src || j.chemin.endsWith('/' + src))
    if (!script) continue
    for (const m of script.code.matchAll(/fetch\w*\(\s*['"]([^'"]+\.html)['"]/g)) {
      const cible = m[1].replace(/^\.?\//, '')
      const p = ctx.pages.find(x => x.chemin === cible || x.chemin.endsWith('/' + cible))
      if (p && p !== page) trouvees.add(p)
    }
  }
  return [...trouvees]
}

module.exports = {
  id: 'feuilles-de-style',
  titre: 'Feuilles de style',
  reference: 'CLAUDE.md section 5, avis design du 4 aout 2026',

  executer(ctx) {
    const anomalies = []

    for (const f of ctx.css) {
      const nom = f.chemin.replace(/^assets\/css\//, '')

      // Accolades desequilibrees : le fichier est casse, tout le reste est faux
      const ouvre = (f.source.match(/\{/g) || []).length
      const ferme = (f.source.match(/\}/g) || []).length
      if (ouvre !== ferme) {
        anomalies.push({ niveau: 'faute', ou: f.chemin, quoi: `accolades desequilibrees, ${ouvre} ouvrantes pour ${ferme} fermantes` })
        continue
      }

      // Blocs :root multiples
      const racines = (f.code.match(/(^|\})\s*:root\s*\{/g) || []).length
      if (racines > 1) {
        anomalies.push({ niveau: 'faute', ou: f.chemin, quoi: `${racines} blocs :root, le dernier ecrase les precedents pour tout le document` })
      }

      // Media queries vides
      const vides = (f.code.match(/@media[^{]*\{\s*\}/g) || []).length
      if (vides) anomalies.push({ niveau: 'tache', ou: f.chemin, quoi: `${vides} media query vide(s)` })

      // Selecteurs morts, evalues contre les pages qui chargent la feuille
      const consommatrices = ctx.pages.filter(p => p.feuilles.some(x => x.endsWith(nom)))
      if (!consommatrices.length) {
        anomalies.push({ niveau: 'faute', ou: f.chemin, quoi: 'aucune page ne charge cette feuille' })
        continue
      }
      const classes = new Set(ctx.classesJs)
      const ids = new Set(), balises = new Set(ctx.classesJs.balises || [])
      for (const p of consommatrices) {
        for (const source of [p, ...pagesAspirees(p, ctx)]) {
          source.classes.forEach(c => classes.add(c))
          source.ids.forEach(i => ids.add(i))
          source.balises.forEach(b => balises.add(b))
        }
      }
      const prefixes = ctx.classesJs.prefixes || new Set()
      const sels = selecteursDe(f.code)
      const morts = sels.filter(s => !peutCorrespondre(s, classes, ids, balises, prefixes))
      if (morts.length) {
        const part = Math.round((100 * morts.length) / sels.length)
        anomalies.push({
          niveau: part > 40 ? 'faute' : 'tache',
          ou: f.chemin,
          quoi: `${morts.length} selecteur(s) mort(s) sur ${sels.length} (${part} %), ex. ${[...new Set(morts)].slice(0, 4).join(', ')}`,
        })
      }
    }

    return { anomalies, resume: `${ctx.css.length} feuilles inspectees` }
  },
}
