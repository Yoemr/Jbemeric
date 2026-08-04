// Regle : liens, ancres et images.
//
// Trois defauts qui ne se voient pas en naviguant vite : une image absente du
// disque, une ancre qui ne correspond a aucun element, un lien qui vise une
// ancienne URL et ne marche que grace a une redirection 301.

const fs = require('fs')
const path = require('path')

module.exports = {
  id: 'liens',
  titre: 'Liens, ancres et images',
  reference: 'D-021, releve 2.1 et 2.3',

  executer(ctx) {
    const anomalies = []

    // Toutes les URLs finales connues, pour reperer les liens qui visent autre chose.
    const finales = new Set(Object.values(ctx.routes).filter(v => v.startsWith('/')))
    const fichiersExistants = new Set(ctx.pages.map(p => '/' + p.chemin))

    for (const p of ctx.pages) {
      // 1. Images referencees mais absentes du disque
      for (const m of p.sansScripts.matchAll(/src="((?!https?:|data:)[^"]+)"/g)) {
        const brut = decodeURIComponent(m[1].replace(/^\.?\//, '').split(/[?#]/)[0])
        if (!brut) continue
        if (!fs.existsSync(path.join(ctx.racine, brut))) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `ressource absente du disque : ${m[1]}` })
        }
      }

      // 2. Ancres internes sans element correspondant
      for (const m of p.sansScripts.matchAll(/href="#([^"]+)"/g)) {
        if (!p.ids.has(m[1])) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `ancre #${m[1]} sans element correspondant` })
        }
      }

      // 3. Liens de page vers un chemin qui n'est pas l'URL finale
      for (const m of p.sansScripts.matchAll(/href="((?!https?:|mailto:|tel:|#)[^"]*\.html)([^"]*)"/g)) {
        const cible = m[1].startsWith('/') ? m[1] : '/' + m[1]
        if (finales.has(cible)) continue
        if (fichiersExistants.has(cible)) continue
        anomalies.push({
          niveau: 'tache',
          ou: p.chemin,
          quoi: `lien vers ${m[1]}, qui n'est pas une URL finale et depend de _redirects`,
        })
      }
    }

    // 4. Liens externes ecrits en dur dans du JS alors que routes.js les declare
    const externes = Object.entries(ctx.routes).filter(([, v]) => v.startsWith('http'))
    for (const f of ctx.js) {
      if (f.chemin.endsWith('routes.js')) continue
      for (const [cle, url] of externes) {
        // Le discriminant est href= : une URL stockee comme donnee, par
        // exemple l'inventaire des plateformes de site-data.js, est legitime.
        if (f.code.includes(`href="${url}"`) || f.code.includes(`href='${url}'`)) {
          anomalies.push({
            niveau: 'faute',
            ou: f.chemin,
            quoi: `URL ecrite en dur alors que ROUTES.${cle} la declare`,
          })
        }
      }
    }

    return { anomalies, resume: `${ctx.pages.length} pages inspectees` }
  },
}
