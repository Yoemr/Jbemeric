/**
 * routes.js — JB EMERIC
 * Source unique de vérité pour toutes les URLs du site.
 * Modifier ce fichier = mise à jour automatique de nav, footer, sync-mirror, etc.
 *
 * Convention : tous les chemins sont ABSOLUS (commencent par /).
 * Associé à <base href="/"> dans chaque HTML pour fonctionner à toute profondeur.
 */
(function() {
  var ROUTES = {
    // ── Hubs principaux (restent à la racine) ──────────────────────
    index:      '/index.html',
    academie:   '/academie.html',
    coaching:   '/coaching.html',
    track:      '/track.html',
    paddock:    '/paddock.html',

    // ── Académie ───────────────────────────────────────────────────
    karting:    '/academie/karting.html',
    competition:'/academie/competition.html',

    // ── Paddock ────────────────────────────────────────────────────
    palmares:   '/paddock/palmares.html',
    voitures:   '/paddock/nos-voitures.html',
    articles:   '/paddock/articles.html',
    article:    '/paddock/article.html',

    // ── Admin ──────────────────────────────────────────────────────
    login:      '/admin/login.html',
    signup:     '/admin/signup.html',
    dashboard:  '/admin/dashboard.html',
    motDePasse: '/admin/mot-de-passe-oublie.html',

    // ── Légal ──────────────────────────────────────────────────────
    contact:       '/admin/legal/contact.html',
    mentionsLegales:'/admin/legal/mentions-legales.html',
    confidentialite:'/admin/legal/confidentialite.html',

    // ── Externes ───────────────────────────────────────────────────
    boutique:   'https://pilotage-jbemeric-marseille.fr',
    youtube:    'https://www.youtube.com/channel/UCMTQjYff8llakx2twVNH2SA',
    instagram:  'https://www.instagram.com/jbemeric.ecoledepilotage/',
    facebook:   'https://www.facebook.com/JBEMERIC.Since1989',
    tiktok:     'https://www.tiktok.com/@stagepilotagejbemeric',
  }

  // Helper : identifier la page courante par son chemin
  // Retourne la clé (ex: 'karting') ou null
  ROUTES.matchCurrent = function() {
    var path = window.location.pathname
    var file = path.split('/').pop() || 'index.html'
    for (var k in ROUTES) {
      if (typeof ROUTES[k] !== 'string') continue
      var r = ROUTES[k]
      if (r.indexOf('http') === 0) continue
      if (r.split('/').pop() === file) return k
    }
    return null
  }

  window.ROUTES = ROUTES

  // ── Favicon centralisée (déclarée une seule fois) ───────────────
  var FAVICON = '/assets/favicon.svg'
  if (!document.querySelector('link[rel="icon"]')) {
    var l1 = document.createElement('link')
    l1.rel = 'icon'; l1.type = 'image/svg+xml'; l1.href = FAVICON
    document.head.appendChild(l1)
    var l2 = document.createElement('link')
    l2.rel = 'shortcut icon'; l2.href = FAVICON
    document.head.appendChild(l2)
  }

  // ── Fix <base href="/"> : les liens fragment-only (#anchor) doivent
  //    scroller dans la page courante, pas naviguer vers la racine.
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href^="#"]')
    if (!a) return
    var href = a.getAttribute('href')
    if (!href || href.length < 2) return
    var el = document.getElementById(href.slice(1))
    if (el) {
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', href)
    }
  })
})()

