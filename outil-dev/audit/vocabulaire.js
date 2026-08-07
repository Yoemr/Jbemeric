// vocabulaire.js : ce qu'une page sait porter comme classes, id et balises.
//
// Repondre a « ce selecteur peut-il correspondre a quelque chose ? » demande de
// connaitre le vocabulaire reellement disponible sur les pages qui chargent la
// feuille. Ce n'est pas la liste des classes ecrites dans leur HTML : il faut y
// ajouter ce que le JavaScript fabrique, et ce qu'une autre page leur injecte.
//
// Ce fichier est la SEULE definition de ce critere. La regle d'audit et l'outil
// de nettoyage s'en servent tous les deux. Deux copies finiraient par diverger,
// et le jour ou elles divergent, l'outil supprime ce que la regle croit vivant.
// Le projet connait deja cette panne, voir la regle « renommages ».

// Pages dont le balisage peut atterrir dans « page » a l'execution, parce qu'un
// de ses scripts va les chercher. On lit le code sans les commentaires : un
// « Chargé par academie.html » en commentaire ne prouve rien.
//
// Le ?v=21 de cache-busting se coupe APRES la capture. Le couper dans la classe
// de caracteres, « [^"?]+ », fait rater la balise entiere.
function pagesAspirees(page, ctx) {
  const sources = [...page.utile.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)]
    .map(m => m[1].split('?')[0].replace(/^\.?\//, ''))
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

// Construit le vocabulaire disponible pour une feuille de style donnee.
function pour(feuille, ctx) {
  const nom = feuille.chemin.replace(/^assets\/css\//, '')
  const consommatrices = ctx.pages.filter(p => p.feuilles.some(x => x.endsWith(nom)))

  const classes = new Set(ctx.classesJs)
  const ids = new Set(ctx.classesJs.ids || [])
  const balises = new Set(ctx.classesJs.balises || [])
  for (const p of consommatrices) {
    for (const source of [p, ...pagesAspirees(p, ctx)]) {
      source.classes.forEach(c => classes.add(c))
      source.ids.forEach(i => ids.add(i))
      source.balises.forEach(b => balises.add(b))
    }
  }
  const prefixes = ctx.classesJs.prefixes || new Set()

  // Une classe construite par concatenation, « pal-packed-grid--' + n », laisse
  // un prefixe. Tout selecteur qui commence par lui est considere vivant.
  const classeConnue = c => classes.has(c) || [...prefixes].some(p => c.startsWith(p))

  return {
    consommatrices,

    // Un selecteur est vivant s'il PEUT correspondre. Dans le doute, oui : une
    // regle dont l'action est « supprime ce CSS » doit preferer garder un style
    // inutile plutot qu'en supprimer un vivant.
    vivant(sel) {
      const s = String(sel).trim()
      if (!s || s.startsWith('@') || s.startsWith(':root') || s.startsWith('*')) return true
      if (/^[\d.]+%$/.test(s) || s === 'from' || s === 'to') return true
      const cls = [...s.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(m => m[1])
      const idz = [...s.matchAll(/#([A-Za-z_][\w-]*)/g)].map(m => m[1])
      if (cls.length && !cls.every(classeConnue)) return false
      if (idz.length && !idz.every(i => ids.has(i))) return false
      if (!cls.length && !idz.length) {
        const base = (s.match(/^([a-zA-Z][a-zA-Z0-9]*)/) || [])[1]
        if (base && !balises.has(base.toLowerCase())) return false
      }
      return true
    },
  }
}

module.exports = { pour, pagesAspirees }
