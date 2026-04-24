// sync-mirror.js — JB EMERIC
// Aspire les sections des pages piliers et les injecte dans index.html
// ZERO template literal · ZERO class ES6 · Compatible tous navigateurs modernes
// Sources : academie.html#portes · coaching.html#formules · track.html#sr-grid

(function () {
'use strict'

// Routes centralisées (routes.js). Permet de déplacer les fichiers sans toucher ce fichier.
var R = (typeof window !== 'undefined' && window.ROUTES) || {}

// Notifie live-editor.js qu'un mirror vient d'être injecté
function notifyMirrorLoaded() {
  document.dispatchEvent(new CustomEvent('jbe-mirror-loaded'))
}


// ─────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  mirrorAcademie()
  mirrorCoaching()
  mirrorTrack()
  mirrorPaddock()
})

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
var _cache = {}

function fetchSection(url, sectionId) {
  var key = url + '#' + sectionId
  if (_cache[key]) return Promise.resolve(_cache[key])
  return fetch(url, { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error(url + ' -> ' + res.status)
      return res.text()
    })
    .then(function (html) {
      var parser = new DOMParser()
      var doc    = parser.parseFromString(html, 'text/html')
      var el     = doc.getElementById(sectionId)
      if (!el) throw new Error('#' + sectionId + ' introuvable dans ' + url)
      _cache[key] = el
      return el
    })
}

function getTarget(id) {
  return document.getElementById(id)
}

function setLoading(target) {
  if (!target) return
  target.innerHTML = ''
    + '<div style="display:flex;gap:12px;padding:8px 0">'
    +   '<div style="flex:1;height:200px;background:rgba(255,255,255,.06);border-radius:8px;animation:jbskel 1.4s ease-in-out infinite"></div>'
    +   '<div style="flex:1;height:200px;background:rgba(255,255,255,.06);border-radius:8px;animation:jbskel 1.4s ease-in-out infinite .2s"></div>'
    +   '<div style="flex:1;height:200px;background:rgba(255,255,255,.06);border-radius:8px;animation:jbskel 1.4s ease-in-out infinite .4s"></div>'
    + '</div>'
  injectSkeletonCSS()
}

function setError(target, url) {
  if (!target) return
  target.innerHTML = '<p style="opacity:.4;font-size:12px;padding:8px 0">Contenu non disponible — <a href="' + url + '" style="color:inherit">voir la page →</a></p>'
}

function injectSkeletonCSS() {
  if (document.getElementById('jb-mirror-css')) return
  var s = document.createElement('style')
  s.id  = 'jb-mirror-css'
  s.textContent = '@keyframes jbskel{0%,100%{opacity:.4}50%{opacity:.8}}'
  document.head.appendChild(s)
}

// ─────────────────────────────────────────────────────────────
//  ACADÉMIE — extrait les 3 portes + le parcours de academie.html
// ─────────────────────────────────────────────────────────────
function mirrorAcademie() {
  var target = getTarget('mirror-academie')
  if (!target) return
  setLoading(target)

  fetch('academie.html', { cache: 'no-store' })
    .then(function(res) {
      if (!res.ok) throw new Error('academie.html -> ' + res.status)
      return res.text()
    })
    .then(function(html) {
      var parser = new DOMParser()
      var doc = parser.parseFromString(html, 'text/html')
      var portesEl   = doc.getElementById('portes')
      var parcoursEl = doc.getElementById('parcours')
      if (!portesEl) throw new Error('#portes introuvable dans academie.html')
      target.innerHTML = buildAcademieCards(portesEl, parcoursEl)
      notifyMirrorLoaded()
    })
    .catch(function (err) {
      console.warn('[mirror] academie:', err.message)
      setError(target, 'academie.html')
    })
}

function buildAcademieCards(section, parcours) {
  var portes = section.querySelectorAll('.porte')
  if (!portes.length) return ''

  // Extraire données des 3 portes
  var data = []
  var hrefs = [R.karting || 'academie-karting.html', R.competition || 'academie-competition.html']
  for (var i = 0; i < portes.length; i++) {
    var p = portes[i]
    var onclick = p.getAttribute('onclick') || ''
    var hrefMatch = onclick.match(/'([^']+)'/)
    data.push({
      href:  hrefMatch ? hrefMatch[1] : hrefs[i] || 'academie.html',
      cls:   p.className,
      inner: p.innerHTML
    })
  }

  if (data.length < 2) return ''

  // Layout B : grande porte gauche + 2 vignettes droite
  var html = '<div class="acad-layout">'

  // Grande porte principale (Karting Enfant)
  html += '<a href="' + data[0].href + '" class="acad-main ' + data[0].cls + '">'
  html += data[0].inner
  html += '</a>'

  // Deux vignettes droite
  html += '<div class="acad-side">'
  for (var j = 1; j < data.length; j++) {
    html += '<a href="' + data[j].href + '" class="acad-side-item ' + data[j].cls + '">'
    html += data[j].inner
    html += '</a>'
  }
  html += '</div>'

  // Bandeau parcours en bas — miroir de academie.html#parcours
  html += buildParcoursBar(parcours)

  html += '</div>'
  return html
}

function buildParcoursBar(parcours) {
  var html = '<div class="acad-parcours">'

  if (parcours) {
    var steps = parcours.querySelectorAll('.tl-step')
    for (var i = 0; i < steps.length; i++) {
      var step    = steps[i]
      var numEl   = step.querySelector('.tl-num')
      var badgeEl = step.querySelector('.tl-badge')
      var nameEl  = step.querySelector('.tl-name')

      var num      = numEl   ? numEl.textContent.trim()   : String(i + 1)
      var badge    = badgeEl ? badgeEl.textContent.trim() : ''
      var name     = nameEl  ? nameEl.textContent.trim()  : ''
      var isFinale = step.classList.contains('tl-step--finale')
      var stepCls  = isFinale ? 'acad-step acad-step-champion' : 'acad-step'
      var numCls   = 'acad-step-n'
      var numDisp  = num

      if (i > 0) html += '<span class="acad-arrow">→</span>'
      html += '<div class="' + stepCls + '">'
      html += '<span class="' + numCls + '">' + numDisp + '</span>'
      html += '<div class="acad-step-info">'
      html += '<div class="acad-step-name">' + badge + '</div>'
      if (name) html += '<div class="acad-step-sub">' + name + '</div>'
      html += '</div></div>'
    }
  } else {
    // Fallback si #parcours introuvable dans academie.html
    html += '<div class="acad-step"><span class="acad-step-n">01</span><div class="acad-step-info"><div class="acad-step-name">Découverte</div><div class="acad-step-sub">Karting enfant · Brignoles · 1 journée</div></div></div>'
    html += '<span class="acad-arrow">→</span>'
    html += '<div class="acad-step"><span class="acad-step-n">02</span><div class="acad-step-info"><div class="acad-step-name">Progression</div><div class="acad-step-sub">5 niveaux · Évaluation JB sur circuit</div></div></div>'
    html += '<span class="acad-arrow">→</span>'
    html += '<div class="acad-step"><span class="acad-step-n">03</span><div class="acad-step-info"><div class="acad-step-name">Compétition</div><div class="acad-step-sub">BMW 325i HTCC · Licence FFSA · Sebring</div></div></div>'
    html += '<span class="acad-arrow">→</span>'
    html += '<div class="acad-step acad-step-champion"><span class="acad-step-n acad-step-star">★</span><div class="acad-step-info"><div class="acad-step-name">Champion</div><div class="acad-step-sub">France 1988 · JB EMERIC</div></div></div>'
  }

  html += '<a href="academie.html" class="acad-parcours-cta">Découvrir l\'Académie →</a>'
  html += '</div>'
  return html
}

// ─────────────────────────────────────────────────────────────
//  COACHING — extrait les 2 panels de coaching.html#formules
// ─────────────────────────────────────────────────────────────
function mirrorCoaching() {
  var target = getTarget('mirror-coaching')
  if (!target) return
  setLoading(target)

  fetchSection('coaching.html', 'formules')
    .then(function (section) {
      var panels = section.querySelectorAll('.offer-card')
      if (!panels.length) { setError(target, 'coaching.html'); return }

      var hrefs = ['coaching.html#amateur', 'coaching.html#competition']
      var wrap = document.createElement('div')
      wrap.className = 'idx-coaching-panels'

      for (var i = 0; i < panels.length && i < 2; i++) {
        var a = document.createElement('a')
        a.href = hrefs[i]
        a.className = panels[i].className
        a.innerHTML = panels[i].innerHTML
        wrap.appendChild(a)
      }

      target.innerHTML = ''
      target.appendChild(wrap)
      notifyMirrorLoaded()
    })
    .catch(function (err) {
      console.warn('[mirror] coaching:', err.message)
      setError(target, 'coaching.html')
    })
}

function buildCoachingCards(section) {
  var panels = section.querySelectorAll('.offer-card')
  if (!panels.length) return ''

  var hrefs = ['coaching.html#amateur', 'coaching.html#competition']
  var cards = ''

  for (var i = 0; i < panels.length && i < 2; i++) {
    var p       = panels[i]
    var tag     = p.querySelector('.flyer-tag')
    var pre     = p.querySelector('.flyer-pretitle')
    var name    = p.querySelector('.flyer-name')
    var hook    = p.querySelector('.flyer-hook')
    var cta     = p.querySelector('.flyer-cta')
    var img     = p.querySelector('img')

    var tagText   = tag  ? tag.textContent.trim()  : ''
    var preText   = pre  ? pre.textContent.trim()  : ''
    var nameText  = name ? name.textContent.trim().replace(/\s+/g,' ') : ''
    var hookText  = hook ? hook.textContent.trim() : ''
    var ctaText   = cta  ? cta.textContent.trim()  : 'En savoir plus →'
    var imgSrc    = img  ? img.src : ''
    // Fallback images si pas d'image dans le panel
    if (!imgSrc) {
      imgSrc = i === 0
        ? 'assets/images/podium-paul-ricard-1994.jpg'
        : 'assets/images/bmw-325i-htcc.jpg'
    }
    var isLight   = p.classList.contains('panel-l')

    cards += '<a href="' + hrefs[i] + '" class="ov-card" style="'
    if (!isLight) cards += 'background:var(--BN);'
    cards += '">'
    cards += '<div class="ov-card-img">'
    if (imgSrc) cards += '<img src="' + imgSrc + '" alt="' + nameText + '" loading="lazy">'
    if (tagText) cards += '<span class="ov-card-badge">' + tagText + '</span>'
    cards += '</div>'
    cards += '<div class="ov-card-body">'
    if (preText)  cards += '<div class="ov-card-num">'  + preText  + '</div>'
    if (nameText) cards += '<div class="ov-card-name">' + nameText + '</div>'
    if (hookText) cards += '<div class="ov-card-sub">'  + hookText.substring(0,100) + (hookText.length>100?'…':'') + '</div>'
    if (ctaText)  cards += '<div class="ov-card-price">' + ctaText + '</div>'
    cards += '</div></a>'
  }

  return '<div class="ov-cards rv d1">' + cards + '</div>'
}

// ─────────────────────────────────────────────────────────────
//  TRACK — extrait les sessions de track.html#sr-grid
// ─────────────────────────────────────────────────────────────
function mirrorTrack() {
  var target = getTarget('mirror-track')
  if (!target) return
  setLoading(target)

  var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
  var SB_KEY  = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var url = SB_URL + '/rest/v1/events?visible_site=eq.true&order=date_event.asc&limit=4&select=date_event,type,prix,status'

  fetch(url, { headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY } })
    .then(function(r) { return r.json() })
    .then(function(events) {
      console.log('[mirror] track events:', events ? events.length : 'null', events)
      var html = buildTrackCardsFromEvents(events)
      target.innerHTML = html || '<p style="opacity:.4;font-size:11px;padding:20px">Aucune session programmée.</p>'
    })
    .catch(function(err) {
      console.warn('[mirror] track:', err.message)
      setError(target, 'track.html')
    })
}

function buildTrackCardsFromEvents(events) {
  if (!events || !events.length) return ''
  var months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
  var cards = ''
  var max = Math.min(events.length, 3)
  for (var i = 0; i < max; i++) {
    var ev = events[i]
    var d = new Date(ev.date_event)
    var dateText = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
    var isOpen = ev.status === 'Open' || ev.status === 'open'
    var badgeCls = isOpen ? 'ov-card-badge ov-card-badge-y' : 'ov-card-badge'
    var badgeText = isOpen ? 'Places disponibles' : 'Complet'
    cards += '<a href="track.html" class="ov-card">'
    cards += '<div class="ov-card-img">'
    if (ev.image_url) cards += '<img src="' + ev.image_url + '" alt="' + (ev.circuit || '') + '" loading="lazy">'
    cards += '<span class="' + badgeCls + '">' + badgeText + '</span>'
    cards += '</div>'
    cards += '<div class="ov-card-body">'
    cards += '<div class="ov-card-num">' + dateText + '</div>'
    cards += '<div class="ov-card-name">' + (ev.type || 'Track-Day') + '</div>'
    // circuit non disponible sans jointure
    if (ev.prix)    cards += '<div class="ov-card-price">' + ev.prix + ' €</div>'
    cards += '</div></a>'
  }
  cards += '<a href="track.html" class="ov-card" style="justify-content:center;align-items:center;min-height:200px;opacity:.6">'
  cards += '<div class="ov-card-body" style="text-align:center">'
  cards += '<div class="ov-card-name">Voir toutes les dates 2026</div>'
  cards += '<div class="ov-card-price">Track-Days &amp; Stages &rarr;</div>'
  cards += '</div></a>'
  return '<div class="ov-cards rv d1">' + cards + '</div>'
}

function buildTrackCards(section) {
  var srcCards = section.querySelectorAll('.sr-card')
  if (!srcCards.length) return ''

  var cards = ''
  // Afficher max 3 cards
  var max = Math.min(srcCards.length, 3)
  for (var i = 0; i < max; i++) {
    var c      = srcCards[i]
    var img    = c.querySelector('img')
    var badge  = c.querySelector('.sr-badge')
    var date   = c.querySelector('.sr-card-date')
    var title  = c.querySelector('.sr-title, h2, .sr-card-title')
    var circuit= c.querySelector('.sr-circuit,.sr-meta')
    var prix   = c.querySelector('.sr-prix,.sr-price')
    var status = c.getAttribute('data-status') || 'open'

    var imgSrc     = img     ? img.src                   : ''
    var imgAlt     = img     ? img.alt                   : ''
    var badgeText  = badge   ? badge.textContent.trim()  : ''
    var dateText   = date    ? date.textContent.trim()   : ''
    var titleText  = title   ? title.textContent.trim()  : ''
    var circuitTxt = circuit ? circuit.textContent.trim(): ''
    var prixText   = prix    ? prix.textContent.trim()   : ''
    var isOpen     = status === 'open'

    cards += '<a href="track.html" class="ov-card">'
    cards += '<div class="ov-card-img">'
    if (imgSrc) cards += '<img src="' + imgSrc + '" alt="' + imgAlt + '" loading="lazy">'
    if (badgeText) {
      var badgeCls = isOpen ? 'ov-card-badge ov-card-badge-y' : 'ov-card-badge'
      cards += '<span class="' + badgeCls + '">' + badgeText + '</span>'
    }
    cards += '</div>'
    cards += '<div class="ov-card-body">'
    if (dateText)   cards += '<div class="ov-card-num">'  + dateText   + '</div>'
    if (titleText)  cards += '<div class="ov-card-name">' + titleText  + '</div>'
    if (circuitTxt) cards += '<div class="ov-card-sub">'  + circuitTxt + '</div>'
    if (prixText)   cards += '<div class="ov-card-price">' + prixText  + '</div>'
    cards += '</div></a>'
  }

  // Bouton "voir toutes les dates"
  cards += '<a href="track.html" class="ov-card" style="justify-content:center;align-items:center;min-height:200px;opacity:.6">'
  cards += '<div class="ov-card-body" style="text-align:center">'
  cards += '<div class="ov-card-name">Voir toutes les dates 2026</div>'
  cards += '<div class="ov-card-price">Track-Days & Stages →</div>'
  cards += '</div></a>'

  return '<div class="ov-cards rv d1">' + cards + '</div>'
}

// ─────────────────────────────────────────────────────────────
//  PADDOCK — threads forum + prochain événement depuis Supabase
// ─────────────────────────────────────────────────────────────
function mirrorPaddock() {
  var target = getTarget('mirror-paddock')
  if (!target) return
  setLoading(target)

  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var H = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  var MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

  // Charger threads + prochain événement en parallèle
  Promise.all([
    fetch(SB_URL + '/rest/v1/forum_threads?visible=eq.true&order=pinned.desc,reply_count.desc&limit=3&select=id,title,tag,author_name,reply_count', { headers: H }).then(function(r) { return r.json() }),
    fetch(SB_URL + '/rest/v1/events?status=eq.Open&visible_site=eq.true&order=date_event.asc&limit=1&select=date_event,type,prix', { headers: H }).then(function(r) { return r.json() })
  ]).then(function(results) {
    var threads = results[0] || []
    var events  = results[1] || []
    var html    = buildPaddockCards(threads, events, MONTHS)
    target.innerHTML = html || '<p style="opacity:.4;font-size:11px;padding:20px">Chargement…</p>'
  }).catch(function(err) {
    console.warn('[mirror] paddock:', err.message)
    setError(target, 'paddock.html')
  })
}

function buildPaddockCards(threads, events, MONTHS) {
  var cards = ''

  // Card prochain événement
  if (events && events[0]) {
    var ev = events[0]
    var d  = new Date(ev.date_event)
    var dateStr = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
    cards += '<a href="track.html" class="ov-card">'
    cards += '<div class="ov-card-img" style="background:linear-gradient(135deg,#040a1e,#0A3D91);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px">'
    cards += '<div style="font-family:\'Bebas Neue\';font-size:42px;color:#FFCF00;line-height:1">' + d.getDate() + '</div>'
    cards += '<div style="font-family:\'DM Mono\';font-size:9px;color:rgba(255,255,255,.6);letter-spacing:2px;text-transform:uppercase">' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + '</div>'
    cards += '<span class="ov-card-badge ov-card-badge-y" style="position:static;margin-top:4px">Prochain</span>'
    cards += '</div>'
    cards += '<div class="ov-card-body">'
    cards += '<div class="ov-card-num">' + dateStr + '</div>'
    cards += '<div class="ov-card-name">' + ev.type + '</div>'
    if (ev.prix) cards += '<div class="ov-card-price">' + ev.prix + ' €</div>'
    cards += '</div></a>'
  }

  // Cards threads forum
  var TAG_COLORS = { meca:'#E85D04', elec:'#3B82F6', chas:'#10B981', data:'#8B5CF6', regl:'#F59E0B', coaching:'#0A3D91' }
  var max = Math.min(threads.length, 2)
  for (var i = 0; i < max; i++) {
    var t = threads[i]
    var color = TAG_COLORS[t.tag] || '#666'
    cards += '<a href="paddock.html#forum" class="ov-card">'
    cards += '<div class="ov-card-img" style="background:#07080f;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:20px">'
    cards += '<div style="font-family:\'DM Mono\';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:' + color + ';border:1px solid ' + color + ';padding:3px 10px;border-radius:20px">' + t.tag + '</div>'
    cards += '<div style="font-family:\'DM Mono\';font-size:11px;color:rgba(255,255,255,.6);text-align:center;max-width:180px">' + (t.reply_count || 0) + ' réponse' + (t.reply_count !== 1 ? 's' : '') + '</div>'
    cards += '</div>'
    cards += '<div class="ov-card-body">'
    cards += '<div class="ov-card-num">Forum Paddock</div>'
    cards += '<div class="ov-card-name">' + t.title.substring(0, 50) + (t.title.length > 50 ? '…' : '') + '</div>'
    cards += '<div class="ov-card-sub">' + (t.author_name || 'JB EMERIC') + '</div>'
    cards += '</div></a>'
  }

  if (!cards) return ''
  return '<div class="ov-cards ov-cards-3 rv d1">' + cards + '</div>'
}


})()
