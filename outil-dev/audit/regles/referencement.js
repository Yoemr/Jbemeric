// Regle : balisage de referencement.
//
// Un h1 par page, une canonique qui designe l'URL finale, un title et une
// description presents. Plus la geographie, qui depuis D-020 s'exprime par les
// circuits et jamais par une region.

const DOMAINE = 'https://jbemeric.netlify.app'
const REGIONS = ['PACA', 'Provence · Alpes', 'Région PACA']

module.exports = {
  id: 'referencement',
  titre: 'Referencement',
  reference: 'D-010, D-020, docs/04',

  executer(ctx) {
    const anomalies = []

    for (const p of ctx.pages) {
      const tete = (p.utile.match(/<head[\s\S]*?<\/head>/i) || [''])[0]
      const corps = p.utile.slice(tete.length)

      const h1 = (p.utile.match(/<h1[\s>]/g) || []).length
      if (h1 === 0) anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: 'aucun <h1>' })
      if (h1 > 1) anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `${h1} <h1>, il en faut un seul` })

      if (!/<title[\s>]/i.test(tete)) anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: 'aucun <title>' })
      if (!/name="description"/i.test(tete)) anomalies.push({ niveau: 'tache', ou: p.chemin, quoi: 'aucune meta description' })

      const canon = tete.match(/rel="canonical"\s+href="([^"]+)"/i)
      if (!canon) {
        anomalies.push({ niveau: 'tache', ou: p.chemin, quoi: 'aucune canonique' })
      } else {
        const attendue = p.chemin === 'index.html' ? DOMAINE + '/' : DOMAINE + '/' + p.chemin
        if (canon[1] !== attendue) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `canonique ${canon[1]}, attendue ${attendue}` })
        }
      }

      // Geographie : une region annoncee dans les metadonnees est une faute,
      // dans le corps c'est a juger au cas par cas.
      for (const r of REGIONS) {
        if (tete.includes(r)) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `« ${r} » dans les metadonnees` })
          break
        }
      }
      const dansCorps = REGIONS.reduce((n, r) => n + (corps.split(r).length - 1), 0)
      if (dansCorps) {
        anomalies.push({ niveau: 'signal', ou: p.chemin, quoi: `${dansCorps} mention(s) de region dans le corps, a juger` })
      }
    }

    for (const f of ctx.js) {
      // L'outil d'audit lui-meme cite ces mots comme motifs de recherche.
      // Sans cette exclusion, il se signalerait a chaque execution.
      if (f.chemin.startsWith('outil-dev/audit/')) continue
      for (const r of REGIONS) {
        if (f.code.includes(r)) {
          anomalies.push({ niveau: 'signal', ou: f.chemin, quoi: `« ${r} » dans du JavaScript, verifier si c'est une donnee ou de la redaction` })
          break
        }
      }
    }

    return { anomalies, resume: `${ctx.pages.length} pages inspectees` }
  },
}
