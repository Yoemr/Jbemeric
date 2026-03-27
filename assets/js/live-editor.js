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

// Sélecteurs texte — textes purs uniquement
var SEL = [
  '.hero-title', '.hero-lead', '.hero-kicker', '.hero-sub', '.hero-eyebrow',
  '.ov-desc', '.ov-eyebrow', '.ov-card-name', '.ov-card-sub', '.ov-card-num', '.ov-card-price',
  '.sh-kick',
  '.flyer-hook', '.flyer-pretitle', '.flyer-tag', '.flyer-cta',
  '.pc-lead', '.man-lead', '.porte-tag', '.porte-body', '.porte-cta',
  '.sr-lead', '.body-txt', '.sr-circuit', '.sr-prix',
  '.kicker', '.stat-key', '.stat-desc',
  '.nl-subtitle', '.art-title', '.art-desc'
].join(',')

var _db      = {}
var _els     = []
var _imgs    = []
var _dirty   = {}
var _active  = null
var _bar     = null

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
        activateImages()
        buildBar(user)
      }
    })
    .catch(function (err) { showPage(); console.warn('[JBE]', err) })
})

// ─────────────────────────────────────────────
//  SCAN TEXTES
// ─────────────────────────────────────────────
function scanElements() {
  _els = []
  var n = 1
  var all = document.querySelectorAll(SEL)
  for (var i = 0; i < all.length; i++) {
    var el = all[i]
    if (el.closest('nav') || el.closest('footer') || el.closest('svg')) continue
    if (el.querySelector('a,img,button,input,select,textarea')) continue
    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue
    if (!el.id) el.id = 'txt-' + n
    n++
    el.setAttribute('data-orig-html', el.innerHTML)
    el.setAttribute('data-orig', txt)
    _els.push(el)
  }
  console.log('[JBE] ' + _els.length + ' textes indexes (' + PAGE + ')')
}

// ─────────────────────────────────────────────
//  SCAN IMAGES
// ─────────────────────────────────────────────
function scanImages() {
  _imgs = []
  var n = 1
  var all = document.querySelectorAll('img')
  for (var i = 0; i < all.length; i++) {
    var img = all[i]
    if (img.closest('nav') || img.closest('footer') || img.closest('svg')) continue
    if (!img.src || img.width < 60) continue
    if (!img.id) img.id = 'img-' + n
    n++
    img.setAttribute('data-orig-src', img.src)
    _imgs.push(img)
  }
  console.log('[JBE] ' + _imgs.length + ' images indexees (' + PAGE + ')')
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
        console.log('[JBE] ' + res.data.length + ' entree(s) Supabase')
      }
    })
    .catch(function (e) { console.warn('[JBE]', e.message) })
}

function applyTexts() {
  for (var i = 0; i < _els.length; i++) {
    var el  = _els[i]
    var key = PAGE + '__' + el.id
    if (!_db[key]) continue
    var origHtml = el.getAttribute('data-orig-html') || ''
    var hasMixed = el.querySelector('em,span,strong,b,i')
                || origHtml.indexOf('<em') >= 0
                || origHtml.indexOf('<span') >= 0
    if (hasMixed) { console.log('[JBE] Skip mixed:', key); continue }
    el.textContent = _db[key]
  }
}

function applyImages() {
  for (var i = 0; i < _imgs.length; i++) {
    var img = _imgs[i]
    var key = PAGE + '__' + img.id
    if (_db[key]) img.src = _db[key]
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

// ─────────────────────────────────────────────
//  ÉDITION TEXTE — double-clic + survol
// ─────────────────────────────────────────────
function activateEditing() {
  for (var i = 0; i < _els.length; i++) {
    bindElement(_els[i])
  }
  document.addEventListener('click', function (e) {
    if (!_active) return
    if (!_active.contains(e.target)) stopEdit(_active, true)
  })
}

function bindElement(el) {
  var key = PAGE + '__' + el.id
  if (_db[key]) {
    var origHtml = el.getAttribute('data-orig-html') || ''
    var hasMixed = origHtml.indexOf('<em') >= 0 || origHtml.indexOf('<span') >= 0
    if (!hasMixed) el.textContent = _db[key]
  }
  el.style.cursor = 'default'
  el.addEventListener('mouseenter', function () {
    if (_active === el) return
    el.classList.add('jbe-hover')
  })
  el.addEventListener('mouseleave', function () {
    el.classList.remove('jbe-hover')
  })
  el.addEventListener('dblclick', function (e) {
    e.preventDefault()
    e.stopPropagation()
    startEdit(el)
  })
}

function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  _active = el
  el.classList.remove('jbe-hover')
  el.classList.add('jbe-editing')
  el.contentEditable = 'true'
  el.spellcheck      = false
  el.style.cursor    = 'text'
  el.focus()
  try {
    var r = document.createRange()
    var firstTxt = null
    for (var ci = 0; ci < el.childNodes.length; ci++) {
      if (el.childNodes[ci].nodeType === 3) { firstTxt = el.childNodes[ci]; break }
    }
    if (firstTxt) { r.selectNodeContents(firstTxt) } else { r.selectNodeContents(el) }
    var s = window.getSelection()
    if (s) { s.removeAllRanges(); s.addRange(r) }
  } catch (err) {}
  el._p = function (e) { onPaste(e) }
  el._k = function (e) { onKey(e, el) }
  el._i = function ()  { onInput(el) }
  el._b = function ()  { stopEdit(el, true) }
  el.addEventListener('paste',   el._p)
  el.addEventListener('keydown', el._k)
  el.addEventListener('input',   el._i)
  el.addEventListener('blur',    el._b)
  setStatus('\u270e Modifiez le texte \u00b7 Entr\u00e9e = sauvegarder \u00b7 \u00c9chap = annuler')
}

function stopEdit(el, doSave) {
  el.contentEditable = 'false'
  el.style.cursor    = 'default'
  el.classList.remove('jbe-editing')
  el.removeEventListener('paste',   el._p)
  el.removeEventListener('keydown', el._k)
  el.removeEventListener('input',   el._i)
  el.removeEventListener('blur',    el._b)
  el._wrapper = null
  var key = PAGE + '__' + el.id
  if (!_dirty[key] && el.getAttribute('data-orig-html')) {
    var oh = el.getAttribute('data-orig-html')
    if (el.innerHTML !== oh) el.innerHTML = oh
  }
  if (doSave && _dirty[key]) saveEl(el)
  if (_active === el) _active = null
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
    var origHtml = el.getAttribute('data-orig-html')
    if (origHtml) { el.innerHTML = origHtml }
    else { el.textContent = _db[key] || el.getAttribute('data-orig') || '' }
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
        var r = document.createRange(); r.selectNodeContents(el); r.collapse(false)
        var s = window.getSelection(); if (s) { s.removeAllRanges(); s.addRange(r) }
      } catch(e2) {}
      return
    }
  }
  var TAGS = ['b','strong','i','em','u','s','font','mark','code']
  if (!hasChildren) {
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
  setStatus('\u270e Modifi\u00e9 \u00b7 Entr\u00e9e ou clic ailleurs pour sauvegarder')
}

function getPlainText(el) {
  var clone = el.cloneNode(true)
  return purify(clone.textContent || '')
}

function purify(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ─────────────────────────────────────────────
//  ÉDITION IMAGES
// ─────────────────────────────────────────────
function activateImages() {
  scanImages()
  applyImages()
  for (var i = 0; i < _imgs.length; i++) {
    bindImage(_imgs[i])
  }
}

function bindImage(img) {
  // Wrapper position:relative pour ancrer l'icône
  var parent = img.parentNode
  if (!parent) return

  // Créer un wrapper si l'image n'est pas déjà dans un conteneur relatif
  var wrapper = document.createElement('span')
  wrapper.className = 'jbe-img-wrap'
  parent.insertBefore(wrapper, img)
  wrapper.appendChild(img)

  // Icône "+" en bas à droite
  var btn = document.createElement('button')
  btn.className   = 'jbe-img-btn'
  btn.type        = 'button'
  btn.textContent = '+'
  btn.title       = 'Changer l\'image'
  wrapper.appendChild(btn)

  // Hover sur l'image
  wrapper.addEventListener('mouseenter', function () {
    img.style.opacity = '.8'
    img.style.outline = '2px solid #007aff'
    btn.style.opacity = '1'
    btn.style.transform = 'scale(1)'
  })
  wrapper.addEventListener('mouseleave', function () {
    img.style.opacity = ''
    img.style.outline = ''
    btn.style.opacity = '0'
    btn.style.transform = 'scale(.8)'
  })

  // Clic sur l'icône → prompt URL
  btn.addEventListener('click', function (e) {
    e.stopPropagation()
    var current = img.src || img.getAttribute('data-orig-src') || ''
    var newUrl = window.prompt('URL de la nouvelle image :', current)
    if (!newUrl || newUrl === current) return
    newUrl = newUrl.trim()
    img.src = newUrl
    saveImage(img, newUrl)
  })
}

function saveImage(img, url) {
  var key = PAGE + '__' + img.id
  setStatus('\u23f3 Sauvegarde image...')
  sb.from('site_content')
    .upsert({ id: key, content: url }, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key] = url
      setStatus('\u2705 Image sauvegard\u00e9e')
      flashImg(img)
      console.log('[JBE] Image OK:', key)
    })
    .catch(function (err) {
      setStatus('\u274c ' + err.message)
      console.error('[JBE]', err)
    })
}

function flashImg(img) {
  img.style.transition = 'outline .3s'
  img.style.outline    = '3px solid #34c759'
  setTimeout(function () { img.style.outline = ''; img.style.transition = '' }, 1200)
}

// ─────────────────────────────────────────────
//  SAUVEGARDE TEXTE
// ─────────────────────────────────────────────
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getPlainText(el)
  if (!key || !content) return
  var origHtml = el.getAttribute('data-orig-html')
  if (origHtml && el.querySelector('em,span,strong,b,i')) {
    el.innerHTML = origHtml
  } else {
    el.textContent = content
  }
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

function cleanBrokenEntries() {
  setStatus('\u23f3 Recherche des entr\u00e9es invalides...')
  sb.from('site_content').select('*').like('id', PAGE + '__%')
    .then(function (res) {
      if (res.error) { setStatus('\u274c ' + res.error.message); return }
      if (!res.data || !res.data.length) { setStatus('\u2705 Aucune entr\u00e9e \u00e0 nettoyer'); return }
      var toDelete = []
      for (var i = 0; i < res.data.length; i++) {
        var row  = res.data[i]
        var elId = row.id.replace(PAGE + '__', '')
        var el   = document.getElementById(elId)
        if (!el) continue
        if (el.querySelector('em,span,strong,b,i')) {
          toDelete.push(row.id)
          console.log('[JBE] Invalide:', row.id, '=', row.content)
        }
      }
      if (!toDelete.length) { setStatus('\u2705 Aucune entr\u00e9e invalide'); return }
      setStatus('\u23f3 Suppression de ' + toDelete.length + ' entr\u00e9e(s)...')
      var dels = []
      for (var j = 0; j < toDelete.length; j++) {
        dels.push(sb.from('site_content').delete().eq('id', toDelete[j]))
        delete _db[toDelete[j]]
      }
      Promise.all(dels).then(function () {
        setStatus('\u2705 ' + toDelete.length + ' entr\u00e9e(s) supprim\u00e9e(s) \u2014 rechargez')
      }).catch(function (err) { setStatus('\u274c ' + err.message) })
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
//  BARRE ADMIN
// ─────────────────────────────────────────────
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
    +   'Double-clic = texte \u00b7 Clic + = image'
    + '</div>'
    + '<div class="jbe-bar-right">'
    +   '<span class="jbe-bar-cnt" id="jbe-cnt"></span>'
    +   '<button class="jbe-btn-clean" onclick="window.__jbeClean()">\u26a0 R\u00e9parer</button>'
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
  var navH = nav ? nav.offsetHeight : 56
  bar.style.top = navH + 'px'
  var currentPad = parseInt(window.getComputedStyle(document.body).paddingTop) || 0
  document.body.style.paddingTop = (currentPad + 42) + 'px'
  _bar = document.getElementById('jbe-msg')
  window.__jbeSaveAll = saveAll
  window.__jbeClean   = cleanBrokenEntries
  var cntEl = document.getElementById('jbe-cnt')
  if (cntEl) cntEl.textContent = _els.length + ' textes \u00b7 ' + _imgs.length + ' images'
  console.log('[JBE] Barre admin OK')
}

function setStatus(msg) {
  if (!_bar) return
  _bar.textContent = msg
  if (msg.charAt(0) === '\u2705') {
    setTimeout(function () {
      if (_bar) _bar.textContent = 'Double-clic = texte \u00b7 Clic + = image'
    }, 2500)
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

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s = document.createElement('style')
  s.id  = 'jbe-css'
  var css = ''
  // Barre admin
  css += '#jbe-bar{position:fixed;left:0;right:0;z-index:999;background:#fff;border-bottom:1px solid rgba(0,0,0,.1);font-family:-apple-system,BlinkMacSystemFont,Helvetica,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.08)}'
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
  css += '.jbe-btn-clean{padding:5px 11px;background:transparent;color:#ff9500;border:1.5px solid rgba(255,149,0,.4);border-radius:20px;font-size:11px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;white-space:nowrap}'
  css += '.jbe-btn-clean:hover{background:rgba(255,149,0,.1)}'
  css += '.jbe-btn-dash{padding:5px 13px;background:transparent;color:#007aff;border:1.5px solid rgba(0,122,255,.35);border-radius:20px;font-size:11px;font-weight:600;text-decoration:none;white-space:nowrap;transition:all .15s}'
  css += '.jbe-btn-dash:hover{background:rgba(0,122,255,.06)}'
  // Texte hover/edit
  css += '.jbe-hover{outline:2px solid rgba(0,122,255,.4)!important;outline-offset:3px;border-radius:3px;cursor:text!important}'
  css += '.jbe-editing{outline:2px solid #007aff!important;outline-offset:3px;border-radius:3px;background:rgba(0,122,255,.04)!important;cursor:text!important}'
  css += '[contenteditable="true"]{caret-color:#007aff;user-select:text!important}'
  // Images — wrapper
  css += '.jbe-img-wrap{display:inline-block;position:relative;line-height:0}'
  css += '.jbe-img-wrap img{display:block;transition:opacity .2s,outline .2s}'
  // Bouton "+" image
  css += '.jbe-img-btn{'
  css +=   'position:absolute;bottom:8px;right:8px;'
  css +=   'width:32px;height:32px;border-radius:50%;'
  css +=   'background:#fff;color:#555;'
  css +=   'font-size:20px;font-weight:300;line-height:1;'
  css +=   'border:none;cursor:pointer;'
  css +=   'display:flex;align-items:center;justify-content:center;'
  css +=   'box-shadow:0 2px 8px rgba(0,0,0,.3);'
  css +=   'opacity:0;transform:scale(.8);'
  css +=   'transition:opacity .2s,transform .2s;'
  css +=   'z-index:10;pointer-events:auto;'
  css += '}'
  css += '.jbe-img-btn:hover{background:#007aff;color:#fff}'
  // Nav connecté
  css += '.nav-btn-logout{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);background:transparent;padding:6px 13px;border-radius:5px;border:1px solid rgba(255,255,255,.2);cursor:pointer}'
  css += '.nav-btn-logout:hover{color:#fff;border-color:rgba(255,255,255,.5)}'
  css += '.nav-btn-user{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.6)}'
  s.textContent = css
  document.head.appendChild(s)
}
