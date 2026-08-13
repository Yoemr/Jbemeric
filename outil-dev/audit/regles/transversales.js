// Regle : ressources transversales.
//
// Le principe scalable dit qu'une chose commune est ecrite une fois et
// integree par les pages. Le 4 aout 2026, deux pages affichaient trois pieds
// de page, dont un recopie en dur et tronque en plein mot. Le defaut etait
// invisible parce qu'on ne descend jamais en bas d'une page de connexion.

module.exports = {
  id: 'transversales',
  titre: 'Footer, menu et autres ressources uniques',
  reference: 'CLAUDE.md section 5',

  executer(ctx) {
    const anomalies = []

    for (const p of ctx.pages) {
      const aRacineFooter = /id="footer-root"/.test(p.utile)
      const aFooterDur = /<footer[\s>]/i.test(p.utile)
      const chargeFooterJs = /footer\.js/.test(p.utile)
      const aRacineNav = /id="nav-root"/.test(p.utile)
      const chargeNavJs = /nav\.js/.test(p.utile)

      if (aFooterDur) {
        anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: '<footer> ecrit en dur, le pied de page vient de footer.js' })
      }
      if (chargeFooterJs && !aRacineFooter) {
        anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: 'charge footer.js sans <div id="footer-root">, le pied ne s\'affichera pas' })
      }
      if (!chargeFooterJs) {
        anomalies.push({ niveau: 'signal', ou: p.chemin, quoi: 'ne charge pas footer.js, donc aucun pied de page' })
      }
      if (chargeNavJs && !aRacineNav) {
        anomalies.push({ niveau: 'signal', ou: p.chemin, quoi: 'charge nav.js sans <div id="nav-root">' })
      }

      // Fragments de pied recopies a la main, signature du copier-coller
      for (const marqueur of ['ft-tagline', 'ft-social', 'fb-copy', 'footer-bottom']) {
        const dansHtml = (p.utile.match(new RegExp(marqueur, 'g')) || []).length
        if (dansHtml) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `porte « ${marqueur} » en dur, fragment de pied de page recopie` })
          break
        }
      }

      // Ordre de chargement : routes.js doit preceder ses consommateurs.
      // On ne lit que les balises script : chercher le nom du fichier dans
      // tout le HTML ferait tomber sur un commentaire du genre
      // « Chargé par sync-mirror.js », et signalerait un faux desordre.
      const scripts = [...p.utile.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1])
      const iRoutes = scripts.findIndex(s => s.endsWith('routes.js'))
      for (const dependant of ['nav.js', 'footer.js', 'sync-mirror.js']) {
        const i = scripts.findIndex(s => s.endsWith(dependant))
        if (i !== -1 && (iRoutes === -1 || iRoutes > i)) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `${dependant} charge avant routes.js` })
        }
      }
    }

    return { anomalies, resume: `${ctx.pages.length} pages inspectees` }
  },
}
