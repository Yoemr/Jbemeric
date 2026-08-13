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
// Le critere « ce selecteur peut-il correspondre ? » n'est pas ecrit ici. Il
// vit dans vocabulaire.js, partage avec l'outil de nettoyage, parce que deux
// copies finiraient par diverger et que le jour ou elles divergent, l'outil
// supprime ce que la regle croit vivant. Les pieges qu'il absorbe, tous payes
// comptant, sont documentes dans ce fichier et dans LISEZMOI.md.

const vocabulaire = require('../vocabulaire')

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

module.exports = {
  id: 'feuilles-de-style',
  titre: 'Feuilles de style',
  reference: 'CLAUDE.md section 5, avis design du 4 aout 2026',

  executer(ctx) {
    const anomalies = []

    for (const f of ctx.css) {
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
      const v = vocabulaire.pour(f, ctx)
      if (!v.consommatrices.length) {
        anomalies.push({ niveau: 'faute', ou: f.chemin, quoi: 'aucune page ne charge cette feuille' })
        continue
      }
      const sels = selecteursDe(f.code)
      const morts = sels.filter(s => !v.vivant(s))
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
