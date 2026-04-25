// live-editor.js — JB EMERIC
// ZERO class ES6 · ZERO template literal · ZERO arrow function
console.log("live-editor.js charge !");
console.log("Configuration OK : Utilisation des colonnes id et content uniquement");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
var sb      = createClient(SB_URL, SB_ANON)

var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'

var SEL = [
  '.hero-title', '.hero-lead', '.hero-kicker', '.hero-sub', '.hero-eyebrow',
  '.ov-desc', '.ov-eyebrow', '.ov-title', '.ov-card-name', '.ov-card-sub', '.ov-card-num', '.ov-card-price',
  '.sh-kick', '.sh-title', '.sh',
  '.flyer-hook', '.flyer-pretitle', '.flyer-tag', '.flyer-cta', '.flyer-name',
  '.pc-lead', '.man-lead', '.porte-tag', '.porte-body', '.porte-cta',
  '.sr-lead', '.body-txt', '.sr-circuit', '.sr-prix',
  '.kicker', '.stat-val', '.stat-key', '.stat-desc',
  '.nl-subtitle', '.art-title', '.art-desc',
  '.ac-title', '.rp-title', '.nv-title', '.r-title', '.cf-text', '.ttl',
  '.man-kicker', '.man-title', '.pc-kicker', '.pc-title', '.pc-body', '.pc-text',
  '.jb-kicker', '.jb-name', '.jb-sub', '.jb-quote',
  '.voie-title', '.voie-desc', '.pilier-title', '.pilier-body',
  '.nv-kicker', '.nv-desc', '.nv-sub', '.nv-name',
  '.promesse-title', '.promesse-sub',
  '.flyer-hook-dark', '.flyer-pretitle-dark', '.flyer-name-dark',
  '.flyer-mod-name', '.flyer-mod-desc', '.flyer-mod-name-dark', '.flyer-mod-desc-dark',
  '.flyer-level', '.flyer-level-dark',
  '.fcard-name', '.fcard-desc', '.fcard-tag',
  '.disc-name', '.disc-desc', '.disc-code',
  '.kart-model', '.kart-desc', '.kart-age',
  '.ac-body', '.nl-kicker', '.nl-title', '.nl-body',
  '.cg-name', '.cg-dept', '.cg-info',
  '.aff-kicker', '.aff-title',
  '.bmw-name', '.bmw-fact', '.bmw-spec',
  '.dot-name', '.dot-desc',
  '.finales-kicker', '.finales-title',
  '.cta-title', '.cta-sub',
  '.sr-kicker', '.sr-title', '.sr-veh-name', '.sr-veh-sub',
  '.tl-name', '.tl-desc',
  '.split-body', '.body-txt-w', '.r-kicker', '.r-body',
  '.rp-kicker', '.rp-desc', '.t-kicker', '.t-text',
  '.stage-name', '.stage-spec', '.stage-body', '.stage-badge', '.stage-header',
  '.sr-badge', '.sr-card-date', '.sr-card-circuit', '.sr-extra-tag',
  '.sr-check-text', '.sr-recap-label', '.sr-recap-val',
  '.sr-modal-title', '.sr-modal-sub',
  '.palm-name', '.palm-detail', '.ps-name', '.ps-info',
  '.card-title', '.card-body', '.hud-label', '.hud-val',
  '.ev-title', '.ev-circuit', '.ev-badge', '.ev-day',
  '.nv-card', '.nv-tag', '.tl-badge', '.porte-title',
  '.finale-date', '.finale-circuit', '.finale-info', '.finale-n',
  '.ci-label', '.ci-val', '.ss-val', '.voie-tag',
  '.fcard-item', '.flyer-mod', '.flyer-mod-dark',
  '.nl-forum-title', '.nl-yt-title', '.nl-event-title', '.nl-event-desc',
  '.nl-article-title', '.nl-article-cat', '.nl-promo-title', '.nl-promo-desc',
  '.yt-title', '.lib-card-title', '.lib-card-cat', '.lib-kicker', '.lib-title',
  '.rp-item', '.rp-name',
  '.palm-yr', '.cf-source', '.kart-cc', '.kart-cc-unit',
  '.t-price', '.t-unit', '.sb', '.pc-src',
  '.bmw-badge', '.dot-zero-label',
  '.active-level', '.active-level-dark', '.flyer-tag-gold', '.jb-tag', '.ss-lbl',
  '.sr-coaching-name', '.sr-coaching-sub', '.sr-confirm-title', '.sr-places-label',
  '.sr-vote-hint', '.stage-item', '.kick', '.kick-w', '.badge', '.badge-y', '.almost',
  '.forum-kicker', '.forum-row-title', '.forum-row-preview',
  '.fp-name', '.fp-content', '.fp-time',
  '.ftag-badge', '.nl-date', '.nl-edition', '.nl-event-sub', '.nl-label',
  '.lib-card-kw', '.lib-card-size', '.ev-mo', '.forum-replies',
  '.rubrik', '.chip', '.ov-tag', '.ov-tag-y', '.ov-card-badge', '.ov-card-badge-y',
  '.snap-track-eyebrow', '.snap-track-title', '.snap-track-sub', '.snap-track-circuits',
  '.nl-masthead-title', '.nl-masthead-sub', '.nl-stat-label', '.nl-stat-val', '.nl-cell-label',
  '.acad-step-name', '.acad-step-sub'
].join(',')

var SEL_UNIV = 'p,h1,h2,h3,h4,h5,h6,span,li,td,th,dt,dd,blockquote,figcaption,cite,label,caption,small,strong,em,b,i,div'

var _db       = {}
var _dbMeta   = {}
var _els      = []
var _imgs     = []
// _vidCtrls supprimé — ctrl ancré au .hero, plus de repositionnement JS
var _dirty    = {}
var _active = null
var _bar    = null

// Anti-flash
var _hs = document.createElement('style')
_hs.textContent = 'body{opacity:0}'
document.head.appendChild(_hs)
function showPage() {
  document.body.style.opacity    = '1'
  document.body.style.transition = 'opacity .18s'
  if (_hs.parentNode) _hs.parentNode.removeChild(_hs)
}

// ─── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  scanElements()
  Promise.all([loadTexts(), sb.auth.getSession()])
    .then(function (results) {
      applyTexts()
      scanImages()
      applyImages()
      injectVideoCSS()
      applyVideoControlsToAll()
      var sess    = results[1]
      var session = (sess && sess.data) ? sess.data.session : null
      var user    = session ? session.user : null
      var meta    = (user && user.user_metadata) ? user.user_metadata : {}
      var role    = meta.role || null
      var isAdmin = (role === 'admin' || role === 'moderateur')
      console.log('[JBE] role:', role, '| isAdmin:', isAdmin)
      updateNav(user, isAdmin)
      if (isAdmin) {
        injectCSS()
        buildBar(user)
        activateEditing()
        activateImages()
      }
      showPage()
    })
    .catch(function (err) { showPage(); console.warn('[JBE]', err) })
})

// ─── SCAN TEXTES ─────────────────────────────
function scanElements() {
  _els = []
  var n = 1

  // ── Phase 1 : sélecteurs connus — IDs stables, compat DB existante ──
  var p1 = document.querySelectorAll(SEL)
  for (var i = 0; i < p1.length; i++) {
    var el = p1[i]
    if (el.closest('nav') || el.closest('footer') || el.closest('svg')) continue
    if (el.querySelector('a,img,button,input,select,textarea')) continue
    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue
    if (!el.id) el.id = 'txt-' + n
    n++
    el.setAttribute('data-orig-html', el.innerHTML)
    el.setAttribute('data-orig', txt)
    if (el.getAttribute('style')) el.setAttribute('data-orig-style', el.getAttribute('style'))
    _els.push(el)
  }

  // ── Phase 2 : scan universel — éléments non couverts par SEL ──
  var u = 1
  var p2 = document.querySelectorAll(SEL_UNIV)
  for (var j = 0; j < p2.length; j++) {
    var el2 = p2[j]
    if (_els.indexOf(el2) !== -1) continue
    if (el2.closest('nav') || el2.closest('footer') || el2.closest('svg')) continue
    if (el2.querySelector('a,img,button,input,select,textarea')) continue
    if (el2.querySelector('p,h1,h2,h3,h4,h5,h6,div,section,article,ul,ol,table,form')) continue
    var txt2 = el2.textContent.trim()
    if (!txt2 || txt2.length < 2) continue
    if (!el2.id) el2.id = 'jbe-u-' + u
    u++
    el2.setAttribute('data-orig-html', el2.innerHTML)
    el2.setAttribute('data-orig', txt2)
    if (el2.getAttribute('style')) el2.setAttribute('data-orig-style', el2.getAttribute('style'))
    _els.push(el2)
  }

  console.log('[JBE] ' + _els.length + ' textes indexes (' + PAGE + ')')
}

// ─── SCAN IMAGES ─────────────────────────────
function scanImages() {
  _imgs = []
  var n = 1
  var all = document.querySelectorAll('img, video')
  for (var i = 0; i < all.length; i++) {
    var img = all[i]
    if (img.closest('nav') || img.closest('footer') || img.closest('svg')) continue
    if (img.id === 'jbe-vid-prev-el') continue // preview interne du modal
    // Récupérer la source (img.src ou <source> enfant pour les vidéos)
    var elSrc = img.src || (img.querySelector && img.querySelector('source') ? img.querySelector('source').getAttribute('src') : '') || ''
    if (!elSrc) continue
    // Exclure les thumbnails YouTube auto-générés (img uniquement — les <video> n'ont pas d'URL youtube)
    if (img.tagName === 'IMG' && (elSrc.indexOf('youtube.com') !== -1 || elSrc.indexOf('youtu.be') !== -1)) continue
    // Exclure les images des cards gérées depuis le Dashboard
    if (img.closest('.ov-card-img')) continue   // cards miroir index
    if (img.closest('.sr-card'))     continue   // cards track-days
    if (img.closest('[data-dashboard]')) continue // marqueur générique
    if (!img.id) img.id = 'img-' + n
    n++
    img.setAttribute('data-orig-src', elSrc)
    _imgs.push(img)
  }
  console.log('[JBE] ' + _imgs.length + ' images indexees (' + PAGE + ')')
}

// ─── CHARGEMENT ──────────────────────────────
function _loadFromCache() {
  var cacheEl = document.getElementById('jbe-content-cache')
  if (!cacheEl) return
  try {
    var cached = JSON.parse(cacheEl.textContent || '{}')
    var n = 0
    for (var k in cached) {
      if (cached[k]) { _db[k] = cached[k]; n++ }
    }
    console.log('[JBE] Fallback cache HTML: ' + n + ' entree(s)')
  } catch (e) { console.warn('[JBE] Cache parse error', e) }
}

function loadTexts() {
  return sb.from('site_content').select('*')
    .then(function (res) {
      if (res.error) { console.warn('[JBE]', res.error.message); _loadFromCache(); return }
      if (res.data) {
        for (var i = 0; i < res.data.length; i++) {
          if (res.data[i].id && res.data[i].content) {
            _db[res.data[i].id] = res.data[i].content
            if (res.data[i].media_type) _dbMeta[res.data[i].id] = res.data[i].media_type
          }
        }
        console.log('[JBE] ' + res.data.length + ' entree(s) Supabase')
      }
    })
    .catch(function (e) { console.warn('[JBE]', e.message); _loadFromCache() })
}

function applyTexts() {
  for (var i = 0; i < _els.length; i++) {
    var el  = _els[i]
    var key = PAGE + '__' + el.id
    if (!_db[key]) continue
    var origHtmlTemplate = el.getAttribute('data-orig-html') || ''
    var hasStructure = /<(em|span|b|strong|i|br)\b/i.test(origHtmlTemplate)
    var rebuilt = rebuildHTML(el, _db[key])
    if (hasStructure && !/<(em|span|b|strong|i|br)\b/i.test(rebuilt)) {
      console.log('[JBE] Corruption detectee, ignoree:', key)
      continue
    }
    el.innerHTML = rebuilt
    var origStyle = el.getAttribute('data-orig-style') || ''
    if (origStyle) el.setAttribute('style', origStyle)
    console.log('[JBE] Applique:', key)
  }
}

function _makeVideoFromImg(img, url) {
  var vid = document.createElement('video')
  vid.id        = img.id
  vid.className = img.className
  var cs = window.getComputedStyle(img)
  vid.setAttribute('style', img.getAttribute('style') || '')
  vid.style.position  = cs.position
  vid.style.width     = cs.width
  vid.style.height    = cs.height
  vid.style.objectFit = cs.objectFit
  vid.style.top       = cs.top
  vid.style.left      = cs.left
  vid.style.right     = cs.right
  vid.style.bottom    = cs.bottom
  vid.src      = url
  vid.autoplay = true
  vid.muted    = true
  vid.volume   = 0.1
  vid.loop     = true
  vid.setAttribute('playsinline', '')
  return vid
}


function _addVideoControls(vid) {
  if (vid.dataset.jbeCtrl) return
  vid.dataset.jbeCtrl = '1'

  var cs  = window.getComputedStyle(vid)
  var pos = cs.position
  var wrap = document.createElement('div')
  wrap.className = 'jbe-vid-wrap'

  if (pos === 'absolute' || pos === 'fixed') {
    // Vidéo positionnée : copier inset uniquement, pas width/height (évite 0px au DOMContentLoaded)
    wrap.style.position = pos
    wrap.style.top      = cs.top
    wrap.style.left     = cs.left
    wrap.style.right    = cs.right
    wrap.style.bottom   = cs.bottom
    if (cs.zIndex !== 'auto') wrap.style.zIndex = cs.zIndex
  } else {
    // Vidéo en flux : wrapper relatif avec dimensions computées
    wrap.style.position = 'relative'
    wrap.style.display  = 'block'
    wrap.style.width    = cs.width
    wrap.style.height   = cs.height
  }

  vid.parentNode.insertBefore(wrap, vid)
  wrap.appendChild(vid)

  // Réinitialiser le style inline de la vidéo (supprime inset, z-index, etc.)
  vid.style.cssText = 'position:static;width:100%;height:100%;object-fit:' + cs.objectFit + ';object-position:' + cs.objectPosition + ';display:block'

  vid.volume = 0.1

  var ctrl = document.createElement('div')
  ctrl.className = 'jbe-vid-ctrl'

  var btnPlay = document.createElement('button')
  btnPlay.className   = 'jbe-vid-btn jbe-vid-play'
  btnPlay.textContent = '\u23F8'
  btnPlay.title       = 'Pause / Lecture'

  var volWrap = document.createElement('div')
  volWrap.className = 'jbe-vid-vol-wrap'

  var btnMute = document.createElement('button')
  btnMute.className   = 'jbe-vid-btn jbe-vid-mute'
  btnMute.textContent = '\uD83D\uDD07'
  btnMute.title       = 'Son'

  var volSlider = document.createElement('input')
  volSlider.type      = 'range'
  volSlider.className = 'jbe-vid-vol'
  volSlider.min       = '0'
  volSlider.max       = '1'
  volSlider.step      = '0.05'
  volSlider.value     = '0.1'

  volWrap.appendChild(btnMute)
  volWrap.appendChild(volSlider)
  ctrl.appendChild(btnPlay)
  ctrl.appendChild(volWrap)
  var heroSection = vid.closest ? vid.closest('.hero') : null
  ;(heroSection || document.body).appendChild(ctrl)

  btnPlay.addEventListener('click', function(e) {
    e.stopPropagation()
    if (vid.paused) { vid.play();  btnPlay.textContent = '\u23F8' }
    else            { vid.pause(); btnPlay.textContent = '\u25B6' }
  })

  btnMute.addEventListener('click', function(e) {
    e.stopPropagation()
    vid.muted = !vid.muted
    if (vid.muted) {
      btnMute.textContent = '\uD83D\uDD07'
      volSlider.value = '0'
    } else {
      vid.volume = volSlider.value > 0 ? parseFloat(volSlider.value) : 0.1
      volSlider.value = vid.volume
      btnMute.textContent = '\uD83D\uDD0A'
    }
  })

  volSlider.addEventListener('input', function(e) {
    e.stopPropagation()
    vid.volume = parseFloat(volSlider.value)
    vid.muted  = (vid.volume === 0)
    btnMute.textContent = vid.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'
  })
}

function applyVideoControlsToAll() {
  var vids = document.querySelectorAll('video')
  for (var i = 0; i < vids.length; i++) {
    if (vids[i].id === 'jbe-vid-prev-el') continue
    _addVideoControls(vids[i])
  }
}

function applyImages() {
  for (var i = 0; i < _imgs.length; i++) {
    var img = _imgs[i]
    var key = PAGE + '__' + img.id
    if (!_db[key]) continue
    if (_dbMeta[key] === 'video') {
      if (img.tagName === 'VIDEO') continue // déjà une vidéo, pas de re-conversion
      var vid = _makeVideoFromImg(img, _db[key])
      img.parentNode.replaceChild(vid, img)
      _imgs[i] = vid  // mettre à jour la référence : l'<img> est retiré du DOM
      _addVideoControls(vid)
    } else {
      img.src = _db[key]
    }
  }
}

// ─── NAV ─────────────────────────────────────
function updateNav(user, isAdmin) {
  if (!user) return
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'Admin')
  var desk = document.querySelector('.nav-auth')
  if (desk) {
    desk.innerHTML = '<span class="nav-btn-user">' + prenom + '</span>'
      + '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  var mob = document.querySelector('.nav-mobile-cta') || document.querySelector('.nav-mobile-auth')
  if (mob) {
    mob.innerHTML = '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  window.__jbeOut = function () {
    sb.auth.signOut().then(function () { location.reload() })
  }
}

// ─── EDITION TEXTE ───────────────────────────
function activateEditing() {
  // Rescan immédiat : capture les miroirs chargés pendant l'auth (race condition)
  scanElements()
  applyTexts()

  var pencil = document.createElement('button')
  pencil.id             = 'jbe-pencil-global'
  pencil.type           = 'button'
  pencil.textContent    = '\u270e'
  pencil.title          = 'Modifier'
  pencil.style.opacity  = '0'
  pencil.style.pointerEvents = 'none'
  document.body.appendChild(pencil)

  var _hoverEl   = null
  var _hideTimer = null

  function showPencil(el, x, y) {
    clearTimeout(_hideTimer)
    _hoverEl = el
    var pSize = 28
    var pLeft = x + 6
    var pTop  = y - pSize / 2
    if (pLeft + pSize > window.innerWidth  - 4) { pLeft = x - pSize - 6 }
    if (pTop < 60)                              { pTop  = 60 }
    if (pTop + pSize > window.innerHeight  - 8) { pTop  = window.innerHeight - pSize - 8 }
    pencil.style.top           = pTop + 'px'
    pencil.style.left          = pLeft + 'px'
    pencil.style.opacity       = '1'
    pencil.style.pointerEvents = 'auto'
  }

  function hidePencil() {
    _hideTimer = setTimeout(function () {
      pencil.style.opacity       = '0'
      pencil.style.pointerEvents = 'none'
      _hoverEl = null
    }, 800)
  }

  for (var i = 0; i < _els.length; i++) {
    bindElement(_els[i], showPencil, hidePencil)
  }

  pencil.addEventListener('mouseenter', function () {
    clearTimeout(_hideTimer)
  })
  pencil.addEventListener('mouseleave', hidePencil)
  pencil.addEventListener('click', function (e) {
    e.preventDefault()
    e.stopPropagation()
    if (_hoverEl) {
      var el = _hoverEl
      _hoverEl = null
      pencil.style.opacity       = '0'
      pencil.style.pointerEvents = 'none'
      clearTimeout(_hideTimer)
      startEdit(el)
    }
  })

  document.addEventListener('click', function (e) {
    if (!_active) return
    if (_active.contains(e.target)) return
    if (e.target === pencil) return
    var brBtn2 = document.getElementById('jbe-br-float')
    if (brBtn2 && brBtn2.contains(e.target)) return
    stopEdit(_active, true)
  })

  // Bouton saut de ligne flottant — affiché pendant l'édition
  var brFloat = document.createElement('button')
  brFloat.id          = 'jbe-br-float'
  brFloat.type        = 'button'
  brFloat.textContent = '↵'
  brFloat.title       = 'Insérer un saut de ligne (cliquer encore pour supprimer)'
  brFloat.style.opacity      = '0'
  brFloat.style.pointerEvents = 'none'
  document.body.appendChild(brFloat)
  brFloat.addEventListener('click', function (e) {
    e.preventDefault()
    e.stopPropagation()
    window.__jbeInsertBr()
  })
  window.__jbeBrFloat = brFloat

  // Rescan textes après injection dynamique (sync-mirror.js, paddock, etc.)
  document.addEventListener('jbe-mirror-loaded', function () {
    var prevCount = _els.length
    scanElements()
    applyTexts()
    for (var ni = prevCount; ni < _els.length; ni++) {
      bindElement(_els[ni], showPencil, hidePencil)
    }
    if (_els.length > prevCount) {
      console.log('[JBE] Rescan mirror: ' + _els.length + ' textes au total')
    }
  })
}

function bindElement(el, showPencil, hidePencil) {
  el.addEventListener('mouseenter', function (e) {
    if (_active === el) return
    el.classList.add('jbe-hover')
    var rect = el.getBoundingClientRect()
    showPencil(el, rect.right, rect.top)
  })
  el.addEventListener('mouseleave', function () {
    el.classList.remove('jbe-hover')
    hidePencil()
  })
}

function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  if (_active === el) return
  _active = el
  el.classList.remove('jbe-hover')
  el.classList.add('jbe-editing')
  console.log('[JBE] startEdit:', el.id)

  // Si l'élément a un <br> → overlay input simple
  var origHtml = el.getAttribute('data-orig-html') || ''
  if (origHtml.indexOf('<br') >= 0) {
    startEditOverlay(el)
    return
  }

  el._origStyle = el.getAttribute('style') || ''
  var cs = window.getComputedStyle(el)
  el.style.setProperty('font-size',      cs.fontSize,      'important')
  el.style.setProperty('line-height',    cs.lineHeight,    'important')
  el.style.setProperty('font-family',    cs.fontFamily,    'important')
  el.style.setProperty('font-weight',    cs.fontWeight,    'important')
  el.style.setProperty('letter-spacing', cs.letterSpacing, 'important')
  el.style.setProperty('text-transform', cs.textTransform, 'important')
  el.style.setProperty('color',          cs.color,         'important')
  el.contentEditable = 'true'
  el.spellcheck      = false
  el.style.cursor    = 'text'
  el.focus()
  try {
    var r = document.createRange()
    var s = window.getSelection()
    r.selectNodeContents(el)
    r.collapse(false)
    if (s) { s.removeAllRanges(); s.addRange(r) }
  } catch (err) {}
  el._p = function (e) { onPaste(e) }
  el._k = function (e) { onKey(e, el) }
  el._i = function ()  { onInput(el) }
  el.addEventListener('paste',   el._p)
  el.addEventListener('keydown', el._k)
  el.addEventListener('input',   el._i)
  // Positionner le bouton BR en bas à droite de l'élément en édition
  var brFloat = window.__jbeBrFloat
  if (brFloat) {
    var elRect = el.getBoundingClientRect()
    var brSize = 32
    var brTop  = elRect.bottom - brSize - 4
    var brLeft = elRect.right  + 8
    if (brLeft + brSize > window.innerWidth  - 8) { brLeft = elRect.right - brSize - 4 }
    if (brTop  + brSize > window.innerHeight - 8) { brTop  = window.innerHeight - brSize - 8 }
    brFloat.style.top           = Math.max(8, brTop)  + 'px'
    brFloat.style.left          = Math.max(8, brLeft) + 'px'
    brFloat.style.opacity       = '1'
    brFloat.style.pointerEvents = 'auto'
  }
  console.log('[JBE] startEdit:', el.id)
  setStatus('\u270e Modifiez \u00b7 Entr\u00e9e = sauvegarder \u00b7 \u00c9chap = annuler')
}


function startEditOverlay(el) {
  var rect    = el.getBoundingClientRect()
  // Valeur courante : utiliser _db si disponible, sinon textContent
  // Convertir les <br> en \n pour l'affichage dans l'input
  var rawHtml  = el.innerHTML
  var current  = _db[PAGE + '__' + el.id] || rawHtml.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()

  var overlay = document.createElement('div')
  overlay.id  = 'jbe-overlay'

  var label = document.createElement('div')
  label.className   = 'jbe-overlay-label'
  label.textContent = 'Utilisez \u21b5 pour un saut de ligne'

  var input = document.createElement('textarea')
  input.className  = 'jbe-overlay-input'
  input.value      = current
  input.spellcheck = false
  input.rows       = 3

  var btnRow = document.createElement('div')
  btnRow.className = 'jbe-overlay-btns'

  var btnOk = document.createElement('button')
  btnOk.type        = 'button'
  btnOk.textContent = '\u2713 OK'

  var btnCancel = document.createElement('button')
  btnCancel.type        = 'button'
  btnCancel.textContent = '\u2715 Annuler'
  btnCancel.className   = 'jbe-overlay-cancel'

  var btnBr = document.createElement('button')
  btnBr.type        = 'button'
  btnBr.textContent = '↵ Saut de ligne'
  btnBr.className   = 'jbe-overlay-br'
  btnBr.addEventListener('click', function () {
    var cur = input.value
    var pos = input.selectionStart
    // Vérifier anti-doublon : pas deux \n consécutifs
    if (cur[pos-1] === '\n') {
      input.value = cur.slice(0, pos-1) + cur.slice(pos)
      input.selectionStart = input.selectionEnd = pos - 1
    } else {
      input.value = cur.slice(0, pos) + '\n' + cur.slice(pos)
      input.selectionStart = input.selectionEnd = pos + 1
    }
    input.focus()
  })
  btnRow.appendChild(btnOk)
  btnRow.appendChild(btnBr)
  btnRow.appendChild(btnCancel)
  overlay.appendChild(label)
  overlay.appendChild(input)
  overlay.appendChild(btnRow)
  document.body.appendChild(overlay)

  // Positionner au-dessus de l'élément, dans le viewport
  var top  = rect.top + window.scrollY - overlay.offsetHeight - 12
  var left = Math.max(12, Math.min(rect.left, window.innerWidth - 420))
  if (top < window.scrollY + 60) top = rect.bottom + window.scrollY + 12
  overlay.style.top  = top + 'px'
  overlay.style.left = left + 'px'

  input.focus()
  input.select()

  function doSave() {
    var val = input.value.trim()
    if (val) saveElWithText(el, val)
    closeOverlay()
  }

  function closeOverlay() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay)
    el.classList.remove('jbe-editing')
    if (_active === el) _active = null
    setStatus('Survolez un texte \u2192 cliquez \u270e pour \u00e9diter')
  }

  btnOk.addEventListener('click', doSave)
  btnCancel.addEventListener('click', closeOverlay)
  input.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doSave() }
    if (e.key === 'Escape') { closeOverlay() }
    // Laisser Enter normal pour les sauts de ligne
  })
}

function saveElWithText(el, content) {
  var key = PAGE + '__' + el.id
  // Remplacer les sauts de ligne par un marqueur temporaire avant rebuildHTML
  // puis les restituer en <br> après reconstruction
  var BR_MARKER = '\u0001BR\u0001'
  var contentWithMarker = content.replace(/\n/g, ' ' + BR_MARKER + ' ')
  var rebuilt = rebuildHTML(el, contentWithMarker)
  // Restaurer les <br>
  rebuilt = rebuilt.replace(/\s*\u0001BR\u0001\s*/g, '<br>')
  el.innerHTML = rebuilt
  var os = el.getAttribute('data-orig-style') || ''
  if (os) el.setAttribute('style', os)
  setStatus('⏳ Sauvegarde...')
  sb.from('site_content')
    .upsert({ id: key, content: content }, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key] = content
      delete _dirty[key]
      setStatus('✅ Sauvegardé')
      flashEl(el)
      console.log('[JBE] OK overlay:', key, '=', content.substring(0, 40))
    })
    .catch(function (err) { setStatus('❌ ' + err.message) })
}

function stopEdit(el, doSave) {
  if (!el) return
  el.contentEditable = 'false'
  el.classList.remove('jbe-editing')
  el.style.removeProperty('font-size')
  el.style.removeProperty('line-height')
  el.style.removeProperty('font-family')
  el.style.removeProperty('font-weight')
  el.style.removeProperty('letter-spacing')
  el.style.removeProperty('text-transform')
  el.style.removeProperty('color')
  if (el._origStyle) {
    el.setAttribute('style', el._origStyle)
  } else {
    el.removeAttribute('style')
  }
  el._origStyle = null
  el.style.cursor = 'default'
  el.removeEventListener('paste',   el._p)
  el.removeEventListener('keydown', el._k)
  el.removeEventListener('input',   el._i)
  var key = PAGE + '__' + el.id
  if (doSave && _dirty[key]) {
    saveEl(el)
  } else if (!doSave) {
    var origHtml2 = el.getAttribute('data-orig-html') || ''
    var dbHtml    = _db[key] ? rebuildHTML(el, _db[key]) : null
    if (dbHtml)         { el.innerHTML = dbHtml }
    else if (origHtml2) { el.innerHTML = origHtml2 }
    var os2 = el.getAttribute('data-orig-style') || ''
    if (os2) el.setAttribute('style', os2)
    _dirty[key] = false
  } else if (!_dirty[key]) {
    var current2 = _db[key] ? rebuildHTML(el, _db[key]) : (el.getAttribute('data-orig-html') || '')
    if (current2) el.innerHTML = current2
    var os3 = el.getAttribute('data-orig-style') || ''
    if (os3) el.setAttribute('style', os3)
  }
  if (_active === el) _active = null
  var brFloatStop = window.__jbeBrFloat
  if (brFloatStop) {
    brFloatStop.style.opacity       = '0'
    brFloatStop.style.pointerEvents = 'none'
  }
  setStatus('Survolez un texte → cliquez ✎ pour éditer')
}

function onPaste(e) {
  e.preventDefault()
  var raw = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''
  document.execCommand('insertText', false, purify(raw))
}

function onKey(e, el) {
  if ((e.ctrlKey || e.metaKey) && 'biukh'.indexOf(e.key.toLowerCase()) > -1) {
    e.preventDefault(); return
  }
  if (e.key === 'Enter') { e.preventDefault(); stopEdit(el, true); return }
  if (e.key === 'Escape') {
    var key = PAGE + '__' + el.id
    var restoreHtml = _db[key] ? rebuildHTML(el, _db[key]) : (el.getAttribute('data-orig-html') || '')
    if (restoreHtml) el.innerHTML = restoreHtml
    var os = el.getAttribute('data-orig-style') || ''
    if (os) el.setAttribute('style', os)
    delete _dirty[key]
    stopEdit(el, false)
  }
}

function onInput(el) {
  var hasChildren = el.querySelector('em,span,strong,b,i')
  if (hasChildren) {
    var origHtml = el.getAttribute('data-orig-html') || ''
    var cur  = el.querySelectorAll('em,span,strong,b,i').length
    var orig = (origHtml.match(/<em|<span|<strong|<b[^a]|<i[^m]/g) || []).length
    if (cur < orig) {
      el.innerHTML = origHtml
      try {
        var r2 = document.createRange(); r2.selectNodeContents(el); r2.collapse(false)
        var s2 = window.getSelection(); if (s2) { s2.removeAllRanges(); s2.addRange(r2) }
      } catch(e2) {}
      return
    }
  }
  if (!hasChildren) {
    var TAGS = ['b','strong','i','em','u','s','font','mark','code']
    for (var t = 0; t < TAGS.length; t++) {
      var nodes = el.querySelectorAll(TAGS[t])
      for (var ni = 0; ni < nodes.length; ni++) {
        var node = nodes[ni]
        while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
        if (node.parentNode) node.parentNode.removeChild(node)
      }
    }
  }
  _dirty[PAGE + '__' + el.id] = true
  var dirtyCount = Object.keys(_dirty).filter(function(k) { return _dirty[k] }).length
  setStatus('\u270e ' + dirtyCount + ' modification' + (dirtyCount > 1 ? 's' : '') + ' \u00b7 Entr\u00e9e pour sauvegarder')
  var saveBtn = document.getElementById('jbe-save-btn')
  if (saveBtn) {
    saveBtn.textContent = '\u2713 Sauvegarder (' + dirtyCount + ')'
    saveBtn.style.background = dirtyCount > 0 ? 'rgba(255,207,0,.25)' : ''
  }
}

function getPlainText(el) {
  var clone = el.cloneNode(true)
  return purify(clone.textContent || '')
}

function purify(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ─── EDITION IMAGES ──────────────────────────
function activateImages() {
  scanImages()
  applyImages()
  var floatBtn = document.createElement('button')
  floatBtn.id        = 'jbe-img-float-btn'
  floatBtn.type      = 'button'
  // Icône SVG image
  floatBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  floatBtn.title     = "Changer l'image"
  document.body.appendChild(floatBtn)
  var _hoverImg = null

  for (var i = 0; i < _imgs.length; i++) {
    bindImage(_imgs[i], floatBtn)
  }

  floatBtn.addEventListener('mouseenter', function () {
    floatBtn.style.opacity = '1'
    floatBtn.style.pointerEvents = 'auto'
  })
  floatBtn.addEventListener('mouseleave', function () {
    floatBtn.style.opacity = '0'
    floatBtn.style.pointerEvents = 'none'
    _hoverImg = null
  })
  floatBtn.addEventListener('click', function () {
    if (!_hoverImg) return
    openImgModal(_hoverImg)
  })

  // ─── MODALE IMAGE ─────────────────────────────────────
  var _imgModal = null
  var _imgModalTarget = null

  function openImgModal(img) {
    _imgModalTarget = img
    var isVideo = (img.tagName === 'VIDEO') || (img.getAttribute('data-media-type') === 'video')
    if (!_imgModal) {
      _imgModal = document.createElement('div')
      _imgModal.id = 'jbe-img-modal'
      _imgModal.innerHTML =
        '<div id="jbe-img-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px">' +
          '<div style="background:#1a1f2e;border:1px solid rgba(255,255,255,.12);border-radius:12px;width:100%;max-width:540px;padding:24px;display:flex;flex-direction:column;gap:14px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<div id="jbe-img-modal-title" style="font-family:\'DM Mono\';font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.6)">Changer le media</div>' +
              '<button id="jbe-img-close" style="background:none;border:none;color:rgba(255,255,255,.4);font-size:20px;cursor:pointer;line-height:1">\u2715</button>' +
            '</div>' +
            '<div id="jbe-img-preview" style="width:100%;height:160px;background:rgba(255,255,255,.05);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center">' +
              '<img id="jbe-img-prev-el" style="max-width:100%;max-height:100%;object-fit:contain" src="" alt="">' +
              '<video id="jbe-vid-prev-el" style="display:none;max-width:100%;max-height:100%;object-fit:contain" muted playsinline></video>' +
            '</div>' +
            '<div style="display:flex;gap:6px">' +
              '<button id="jbe-tab-img" style="flex:1;padding:7px;background:#FFCF00;border:none;border-radius:6px;color:#000;font-family:\'DM Mono\';font-size:9px;letter-spacing:1px;font-weight:700;cursor:pointer">Image</button>' +
              '<button id="jbe-tab-vid" style="flex:1;padding:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:rgba(255,255,255,.5);font-family:\'DM Mono\';font-size:9px;letter-spacing:1px;cursor:pointer">Vid\u00e9o</button>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px">' +
              '<label style="font-family:\'DM Mono\';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4)">URL du fichier</label>' +
              '<input id="jbe-img-url" type="url" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:6px;color:#fff;padding:10px 12px;font-family:\'DM Mono\';font-size:11px;outline:none;width:100%;box-sizing:border-box" placeholder="https://... ou chemin local">' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px">' +
              '<label style="font-family:\'DM Mono\';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4)">Nom du fichier <span style="color:rgba(255,207,0,.5)">(SEO)</span></label>' +
              '<input id="jbe-img-name" type="text" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:6px;color:#fff;padding:10px 12px;font-family:\'DM Mono\';font-size:11px;outline:none;width:100%;box-sizing:border-box" placeholder="ex: karting-enfant-jbemeric-paca">' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px">' +
              '<label style="font-family:\'DM Mono\';font-size:8px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4)">L\u00e9gende / texte alternatif <span style="color:rgba(255,207,0,.5)">(SEO)</span></label>' +
              '<input id="jbe-img-alt" type="text" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:6px;color:#fff;padding:10px 12px;font-family:\'DM Mono\';font-size:11px;outline:none;width:100%;box-sizing:border-box" placeholder="ex: Stage karting enfant JB EMERIC, circuit PACA">' +
            '</div>' +
            '<div style="display:flex;gap:8px">' +
              '<input id="jbe-img-file" type="file" accept="image/*,video/mp4,video/webm,video/ogg" style="display:none">' +
              '<button id="jbe-img-file-btn" style="flex:1;padding:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:rgba(255,255,255,.6);font-family:\'DM Mono\';font-size:9px;letter-spacing:1px;cursor:pointer">\ud83d\udcc2 Fichier local</button>' +
              '<button id="jbe-img-ok" style="flex:2;padding:9px;background:#FFCF00;border:none;border-radius:6px;color:#000;font-family:\'DM Mono\';font-size:9px;letter-spacing:1px;font-weight:700;cursor:pointer">Appliquer \u2192</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      document.body.appendChild(_imgModal)

      var _mediaIsVideo = false

      function setTab(vid) {
        _mediaIsVideo = vid
        var tabImg = document.getElementById('jbe-tab-img')
        var tabVid = document.getElementById('jbe-tab-vid')
        var title  = document.getElementById('jbe-img-modal-title')
        if (tabImg) { tabImg.style.background = vid ? 'rgba(255,255,255,.07)' : '#FFCF00'; tabImg.style.color = vid ? 'rgba(255,255,255,.5)' : '#000'; tabImg.style.border = vid ? '1px solid rgba(255,255,255,.12)' : 'none' }
        if (tabVid) { tabVid.style.background = vid ? '#FFCF00' : 'rgba(255,255,255,.07)'; tabVid.style.color = vid ? '#000' : 'rgba(255,255,255,.5)'; tabVid.style.border = vid ? 'none' : '1px solid rgba(255,255,255,.12)' }
        if (title)  title.textContent = vid ? 'Changer la vid\u00e9o' : 'Changer l\'image'
        var fileInput = document.getElementById('jbe-img-file')
        if (fileInput) fileInput.accept = vid ? 'video/mp4,video/webm,video/ogg' : 'image/*'
        updatePreview(document.getElementById('jbe-img-url') ? document.getElementById('jbe-img-url').value : '')
      }

      function updatePreview(url) {
        var prevImg = document.getElementById('jbe-img-prev-el')
        var prevVid = document.getElementById('jbe-vid-prev-el')
        if (!prevImg || !prevVid) return
        if (_mediaIsVideo) {
          prevImg.style.display = 'none'
          prevVid.style.display = 'block'
          prevVid.src = url
          if (url) prevVid.load()
        } else {
          prevVid.style.display = 'none'
          prevImg.style.display = 'block'
          prevImg.src = url
        }
      }

      function suggestSEO(filename, currentAlt) {
        var nameInput = document.getElementById('jbe-img-name')
        var altInput  = document.getElementById('jbe-img-alt')

        // 1. Slug depuis le nom de fichier
        var ext  = filename.match(/\.[^.]+$/) ? filename.match(/\.[^.]+$/)[0] : ''
        var base = filename.replace(/\.[^.]+$/, '')
          .replace(/[_\s]+/g, '-')
          .toLowerCase()
          .replace(/[^a-z0-9\-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

        // 2. Contexte DOM autour de l'image cible
        var ctx = []

        // Titre h1/h2 le plus proche
        var el = _imgModalTarget
        var h = null
        var parent = el ? el.parentElement : null
        while (parent && !h) {
          h = parent.querySelector('h1, h2')
          parent = parent.parentElement
        }
        if (!h) h = document.querySelector('h1')
        if (h) ctx.push(h.textContent.trim().replace(/\s+/g, ' '))

        // Section ou div parente la plus proche avec un titre ou data-section
        var section = el ? el.closest('[data-section], section, .hero, .snap-section') : null
        if (section) {
          var ds = section.getAttribute('data-section') || ''
          if (ds) ctx.push(ds)
          var sh = section.querySelector('.hero-title, .porte-title, .sh-title, .flyer-name, .panel-title')
          if (sh) ctx.push(sh.textContent.trim().replace(/\s+/g, ' '))
        }

        // Texte alt existant
        if (_imgModalTarget && _imgModalTarget.alt) ctx.push(_imgModalTarget.alt)

        // Texte du plus proche paragraphe (50 premiers chars)
        var nearP = el ? el.closest('div, section, article') : null
        if (nearP) {
          var p = nearP.querySelector('p, .porte-body, .hero-lead, .flyer-hook')
          if (p) ctx.push(p.textContent.trim().substring(0, 60))
        }

        // 3. Construire le slug contextuel
        function toSlug(str) {
          return str.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        }

        var ctxSlug = ''
        if (ctx[0]) {
          // Prendre les 4-5 premiers mots du h1 le plus pertinent
          var words = toSlug(ctx[0]).split('-').filter(function(w){ return w.length > 2 }).slice(0, 4)
          ctxSlug = words.join('-')
        }

        // Nom final : contexte + base fichier si apporte qqch + jb-emeric
        var slugParts = []
        if (ctxSlug) slugParts.push(ctxSlug)
        // Ajouter la partie fichier seulement si elle apporte de l'info nouvelle
        var baseWords = base.split('-').filter(function(w){ return w.length > 2 && ctxSlug.indexOf(w) === -1 }).slice(0, 2)
        if (baseWords.length) slugParts.push(baseWords.join('-'))
        slugParts.push('jb-emeric')
        var finalSlug = slugParts.join('-').replace(/-+/g, '-') + ext

        if (nameInput && !nameInput.value) nameInput.value = finalSlug

        // 4. Alt text : phrase descriptive depuis le contexte
        if (altInput && !altInput.value) {
          var altParts = []
          // Titre principal
          if (ctx[0]) altParts.push(ctx[0].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
          // Complement contextuel
          if (ctx[2] && ctx[2] !== ctx[0]) {
            var extra = ctx[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
            if (extra && extra.length > 5) altParts.push(extra.charAt(0).toLowerCase() + extra.slice(1))
          }
          altParts.push('JB EMERIC')
          var alt = altParts.join(', ')
          // Capitaliser premiere lettre
          if (alt) alt = alt.charAt(0).toUpperCase() + alt.slice(1)
          altInput.value = alt
        }
      }

      var _pendingFile = null
      document.getElementById('jbe-tab-img').onclick = function() { setTab(false) }
      document.getElementById('jbe-tab-vid').onclick = function() { setTab(true) }
      document.getElementById('jbe-img-close').onclick = closeImgModal
      document.getElementById('jbe-img-backdrop').onclick = function(e) {
        if (e.target === this) closeImgModal()
      }
      document.getElementById('jbe-img-url').oninput = function() {
        updatePreview(this.value)
      }
      document.getElementById('jbe-img-file-btn').onclick = function() {
        document.getElementById('jbe-img-file').click()
      }
      document.getElementById('jbe-img-file').onchange = function() {
        var f = this.files[0]
        if (!f) return
        var isVid = f.type.indexOf('video') === 0
        setTab(isVid)
        suggestSEO(f.name, '')
        _pendingFile = f
        var urlInput = document.getElementById('jbe-img-url')
        if (urlInput) urlInput.value = ''
        updatePreview(URL.createObjectURL(f))
      }
      document.getElementById('jbe-img-ok').onclick = function() {
        if (_pendingFile) {
          var file = _pendingFile
          _pendingFile = null
          var isVid = file.type.indexOf('video') === 0
          var path = 'uploads/' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-')
          var altVal  = (document.getElementById('jbe-img-alt')  || {}).value || ''
          var nameVal = (document.getElementById('jbe-img-name') || {}).value || ''
          var savedTarget = _imgModalTarget
          closeImgModal()

          // Overlay de progression sur l'image cible
          var rect = savedTarget.getBoundingClientRect()
          var overlay = document.createElement('div')
          overlay.style.cssText = 'position:fixed;left:' + rect.left + 'px;top:' + rect.top + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;background:rgba(0,0,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;pointer-events:none'
          var barWrap = document.createElement('div')
          barWrap.style.cssText = 'width:70%;background:rgba(255,255,255,.2);border-radius:4px;overflow:hidden;height:6px'
          var barFill = document.createElement('div')
          barFill.style.cssText = 'height:100%;width:0%;background:#007aff;transition:width .1s linear'
          var barPct = document.createElement('div')
          barPct.style.cssText = 'color:#fff;font-size:13px;margin-top:10px;font-family:monospace;font-weight:600'
          barPct.textContent = '0%'
          barWrap.appendChild(barFill)
          overlay.appendChild(barWrap)
          overlay.appendChild(barPct)
          document.body.appendChild(overlay)

          function removeOverlay() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay) }

          // Upload XHR direct → progress réel
          var xhr = new XMLHttpRequest()
          var uploadUrl = SB_URL + '/storage/v1/object/media/' + path
          xhr.open('POST', uploadUrl)
          xhr.setRequestHeader('Authorization', 'Bearer ' + SB_ANON)
          xhr.setRequestHeader('apikey', SB_ANON)
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
          xhr.setRequestHeader('x-upsert', 'true')

          xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
              var p = Math.round(e.loaded / e.total * 100)
              barFill.style.width = p + '%'
              barPct.textContent = p + '%'
              setStatus('\u23f3 Upload\u00a0' + p + '%')
            }
          })

          xhr.onload = function() {
            removeOverlay()
            if (xhr.status >= 200 && xhr.status < 300) {
              var url = SB_URL + '/storage/v1/object/public/media/' + path
              if (isVid) {
                if (savedTarget.tagName === 'VIDEO') {
                  var src = savedTarget.querySelector('source')
                  if (src) { src.src = url } else { savedTarget.src = url }
                  savedTarget.load()
                } else {
                  var vid = _makeVideoFromImg(savedTarget, url)
                  savedTarget.parentNode.replaceChild(vid, savedTarget)
                  savedTarget = vid
                  _addVideoControls(vid)
                }
              } else {
                savedTarget.src = url
                if (altVal) savedTarget.alt = altVal
              }
              saveMedia(savedTarget, url, isVid ? 'video' : 'image', altVal, nameVal)
            } else {
              setStatus('\u274c Upload \u00e9chou\u00e9 (' + xhr.status + ') : ' + xhr.responseText)
            }
          }

          xhr.onerror = function() { removeOverlay(); setStatus('\u274c Erreur r\u00e9seau') }
          xhr.send(file)
          return
        }
        var url = (document.getElementById('jbe-img-url') || {}).value || ''
        if (!url || !_imgModalTarget) { closeImgModal(); return }
        var altVal  = (document.getElementById('jbe-img-alt')  || {}).value || ''
        var nameVal = (document.getElementById('jbe-img-name') || {}).value || ''
        if (_mediaIsVideo) {
          // Rejeter les URLs YouTube : incompatibles avec <video src="">
          if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) {
            setStatus('\u26a0\ufe0f URLs YouTube non supportées ici. Utilisez un fichier MP4/WebM ou une URL directe.')
            return
          }
          // Cible est une <video> ou on remplace une <img> par une <video>
          var targetEl = _imgModalTarget
          if (targetEl.tagName === 'VIDEO') {
            var src = targetEl.querySelector('source')
            if (src) { src.src = url } else { targetEl.src = url }
            targetEl.load()
          } else {
            // Creer un element video a la place de l'img
            targetEl.setAttribute('data-media-url', url)
            targetEl.setAttribute('data-media-type', 'video')
            targetEl.src = ''
            targetEl.setAttribute('data-video-pending', url)
          }
          saveMedia(_imgModalTarget, url, 'video', altVal, nameVal)
        } else {
          _imgModalTarget.src = url.trim()
          if (altVal) _imgModalTarget.alt = altVal
          saveMedia(_imgModalTarget, url.trim(), 'image', altVal, nameVal)
        }
        closeImgModal()
      }
    }

    // Pre-remplir avec l'URL actuelle
    var urlInput = document.getElementById('jbe-img-url')
    var altInput  = document.getElementById('jbe-img-alt')
    var nameInput = document.getElementById('jbe-img-name')
    var isVid = isVideo || (img.tagName === 'VIDEO')
    if (urlInput) urlInput.value = isVid ? (img.getAttribute('src') || (img.querySelector && img.querySelector('source') ? img.querySelector('source').getAttribute('src') : '') || '') : (img.src || '')
    if (altInput)  altInput.value  = img.alt || ''
    if (nameInput) nameInput.value = ''
    // Reset tab
    var tabImg = document.getElementById('jbe-tab-img')
    var tabVid = document.getElementById('jbe-tab-vid')
    if (tabImg) { tabImg.style.background = isVid ? 'rgba(255,255,255,.07)' : '#FFCF00'; tabImg.style.color = isVid ? 'rgba(255,255,255,.5)' : '#000'; tabImg.style.border = isVid ? '1px solid rgba(255,255,255,.12)' : 'none' }
    if (tabVid) { tabVid.style.background = isVid ? '#FFCF00' : 'rgba(255,255,255,.07)'; tabVid.style.color = isVid ? '#000' : 'rgba(255,255,255,.5)'; tabVid.style.border = isVid ? 'none' : '1px solid rgba(255,255,255,.12)' }
    var title = document.getElementById('jbe-img-modal-title')
    if (title) title.textContent = isVid ? 'Changer la vid\u00e9o' : 'Changer l\'image'
    var fileInput = document.getElementById('jbe-img-file')
    if (fileInput) fileInput.accept = isVid ? 'video/mp4,video/webm,video/ogg' : 'image/*'
    var prevImg = document.getElementById('jbe-img-prev-el')
    var prevVid = document.getElementById('jbe-vid-prev-el')
    if (prevImg) { prevImg.style.display = isVid ? 'none' : 'block'; prevImg.src = isVid ? '' : (img.src || '') }
    if (prevVid) { prevVid.style.display = isVid ? 'block' : 'none' }
    _imgModal.style.display = 'block'
  }
  function closeImgModal() {
    if (_imgModal) _imgModal.style.display = 'none'
  }
  window.__jbeFloatBtn = floatBtn
  window.__jbeHoverImg = function (img) { _hoverImg = img; window.__jbeCurrentHoverImg = img }
  window.__jbeCurrentHoverImg = null
  // Rescanner après chargement complet (images hero width=0 au DOMContentLoaded)
  window.addEventListener('load', function () {
    var prevCount = _imgs.length
    scanImages()
    applyImages()
    // Bind les nouvelles images non encore bindées
    for (var li = prevCount; li < _imgs.length; li++) {
      bindImage(_imgs[li], floatBtn)
    }
    if (_imgs.length > prevCount) {
      console.log('[JBE] Rescan: ' + _imgs.length + ' images au total')
    }
  })

  // Rescan après injection dynamique (sync-mirror.js, paddock, etc.)
  document.addEventListener('jbe-mirror-loaded', function () {
    var prevCount = _imgs.length
    scanImages()
    applyImages()
    for (var mi = prevCount; mi < _imgs.length; mi++) {
      bindImage(_imgs[mi], floatBtn)
    }
    if (_imgs.length > prevCount) {
      console.log('[JBE] Rescan mirror: ' + _imgs.length + ' images au total')
    }
  })
}

function bindImage(img, floatBtn) {
  var target
  if (img.tagName === 'VIDEO') {
    // Vidéo background : .hero-content (z-index:3) intercepte tous les events souris.
    // On remonte à la section parente (.hero ou section) qui est accessible par la souris.
    target = (img.closest && (img.closest('.hero') || img.closest('section'))) || img.parentNode || img
  } else {
    // Utiliser le premier ancêtre positionné comme target des events mouse.
    var op = img.offsetParent
    target = (op && op !== document.body && op !== document.documentElement) ? op : img
  }

  function positionBtn() {
    // Utiliser l'image pour la position, le target pour la visibilité
    var rect = img.getBoundingClientRect()
    if (rect.width < 10 || rect.height < 10) rect = target.getBoundingClientRect()
    var inView = rect.bottom > 0 && rect.top < window.innerHeight
                 && rect.right  > 0 && rect.left < window.innerWidth
    if (!inView) {
      floatBtn.style.opacity       = '0'
      floatBtn.style.pointerEvents = 'none'
      return
    }
    var btnSize = 44
    var margin  = 10
    var left = Math.min(rect.right  - btnSize - margin, window.innerWidth  - btnSize - 8)
    var top  = Math.min(rect.bottom - btnSize - margin, window.innerHeight - btnSize - 8)
    left = Math.max(8, left)
    top  = Math.max(8, top)
    floatBtn.style.left          = left + 'px'
    floatBtn.style.top           = top  + 'px'
    floatBtn.style.opacity       = '1'
    floatBtn.style.pointerEvents = 'auto'
  }

  var _scrollListener = null

  target.addEventListener('mouseenter', function () {
    if (img.tagName !== 'VIDEO') {
      img.style.outline       = '3px solid #007aff'
      img.style.outlineOffset = '-3px'
    }
    window.__jbeCurrentHoverImg = img
    window.__jbeHoverImg(img)
    positionBtn()
    _scrollListener = function () { positionBtn() }
    window.addEventListener('scroll', _scrollListener, { passive: true })
  })

  target.addEventListener('mouseleave', function (e) {
    if (e.relatedTarget === floatBtn) return
    if (img.tagName !== 'VIDEO') {
      img.style.outline       = ''
      img.style.outlineOffset = ''
    }
    window.__jbeCurrentHoverImg = null
    if (_scrollListener) {
      window.removeEventListener('scroll', _scrollListener)
      _scrollListener = null
    }
    setTimeout(function () {
      if (window.__jbeCurrentHoverImg !== img) {
        floatBtn.style.opacity       = '0'
        floatBtn.style.pointerEvents = 'none'
      }
    }, 300)
  })
}

function saveImage(img, url) {
  saveMedia(img, url, 'image', '', '')
}

function saveMedia(el, url, mediaType, altText, fileName) {
  var key = PAGE + '__' + el.id
  var payload = { id: key, content: url }
  if (altText)  payload.alt_text  = altText
  if (fileName) payload.file_name = fileName
  if (mediaType === 'video') payload.media_type = 'video'
  setStatus('\u23f3 Sauvegarde...')
  sb.from('site_content')
    .upsert(payload, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key] = url
      setStatus('\u2705 ' + (mediaType === 'video' ? 'Vid\u00e9o' : 'Image') + ' sauvegard\u00e9e')
      flashImg(el)
    })
    .catch(function (err) { setStatus('\u274c ' + err.message) })
}

function flashImg(img) {
  img.style.transition = 'outline .3s'
  img.style.outline    = '3px solid #34c759'
  setTimeout(function () { img.style.outline = ''; img.style.transition = '' }, 1200)
}

// ─── REBUILD HTML ────────────────────────────
var JBE_STOP = {
  'de':1,'du':1,'des':1,'le':1,'la':1,'les':1,'un':1,'une':1,
  'a':1,'au':1,'aux':1,'et':1,'ou':1,'ni':1,'mais':1,'donc':1,
  'que':1,'qui':1,'ce':1,'cet':1,'cette':1,'ces':1,'en':1,
  'par':1,'pour':1,'sur':1,'sous':1,'dans':1,'avec':1,'sans':1,
  'est':1,'sont':1,'il':1,'elle':1,'ils':1,'elles':1,'se':1,
  'si':1,'ne':1,'pas':1,'ans':1,'an':1,'jour':1,'fois':1
}
function isStopWord(word) {
  var clean = word.replace(/[^a-zA-ZÀ-ÿ]/g, '').toLowerCase()
  return !!JBE_STOP[clean]
}

function rebuildHTML(el, newText) {
  var origHtml = el.getAttribute('data-orig-html') || el.innerHTML
  var origText = el.getAttribute('data-orig') || el.textContent
  newText = newText.trim()
  if (!/<(em|span|b|strong|i|br)\b/i.test(origHtml)) { return newText }

  var tokens = []
  var i = 0; var buf = ''
  while (i < origHtml.length) {
    if (origHtml[i] === '<') {
      var gt = origHtml.indexOf('>', i)
      if (gt < 0) { buf += origHtml[i]; i++; continue }
      var tag = origHtml.substring(i, gt+1)
      if (/^<br/i.test(tag)) {
        if (buf) { tokens.push({type:'text',text:buf}); buf='' }
        tokens.push({type:'br'}); i = gt+1; continue
      }
      var openM = tag.match(/^<(em|span|b|strong|i)([^>]*)>/i)
      if (openM) {
        if (buf) { tokens.push({type:'text',text:buf}); buf='' }
        var tname = openM[1].toLowerCase(); var tattrs = openM[2]
        var closeTag = '</' + tname + '>'
        var ci = origHtml.toLowerCase().indexOf(closeTag, gt+1)
        if (ci < 0) { buf += origHtml[i]; i++; continue }
        var inner = origHtml.substring(gt+1, ci).replace(/<[^>]+>/g, '')
        tokens.push({type:'styled',tag:tname,attrs:tattrs,text:inner})
        i = ci + closeTag.length; continue
      }
      i = gt+1
    } else { buf += origHtml[i]; i++ }
  }
  if (buf) tokens.push({type:'text',text:buf})

  var origWords = []; var brAfterWord = []; var wc = 0
  for (var t = 0; t < tokens.length; t++) {
    var tok = tokens[t]
    if (tok.type === 'br') {
      brAfterWord.push(wc - 1)
    } else if (tok.type === 'text' || tok.type === 'styled') {
      var ws = tok.text.trim().split(/\s+/)
      for (var w = 0; w < ws.length; w++) {
        if (ws[w]) { origWords.push({styled:tok.type==='styled',tag:tok.tag||'',attrs:tok.attrs||''}); wc++ }
      }
    }
  }
  if (!origWords.length) return newText

  var styledList = []
  for (var oi = 0; oi < origWords.length; oi++) {
    if (origWords[oi].styled) {
      styledList.push({origRel:origWords.length>1?oi/(origWords.length-1):1,tag:origWords[oi].tag,attrs:origWords[oi].attrs})
    }
  }

  var newWords = newText.trim().split(/\s+/).filter(function(w){return w.length>0})
  if (!newWords.length) return newText

  var wordAssign = {}
  for (var si = 0; si < styledList.length; si++) {
    var sinfo = styledList[si]; var bestD = 999; var bestNi = -1
    for (var ni = 0; ni < newWords.length; ni++) {
      if (wordAssign[ni]) continue
      if (isStopWord(newWords[ni])) continue
      var nr = newWords.length>1?ni/(newWords.length-1):1
      var d = Math.abs(nr - sinfo.origRel)
      if (d < bestD) { bestD = d; bestNi = ni }
    }
    if (bestNi < 0) {
      for (var ni2 = 0; ni2 < newWords.length; ni2++) {
        if (wordAssign[ni2]) continue
        var nr2 = newWords.length>1?ni2/(newWords.length-1):1
        var d2 = Math.abs(nr2 - sinfo.origRel)
        if (d2 < bestD) { bestD = d2; bestNi = ni2 }
      }
    }
    if (bestNi >= 0) wordAssign[bestNi] = sinfo
  }

  var brAfterNewWord = {}
  for (var bi = 0; bi < brAfterWord.length; bi++) {
    var brOrigRel = origWords.length>1?brAfterWord[bi]/(origWords.length-1):0.5
    var bestBD = 999; var bestBNi = -1
    for (var bni = 0; bni < newWords.length-1; bni++) {
      if (brAfterNewWord[bni] !== undefined) continue
      var bnr = newWords.length>1?bni/(newWords.length-1):0
      var bd = Math.abs(bnr - brOrigRel)
      if (bd < bestBD) { bestBD = bd; bestBNi = bni }
    }
    if (bestBNi >= 0) brAfterNewWord[bestBNi] = true
  }

  var result = ''
  for (var ri = 0; ri < newWords.length; ri++) {
    if (ri > 0) result += ' '
    if (wordAssign[ri]) {
      var sa = wordAssign[ri]
      result += '<' + sa.tag + sa.attrs + '>' + newWords[ri] + '</' + sa.tag + '>'
    } else {
      result += newWords[ri]
    }
    if (brAfterNewWord[ri]) result += '<br>'
  }
  return result
}

// ─── SAUVEGARDE TEXTE ────────────────────────
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getPlainText(el)
  if (!key || !content) return
  var rebuilt = rebuildHTML(el, content)
  el.innerHTML = rebuilt
  var os = el.getAttribute('data-orig-style') || ''
  if (os) el.setAttribute('style', os)
  // Mettre à jour data-orig-html si l'élément n'a pas de HTML structurant
  var origHtmlSave = el.getAttribute('data-orig-html') || ''
  if (!/<(em|span|b|strong|i|br)\b/i.test(origHtmlSave)) {
    el.setAttribute('data-orig-html', el.innerHTML)
  }
  setStatus('\u23f3 Sauvegarde...')
  return sb.from('site_content')
    .upsert({ id: key, content: content }, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key] = content
      delete _dirty[key]
      setStatus('\u2705 Sauvegard\u00e9')
      flashEl(el)
      console.log('[JBE] OK:', key, '=', content.substring(0, 40))
    })
    .catch(function (err) {
      setStatus('\u274c ' + err.message)
      console.error('[JBE]', err)
    })
}

function saveAll() {
  var promises = []
  for (var i = 0; i < _els.length; i++) {
    var key = PAGE + '__' + _els[i].id
    if (_dirty[key]) { var p = saveEl(_els[i]); if (p) promises.push(p) }
  }
  if (!promises.length) { setStatus('\u2705 Tout est \u00e0 jour'); return }
  Promise.all(promises)
    .then(function () { updateLocalHTML() })
    .catch(function () {})
}

function updateLocalHTML() {
  var entries = {}
  var prefix  = PAGE + '__'
  for (var k in _db) {
    if (k.indexOf(prefix) === 0 && _db[k]) entries[k] = _db[k]
  }
  fetch('/save-html', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ page: PAGE, entries: entries })
  })
  .then(function (r) { return r.json() })
  .then(function (d) {
    if (d.ok) console.log('[JBE] HTML local mis \u00e0 jour : ' + PAGE + '.html')
  })
  .catch(function () {
    // Normal si on est sur Netlify — pas de serveur local, on ignore
  })
}

// ─── BARRE ADMIN ─────────────────────────────
function buildBar(user) {
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'JB')
  var bar = document.createElement('div')
  bar.id  = 'jbe-bar'
  bar.innerHTML =
    '<div class="jbe-bar-inner">'
    + '<div class="jbe-bar-left">'
    +   '<span class="jbe-dot"></span>'
    +   '<div class="jbe-bar-info">'
    +     '<span class="jbe-bar-mode">Mode \u00e9dition</span>'
    +     '<span class="jbe-bar-user">Bonjour\u00a0<strong>' + prenom + '</strong></span>'
    +   '</div>'
    + '</div>'
    + '<div id="jbe-msg" class="jbe-bar-status">'
    +   'Survolez un texte \u2192 cliquez \u270e pour \u00e9diter'
    + '</div>'
    + '<div class="jbe-bar-right">'
    +   '<span class="jbe-bar-cnt" id="jbe-cnt"></span>'
    +   '<button class="jbe-btn-save" onclick="window.__jbeSaveAll()">\u2713 Sauvegarder</button>'
    +   '<a class="jbe-btn-dash" href="admin.html">Dashboard \u2192</a>'
    + '</div>'
    + '</div>'
  var nav = document.querySelector('nav.nav')
  if (nav && nav.nextSibling) {
    nav.parentNode.insertBefore(bar, nav.nextSibling)
  } else {
    document.body.insertBefore(bar, document.body.firstChild)
  }
  bar.style.top   = '56px'
  var _swEl = document.createElement('div')
  _swEl.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:50px;height:50px;overflow:scroll'
  document.body.appendChild(_swEl)
  var _sw = _swEl.offsetWidth - _swEl.clientWidth
  document.body.removeChild(_swEl)
  bar.style.right = _sw + 'px'
  document.documentElement.style.scrollPaddingTop = '98px' // 56px nav + 42px barre édition
  document.body.classList.add('jbe-admin-mode')
  _bar = document.getElementById('jbe-msg')
  window.__jbeSaveAll = saveAll
  window.__jbeInsertBr = function () {
    if (!_active) return
    var sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    var range = sel.getRangeAt(0)
    // Vérifier si un <br> est déjà adjacent au curseur (anti-doublon)
    var node = range.startContainer
    var offset = range.startOffset
    // Chercher un <br> juste avant le curseur
    var prevNode = node.nodeType === 3 && offset === 0 ? node.previousSibling
                 : (node.childNodes ? node.childNodes[offset - 1] : null)
    if (prevNode && prevNode.nodeName === 'BR') {
      // Supprimer le <br> existant
      prevNode.parentNode.removeChild(prevNode)
      _dirty[PAGE + '__' + _active.id] = true
      setStatus('✓ Saut de ligne supprimé')
      return
    }
    // Insérer un <br>
    var br = document.createElement('br')
    range.deleteContents()
    range.insertNode(br)
    // Placer le curseur après le <br>
    range.setStartAfter(br)
    range.setEndAfter(br)
    sel.removeAllRanges()
    sel.addRange(range)
    _dirty[PAGE + '__' + _active.id] = true
    setStatus('↵ Saut de ligne inséré · Cliquez ↵ encore pour supprimer')
  }
  var cntEl = document.getElementById('jbe-cnt')
  if (cntEl) cntEl.textContent = _els.length + ' textes'
  console.log('[JBE] Barre admin OK')
}

function setStatus(msg) {
  if (!_bar) return
  _bar.textContent = msg
  var isOk  = msg.charAt(0) === '\u2705'
  var isErr = msg.charAt(0) === '\u274c'
  _bar.style.color = isOk ? '#4ade80' : isErr ? '#f87171' : ''
  if (isOk || isErr) {
    setTimeout(function () {
      if (_bar) {
        _bar.textContent = 'Survolez un texte \u2192 cliquez \u270e pour \u00e9diter'
        _bar.style.color = ''
      }
    }, isErr ? 4000 : 2500)
  }
}

function flashEl(el) {
  el.style.transition      = 'background-color .3s'
  el.style.backgroundColor = 'rgba(34,197,94,.15)'
  setTimeout(function () {
    el.style.backgroundColor = ''
    setTimeout(function () { el.style.transition = '' }, 300)
  }, 800)
}

// ─── CSS VIDÉO (tous utilisateurs) ───────────
function injectVideoCSS() {
  if (document.getElementById('jbe-vid-css')) return
  var s = document.createElement('style')
  s.id = 'jbe-vid-css'
  var css = ''
  css += '.jbe-vid-wrap{display:block}'
  css += '.jbe-vid-ctrl{position:absolute;bottom:clamp(20px,4vw,36px);left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;z-index:9999}'
  css += '[data-theme="index"] .jbe-vid-ctrl{bottom:clamp(120px,18vw,200px)}'
  css += '.jbe-vid-btn{width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;opacity:1;line-height:1;padding:0;flex-shrink:0}'
  css += '.jbe-vid-vol-wrap{display:flex;align-items:center;gap:6px}'
  css += '.jbe-vid-vol{width:0;opacity:0;transition:width .25s,opacity .25s;cursor:pointer;accent-color:#fff;height:4px}'
  css += '.jbe-vid-vol-wrap:hover .jbe-vid-vol{width:80px;opacity:1}'
  s.textContent = css
  document.head.appendChild(s)
}

// ─── CSS ─────────────────────────────────────
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s = document.createElement('style')
  s.id  = 'jbe-css'
  var css = ''
  // Barre admin
  css += '#jbe-bar{position:fixed;top:56px;left:0;right:0;z-index:999;background:#fff;border-bottom:1px solid rgba(0,0,0,.1);font-family:-apple-system,BlinkMacSystemFont,Helvetica,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.08)}'
  css += 'html{scroll-padding-top:98px!important}'
  css += '.jbe-bar-inner{display:flex;align-items:center;height:42px;padding:0 16px;gap:12px}'
  css += '.jbe-bar-left{display:flex;align-items:center;gap:8px;flex-shrink:0}'
  css += '.jbe-dot{width:7px;height:7px;border-radius:50%;background:#34c759;flex-shrink:0;animation:jbepulse 2.5s ease-in-out infinite}'
  css += '@keyframes jbepulse{0%,100%{box-shadow:0 0 0 0 rgba(52,199,89,.4)}70%{box-shadow:0 0 0 7px rgba(52,199,89,0)}}'
  css += '.jbe-bar-info{display:flex;flex-direction:column;line-height:1.25}'
  css += '.jbe-bar-mode{font-size:11px;font-weight:600;color:#1c1c1e}'
  css += '.jbe-bar-user{font-size:10px;color:#8e8e93}'
  css += '.jbe-bar-user strong{color:#1c1c1e;font-weight:600}'
  css += '.jbe-bar-status{flex:1;font-size:11px;color:#aeaeb2;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;padding:0 8px}'
  css += '.jbe-bar-right{display:flex;align-items:center;gap:6px;flex-shrink:0}'
  css += '.jbe-bar-cnt{font-size:10px;color:#c7c7cc;white-space:nowrap;margin-right:4px}'
  css += '.jbe-btn-save{padding:5px 13px;background:#1c1c1e;color:#fff;border:none;border-radius:20px;font-size:11px;font-weight:600;font-family:inherit;cursor:pointer;transition:opacity .15s;white-space:nowrap}'
  css += '.jbe-btn-save:hover{opacity:.7}'
  css += '.jbe-btn-dash{padding:5px 13px;background:transparent;color:#007aff;border:1.5px solid rgba(0,122,255,.35);border-radius:20px;font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;transition:all .15s}'
  css += '.jbe-btn-dash:hover{background:rgba(0,122,255,.06)}'
  // Hover et édition
  css += '.jbe-hover{outline:2px solid rgba(0,122,255,.4)!important;outline-offset:3px;border-radius:3px}'
  css += '.jbe-editing{outline:2px solid #007aff!important;outline-offset:3px;border-radius:3px;background:rgba(0,122,255,.04)!important;cursor:text!important}'
  css += '[contenteditable="true"]{caret-color:#007aff;user-select:text!important;font-family:inherit!important;font-size:inherit!important;letter-spacing:inherit!important;font-weight:inherit!important}'
  // Crayon global
  css += '#jbe-pencil-global{position:fixed;width:28px;height:28px;border-radius:50%;background:#007aff;color:#fff;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;z-index:99998;line-height:1;padding:0;box-shadow:0 2px 8px rgba(0,122,255,.5);transition:opacity .15s}'
  css += '#jbe-pencil-global:hover{background:#0066d6}'
  // Overlay input (pour éléments avec <br>)
  css += '#jbe-overlay{position:absolute;z-index:99999;width:400px;background:#fff;border:2px solid #007aff;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 8px 30px rgba(0,0,0,.2)}'
  css += '.jbe-overlay-label{font-size:10px;font-family:"DM Mono",monospace;letter-spacing:1px;color:#aeaeb2;text-transform:uppercase}'
  css += '.jbe-overlay-input{border:1px solid #d1d1d6;border-radius:6px;padding:8px 12px;font-size:14px;font-family:-apple-system,sans-serif;outline:none;resize:vertical;line-height:1.5}'
  css += '.jbe-overlay-input:focus{border-color:#007aff;box-shadow:0 0 0 3px rgba(0,122,255,.15)}'
  css += '.jbe-overlay-btns{display:flex;gap:6px}'
  css += '.jbe-overlay-btns button{flex:1;padding:8px 14px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;background:#007aff;color:#fff}'
  css += '.jbe-overlay-cancel{background:#f2f2f7!important;color:#636366!important}'
  // Bouton image flottant
  css += '#jbe-img-float-btn{position:fixed;bottom:24px;left:24px;width:44px;height:44px;border-radius:12px;background:#007aff;color:#fff;font-size:22px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,122,255,.45);opacity:0;pointer-events:none;z-index:99999;transition:opacity .2s,background .15s}'
  css += '#jbe-img-float-btn:hover{background:#0066d6}'
  // Nav connecté
  css += '.nav-btn-logout{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);background:transparent;padding:6px 13px;border-radius:5px;border:1px solid rgba(255,255,255,.2);cursor:pointer}'
  css += '.nav-btn-logout:hover{color:#fff;border-color:rgba(255,255,255,.5)}'
  css += '.nav-btn-user{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.6)}'
  // Décalage hero en mode admin (barre 42px + nav 56px)
  css += 'body.jbe-admin-mode .hero,body.jbe-admin-mode section.hero{margin-top:42px!important}'
  css += '#jbe-br-float{position:fixed;width:32px;height:32px;border-radius:50%;background:#007aff;color:#fff;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;z-index:99998;box-shadow:0 2px 8px rgba(0,122,255,.4);transition:opacity .15s}'
  css += '#jbe-br-float:hover{background:#0066d6}'
  css += '.jbe-overlay-br{background:rgba(0,122,255,.1)!important;color:#007aff!important;border:1.5px solid rgba(0,122,255,.3)!important}'
  css += '.jbe-overlay-br:hover{background:rgba(0,122,255,.2)!important}'
  s.textContent = css
  document.head.appendChild(s)
}
