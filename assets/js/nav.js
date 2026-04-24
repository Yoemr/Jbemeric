/**
 * nav.js — JB EMERIC
 * Injecte la nav et le burger mobile dans chaque page.
 * Marque automatiquement le bon item "active" selon l'URL.
 */
(function() {

  // ── Logo SVG ────────────────────────────────────────────────────
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 38" width="200" height="28">' +
    '<polygon points="14,0 25,0 11,38 0,38" fill="#0A3D91"/>' +
    '<polygon points="32,0 43,0 29,38 18,38" fill="#0A3D91"/>' +
    '<polygon points="50,0 61,0 47,38 36,38" fill="#0A3D91"/>' +
    '<text x="72" y="29" font-family="\'Russo One\',sans-serif" font-size="28" fill="#FFCF00" letter-spacing="2">JB EMERIC</text>' +
    '</svg>'

  // ── Items de navigation ─────────────────────────────────────────
  var NAV_ITEMS = [
    { type:'link', href:'index.html',    key:'index',    label:'Accueil' },
    { type:'sub',  href:'academie.html', key:'academie', label:'Acad&eacute;mie',
      subs:[
        { href:'academie-karting.html',          label:'Formation Karting' },
        { href:'academie-competition.html',      label:'Vers la Comp&eacute;tition' },
      ]
    },
    { type:'link', href:'coaching.html', key:'coaching', label:'Coaching' },
    { type:'sub',  href:'track.html',    key:'track',    label:'Stages &amp; Track-Days',
      subs:[
        { href:'track.html#stages',        label:'Stages voiture' },
        { href:'track.html#trackdays',     label:'Track-Days' },
        { href:'track.html#voitures',      label:'Nos voitures' },
        { href:'track.html#voiture-perso', label:'Votre voiture' },
        { href:'https://pilotage-jbemeric-marseille.fr', label:'Boutique 4x sans frais' },
      ]
    },
    { type:'sub',  href:'paddock.html',  key:'paddock',  label:'Paddock',
      subs:[
        { href:'paddock.html#blog',     label:'Biblioth&egrave;que tech.' },
        { href:'paddock.html#forum',    label:'Forum pilotes' },
        { href:'paddock.html#media',    label:'Cha&icirc;ne YouTube' },
        { href:'paddock.html#events',   label:'Calendrier 2026' },
        { href:'palmares.html',         label:'Palmar&egrave;s' },
      ]
    },
  ]

  // ── Détecter la page active ─────────────────────────────────────
  var PAGE_KEYS = {
    'index.html': 'index', 'academie.html': 'academie',
    'academie-karting.html': 'academie', 'academie-competition.html': 'academie',
    'coaching.html': 'coaching',
    'track.html': 'track', 'paddock.html': 'paddock',
  }
  var pathname = window.location.pathname.split('/').pop() || 'index.html'
  var activeKey = PAGE_KEYS[pathname] || ''

  // ── Construire les items desktop ────────────────────────────────
  function buildDesktopItems() {
    return NAV_ITEMS.map(function(item) {
      var isActive = item.key === activeKey
      if (item.type === 'link') {
        return '<a class="nav-tab' + (isActive ? ' active' : '') + '" href="' + item.href + '">' + item.label + '</a>'
      }
      var subHtml = item.subs.map(function(s) {
        return '<a class="nav-sub-item" href="' + s.href + '">' + s.label + '</a>'
      }).join('')
      return '<div class="nav-tab has-sub' + (isActive ? ' active' : '') + '" onclick="location.href=\'' + item.href + '\'">' +
        item.label +
        '<div class="nav-sub">' + subHtml + '</div>' +
        '</div>'
    }).join('\n')
  }

  // ── Construire les items mobile ──────────────────────────────────
  function buildMobileItems() {
    var items = []
    NAV_ITEMS.forEach(function(item) {
      var isActive = item.key === activeKey
      items.push('<a class="nav-tab' + (isActive ? ' active' : '') + '" href="' + item.href + '">' + item.label + '</a>')
      if (item.subs) {
        item.subs.forEach(function(s) {
          if (!s.href.startsWith('http') && !s.href.includes('#')) {
            items.push('<a class="nav-tab" href="' + s.href + '" style="opacity:.65;font-size:9px">&nbsp;&nbsp;' + s.label + '</a>')
          }
        })
      }
    })
    return items.join('\n')
  }

  // ── Icônes réseaux sociaux ──────────────────────────────────────
  var SOCIALS_HTML =
    '<a class="nav-social" href="https://www.youtube.com/channel/UCMTQjYff8llakx2twVNH2SA" target="_blank" aria-label="YouTube">' +
      '<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.7 15.5V8.5l6.3 3.5-6.3 3.5Z"/></svg>' +
    '</a>' +
    '<a class="nav-social" href="https://www.instagram.com/jbemeric.ecoledepilotage/" target="_blank" aria-label="Instagram">' +
      '<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.6 1.6 4.7 4.7.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.1-1.5 4.6-4.7 4.7-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1C4 21.2 2.5 19.8 2.4 16.6c-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8C2.5 3.8 4 2.3 7.2 2.2c1.2 0 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.1 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg>' +
    '</a>' +
    '<a class="nav-social" href="https://www.facebook.com/JBEMERIC.Since1989" target="_blank" aria-label="Facebook">' +
      '<svg viewBox="0 0 24 24"><path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9v2.3h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"/></svg>' +
    '</a>'

  // ── Auth button ──────────────────────────────────────────────────
  var AUTH_HTML =
    '<div class="nav-auth">' +
      '<a class="nav-btn-login" href="login.html">Se connecter</a>' +
      '<a class="nav-btn-signup" href="signup.html">S\'inscrire</a>' +
    '</div>'

  // ── Injecter la nav ──────────────────────────────────────────────
  var navRoot = document.getElementById('nav-root')
  if (navRoot) {
    navRoot.innerHTML =
      '<button class="nav-burger" id="nav-burger" aria-label="Menu"><span></span><span></span><span></span></button>' +
      '<div class="nav-mobile" id="nav-mobile">' +
        buildMobileItems() +
        '<div class="nav-mobile-socials">' +
          '<a href="https://www.youtube.com/channel/UCMTQjYff8llakx2twVNH2SA" target="_blank" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.7 15.5V8.5l6.3 3.5-6.3 3.5Z"/></svg></a>' +
          '<a href="https://www.instagram.com/jbemeric.ecoledepilotage/" target="_blank" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.6 1.6 4.7 4.7.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.1-1.5 4.6-4.7 4.7-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1C4 21.2 2.5 19.8 2.4 16.6c-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8C2.5 3.8 4 2.3 7.2 2.2c1.2 0 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.1 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg></a>' +
          '<a href="https://www.facebook.com/JBEMERIC.Since1989" target="_blank" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9v2.3h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"/></svg></a>' +
        '</div>' +
      '</div>' +
      '<nav class="nav">' +
        '<a class="nav-logo" href="index.html">' + LOGO_SVG + '</a>' +
        '<div class="nav-tabs">' + buildDesktopItems() + '</div>' +
        '<div class="nav-socials">' + SOCIALS_HTML + '</div>' +
        AUTH_HTML +
      '</nav>'

    // Positionner les nav-sub via JS (position:fixed)
    var hasSubs = navRoot.querySelectorAll('.nav-tab.has-sub')
    hasSubs.forEach(function(tab) {
      tab.addEventListener('mouseenter', function() {
        var sub = tab.querySelector('.nav-sub')
        if (!sub) return
        var rect = tab.getBoundingClientRect()
        sub.style.top  = (rect.bottom + 4) + 'px'
        sub.style.left = Math.max(8, rect.left + rect.width/2 - 90) + 'px'
      })
    })

    // Burger logic
    var burger = document.getElementById('nav-burger')
    var mob    = document.getElementById('nav-mobile')
    if (burger && mob) {
      burger.addEventListener('click', function() {
        var open = mob.classList.toggle('open')
        burger.classList.toggle('open', open)
      })
    }

    // Fermer la nav mobile en cliquant ailleurs
    document.addEventListener('click', function(e) {
      if (mob && burger && !mob.contains(e.target) && !burger.contains(e.target)) {
        mob.classList.remove('open')
        burger.classList.remove('open')
      }
    })
  }

})()
