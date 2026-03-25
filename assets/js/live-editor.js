// live-editor.js — JB EMERIC — Style Apple
// Double-clic pour éditer · Surbrillance au survol · Texte brut garanti
// ZERO class ES6 · ZERO template literal · ZERO arrow function
console.log("live-editor.js charge !");
console.log("Configuration OK : Utilisation des colonnes id et content uniquement");

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
var sb      = createClient(SB_URL, SB_ANON)

var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'

// Sélecteurs stricts — TEXTES PURS SEULEMENT
// Exclus : éléments contenant des <em>, <span>, <a>, <img> (HTML structurant)
var SEL = [
  '.hero-kicker',
  '.hero-sub',
  '.hero-lead',
  '.hero-eyebrow',
  '.ov-desc',
  '.ov-card-name',
  '.ov-card-sub',
  '.ov-card-num',
  '.ov-eyebrow',
  '.flyer-name',
  '.flyer-hook',
  '.flyer-pretitle',
  '.flyer-tag',
  '.pc-title',
  '.pc-lead',
  '.sr-title',
  '.sr-lead',
  '.body-txt',
  '.kicker',
  '.stat-key',
  '.stat-desc',
  '.man-title',
  '.man-lead'
].join(',')

var _db     = {}
var _els    = []
var _dirty  = {}
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
      var meta    = (user && user.user_metadata) ? user.user_metadata : {}
      var role    = meta.role || null
      var isAdmin = (role === 'admin' || role === 'moderateur')
      console.log('[JBE] role:', role, '| isAdmin:', isAdmin)
      updateNav(user, isAdmin)
      if (isAdmin) {
        injectCSS()
        activateEditing()
        buildBar(user)
      }
    })
    .catch(function (err) { showPage(); console.warn('[JBE]', err) })
})

// ─────────────────────────────────────────────
//  SCAN — ne garde que les éléments sans HTML interne
// ─────────────────────────────────────────────
function scanElements() {
  _els = []
  var n   = 1
  var all = document.querySelectorAll(SEL)
  for (var i = 0; i < all.length; i++) {
    var el = all[i]
    // Exclure nav, footer, svg
    if (el.closest('nav') || el.closest('footer') || el.closest('svg')) continue
    // Exclure si l'element contient des balises HTML structurantes
    // (em, span, a, img, button → le CSS dépend d'elles)
    if (el.querySelector('em,span,a,img,button,strong,b,i')) continue
    // Texte vide
    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue
    // Attribuer un id stable
    if (!el.id) el.id = 'txt-' + n
    n++
    el.setAttribute('data-orig', txt)
    _els.push(el)
  }
  console.log('[JBE] ' + _els.length + ' elements indexes (' + PAGE + ')')
}

// ─────────────────────────────────────────────
//  CHARGEMENT
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
    .catch(function (e) { console.warn('[JBE]', e.message) })
}

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
      ? '<a class="nav-btn-admin" href="admin.html">\u2746 Admin</a>'
        + '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<span class="nav-btn-user">' + prenom + '</span>'
        + '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  var mob = document.querySelector('.nav-mobile-cta')
         || document.querySelector('.nav-mobile-auth')
  if (mob) {
    mob.innerHTML = isAdmin
      ? '<a class="nav-mobile-btn" href="admin.html">\u2746 Admin</a>'
        + '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }
  window.__jbeOut = function () {
    sb.auth.signOut().then(function () { location.reload() })
  }
}

// ─────────────────────────────────────────────
//  ACTIVATION ÉDITION — double-clic + survol
// ─────────────────────────────────────────────
function activateEditing() {
  for (var i = 0; i < _els.length; i++) {
    bindElement(_els[i])
  }
  // Clic en dehors = quitter l'édition active
  document.addEventListener('click', function (e) {
    if (!_active) return
    if (!_active.contains(e.target)) stopEdit(_active, true)
  })
}

function bindElement(el) {
  // Appliquer contenu Supabase
  var key = PAGE + '__' + el.id
  if (_db[key]) el.textContent = _db[key]

  // Curseur texte au survol pour indiquer l'éditabilité
  el.style.cursor = 'default'

  // Survol : surbrillance subtile
  el.addEventListener('mouseenter', function () {
    if (_active === el) return
    el.classList.add('jbe-hover')
  })
  el.addEventListener('mouseleave', function () {
    el.classList.remove('jbe-hover')
  })

  // Double-clic : activer l'édition
  el.addEventListener('dblclick', function (e) {
    e.preventDefault()
    e.stopPropagation()
    startEdit(el)
  })
}

// ─────────────────────────────────────────────
//  ÉDITION
// ─────────────────────────────────────────────
function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  _active = el

  el.classList.remove('jbe-hover')
  el.classList.add('jbe-editing')
  el.contentEditable = 'true'
  el.spellcheck      = false
  el.style.cursor    = 'text'

  // Sélectionner tout le texte
  el.focus()
  try {
    var r = document.createRange()
    r.selectNodeContents(el)
    var s = window.getSelection()
    if (s) { s.removeAllRanges(); s.addRange(r) }
  } catch (err) {}

  el._p = function (e) { onPaste(e) }
  el._k = function (e) { onKey(e, el) }
  el._i = function ()  { onInput(el) }

  el.addEventListener('paste',   el._p)
  el.addEventListener('keydown', el._k)
  el.addEventListener('input',   el._i)

  setStatus('\u270e Modifiez le texte \u00b7 Entr\u00e9e = sauvegarder \u00b7 \u00c9chap = annuler')
}

function stopEdit(el, doSave) {
  el.contentEditable = 'false'
  el.style.cursor    = 'default'
  el.classList.remove('jbe-editing')

  el.removeEventListener('paste',   el._p)
  el.removeEventListener('keydown', el._k)
  el.removeEventListener('input',   el._i)

  var key = PAGE + '__' + el.id
  if (doSave && _dirty[key]) saveEl(el)
  if (_active === el) _active = null
}

// ─────────────────────────────────────────────
//  ANTI-CASSE — texte brut absolu
//  Aucun style, aucun HTML ne peut entrer
// ─────────────────────────────────────────────
function onPaste(e) {
  e.preventDefault()
  // Lire uniquement text/plain — tout le reste est ignoré
  var raw = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''
  document.execCommand('insertText', false, purify(raw))
}

function onKey(e, el) {
  // Bloquer tous les raccourcis de formatage
  if ((e.ctrlKey || e.metaKey) && 'biukh'.indexOf(e.key.toLowerCase()) > -1) {
    e.preventDefault(); return
  }
  // Entrée = sauvegarder
  if (e.key === 'Enter') {
    e.preventDefault()
    stopEdit(el, true)
    return
  }
  // Échap = annuler
  if (e.key === 'Escape') {
    var key = PAGE + '__' + el.id
    el.textContent = _db[key] || el.getAttribute('data-orig') || ''
    delete _dirty[key]
    stopEdit(el, false)
  }
}

function onInput(el) {
  // Nettoyer TOUTE balise HTML qui aurait pu entrer
  // (copier-coller depuis Word, etc.)
  var TAGS = ['b','strong','i','em','u','s','font','mark','span','code','sub','sup']
  for (var t = 0; t < TAGS.length; t++) {
    var nodes = el.querySelectorAll(TAGS[t])
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n]
      while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
      if (node.parentNode) node.parentNode.removeChild(node)
    }
  }
  // Retirer tout attribut style/class sur les descendants
  var styledNodes = el.querySelectorAll('[style],[class],[color],[face],[size]')
  for (var s = 0; s < styledNodes.length; s++) {
    styledNodes[s].removeAttribute('style')
    styledNodes[s].removeAttribute('class')
    styledNodes[s].removeAttribute('color')
    styledNodes[s].removeAttribute('face')
    styledNodes[s].removeAttribute('size')
  }
  _dirty[PAGE + '__' + el.id] = true
  setStatus('\u270e Modifi\u00e9 \u00b7 Entr\u00e9e ou clic en dehors pour sauvegarder')
}

function getPlainText(el) {
  // Cloner l'élément et extraire uniquement le texte brut
  var clone = el.cloneNode(true)
  return purify(clone.textContent || '')
}

function purify(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ─────────────────────────────────────────────
//  SAUVEGARDE — id + content seulement
// ─────────────────────────────────────────────
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getPlainText(el)
  if (!key || !content) return

  // Remettre proprement le textContent (retire tout HTML résiduel)
  el.textContent = content

  setStatus('\u23f3 Sauvegarde...')

  sb.from('site_content')
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
  var count = 0
  for (var i = 0; i < _els.length; i++) {
    var key = PAGE + '__' + _els[i].id
    if (_dirty[key]) { saveEl(_els[i]); count++ }
  }
  if (!count) setStatus('\u2705 Tout est \u00e0 jour')
}

// ─────────────────────────────────────────────
//  BARRE ADMIN — style Apple
// ─────────────────────────────────────────────
function buildBar(user) {
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'JB')
  var bar    = document.createElement('div')
  bar.id     = 'jbe-bar'
  bar.innerHTML =
    '<div class="jbe-l">'
    + '<span class="jbe-dot"></span>'
    + '<span class="jbe-title">Mode \u00c9dition</span>'
    + '<span class="jbe-name">Bonjour, <b>' + prenom + '</b></span>'
    + '</div>'
    + '<div id="jbe-msg" class="jbe-m">'
    + 'Double-cliquez sur un texte pour le modifier'
    + '</div>'
    + '<div class="jbe-r">'
    + '<span class="jbe-cnt" id="jbe-cnt"></span>'
    + '<button class="jbe-btn-save" onclick="window.__jbeSaveAll()">'
    + 'Sauvegarder tout'
    + '</button>'
    + '<a class="jbe-btn-dash" href="admin.html">Dashboard</a>'
    + '</div>'
  document.body.insertBefore(bar, document.body.firstChild)
  document.body.style.paddingTop = '44px'
  _bar = document.getElementById('jbe-msg')
  window.__jbeSaveAll = saveAll

  // Afficher le nombre de zones
  var cntEl = document.getElementById('jbe-cnt')
  if (cntEl) cntEl.textContent = _els.length + ' zones \u00e9ditables'
  console.log('[JBE] Barre admin OK — ' + _els.length + ' zones')
}

function setStatus(msg) {
  if (!_bar) return
  _bar.textContent = msg
  if (msg.charAt(0) === '\u2705') {
    setTimeout(function () {
      if (_bar) _bar.textContent = 'Double-cliquez sur un texte pour le modifier'
    }, 2500)
  }
}

function flashEl(el) {
  el.style.transition = 'background-color .3s'
  el.style.backgroundColor = 'rgba(34,197,94,.15)'
  setTimeout(function () {
    el.style.backgroundColor = ''
    setTimeout(function () { el.style.transition = '' }, 300)
  }, 800)
}

// ─────────────────────────────────────────────
//  CSS — style Apple / minimaliste
// ─────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s = document.createElement('style')
  s.id  = 'jbe-css'
  var css = ''
  css += '#jbe-bar{position:fixed;top:0;left:0;right:0;z-index:99998;height:44px;background:rgba(255,255,255,.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,.1);display:flex;align-items:center;padding:0 20px;gap:16px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;font-size:13px;color:#1c1c1e;box-shadow:0 1px 0 rgba(0,0,0,.06)}'
  css += '.jbe-l{display:flex;align-items:center;gap:10px;flex-shrink:0}'
  css += '.jbe-dot{width:8px;height:8px;border-radius:50%;background:#34c759;flex-shrink:0;box-shadow:0 0 0 0 rgba(52,199,89,.4);animation:jbepulse 2.5s ease-in-out infinite}'
  css += '@keyframes jbepulse{0%{box-shadow:0 0 0 0 rgba(52,199,89,.4)}70%{box-shadow:0 0 0 7px rgba(52,199,89,0)}100%{box-shadow:0 0 0 0 rgba(52,199,89,0)}}'
  css += '.jbe-title{font-weight:600;font-size:13px;color:#1c1c1e}'
  css += '.jbe-name{font-size:12px;color:#6e6e73}'
  css += '.jbe-m{flex:1;font-size:12px;color:#8e8e93;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  css += '.jbe-r{display:flex;align-items:center;gap:8px;flex-shrink:0}'
  css += '.jbe-cnt{font-size:11px;color:#aeaeb2}'
  css += '.jbe-btn-save{padding:5px 14px;background:#007aff;color:#fff;border:none;border-radius:14px;font-size:12px;font-weight:500;font-family:inherit;cursor:pointer;transition:background .15s}'
  css += '.jbe-btn-save:hover{background:#0066d6}'
  css += '.jbe-btn-dash{padding:5px 14px;background:transparent;color:#007aff;border:1px solid rgba(0,122,255,.35);border-radius:14px;font-size:12px;font-weight:500;text-decoration:none;transition:all .15s}'
  css += '.jbe-btn-dash:hover{background:rgba(0,122,255,.06)}'
  css += '.jbe-hover{outline:2px solid rgba(0,122,255,.45)!important;outline-offset:3px;border-radius:3px;cursor:text!important}'
  css += '.jbe-editing{outline:2px solid #007aff!important;outline-offset:3px;border-radius:3px;background:rgba(0,122,255,.04)!important;cursor:text!important}'
  css += '[contenteditable="true"]{caret-color:#007aff;user-select:text!important}'
  css += '.nav-btn-admin{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;background:rgba(255,255,255,.9);color:#111;padding:6px 14px;border-radius:5px;text-decoration:none;box-shadow:0 1px 6px rgba(0,0,0,.2);display:inline-flex;align-items:center;gap:5px}'
  css += '.nav-btn-logout{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);background:transparent;padding:6px 13px;border-radius:5px;border:1px solid rgba(255,255,255,.2);cursor:pointer}'
  css += '.nav-btn-logout:hover{color:#fff;border-color:rgba(255,255,255,.5)}'
  css += '.nav-btn-user{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.6)}'
  s.textContent = css
  document.head.appendChild(s)
}
