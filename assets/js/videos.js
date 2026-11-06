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
// ── Une miniature, puis la video au toucher ─────────────────────────────────
// Jusqu'au 13 octobre 2026, rien sur telephone : quatre iframes YouTube, c'est
// quatre lecteurs a telecharger pour des videos que personne n'a demandees.
// Yoan, ce jour-la : les videos de la chaine doivent se voir aussi sur
// telephone. Chaque carte montre donc la miniature de la video et un bouton
// de lecture ; l'iframe n'est posee qu'au toucher ou au clic. Meme regle sur
// tous les ecrans : rien ne se charge tant qu'on n'a rien demande.
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
    var id = echapper(v.id)
    return '<div class="yt-card">' +
      '<div class="yt-thumb">' +
        '<button type="button" class="yt-lancer" data-yt="' + id + '" data-titre="' + titreComplet + '"' +
        ' aria-label="Lire la vidéo : ' + titreComplet + '">' +
          // Miniature introuvable : le cadre noir et le bouton suffisent.
          '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
          '<span class="yt-play" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +
      '<div class="yt-info">' +
        '<div class="yt-title">' + titre + '</div>' +
        '<div class="yt-meta"><span>' + echapper(v.theme === 'trajectoires' ? 'Trajectoires' : 'Journée karting') + '</span>' +
        (lieu ? '<span>' + lieu + '</span>' : '') + '</div>' +
      '</div>' +
    '</div>'
  }

  // Le lecteur remplace la miniature et démarre : le toucher valait demande.
  function lancer(bouton) {
    var f = document.createElement('iframe')
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(bouton.getAttribute('data-yt')) + '?rel=0&autoplay=1'
    f.title = bouton.getAttribute('data-titre') || 'Vidéo YouTube'
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    f.setAttribute('allowfullscreen', '')
    bouton.parentNode.replaceChild(f, bouton)
    f.focus()
  }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('.yt-lancer')
    if (b) lancer(b)
  })

  function remplir() {
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

})()
