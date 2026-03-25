// live-editor.js — JB EMERIC v5
// Aucune classe ES6, aucune template literal, aucun CSS inline fragmenté.
// Compatible tous navigateurs modernes.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
var sb      = createClient(SB_URL, SB_ANON)

var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'

// Sélecteurs des éléments de texte éditoriaux du site JBE
var SEL = [
  'h1','h2','h3','h4',
  '.hero-title','.hero-lead','.hero-sub','.hero-kicker','.hero-eyebrow',
  '.ov-title','.ov-desc','.ov-eyebrow','.ov-card-name','.ov-card-sub',
  '.flyer-name','.flyer-hook','.flyer-pretitle',
  '.pc-title','.pc-lead','.man-title','.man-lead',
  '.sr-title','.sr-lead','.body-txt','.kicker','.sh','p'
].join(',')

var _db      = {}   // textes chargés depuis Supabase
var _els     = []   // éléments indexés
var _dirty   = {}   // clés modifiées non sauvegardées
var _active  = null // élément en cours d'édition
var _bar     = null // message de la barre admin

// ─────────────────────────────────────────────────────────────────
//  MASQUER LE BODY pour éviter le flash de l'ancien texte
// ─────────────────────────────────────────────────────────────────
var _hideStyle = document.createElement('style')
_hideStyle.textContent = 'body{opacity:0;transition:opacity .15s}'
document.head.appendChild(_hideStyle)

function showPage() {
  document.body.style.opacity = '1'
  _hideStyle.remove()
}

// ─────────────────────────────────────────────────────────────────
//  INIT — point d'entrée
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // 1. Attribuer les IDs automatiques (synchrone)
  scanElements()

  // 2. Charger Supabase et vérifier la session en parallèle
  Promise.all([
    loadTexts(),
    sb.auth.getSession()
  ]).then(function (results) {

    // 3. Appliquer les textes sauvegardés
    applyTexts()

    // 4. Révéler la page
    showPage()

    // 5. Analyser la session
    var sessData = results[1]
    var session  = (sessData && sessData.data && sessData.data.session)
                   ? sessData.data.session : null
    var user     = session ? session.user : null
    var role     = (user && user.user_metadata && user.user_metadata.role)
                   ? user.user_metadata.role : null
    var isAdmin  = (role === 'admin' || role === 'moderateur')

    // 6. Adapter le nav
    updateNav(user, isAdmin)

    // 7. Mode édition si admin
    if (isAdmin) {
      injectCSS()
      addPencils()
      buildBar(user)
    }

  }).catch(function (err) {
    // En cas d'erreur réseau : révéler quand même la page
    showPage()
    console.info('[JBE] Erreur init:', err)
  })
})

// ─────────────────────────────────────────────────────────────────
//  SCAN — attribue txt-01, txt-02… aux éléments sans id
// ─────────────────────────────────────────────────────────────────
function scanElements() {
  _els = []
  var counter = 1
  var all = document.querySelectorAll(SEL)

  for (var i = 0; i < all.length; i++) {
    var el = all[i]

    // Exclure nav, footer, svg, scripts
    if (el.closest('nav') || el.closest('footer') ||
        el.closest('script') || el.closest('svg') ||
        el.closest('[data-no-edit]')) continue

    // Exclure les éléments vides
    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue

    // Exclure les wrappers contenant d'autres cibles
    if (el.querySelector(SEL)) continue

    // Attribuer un id si absent
    if (!el.id) {
      el.id = 'txt-' + (counter < 10 ? '0' + counter : '' + counter)
    }
    counter++

    // Sauvegarder le texte original pour la touche Échap
    el.setAttribute('data-orig', txt)

    _els.push(el)
  }

  console.info('[JBE] ' + _els.length + ' elements trouves (' + PAGE + ')')
}

// ─────────────────────────────────────────────────────────────────
//  CHARGEMENT — colonnes id + content (pas de filtre page)
// ─────────────────────────────────────────────────────────────────
function loadTexts() {
  return sb
    .from('site_content')
    .select('id, content')
    .then(function (res) {
      if (res.error) {
        console.info('[JBE] site_content:', res.error.message)
        return
      }
      if (res.data && res.data.length > 0) {
        for (var i = 0; i < res.data.length; i++) {
          _db[res.data[i].id] = res.data[i].content
        }
        console.info('[JBE] ' + res.data.length + ' texte(s) charges')
      }
    })
    .catch(function (e) {
      console.info('[JBE] Supabase inaccessible:', e.message)
    })
}

// ─────────────────────────────────────────────────────────────────
//  APPLICATION — remplace le HTML par les textes Supabase
// ─────────────────────────────────────────────────────────────────
function applyTexts() {
  for (var i = 0; i < _els.length; i++) {
    var el  = _els[i]
    var key = PAGE + '__' + el.id
    if (_db[key]) {
      el.textContent = _db[key]
    }
  }
}

// ─────────────────────────────────────────────────────────────────
//  NAV — adapter selon l'état de connexion
// ─────────────────────────────────────────────────────────────────
function updateNav(user, isAdmin) {
  if (!user) return

  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'Admin')

  var desk = document.querySelector('.nav-auth')
  if (desk) {
    if (isAdmin) {
      desk.innerHTML =
        '<a class="nav-btn-admin" href="admin.html">\u2746 Espace Admin</a>' +
        '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
    } else {
      desk.innerHTML =
        '<span class="nav-btn-user">' + prenom + '</span>' +
        '<button class="nav-btn-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
    }
  }

  var mob = document.querySelector('.nav-mobile-cta')
      || document.querySelector('.nav-mobile-auth')
  if (mob) {
    if (isAdmin) {
      mob.innerHTML =
        '<a class="nav-mobile-btn" href="admin.html">\u2746 Espace Admin</a>' +
        '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
    } else {
      mob.innerHTML =
        '<button class="nav-mobile-btn" onclick="window.__jbeOut()">D\u00e9connexion</button>'
    }
  }

  window.__jbeOut = function () {
    sb.auth.signOut().then(function () { location.reload() })
  }
}

// ─────────────────────────────────────────────────────────────────
//  CRAYONS — ajouter les boutons Modifier
// ─────────────────────────────────────────────────────────────────
function addPencils() {
  for (var i = 0; i < _els.length; i++) {
    makePencil(_els[i])
  }
}

function makePencil(el) {
  // Appliquer le texte Supabase
  var key = PAGE + '__' + el.id
  if (_db[key]) el.textContent = _db[key]

  // Position relative pour le bouton absolu
  if (window.getComputedStyle(el).position === 'static') {
    el.style.position = 'relative'
  }

  // Créer le bouton Modifier
  var btn = document.createElement('button')
  btn.className   = 'jbe-btn'
  btn.textContent = '\u270e Modifier'
  btn.title       = 'Cle : ' + key
  btn.type        = 'button'
  btn.addEventListener('click', function (e) {
    e.stopPropagation()
    startEdit(el)
  })
  el.appendChild(btn)
}

// ─────────────────────────────────────────────────────────────────
//  EDITION — démarrer / arrêter
// ─────────────────────────────────────────────────────────────────
function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  _active = el

  // Retirer le bouton pendant l'édition
  var btn = el.querySelector('.jbe-btn')
  if (btn) btn.remove()

  el.classList.add('jbe-on')
  el.contentEditable = 'true'
  el.spellcheck      = false
  el.focus()

  // Sélectionner tout le texte
  try {
    var range = document.createRange()
    range.selectNodeContents(el)
    var sel = window.getSelection()
    if (sel) { sel.removeAllRanges(); sel.addRange(range) }
  } catch (e) {}

  el._paste = function (e) { onPaste(e) }
  el._key   = function (e) { onKey(e, el) }
  el._input = function ()  { onInput(el) }
  el._blur  = function ()  { stopEdit(el, true) }

  el.addEventListener('paste',   el._paste)
  el.addEventListener('keydown', el._key)
  el.addEventListener('input',   el._input)
  el.addEventListener('blur',    el._blur)

  setStatus('\u270e Tapez votre texte \u00b7 Entr\u00e9e = sauvegarder \u00b7 \u00c9chap = annuler')
}

function stopEdit(el, doSave) {
  el.contentEditable = 'false'
  el.classList.remove('jbe-on')

  el.removeEventListener('paste',   el._paste)
  el.removeEventListener('keydown', el._key)
  el.removeEventListener('input',   el._input)
  el.removeEventListener('blur',    el._blur)

  // Remettre le bouton
  makePencil(el)

  var key = PAGE + '__' + el.id
  if (doSave && _dirty[key]) saveEl(el)
  if (_active === el) _active = null
}

// ─────────────────────────────────────────────────────────────────
//  ANTI-CASSE — texte brut absolu
// ─────────────────────────────────────────────────────────────────
function onPaste(e) {
  e.preventDefault()
  var raw = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''
  document.execCommand('insertText', false, purify(raw))
}

function onKey(e, el) {
  // Bloquer les raccourcis de formatage
  if ((e.ctrlKey || e.metaKey) && 'biukh'.indexOf(e.key.toLowerCase()) > -1) {
    e.preventDefault()
    return
  }
  // Entrée = sauvegarder et quitter
  if (e.key === 'Enter') {
    e.preventDefault()
    el.blur()
    return
  }
  // Échap = restaurer l'original
  if (e.key === 'Escape') {
    var key = PAGE + '__' + el.id
    el.textContent = _db[key] || el.getAttribute('data-orig') || ''
    makePencil(el)
    delete _dirty[key]
    el.blur()
  }
}

function onInput(el) {
  // Supprimer les balises de formatage en temps réel
  var tags = ['b','strong','i','em','u','s','font','mark','span','code']
  for (var t = 0; t < tags.length; t++) {
    var nodes = el.querySelectorAll(tags[t])
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n]
      while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
      node.parentNode.removeChild(node)
    }
  }
  // Retirer les attributs de style
  var styled = el.querySelectorAll('[style],[color],[face],[size]')
  for (var s = 0; s < styled.length; s++) {
    styled[s].removeAttribute('style')
    styled[s].removeAttribute('color')
    styled[s].removeAttribute('face')
    styled[s].removeAttribute('size')
  }
  var key = PAGE + '__' + el.id
  _dirty[key] = true
  setStatus('\u270e Modifi\u00e9 \u00b7 cliquez ailleurs ou Entr\u00e9e pour sauvegarder')
}

function getPlainText(el) {
  var clone = el.cloneNode(true)
  var btns  = clone.querySelectorAll('.jbe-btn')
  for (var i = 0; i < btns.length; i++) btns[i].parentNode.removeChild(btns[i])
  var brs = clone.querySelectorAll('br')
  for (var i = 0; i < brs.length; i++) brs[i].parentNode.replaceChild(document.createTextNode('\n'), brs[i])
  return purify(clone.textContent || '')
}

function purify(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ─────────────────────────────────────────────────────────────────
//  SAUVEGARDE — colonnes id + content (PAS de colonne page)
// ─────────────────────────────────────────────────────────────────
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getPlainText(el)
  if (!key || !content) return

  // Remettre le DOM propre
  var btn = el.querySelector('.jbe-btn')
  if (btn) btn.parentNode.removeChild(btn)
  el.textContent = content
  makePencil(el)

  setStatus('\u23f3 Sauvegarde en cours\u2026')

  sb.from('site_content')
    .upsert({ id: key, content: content }, { onConflict: 'id' })
    .then(function (res) {
      if (res.error) throw res.error
      _db[key]    = content
      delete _dirty[key]
      setStatus('\u2705 Texte sauvegard\u00e9 !')
      flashEl(el, true)
    })
    .catch(function (err) {
      setStatus('\u274c Erreur : ' + err.message)
      flashEl(el, false)
      console.error('[JBE] Sauvegarde:', err)
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

// ─────────────────────────────────────────────────────────────────
//  BARRE ADMIN — blanche, épurée, fixe
// ─────────────────────────────────────────────────────────────────
function buildBar(user) {
  var prenom = (user.user_metadata && user.user_metadata.prenom)
               ? user.user_metadata.prenom
               : (user.email ? user.email.split('@')[0] : 'JB')

  var bar = document.createElement('div')
  bar.id  = 'jbe-bar'
  bar.innerHTML =
    '<div class="jbe-bar-l">' +
      '<span class="jbe-dot"></span>' +
      '<b>Mode \u00c9dition Activ\u00e9</b>' +
      '<span class="jbe-sep">\u2014</span>' +
      '<span>Bonjour <b>' + prenom + '</b></span>' +
    '</div>' +
    '<div id="jbe-msg" class="jbe-bar-m">Survolez un texte pour voir le bouton Modifier</div>' +
    '<div class="jbe-bar-r">' +
      '<span class="jbe-cnt">' + _els.length + ' zones</span>' +
      '<button class="jbe-save" onclick="window.__jbeSaveAll()">\u2713 Tout sauvegarder</button>' +
      '<a class="jbe-dash" href="admin.html">Dashboard \u2192</a>' +
    '</div>'

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
      if (_bar) _bar.textContent = 'Survolez un texte pour voir le bouton Modifier'
    }, 3000)
  }
}

function flashEl(el, ok) {
  el.style.outline    = ok ? '3px solid #22c55e' : '3px solid #ef4444'
  el.style.transition = 'outline .2s'
  setTimeout(function () { el.style.outline = '' }, 1600)
}

// ─────────────────────────────────────────────────────────────────
//  CSS — injecté une seule fois, dans une seule string propre
// ─────────────────────────────────────────────────────────────────
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s   = document.createElement('style')
  s.id    = 'jbe-css'
  s.textContent = '\
#jbe-bar{\
  position:fixed;top:0;left:0;right:0;z-index:99999;\
  height:48px;background:#ffffff;\
  border-bottom:2px solid #e5e7eb;\
  display:flex;align-items:center;\
  padding:0 20px;gap:14px;\
  font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;\
  font-size:13px;color:#111111;\
  box-shadow:0 2px 12px rgba(0,0,0,.10);\
}\
.jbe-bar-l{display:flex;align-items:center;gap:8px;flex-shrink:0}\
.jbe-dot{\
  display:inline-block;width:9px;height:9px;\
  border-radius:50%;background:#22c55e;\
  animation:jbeping 2s ease-in-out infinite;\
}\
@keyframes jbeping{\
  0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}\
  70%{box-shadow:0 0 0 10px rgba(34,197,94,0)}\
  100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}\
}\
.jbe-sep{color:#ccc;margin:0 4px}\
.jbe-bar-m{\
  flex:1;text-align:center;\
  font-size:12px;color:#888;\
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\
}\
.jbe-bar-r{display:flex;align-items:center;gap:10px;flex-shrink:0}\
.jbe-cnt{font-size:11px;color:#bbb;white-space:nowrap}\
.jbe-save{\
  padding:7px 16px;background:#111111;color:#ffffff;\
  border:none;border-radius:6px;\
  font-size:12px;font-weight:700;cursor:pointer;\
  white-space:nowrap;\
}\
.jbe-save:hover{background:#333333}\
.jbe-dash{\
  padding:7px 16px;background:#ffffff;color:#111111;\
  border:1.5px solid #d1d5db;border-radius:6px;\
  font-size:12px;font-weight:600;\
  text-decoration:none;white-space:nowrap;\
}\
.jbe-dash:hover{background:#f9fafb;border-color:#9ca3af}\
.jbe-btn{\
  position:absolute;top:-16px;right:-4px;z-index:1000;\
  background:#ffffff;color:#111111;\
  font-weight:700;font-size:13px;\
  font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;\
  padding:5px 14px;\
  border:2.5px solid #111111;border-radius:24px;\
  box-shadow:0 3px 12px rgba(0,0,0,.25),0 0 0 4px rgba(255,255,255,.9);\
  cursor:pointer;\
  opacity:0;transform:translateY(4px);\
  transition:opacity .18s,transform .18s;\
  user-select:none;white-space:nowrap;\
}\
[data-orig]:hover .jbe-btn{opacity:1;transform:translateY(0)}\
.jbe-btn:hover{\
  background:#111111;color:#ffffff;\
  transform:translateY(-1px);\
  box-shadow:0 5px 16px rgba(0,0,0,.35),0 0 0 4px rgba(255,255,255,.9);\
}\
.jbe-on{\
  outline:3px solid #FFCF00 !important;\
  outline-offset:6px;\
  border-radius:2px;\
  cursor:text !important;\
}\
[contenteditable="true"]{caret-color:#111111;user-select:text !important}\
.nav-btn-admin{\
  font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;\
  background:rgba(255,255,255,.95);color:#111111;\
  padding:7px 14px;border-radius:5px;text-decoration:none;\
  white-space:nowrap;display:inline-flex;align-items:center;gap:5px;\
  box-shadow:0 1px 6px rgba(0,0,0,.2);transition:all .18s;\
}\
.nav-btn-admin:hover{background:#ffffff}\
.nav-btn-logout{\
  font-size:9px;letter-spacing:1.5px;text-transform:uppercase;\
  color:rgba(255,255,255,.45);background:transparent;\
  padding:7px 13px;border-radius:5px;\
  border:1px solid rgba(255,255,255,.15);\
  cursor:pointer;transition:all .18s;white-space:nowrap;\
}\
.nav-btn-logout:hover{color:#ffffff;border-color:rgba(255,255,255,.4)}\
.nav-btn-user{\
  font-size:9px;letter-spacing:1.5px;text-transform:uppercase;\
  color:rgba(255,255,255,.55);\
}'
  document.head.appendChild(s)
}
