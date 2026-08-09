// Regle : balisage de referencement.
//
// Un h1 par page, une canonique qui designe l'URL finale, un title et une
// description presents. Plus la geographie, qui depuis D-020 s'exprime par les
// circuits et jamais par une region.

const DOMAINE = 'https://jbemeric.netlify.app'
const REGIONS = ['PACA', 'Provence · Alpes', 'Région PACA']

// Les URL propres declarees dans _redirects, sous la forme
// { 'evenements.html': '/evenements' }. Seules les reecritures comptent :
// une redirection 301 envoie ailleurs, elle ne donne pas un second nom a la
// meme page.
let _propres = null
function urlsPropres(ctx) {
  if (_propres) return _propres
  _propres = {}
  let source = ''
  try { source = ctx.lire('_redirects') } catch (e) { return _propres }
  for (const ligne of source.split('\n')) {
    const t = ligne.trim()
    if (!t || t[0] === '#') continue
    const bouts = t.split(/\s+/)
    if (bouts.length < 3) continue
    const [depuis, vers, code] = bouts
    if (parseInt(code, 10) !== 200) continue
    if (depuis.indexOf('*') !== -1) continue          // un joker ne nomme pas une page
    if (depuis.slice(-1) === '/') continue            // la variante avec barre finale
    const fichier = vers.replace(/^\//, '')
    if (!_propres[fichier]) _propres[fichier] = depuis
  }
  return _propres
}

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
        // La canonique doit designer l'adresse que le visiteur voit, pas le
        // nom du fichier sur le disque. Une page servie sous une URL propre
        // par une reecriture 200 de _redirects a donc cette URL pour
        // canonique, et non son .html.
        //
        // Sans ceci, la regle reclamait /evenements.html le 9 aout 2026 alors
        // que la bonne reponse est /evenements. Declarer une canonique vers
        // le fichier reviendrait a demander a Google d'indexer l'adresse que
        // personne ne partage.
        const propres = urlsPropres(ctx)
        const attendues = [p.chemin === 'index.html' ? DOMAINE + '/' : DOMAINE + '/' + p.chemin]
        if (propres[p.chemin]) attendues.unshift(DOMAINE + propres[p.chemin])

        if (attendues.indexOf(canon[1]) === -1) {
          anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `canonique ${canon[1]}, attendue ${attendues[0]}` })
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
