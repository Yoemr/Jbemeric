// sync-mirror.js — JB EMERIC
// Aspire les sections des pages piliers et les injecte dans index.html
// ZERO template literal · ZERO class ES6 · Compatible tous navigateurs modernes
// Sources : academie.html#portes · coaching.html#formules · track.html#sr-grid

(function () {
'use strict'

// ─────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  mirrorAcademie()
  mirrorCoaching()
  mirrorTrack()
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
//  ACADÉMIE — extrait les 3 portes de academie.html#portes
// ─────────────────────────────────────────────────────────────
function mirrorAcademie() {
  var target = getTarget('mirror-academie')
  if (!target) return
  setLoading(target)

  fetchSection('academie.html', 'portes')
    .then(function (section) {
      var html = buildAcademieCards(section)
      target.innerHTML = html
    })
    .catch(function (err) {
      console.warn('[mirror] academie:', err.message)
      setError(target, 'academie.html')
    })
}

function buildAcademieCards(section) {
  var portes = section.querySelectorAll('.porte')
  if (!portes.length) return ''

  var cards = ''
  for (var i = 0; i < portes.length; i++) {
    var p     = portes[i]
    var img   = p.querySelector('img')
    var tag   = p.querySelector('.porte-tag')
    var title = p.querySelector('.porte-title')
    var body  = p.querySelector('.porte-body')
    var cta   = p.querySelector('.porte-cta')
    var badge = p.querySelector('.porte-badge')

    // Extraire l'URL de destination depuis onclick
    var onclick = p.getAttribute('onclick') || ''
    var hrefMatch = onclick.match(/'([^']+)'/)
    var href = hrefMatch ? hrefMatch[1] : 'academie.html'

    // Nettoyer le titre (retirer les <br>)
    var titleText = title ? title.textContent.trim().replace(/\s+/g, ' ') : ''
    var imgSrc    = img   ? img.src  : ''
    var imgAlt    = img   ? img.alt  : titleText
    var tagText   = tag   ? tag.textContent.trim()  : ''
    var bodyText  = body  ? body.textContent.trim() : ''
    var ctaText   = cta   ? cta.textContent.trim()  : 'Découvrir →'
    var badgeText = badge ? badge.textContent.trim() : ''

    cards += '<a href="' + href + '" class="ov-card">'
    cards += '<div class="ov-card-img">'
    if (imgSrc) cards += '<img src="' + imgSrc + '" alt="' + imgAlt + '" loading="lazy">'
    if (badgeText) cards += '<span class="ov-card-badge ov-card-badge-y">' + badgeText + '</span>'
    cards += '</div>'
    cards += '<div class="ov-card-body">'
    if (tagText)  cards += '<div class="ov-card-num">'  + tagText  + '</div>'
    if (titleText) cards += '<div class="ov-card-name">' + titleText + '</div>'
    if (bodyText)  cards += '<div class="ov-card-sub">'  + bodyText  + '</div>'
    if (ctaText)   cards += '<div class="ov-card-price">' + ctaText  + '</div>'
    cards += '</div></a>'
  }

  return '<div class="ov-cards rv d1">' + cards + '</div>'
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
      var html = buildCoachingCards(section)
      target.innerHTML = html
    })
    .catch(function (err) {
      console.warn('[mirror] coaching:', err.message)
      setError(target, 'coaching.html')
    })
}

function buildCoachingCards(section) {
  var panels = section.querySelectorAll('.panel')
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

  fetchSection('track.html', 'sr-grid')
    .then(function (section) {
      var html = buildTrackCards(section)
      target.innerHTML = html
    })
    .catch(function (err) {
      console.warn('[mirror] track:', err.message)
      setError(target, 'track.html')
    })
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

})()
