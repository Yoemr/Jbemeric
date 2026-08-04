// Regle : sante du JavaScript.
//
// Le 4 aout 2026, track-render.js ne s'evaluait pas du tout : une apostrophe
// non echappee ligne 250. Le fichier etant charge en type="module", le module
// entier etait rejete, donc le calendrier, le vote et la fenetre d'inscription
// de track.html n'existaient tout simplement pas. Le defaut etait present sur
// main depuis des mois.
//
// Un node --check aurait suffi. C'est desormais fait a chaque audit.

const { execFileSync } = require('child_process')
const path = require('path')

module.exports = {
  id: 'javascript',
  titre: 'JavaScript',
  reference: 'D-019, releve 6.3',

  executer(ctx) {
    const anomalies = []

    for (const f of ctx.js) {
      // 1. Le fichier compile-t-il seulement
      try {
        execFileSync(process.execPath, ['--check', path.join(ctx.racine, f.chemin)], { stdio: 'pipe' })
      } catch (e) {
        const detail = String(e.stderr || '').split('\n').find(l => l.includes('Error')) || 'erreur de syntaxe'
        anomalies.push({ niveau: 'faute', ou: f.chemin, quoi: `ne compile pas : ${detail.trim()}` })
        continue
      }

      // 2. Bloc immediatement invoque non protege par un point-virgule.
      //    Sans lui, JS rattache le bloc a l'expression precedente et lit un
      //    appel de fonction sur son resultat.
      const lignes = f.source.split('\n')
      for (let i = 1; i < lignes.length; i++) {
        if (!/^\(\s*(async\s+)?function/.test(lignes[i])) continue
        let j = i - 1
        while (j >= 0 && (!lignes[j].trim() || /^\s*(\/\/|\/\*|\*)/.test(lignes[j]))) j--
        if (j >= 0 && /\)\s*\(\s*\)\s*$/.test(lignes[j].trim())) {
          anomalies.push({
            niveau: 'faute',
            ou: `${f.chemin}:${i + 1}`,
            quoi: 'bloc immediatement invoque precede de })() sans point-virgule, ecrire ;(function',
          })
        }
      }
    }

    return { anomalies, resume: `${ctx.js.length} fichiers verifies` }
  },
}
