// live-editor.js — JB EMERIC
// ZERO class, ZERO template literal, ZERO arrow function
// Colonnes Supabase : id + content uniquement (pas de colonne page)
console.log('live-editor.js charge !');

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
var sb      = createClient(SB_URL, SB_ANON)

var PAGE     = (location.pathname.split('/').pop().replace('.html', '')) || 'index'
var SEL      = 'h1,h2,h3,h4,.hero-title,.hero-lead,.hero-sub,.hero-kicker,.ov-title,.ov-desc,.ov-card-name,.ov-card-sub,.flyer-name,.flyer-hook,.flyer-pretitle,.pc-title,.pc-lead,.sr-title,.sr-lead,p'
var _db      = {}
var _els     = []
var _dirty   = {}
var _bar     = null
var _active  = null

// ── Masquer le body pour eviter le flash de l ancien texte ────────
var _hs = document.createElement('style')
_hs.textContent = 'body{opacity:0}'
document.head.appendChild(_hs)

function showPage() {
  document.body.style.opacity = '1'
  document.body.style.transition = 'opacity .2s'
  _hs.parentNode && _hs.parentNode.removeChild(_hs)
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  scanElements()
  Promise.all([
    loadTexts(),
    sb.auth.getSession()
  ]).then(function (results) {
    applyTexts()
    showPage()
    var sessData = results[1]
    var session  = (sessData && sessData.data) ? sessData.data.session : null
    var user     = session ? session.user : null
    var role     = (user && user.user_metadata) ? user.user_metadata.role : null
    var isAdmin  = (role === 'admin' || role === 'moderateur')
    updateNav(user, isAdmin)
    if (isAdmin) {
      injectCSS()
      addPencils()
      buildBar(user)
    }
  }).catch(function (err) {
    showPage()
    console.warn('[JBE] Erreur init:', err)
  })
})

// ── SCAN — id automatique txt-01, txt-02 … ────────────────────────
function scanElements() {
  _els = []
  var n = 1
  var all = document.querySelectorAll(SEL)
  for (var i = 0; i < all.length; i++) {
    var el = all[i]
    if (el.closest('nav') || el.closest('footer') || el.closest('script') || el.closest('svg')) continue
    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue
    if (el.querySelector(SEL)) continue
    if (!el.id) {
      el.id = 'txt-' + (n < 10 ? '0' + n : '' + n)
    }
    n++
    el.setAttribute('data-orig', txt)
    _els.push(el)
  }
  console.log('[JBE] ' + _els.length + ' elements indexes (' + PAGE + ')')
}

// ── CHARGER — select id + content, PAS de filtre page ────────────
function loadTexts() {
  return sb.from('site_content')
    .select('id, content')
    .then(function (res) {
      if (res.error) { console.info('[JBE]', res.error.message); return }
      if (res.data && res.data.length > 0) {
        for (var i = 0; i < res.data.length; i++) {
          _db[res.data[i].id] = res.data[i].content
        }
      }
    })
    .catch(function (e) { console.info('[JBE] Supabase:', e.message) })
}

// ── APPLIQUER les textes Supabase au DOM ──────────────────────────
function applyTexts() {
  for (var i = 0; i < _els.length; i++) {
    var key = PAGE + '__' + _els[i].id
    if (_db[key]) _els[i].textContent = _db[key]
  }
}

// ── NAV ───────────────────────────────────────────────────────────
function updateNav(user, isAdmin) {
  if (!user) return
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'Admin')
  var desk = document.querySelector('.nav-auth')
  if (desk) {
    desk.innerHTML = isAdmin
      ? '<a class="nav-btn-admin" href="admin.html">\u2746 Espace Admin</a><button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<span class="nav-btn-user">' + prenom + '</span><button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  var mob = document.querySelector('.nav-mobile-cta') || document.querySelector('.nav-mobile-auth')
  if (mob) {
    mob.innerHTML = isAdmin
      ? '<a class="nav-mobile-btn" href="admin.html">\u2746 Espace Admin</a><button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  window.__jbeOut = function () { sb.auth.signOut().then(function () { location.reload() }) }
}

// ── CRAYONS ───────────────────────────────────────────────────────
function addPencils() {
  for (var i = 0; i < _els.length; i++) addPencil(_els[i])
}

function addPencil(el) {
  if (el.querySelector('.jbe-btn')) return
  var key = PAGE + '__' + el.id
  if (_db[key]) el.textContent = _db[key]
  if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative'
  var btn = document.createElement('button')
  btn.className = 'jbe-btn'
  btn.type = 'button'
  btn.textContent = 'MODIFIER'
  btn.addEventListener('click', function (e) { e.stopPropagation(); startEdit(el) })
  el.appendChild(btn)
}

function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  _active = el
  var oldBtn = el.querySelector('.jbe-btn')
  if (oldBtn) oldBtn.parentNode.removeChild(oldBtn)
  el.setAttribute('data-editing', '1')
  el.contentEditable = 'true'
  el.spellcheck = false
  el.focus()
  try {
    var r = document.createRange(); r.selectNodeContents(el)
    var s = window.getSelection(); if (s) { s.removeAllRanges(); s.addRange(r) }
  } catch (e) {}
  el._p = function (e) { onPaste(e) }
  el._k = function (e) { onKey(e, el) }
  el._i = function () { onInput(el) }
  el._b = function () { stopEdit(el, true) }
  el.addEventListener('paste', el._p)
  el.addEventListener('keydown', el._k)
  el.addEventListener('input', el._i)
  el.addEventListener('blur', el._b)
  setStatus('\u270e Tapez votre texte \u00b7 Entr\u00e9e = sauvegarder \u00b7 \u00c9chap = annuler')
}

function stopEdit(el, doSave) {
  el.contentEditable = 'false'
  el.removeAttribute('data-editing')
  el.removeEventListener('paste', el._p)
  el.removeEventListener('keydown', el._k)
  el.removeEventListener('input', el._i)
  el.removeEventListener('blur', el._b)
  addPencil(el)
  var key = PAGE + '__' + el.id
  if (doSave && _dirty[key]) saveEl(el)
  if (_active === el) _active = null
}

// ── ANTI-CASSE — texte brut uniquement ───────────────────────────
function onPaste(e) {
  e.preventDefault()
  var t = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''
  document.execCommand('insertText', false, purify(t))
}

function onKey(e, el) {
  if ((e.ctrlKey || e.metaKey) && 'biukh'.indexOf(e.key.toLowerCase()) > -1) {
    e.preventDefault(); return
  }
  if (e.key === 'Enter') { e.preventDefault(); el.blur(); return }
  if (e.key === 'Escape') {
    var key = PAGE + '__' + el.id
    el.textContent = _db[key] || el.getAttribute('data-orig') || ''
    delete _dirty[key]
    el.blur()
  }
}

function onInput(el) {
  var tags = ['b','strong','i','em','u','s','font','mark','span']
  for (var t = 0; t < tags.length; t++) {
    var nodes = el.querySelectorAll(tags[t])
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
  var btns = clone.querySelectorAll('.jbe-btn')
  for (var i = 0; i < btns.length; i++) btns[i].parentNode.removeChild(btns[i])
  return purify(clone.textContent || '')
}

function purify(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ── SAUVEGARDE — colonnes id + content seulement ─────────────────
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getPlainText(el)
  if (!key || !content) return
  var oldBtn = el.querySelector('.jbe-btn')
  if (oldBtn) oldBtn.parentNode.removeChild(oldBtn)
  el.textContent = content
  addPencil(el)
  setStatus('\u23f3 Sauvegarde...')
  sb.from('site_content')
    .upsert({ id: key, content: content }, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key] = content
      delete _dirty[key]
      setStatus('\u2705 Sauvegard\u00e9 !')
      flashEl(el, true)
    })
    .catch(function (err) {
      setStatus('\u274c Erreur : ' + err.message)
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

// ── BARRE ADMIN ───────────────────────────────────────────────────
function buildBar(user) {
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'JB')
  var bar = document.createElement('div')
  bar.id = 'jbe-bar'
  bar.innerHTML =
    '<div class="jbe-l"><span class="jbe-dot"></span>' +
    '<b>Mode \u00c9dition Activ\u00e9</b>' +
    '<span class="jbe-sep">\u2014</span>' +
    '<span>Bonjour <b>' + prenom + '</b></span></div>' +
    '<div id="jbe-msg" class="jbe-m">Survolez un texte pour voir le bouton MODIFIER</div>' +
    '<div class="jbe-r">' +
    '<span class="jbe-cnt">' + _els.length + ' zones</span>' +
    '<button class="jbe-save" onclick="window.__jbeSaveAll()">\u2713 Tout sauvegarder</button>' +
    '<a class="jbe-dash" href="admin.html">Dashboard \u2192</a></div>'
  document.body.insertBefore(bar, document.body.firstChild)
  document.body.style.paddingTop = '48px'
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
  el.style.outline = ok ? '3px solid #22c55e' : '3px solid #ef4444'
  setTimeout(function () { el.style.outline = '' }, 1500)
}

// ── CSS injecte une seule fois pour les admins ───────────────────
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s = document.createElement('style')
  s.id = 'jbe-css'
  s.textContent = [
    '#jbe-bar{position:fixed;top:0;left:0;right:0;z-index:99999;height:48px;background:#fff;border-bottom:2px solid #e5e7eb;display:flex;align-items:center;padding:0 16px;gap:12px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:13px;color:#111;box-shadow:0 2px 10px rgba(0,0,0,.1)}',
    '.jbe-l{display:flex;align-items:center;gap:7px;flex-shrink:0}',
    '.jbe-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#22c55e;animation:jbep 2s ease-in-out infinite}',
    '@keyframes jbep{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 9px rgba(34,197,94,0)}}',
    '.jbe-sep{color:#ccc;margin:0 3px}',
    '.jbe-m{flex:1;font-size:12px;color:#888;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.jbe-r{display:flex;align-items:center;gap:8px;flex-shrink:0}',
    '.jbe-cnt{font-size:11px;color:#bbb}',
    '.jbe-save{padding:6px 14px;background:#111;color:#fff;border:none;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer}',
    '.jbe-save:hover{background:#333}',
    '.jbe-dash{padding:6px 14px;background:#fff;color:#111;border:1.5px solid #ccc;border-radius:5px;font-size:12px;font-weight:600;text-decoration:none}',
    '.jbe-dash:hover{background:#f5f5f5}',

    /* Bouton MODIFIER — enorme, contraste max, z-index 99999 */
    '.jbe-btn{',
    'position:absolute;top:-18px;right:-6px;',
    'z-index:99999;',
    'background:#ffffff;',
    'color:#111111;',
    'font-weight:900;',
    'font-size:14px;',
    'font-family:-apple-system,Helvetica,Arial,sans-serif;',
    'letter-spacing:0.5px;',
    'padding:6px 16px;',
    'border:3px solid #111111;',
    'border-radius:30px;',
    'box-shadow:0 4px 16px rgba(0,0,0,.35),0 0 0 4px rgba(255,255,255,1);',
    'cursor:pointer;',
    'opacity:0;',
    'transform:translateY(4px);',
    'transition:opacity .2s,transform .2s;',
    'white-space:nowrap;',
    'pointer-events:auto;',
    '}',
    '[data-orig]:hover .jbe-btn,[data-editing]:hover .jbe-btn{opacity:1;transform:translateY(0)}',
    '.jbe-btn:hover{background:#111111;color:#ffffff;border-color:#111111;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.4),0 0 0 4px rgba(255,255,255,1)}',

    /* Surbrillance jaune sur element actif */
    '[data-editing]{outline:3px solid #FFCF00 !important;outline-offset:6px;cursor:text !important}',
    '[contenteditable="true"]{caret-color:#111;user-select:text !important}',

    /* Nav connecte */
    '.nav-btn-admin{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;background:rgba(255,255,255,.95);color:#111;padding:7px 14px;border-radius:5px;text-decoration:none;display:inline-flex;align-items:center;gap:5px;box-shadow:0 1px 6px rgba(0,0,0,.2)}',
    '.nav-btn-logout{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.45);background:transparent;padding:7px 13px;border-radius:5px;border:1px solid rgba(255,255,255,.15);cursor:pointer}',
    '.nav-btn-logout:hover{color:#fff;border-color:rgba(255,255,255,.4)}',
    '.nav-btn-user{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.55)}'
  ].join('')
  document.head.appendChild(s)
}
