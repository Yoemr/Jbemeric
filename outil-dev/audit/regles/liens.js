// Regle : liens, ancres et images.
//
// Trois defauts qui ne se voient pas en naviguant vite : une image absente du
// disque, une ancre qui ne correspond a aucun element, un lien qui vise une
// ancienne URL et ne marche que grace a une redirection 301.

const fs = require('fs')
const path = require('path')

// Un identifiant peut ne pas figurer dans le HTML : palmares.html est rendu
// entierement en JavaScript. On accepte donc aussi ceux que les scripts
// fabriquent, sinon la regle crie sur des ancres parfaitement valides.
function idConnu(page, id) {
  return page.ids.has(id) || (page.idsJs && page.idsJs.has(id))
}

// Ancres construites dans du JavaScript, typiquement le menu :
//
//   { href: R.track + '#voiture-perso', label: 'Votre voiture' }
//
// La regle ne lisait que le HTML, et p.sansScripts retire meme les balises
// script. Une entree de menu pouvait donc pointer sur une ancre inexistante
// pendant des mois sans que rien ne le dise. Constate le 8 aout 2026 :
// « Votre voiture » menait a #voiture-perso, absente de track.html.
//
// C'est le menu, c'est-a-dire exactement ce que JB ne saura pas reparer seul.
function ancresDuJavaScript(ctx) {
  const trouvees = []
  for (const f of ctx.js) {
    // R.cle + '#ancre'
    for (const m of f.code.matchAll(/\bR\.([a-zA-Z]+)\s*\+\s*'#([^']+)'/g)) {
      const chemin = ctx.routes[m[1]]
      if (chemin) trouvees.push({ fichier: f.chemin, cible: chemin.replace(/^\//, ''), ancre: m[2] })
    }
    // '/page.html#ancre' ecrit en clair
    for (const m of f.code.matchAll(/'\/?([a-zA-Z0-9/_-]+\.html)#([^']+)'/g)) {
      trouvees.push({ fichier: f.chemin, cible: m[1], ancre: m[2] })
    }
  }
  return trouvees
}

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

      // 2bis. Ancres qui visent une AUTRE page. Verifiees dans cette page-la.
      for (const m of p.sansScripts.matchAll(/href="((?!https?:)[^"#]*\.html)#([^"]+)"/g)) {
        const cible = m[1].replace(/^\.?\//, '')
        const page = ctx.pages.find(x => x.chemin === cible || x.chemin.endsWith('/' + cible))
        if (!page) continue   // la page manquante est deja signalee par la regle 3
        if (!idConnu(page, m[2])) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `ancre #${m[2]} absente de ${page.chemin}` })
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

    // 5. Ancres construites dans du JavaScript, le menu au premier chef.
    const ancresJs = ancresDuJavaScript(ctx)
    for (const a of ancresJs) {
      const page = ctx.pages.find(x => x.chemin === a.cible || x.chemin.endsWith('/' + a.cible))
      if (!page) {
        anomalies.push({ niveau: 'faute', ou: a.fichier, quoi: `pointe vers ${a.cible}, page introuvable` })
        continue
      }
      if (!idConnu(page, a.ancre)) {
        // Le champ « ou » designe la PAGE visee et non le script : c'est elle
        // qui doit porter l'ancre, et c'est elle qui decide du perimetre.
        anomalies.push({
          niveau: 'faute',
          ou: page.chemin,
          quoi: `${a.fichier} pointe sur #${a.ancre}, absente de cette page`,
        })
      }
    }

    return {
      anomalies,
      resume: `${ctx.pages.length} pages inspectees, ${ancresJs.length} ancre(s) construite(s) en JS`,
    }
  },
}
