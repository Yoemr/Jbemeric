// videos.js : JB EMERIC
// Tire au sort des extraits de la chaine YouTube et les pose dans la page.
//
// ── Pourquoi ────────────────────────────────────────────────────────────────
// Demande de Yoan, 6 aout 2026 : « d'abord on fait la structure du site et on
// affiche des videos YouTube aleatoires ». Les videos sont provisoires, elles
// seront refaites par des specialistes du montage. En attendant, la page ne
// doit pas figer huit choix ecrits en dur : la liste vit dans site-data.js et
// la page en montre quelques-unes, differentes a chaque visite.
//
// ── Rien sur telephone ──────────────────────────────────────────────────────
// Meme regle que hero-video.js, meme seuil. Huit iframes YouTube, c'est huit
// connexions a un tiers pour un decor. Ici le script ne construit rien sous le
// seuil, donc aucune requete n'est emise, et le CSS masque la section pour
// qu'on ne voie pas un cadre vide. Les deux sont necessaires : masquer sans
// s'abstenir de construire ferait quand meme payer le telechargement.
//
// ── Universel ───────────────────────────────────────────────────────────────
// Aucun nom de page, aucun identifiant de video en dur. Tout element portant
// data-videos est rempli, sur n'importe quelle page, presente ou future.
//
//   <div class="yt-grid" data-videos></div>            toutes les videos
//   <div class="yt-grid" data-videos="trajectoires"></div>   ce theme seul
//   <div class="yt-grid" data-videos data-videos-n="4"></div>  4 au maximum
//
// ── Ce que ca coute ─────────────────────────────────────────────────────────
// Le titre des videos sort du HTML livre, donc un moteur de recherche ne le
// lit plus. C'est assume pour ce bloc, et pour lui seul : un titre de video
// YouTube ne porte aucun mot-cle qu'on cherche a defendre. La regle inverse
// vaut toujours pour la FAQ et les avis, voir la fiche du 4 aout.
;(function () {
  var SEUIL = 700   // le meme point de bascule que la nav et hero-video.js

  function melanger(liste) {
    // Fisher-Yates sur une copie : la liste d'origine n'est jamais touchee,
    // sinon deux conteneurs sur la meme page se voleraient leur ordre.
    var t = liste.slice()
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = t[i]; t[i] = t[j]; t[j] = tmp
    }
    return t
  }

  function echapper(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function carte(v) {
    var titre = echapper(v.titre)
    var lieu = echapper(v.lieu)
    // Le titre de l'iframe reprend le lieu : c'est ce que lit un lecteur
    // d'ecran, et « Trajectoires sur circuit » tout seul ne dit pas ou.
    var titreComplet = lieu ? titre + ', ' + lieu : titre
    return '<div class="yt-card">' +
      '<div class="yt-thumb">' +
        '<iframe src="https://www.youtube.com/embed/' + echapper(v.id) + '"' +
        ' title="' + titreComplet + '"' +
        ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"' +
        ' allowfullscreen loading="lazy"></iframe>' +
      '</div>' +
      '<div class="yt-info">' +
        '<div class="yt-title">' + titre + '</div>' +
        '<div class="yt-meta"><span>' + echapper(v.theme === 'trajectoires' ? 'Trajectoires' : 'Journée karting') + '</span>' +
        (lieu ? '<span>' + lieu + '</span>' : '') + '</div>' +
      '</div>' +
    '</div>'
  }

  function remplir() {
    if (!window.matchMedia('(min-width: ' + SEUIL + 'px)').matches) return

    var data = window.JBEMERIC_DATA
    var toutes = data && data.videos
    if (!toutes || !toutes.length) return

    var conteneurs = document.querySelectorAll('[data-videos]')
    for (var i = 0; i < conteneurs.length; i++) {
      var c = conteneurs[i]
      if (c.getAttribute('data-videos-fait')) continue   // pas deux fois

      var theme = c.getAttribute('data-videos')
      var choix = theme ? toutes.filter(function (v) { return v.theme === theme }) : toutes
      if (!choix.length) continue

      var combien = parseInt(c.getAttribute('data-videos-n'), 10)
      if (!combien || combien < 1) combien = choix.length

      var html = ''
      var tirees = melanger(choix).slice(0, combien)
      for (var k = 0; k < tirees.length; k++) html += carte(tirees[k])

      c.innerHTML = html
      c.setAttribute('data-videos-fait', '1')
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', remplir)
  } else {
    remplir()
  }

  // Passage en grand ecran apres coup, rotation de tablette par exemple.
  // L'inverse ne vide rien : les iframes sont deja chargees, les retirer ne
  // rendrait pas la bande passante depensee.
  if (window.matchMedia) {
    var mq = window.matchMedia('(min-width: ' + SEUIL + 'px)')
    if (mq.addEventListener) mq.addEventListener('change', remplir)
    else if (mq.addListener) mq.addListener(remplir)
  }
})()
