// live-editor.js — JB EMERIC — VERSION FINALE CORRIGEE
// ZERO class ES6, ZERO template literal, ZERO arrow function
// Table site_content : colonnes id et content UNIQUEMENT
// Bouton MODIFIER : fixed sur le body (evite overflow:hidden des parents)
console.log("live-editor.js charge !");
console.log("Configuration OK : Utilisation des colonnes id et content uniquement");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
var sb      = createClient(SB_URL, SB_ANON)

var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'
var SEL  = [
  'h1','h2','h3','h4',
  '.hero-title','.hero-kicker','.hero-sub','.hero-lead','.hero-eyebrow',
  '.ov-title','.ov-desc','.ov-card-name','.ov-card-sub','.ov-eyebrow',
  '.flyer-name','.flyer-hook','.flyer-pretitle',
  '.pc-title','.pc-lead','.sr-title','.sr-lead',
  '.kicker','.sh','p'
].join(',')

var _db     = {}
var _els    = []
var _dirty  = {}
var _bar    = null
var _active = null
var _floatBtn = null   // bouton unique fixe sur le body

// Masquer le body pour eviter le flash
var _hs = document.createElement('style')
_hs.textContent = 'body{opacity:0}'
document.head.appendChild(_hs)
function showPage() {
  document.body.style.opacity   = '1'
  document.body.style.transition = 'opacity .2s'
  if (_hs.parentNode) _hs.parentNode.removeChild(_hs)
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  scanElements()
  Promise.all([loadTexts(), sb.auth.getSession()])
    .then(function (results) {
      applyTexts()
      showPage()
      var sess    = results[1]
      var session = (sess && sess.data) ? sess.data.session : null
      var user    = session ? session.user : null
      var role    = (user && user.user_metadata) ? user.user_metadata.role : null
      var isAdmin = (role === 'admin' || role === 'moderateur')
      updateNav(user, isAdmin)
      if (isAdmin) {
        injectCSS()
        createFloatBtn()
        hookElements()
        buildBar(user)
      }
    })
    .catch(function (err) {
      showPage()
      console.warn('[JBE] init:', err)
    })
})

// ─────────────────────────────────────────────
//  SCAN
// ─────────────────────────────────────────────
function scanElements() {
  _els = []
  var n = 1
  var all = document.querySelectorAll(SEL)
  for (var i = 0; i < all.length; i++) {
    var el = all[i]
    if (el.closest('nav') || el.closest('footer') ||
        el.closest('script') || el.closest('svg')) continue
    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue
    if (el.querySelector(SEL)) continue
    if (!el.id) el.id = 'txt-' + n
    n++
    el.setAttribute('data-orig', txt)
    _els.push(el)
  }
  console.log('[JBE] ' + _els.length + ' elements indexes (' + PAGE + ')')
}

// ─────────────────────────────────────────────
//  CHARGEMENT — select * sans filtre
// ─────────────────────────────────────────────
function loadTexts() {
  return sb.from('site_content').select('*')
    .then(function (res) {
      if (res.error) { console.warn('[JBE]', res.error.message); return }
      if (res.data) {
        for (var i = 0; i < res.data.length; i++) {
          if (res.data[i].id && res.data[i].content) {
            _db[res.data[i].id] = res.data[i].content
          }
        }
        console.log('[JBE] ' + res.data.length + ' texte(s) Supabase')
      }
    })
    .catch(function (e) { console.warn('[JBE] Supabase:', e.message) })
}

// ─────────────────────────────────────────────
//  APPLIQUER
// ─────────────────────────────────────────────
function applyTexts() {
  for (var i = 0; i < _els.length; i++) {
    var key = PAGE + '__' + _els[i].id
    if (_db[key]) _els[i].textContent = _db[key]
  }
}

// ─────────────────────────────────────────────
//  NAV
// ─────────────────────────────────────────────
function updateNav(user, isAdmin) {
  if (!user) return
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'Admin')
  var desk = document.querySelector('.nav-auth')
  if (desk) {
    desk.innerHTML = isAdmin
      ? '<a class="nav-btn-admin" href="admin.html">\u2746 Espace Admin</a>'
        + '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<span class="nav-btn-user">' + prenom + '</span>'
        + '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  var mob = document.querySelector('.nav-mobile-cta')
         || document.querySelector('.nav-mobile-auth')
  if (mob) {
    mob.innerHTML = isAdmin
      ? '<a class="nav-mobile-btn" href="admin.html">\u2746 Espace Admin</a>'
        + '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  window.__jbeOut = function () {
    sb.auth.signOut().then(function () { location.reload() })
  }
}

// ─────────────────────────────────────────────
//  BOUTON FLOTTANT UNIQUE — position fixed sur body
//  Contourne tous les overflow:hidden des parents
// ─────────────────────────────────────────────
function createFloatBtn() {
  _floatBtn = document.createElement('button')
  _floatBtn.id   = 'jbe-float'
  _floatBtn.type = 'button'
  _floatBtn.textContent = 'MODIFIER'
  _floatBtn.style.cssText = [
    'display:none',
    'position:fixed',
    'z-index:999999',
    'padding:14px 28px',
    'font-size:18px',
    'font-weight:900',
    'font-family:-apple-system,Helvetica,Arial,sans-serif',
    'background:#ffffff',
    'color:#000000',
    'border:4px solid #000000',
    'border-radius:8px',
    'cursor:pointer',
    'box-shadow:0 6px 24px rgba(0,0,0,.5)',
    'pointer-events:auto',
    'transition:background .15s,color .15s',
    'white-space:nowrap'
  ].join(';')
  _floatBtn.addEventListener('mouseenter', function () {
    _floatBtn.style.background = '#000000'
    _floatBtn.style.color      = '#ffffff'
  })
  _floatBtn.addEventListener('mouseleave', function () {
    _floatBtn.style.background = '#ffffff'
    _floatBtn.style.color      = '#000000'
  })
  document.body.appendChild(_floatBtn)
}

// Positionner le bouton flottant au-dessus d'un element
function showFloatBtn(el) {
  if (!_floatBtn) return
  var r = el.getBoundingClientRect()
  _floatBtn.style.top     = Math.max(8, r.top - 52) + 'px'
  _floatBtn.style.left    = r.left + 'px'
  _floatBtn.style.display = 'block'
  // Reconfigurer le click pour cet element
  _floatBtn.onclick = function (e) {
    e.stopPropagation()
    hideFloatBtn()
    startEdit(el)
  }
}

function hideFloatBtn() {
  if (_floatBtn) _floatBtn.style.display = 'none'
}

// Accrocher mouseenter/leave sur chaque element editable
function hookElements() {
  for (var i = 0; i < _els.length; i++) {
    hookOne(_els[i])
  }
  // Cacher le bouton si on sort vers quelque chose qui n'est pas le bouton
  document.addEventListener('mouseover', function (e) {
    if (_active) return
    if (e.target === _floatBtn) return
    var onEditable = false
    for (var i = 0; i < _els.length; i++) {
      if (_els[i].contains(e.target)) { onEditable = true; break }
    }
    if (!onEditable) hideFloatBtn()
  })
}

function hookOne(el) {
  el.addEventListener('mouseenter', function () {
    if (_active && _active !== el) return
    showFloatBtn(el)
  })
  // Marquer l element avec data-orig
  el.setAttribute('data-editable', '1')
}

// ─────────────────────────────────────────────
//  EDITION
// ─────────────────────────────────────────────
function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  _active = el
  el.setAttribute('data-editing', '1')
  el.contentEditable = 'true'
  el.spellcheck      = false
  el.focus()
  try {
    var r = document.createRange()
    r.selectNodeContents(el)
    var s = window.getSelection()
    if (s) { s.removeAllRanges(); s.addRange(r) }
  } catch (e) {}
  el._p = function (e) { onPaste(e) }
  el._k = function (e) { onKey(e, el) }
  el._i = function ()  { onInput(el) }
  el._b = function ()  { stopEdit(el, true) }
  el.addEventListener('paste',   el._p)
  el.addEventListener('keydown', el._k)
  el.addEventListener('input',   el._i)
  el.addEventListener('blur',    el._b)
  setStatus('\u270e Tapez \u00b7 Entr\u00e9e = sauvegarder \u00b7 \u00c9chap = annuler')
}

function stopEdit(el, doSave) {
  el.contentEditable = 'false'
  el.removeAttribute('data-editing')
  el.removeEventListener('paste',   el._p)
  el.removeEventListener('keydown', el._k)
  el.removeEventListener('input',   el._i)
  el.removeEventListener('blur',    el._b)
  hideFloatBtn()
  var key = PAGE + '__' + el.id
  if (doSave && _dirty[key]) saveEl(el)
  if (_active === el) _active = null
}

// ─────────────────────────────────────────────
//  ANTI-CASSE
// ─────────────────────────────────────────────
function onPaste(e) {
  e.preventDefault()
  var t = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''
  document.execCommand('insertText', false, purify(t))
}
function onKey(e, el) {
  if ((e.ctrlKey || e.metaKey) && 'biukh'.indexOf(e.key.toLowerCase()) > -1) {
    e.preventDefault(); return
  }
  if (e.key === 'Enter')  { e.preventDefault(); el.blur(); return }
  if (e.key === 'Escape') {
    var key = PAGE + '__' + el.id
    el.textContent = _db[key] || el.getAttribute('data-orig') || ''
    delete _dirty[key]
    el.blur()
  }
}
function onInput(el) {
  var TAGS = ['b','strong','i','em','u','s','font','mark','span']
  for (var t = 0; t < TAGS.length; t++) {
    var nodes = el.querySelectorAll(TAGS[t])
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n]
      while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
      if (node.parentNode) node.parentNode.removeChild(node)
    }
  }
  _dirty[PAGE + '__' + el.id] = true
  setStatus('\u270e Modifi\u00e9 \u00b7 Entr\u00e9e ou clic ailleurs pour sauvegarder')
}
function getPlainText(el) {
  var clone = el.cloneNode(true)
  return purify(clone.textContent || '')
}
function purify(t) {
  return t.replace(/\r\n|\r/g,'\n').replace(/\n{3,}/g,'\n\n').trim()
}

// ─────────────────────────────────────────────
//  SAUVEGARDE — id + content SEULEMENT
// ─────────────────────────────────────────────
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getPlainText(el)
  if (!key || !content) return
  el.textContent = content
  setStatus('\u23f3 Sauvegarde...')
  sb.from('site_content')
    .upsert({ id: key, content: content }, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key] = content
      delete _dirty[key]
      setStatus('\u2705 Sauvegard\u00e9 !')
      flashEl(el, true)
      console.log('[JBE] OK — id:', key)
    })
    .catch(function (err) {
      setStatus('\u274c ' + err.message)
      flashEl(el, false)
      console.error('[JBE]', err)
    })
}
function saveAll() {
  var count = 0
  for (var i = 0; i < _els.length; i++) {
    var key = PAGE + '__' + _els[i].id
    if (_dirty[key]) { saveEl(_els[i]); count++ }
  }
  if (!count) setStatus('\u2705 Rien \u00e0 sauvegarder')
}

// ─────────────────────────────────────────────
//  BARRE ADMIN
// ─────────────────────────────────────────────
function buildBar(user) {
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'JB')
  var bar = document.createElement('div')
  bar.id  = 'jbe-bar'
  bar.innerHTML =
    '<div class="jbe-l"><span class="jbe-dot"></span>'
    + '<b>Mode \u00c9dition Activ\u00e9</b>'
    + '<span class="jbe-sep">\u2014</span>'
    + '<span>Bonjour <b>' + prenom + '</b></span></div>'
    + '<div id="jbe-msg" class="jbe-m">Survolez un texte pour voir le bouton MODIFIER</div>'
    + '<div class="jbe-r">'
    + '<span class="jbe-cnt">' + _els.length + ' zones</span>'
    + '<button class="jbe-save" onclick="window.__jbeSaveAll()">\u2713 Tout sauvegarder</button>'
    + '<a class="jbe-dash" href="admin.html">Dashboard \u2192</a></div>'
  document.body.insertBefore(bar, document.body.firstChild)
  document.body.style.paddingTop = '52px'
  _bar = document.getElementById('jbe-msg')
  window.__jbeSaveAll = saveAll
}
function setStatus(msg) {
  if (!_bar) return
  _bar.textContent = msg
  if (msg.charAt(0) === '\u2705') {
    setTimeout(function () {
      if (_bar) _bar.textContent = 'Survolez un texte pour voir le bouton MODIFIER'
    }, 3000)
  }
}
function flashEl(el, ok) {
  el.style.outline = ok ? '4px solid #22c55e' : '4px solid #ef4444'
  setTimeout(function () { el.style.outline = '' }, 1500)
}

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s = document.createElement('style')
  s.id  = 'jbe-css'
  s.textContent = ''
    + '#jbe-bar{position:fixed;top:0;left:0;right:0;z-index:99999;height:52px;background:#fff;'
    +   'border-bottom:2px solid #e5e7eb;display:flex;align-items:center;padding:0 18px;gap:14px;'
    +   'font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:14px;color:#111;'
    +   'box-shadow:0 2px 12px rgba(0,0,0,.12)}'
    + '.jbe-l{display:flex;align-items:center;gap:8px;flex-shrink:0}'
    + '.jbe-dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;'
    +   'animation:jbep 2s ease-in-out infinite}'
    + '@keyframes jbep{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 10px rgba(34,197,94,0)}}'
    + '.jbe-sep{color:#ccc;margin:0 4px}'
    + '.jbe-m{flex:1;font-size:13px;color:#888;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.jbe-r{display:flex;align-items:center;gap:10px;flex-shrink:0}'
    + '.jbe-cnt{font-size:12px;color:#bbb}'
    + '.jbe-save{padding:8px 18px;background:#111;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer}'
    + '.jbe-save:hover{background:#333}'
    + '.jbe-dash{padding:8px 18px;background:#fff;color:#111;border:2px solid #ccc;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none}'
    + '.jbe-dash:hover{background:#f5f5f5}'
    + '[data-editing]{outline:4px solid #FFCF00 !important;outline-offset:6px;cursor:text !important}'
    + '[contenteditable="true"]{caret-color:#111;user-select:text !important}'
    + '.nav-btn-admin{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;'
    +   'background:rgba(255,255,255,.95);color:#111;padding:8px 16px;border-radius:5px;'
    +   'text-decoration:none;display:inline-flex;align-items:center;gap:6px;'
    +   'box-shadow:0 2px 8px rgba(0,0,0,.25)}'
    + '.nav-btn-logout{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);'
    +   'background:transparent;padding:8px 14px;border-radius:5px;'
    +   'border:1px solid rgba(255,255,255,.2);cursor:pointer}'
    + '.nav-btn-logout:hover{color:#fff;border-color:rgba(255,255,255,.5)}'
    + '.nav-btn-user{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.6)}'
  document.head.appendChild(s)
}
