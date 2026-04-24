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
    karting:    '/academie-karting.html',
    competition:'/academie-competition.html',

    // ── Paddock ────────────────────────────────────────────────────
    palmares:   '/palmares.html',
    voitures:   '/nos-voitures.html',
    articles:   '/articles.html',
    article:    '/article.html',

    // ── Admin ──────────────────────────────────────────────────────
    login:      '/login.html',
    signup:     '/signup.html',
    dashboard:  '/admin.html',
    motDePasse: '/mot-de-passe-oublie.html',

    // ── Légal ──────────────────────────────────────────────────────
    contact:       '/contact.html',
    mentionsLegales:'/mentions-legales.html',
    confidentialite:'/confidentialite.html',

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
})()
