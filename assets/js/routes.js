/**
 * routes.js : JB EMERIC
 * Source unique de vérité pour les URLs construites en JavaScript.
 * Modifier ce fichier = mise à jour automatique de nav, footer, sync-mirror.
 *
 * Convention : tous les chemins sont ABSOLUS (commencent par /).
 * Associé à <base href="/"> dans chaque HTML pour fonctionner à toute profondeur.
 *
 * PORTÉE RÉELLE, à ne pas surestimer. Ce fichier ne gouverne que ce qui est
 * assemblé par du JS. Un lien écrit directement dans une page HTML ne peut pas
 * le consulter, et c'est très bien ainsi : un lien statique reste lisible par
 * un moteur de recherche même si le JS ne s'exécute pas. La règle est donc :
 *
 *   - lien construit en JS  -> il DOIT passer par ROUTES
 *   - lien écrit dans le HTML -> chemin absolu final, jamais un ancien chemin
 *     rattrapé par _redirects
 *
 * Le 4 août 2026, sept liens de réseaux sociaux étaient écrits en dur dans
 * nav.js et footer.js alors que ROUTES les déclarait, et vingt-neuf liens de
 * pages visaient d'anciennes URLs. Voir 6.8 de docs/05-etat-des-lieux.md.
 */
(function() {
  var ROUTES = {
    // ── Hubs principaux (restent à la racine) ──────────────────────
    index:      '/index.html',
    academie:   '/academie.html',
    coaching:   '/coaching.html',
    evenements: '/evenements.html',
    paddock:    '/paddock.html',

    // ── Académie ───────────────────────────────────────────────────
    kartingEnfant: '/academie/karting-enfant.html',
    karting:    '/academie/karting-adulte.html',
    competition:'/academie/competition.html',

    // ── Paddock ────────────────────────────────────────────────────
    palmares:   '/paddock/palmares.html',
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
  //
  // La comparaison porte d'abord sur le chemin complet. Le nom de fichier seul
  // ne suffit pas : deux pages homonymes dans des dossiers différents auraient
  // la même clé, et un chemin en /dossier/ renvoyait à tort la clé 'index'.
  // Le repli sur le nom de fichier ne sert que si le chemin exact échoue.
  ROUTES.matchCurrent = function() {
    var path = window.location.pathname || '/'
    if (path === '/') path = ROUTES.index

    function internes(cb) {
      for (var k in ROUTES) {
        if (typeof ROUTES[k] !== 'string') continue
        if (ROUTES[k].indexOf('http') === 0) continue
        var r = cb(k)
        if (r) return r
      }
      return null
    }

    var exact = internes(function(k) { return ROUTES[k] === path ? k : null })
    if (exact) return exact

    var file = path.split('/').pop()
    if (!file) return null
    return internes(function(k) { return ROUTES[k].split('/').pop() === file ? k : null })
  }

  // ── Grand écran : le seul endroit où il est défini ──────────────
  // Décision de Yoan du 6 août 2026 : pas de vidéo sur téléphone. La largeur
  // seule ne suffit pas : un téléphone tenu à l'horizontale fait 844 px de
  // large et chargeait les 45 Mo de l'accueil. La hauteur l'exclut.
  // Lu par hero-video.js, videos.js et live-editor.js ; academie.css porte la
  // même requête en CSS pour la section des vidéos YouTube.
  ROUTES.GRAND_ECRAN = '(min-width: 700px) and (min-height: 600px)'
  // Vidéos de fond : le grand écran, sauf pour un visiteur qui a demandé à
  // son système de réduire les animations. Il garde l'image d'attente, comme
  // un téléphone. Lu par hero-video.js et live-editor.js. videos.js garde
  // GRAND_ECRAN : une vidéo YouTube ne démarre qu'au clic.
  ROUTES.VIDEO_FOND = ROUTES.GRAND_ECRAN + ' and (prefers-reduced-motion: no-preference)'
  ROUTES.MOUVEMENT_REDUIT = '(prefers-reduced-motion: reduce)'

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
      var reduit = window.matchMedia && window.matchMedia(ROUTES.MOUVEMENT_REDUIT).matches
      el.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' })
      // Chemin complet : avec <base href="/">, un « #journee » seul devenait
      // « /#journee », et un rechargement ou un lien partagé menait à l'accueil.
      history.replaceState(null, '', location.pathname + location.search + href)
    }
  })
})()

