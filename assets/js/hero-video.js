// hero-video.js : JB EMERIC
// Charge la video de fond du hero uniquement sur grand ecran.
//
// ── Pourquoi ────────────────────────────────────────────────────────────────
// Les videos de fond pesent entre 4 et 25 Mo. Sur un telephone en 4G, c'est
// payer cher un decor que personne ne regarde, et la page s'affiche apres.
// Decision de Yoan, 6 aout 2026 : « pour la partie telephone, la solution est
// tres simple, c'est de ne pas mettre ces videos sur la version telephone ».
//
// ── Comment ─────────────────────────────────────────────────────────────────
// Cacher la video en CSS ne suffirait pas : le navigateur la telecharge quand
// meme. La source est donc absente du HTML, rangee dans un data-src, et n'est
// posee qu'apres verification de la largeur. Sur telephone, aucune requete
// n'est emise du tout.
//
// L'attribut poster du <video> prend le relais : l'image reste affichee,
// exactement comme le premier plan de la video. Rien a prevoir de plus.
//
// ── Universel ───────────────────────────────────────────────────────────────
// Aucun identifiant de page, aucun nom de fichier en dur. Toute video portant
// un <source data-src> est traitee, sur n'importe quelle page, presente ou
// future.
(function () {
  var SEUIL = 700   // le meme point de bascule que la nav, voir nav.css

  function charger() {
    if (!window.matchMedia('(min-width: ' + SEUIL + 'px)').matches) return

    var sources = document.querySelectorAll('video > source[data-src]')
    for (var i = 0; i < sources.length; i++) {
      var s = sources[i]
      if (s.getAttribute('src')) continue
      s.setAttribute('src', s.getAttribute('data-src'))
      var v = s.parentNode
      v.load()
      // play() peut etre refuse par le navigateur, ce n'est pas une erreur :
      // le poster reste affiche et la page fonctionne.
      var p = v.play()
      if (p && p.catch) p.catch(function () {})
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', charger)
  } else {
    charger()
  }

  // Un passage en grand ecran apres coup, rotation de tablette par exemple,
  // declenche le chargement. L'inverse ne decharge rien : la video est deja la.
  if (window.matchMedia) {
    var mq = window.matchMedia('(min-width: ' + SEUIL + 'px)')
    if (mq.addEventListener) mq.addEventListener('change', charger)
    else if (mq.addListener) mq.addListener(charger)
  }
})()
