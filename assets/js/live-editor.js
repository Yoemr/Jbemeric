import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ─── Config Supabase ───────────────────────────────────────────────
var SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
var sb      = createClient(SB_URL, SB_ANON)

// ─── Page courante ─────────────────────────────────────────────────
var PAGE = location.pathname.split('/').pop().replace('.html', '') || 'index'

// ─── Sélecteurs de texte éditorial (excluant nav + footer) ────────
var SEL = [
  'h1','h2','h3','h4',
  '.hero-title','.hero-lead','.hero-sub','.hero-kicker','.hero-eyebrow',
  '.ov-title','.ov-desc','.ov-eyebrow','.ov-card-name','.ov-card-sub',
  '.flyer-name','.flyer-hook','.flyer-pretitle',
  '.pc-title','.pc-lead','.man-title','.man-lead',
  '.sr-title','.sr-lead','.body-txt',
  '.kicker','.sh','p'
].join(',')

// ─── État global ───────────────────────────────────────────────────
var _db      = {}   // textes charges depuis Supabase  { id: content }
var _els     = []   // elements editables indexes
var _dirty   = {}   // { id: true } -- modifications non sauvegardees
var _active  = null // element en cours d'edition
var _statusEl = null

// ══════════════════════════════════════════════════════════════════
//  DÉMARRAGE
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
  hideBody()
  scanElements()

  Promise.all([
    loadTexts(),
    sb.auth.getSession()
  ]).then(function (results) {
    var textsOk  = results[0]
    var sessData = results[1]

    applyTexts()
    showBody()

    var session = sessData && sessData.data && sessData.data.session
                  ? sessData.data.session : null
    var user    = session ? session.user : null
    var role    = user && user.user_metadata ? user.user_metadata.role : null
    var isAdmin = role === 'admin' || role === 'moderateur'

    updateNav(user, isAdmin)

    if (isAdmin) {
      injectCSS()
      buildCrayons()
      buildBar(user)
    }
  }).catch(function (err) {
    showBody()
    console.error('[JBE] init error:', err)
  })
})

// ══════════════════════════════════════════════════════════════════
//  MASQUER / RÉVÉLER le body (anti-flash)
// ══════════════════════════════════════════════════════════════════
function hideBody() {
  var st = document.createElement('style')
  st.id  = 'jbe-hide'
  st.textContent = 'body { visibility: hidden !important; }'
  document.head.appendChild(st)
}

function showBody() {
  var st = document.getElementById('jbe-hide')
  if (st) st.parentNode.removeChild(st)
}

// ══════════════════════════════════════════════════════════════════
//  SCAN — attribue txt-01, txt-02… à chaque élément sans id
// ══════════════════════════════════════════════════════════════════
function scanElements() {
  _els = []
  var counter = 1
  var all = document.querySelectorAll(SEL)

  for (var i = 0; i < all.length; i++) {
    var el = all[i]

    if (el.closest('nav')    ) continue
    if (el.closest('footer') ) continue
    if (el.closest('script') ) continue
    if (el.closest('style')  ) continue
    if (el.closest('svg')    ) continue

    var txt = el.textContent.trim()
    if (!txt || txt.length < 2) continue
    if (el.querySelector(SEL)) continue   // garder les feuilles seulement

    // Attribuer un id si absent
    if (!el.id) {
      el.id = 'txt-' + (counter < 10 ? '0' + counter : '' + counter)
    }
    counter++

    // Stocker le texte original (restauration via Échap)
    el.setAttribute('data-orig', txt)
    _els.push(el)
  }

  console.info('[JBE] ' + _els.length + ' elements indexes (' + PAGE + ')')
}

// ══════════════════════════════════════════════════════════════════
//  CHARGER depuis Supabase
//  Table : site_content   Colonnes : id TEXT, content TEXT
//  Pas de filtre page (la colonne n'existe pas)
// ══════════════════════════════════════════════════════════════════
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
          _db[ res.data[i].id ] = res.data[i].content
        }
        console.info('[JBE] ' + res.data.length + ' texte(s) charge(s)')
      }
    })
    .catch(function (e) {
      console.info('[JBE] Supabase inaccessible:', e.message)
    })
}

// ══════════════════════════════════════════════════════════════════
//  APPLIQUER les textes au DOM
// ══════════════════════════════════════════════════════════════════
function applyTexts() {
  for (var i = 0; i < _els.length; i++) {
    var el  = _els[i]
    var key = PAGE + '__' + el.id
    if (_db[key]) {
      el.textContent = _db[key]
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  NAV
// ══════════════════════════════════════════════════════════════════
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

  var mob = document.querySelector('.nav-mobile-cta, .nav-mobile-auth')
  if (mob) {
    mob.innerHTML = isAdmin
      ? '<a class="nav-mobile-btn" href="admin.html">\u2746 Espace Admin</a>' +
        '<button class="nav-mobile-btn nav-mobile-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
      : '<button class="nav-mobile-btn nav-mobile-logout" onclick="window.__jbeOut()">D\u00e9connexion</button>'
  }

  window.__jbeOut = function () {
    sb.auth.signOut().then(function () { location.reload() })
  }
}

// ══════════════════════════════════════════════════════════════════
//  CRAYONS
// ══════════════════════════════════════════════════════════════════
function buildCrayons() {
  for (var i = 0; i < _els.length; i++) {
    addPencil(_els[i])
  }
}

function addPencil(el) {
  var key = PAGE + '__' + el.id
  if (_db[key]) el.textContent = _db[key]

  if (window.getComputedStyle(el).position === 'static') {
    el.style.position = 'relative'
  }

  var btn = document.createElement('button')
  btn.className   = 'jbe-btn'
  btn.textContent = '\u270e Modifier'
  btn.type        = 'button'
  btn.title       = 'Modifier -- id: ' + el.id

  btn.addEventListener('click', function (e) {
    e.stopPropagation()
    startEdit(el)
  })

  el.appendChild(btn)
}

function removePencil(el) {
  var btn = el.querySelector('.jbe-btn')
  if (btn) btn.parentNode.removeChild(btn)
}

// ─── Démarrer l'édition ────────────────────────────────────────────
function startEdit(el) {
  if (_active && _active !== el) stopEdit(_active, true)
  _active = el

  removePencil(el)
  el.classList.add('jbe-on')
  el.contentEditable = 'true'
  el.spellcheck      = false
  el.focus()

  // Sélectionner tout le texte
  try {
    var r = document.createRange()
    r.selectNodeContents(el)
    var s = window.getSelection()
    s.removeAllRanges()
    s.addRange(r)
  } catch (e) {}

  el._paste = function (ev) { doPaste(ev) }
  el._key   = function (ev) { doKey(ev, el) }
  el._input = function ()   { doInput(el) }
  el._blur  = function ()   { stopEdit(el, true) }

  el.addEventListener('paste',   el._paste)
  el.addEventListener('keydown', el._key)
  el.addEventListener('input',   el._input)
  el.addEventListener('blur',    el._blur)

  setStatus('\u270e Tapez votre texte  \u00b7  Entr\u00e9e = sauvegarder  \u00b7  \u00c9chap = annuler')
}

// ─── Terminer l'édition ────────────────────────────────────────────
function stopEdit(el, save) {
  el.contentEditable = 'false'
  el.classList.remove('jbe-on')

  el.removeEventListener('paste',   el._paste)
  el.removeEventListener('keydown', el._key)
  el.removeEventListener('input',   el._input)
  el.removeEventListener('blur',    el._blur)

  addPencil(el)

  var key = PAGE + '__' + el.id
  if (save && _dirty[key]) saveEl(el)
  if (_active === el) _active = null
}

// ══════════════════════════════════════════════════════════════════
//  ANTI-CASSE — texte brut uniquement
// ══════════════════════════════════════════════════════════════════
function doPaste(ev) {
  ev.preventDefault()
  var raw = ev.clipboardData ? ev.clipboardData.getData('text/plain') : ''
  document.execCommand('insertText', false, cleanTxt(raw))
}

function doKey(ev, el) {
  var blocked = ['b','i','u','k','h']
  if ((ev.ctrlKey || ev.metaKey) && blocked.indexOf(ev.key.toLowerCase()) !== -1) {
    ev.preventDefault()
    return
  }
  if (ev.key === 'Enter') {
    ev.preventDefault()
    el.blur()
    return
  }
  if (ev.key === 'Escape') {
    var key      = PAGE + '__' + el.id
    var original = _db[key] || el.getAttribute('data-orig') || ''
    el.textContent = original
    delete _dirty[key]
    el.blur()
  }
}

function doInput(el) {
  // Retirer les balises de formatage
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
  setStatus('\u270e Modification -- cliquez ailleurs pour sauvegarder')
}

function getTextContent(el) {
  var clone = el.cloneNode(true)
  var btns  = clone.querySelectorAll('.jbe-btn')
  for (var i = 0; i < btns.length; i++) btns[i].parentNode.removeChild(btns[i])
  var brs = clone.querySelectorAll('br')
  for (var i = 0; i < brs.length; i++) brs[i].parentNode.replaceChild(document.createTextNode('\n'), brs[i])
  return cleanTxt(clone.textContent || '')
}

function cleanTxt(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ══════════════════════════════════════════════════════════════════
//  SAUVEGARDE — colonnes id + content uniquement
//  Pas de colonne page, pas de colonne updated_at
// ══════════════════════════════════════════════════════════════════
function saveEl(el) {
  var key     = PAGE + '__' + el.id
  var content = getTextContent(el)
  if (!key || !content) return

  removePencil(el)
  el.textContent = content
  addPencil(el)

  setStatus('\u23f3 Sauvegarde en cours\u2026')

  sb.from('site_content')
    .upsert(
      { id: key, content: content },
      { onConflict: 'id' }
    )
    .then(function (res) {
      if (res.error) {
        setStatus('\u274c Erreur : ' + res.error.message)
        flashEl(el, false)
        console.error('[JBE] upsert error:', res.error)
        return
      }
      _db[key] = content
      delete _dirty[key]
      setStatus('\u2705 Texte sauvegard\u00e9 !')
      flashEl(el, true)
    })
    .catch(function (e) {
      setStatus('\u274c Erreur r\u00e9seau : ' + e.message)
      console.error('[JBE] save catch:', e)
    })
}

function saveAll() {
  var todo = []
  for (var i = 0; i < _els.length; i++) {
    var key = PAGE + '__' + _els[i].id
    if (_dirty[key]) todo.push(_els[i])
  }
  if (!todo.length) { setStatus('\u2705 Rien \u00e0 sauvegarder'); return }
  for (var i = 0; i < todo.length; i++) saveEl(todo[i])
}

// ══════════════════════════════════════════════════════════════════
//  BARRE DE STATUT ADMIN
// ══════════════════════════════════════════════════════════════════
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
      '<span style="color:#ccc;margin:0 6px">\u2014</span>' +
      '<span>Bonjour <b>' + prenom + '</b> \ud83d\udc4b</span>' +
    '</div>' +
    '<div id="jbe-msg" class="jbe-bar-m">Survolez un texte pour modifier</div>' +
    '<div class="jbe-bar-r">' +
      '<span class="jbe-cnt">' + _els.length + ' zones</span>' +
      '<button class="jbe-save" onclick="window.__jbeSaveAll()">\u2713 Tout sauvegarder</button>' +
      '<a class="jbe-dash" href="admin.html">Dashboard \u2192</a>' +
    '</div>'

  document.body.insertBefore(bar, document.body.firstChild)
  document.body.style.paddingTop = '48px'

  _statusEl = document.getElementById('jbe-msg')
  window.__jbeSaveAll = saveAll
}

function setStatus(msg) {
  if (!_statusEl) return
  _statusEl.textContent = msg
  if (msg.charAt(0) === '\u2705') {
    setTimeout(function () {
      if (_statusEl) _statusEl.textContent = 'Survolez un texte pour modifier'
    }, 3000)
  }
}

function flashEl(el, ok) {
  el.style.outline    = ok ? '3px solid #22c55e' : '3px solid #ef4444'
  el.style.transition = 'outline .2s'
  setTimeout(function () { el.style.outline = '' }, 1600)
}

// ══════════════════════════════════════════════════════════════════
//  CSS — injecté une seule fois pour les admins
// ══════════════════════════════════════════════════════════════════
function injectCSS() {
  if (document.getElementById('jbe-css')) return
  var s = document.createElement('style')
  s.id  = 'jbe-css'
  s.textContent = [
    '#jbe-bar{',
      'position:fixed;top:0;left:0;right:0;z-index:99999;',
      'height:48px;background:#fff;border-bottom:2px solid #e5e7eb;',
      'display:flex;align-items:center;padding:0 20px;gap:14px;',
      'font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;',
      'font-size:13px;color:#111;box-shadow:0 2px 12px rgba(0,0,0,.10);',
    '}',
    '.jbe-bar-l{display:flex;align-items:center;gap:8px;flex-shrink:0}',
    '.jbe-dot{',
      'display:inline-block;width:9px;height:9px;border-radius:50%;',
      'background:#22c55e;',
      'animation:jbeping 2s ease-in-out infinite;',
    '}',
    '@keyframes jbeping{',
      '0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}',
      '70%{box-shadow:0 0 0 10px rgba(34,197,94,0)}',
      '100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}',
    '}',
    '.jbe-bar-m{flex:1;text-align:center;font-size:12px;color:#888;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.jbe-bar-r{display:flex;align-items:center;gap:10px;flex-shrink:0}',
    '.jbe-cnt{font-size:11px;color:#bbb;white-space:nowrap}',
    '.jbe-save{padding:7px 16px;background:#111;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;transition:background .15s;font-family:inherit;white-space:nowrap}',
    '.jbe-save:hover{background:#333}',
    '.jbe-dash{padding:7px 16px;background:#fff;color:#111;border:1.5px solid #d1d5db;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;transition:all .15s;white-space:nowrap}',
    '.jbe-dash:hover{background:#f9fafb;border-color:#9ca3af}',

    /* Bouton Modifier */
    '.jbe-btn{',
      'position:absolute;top:-14px;right:-6px;z-index:1000;',
      'background:#fff;color:#111;',
      'font-weight:700;font-size:12px;',
      'font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;',
      'padding:4px 12px;',
      'border:2px solid #111;border-radius:20px;',
      'box-shadow:0 3px 10px rgba(0,0,0,.25),0 0 0 3px rgba(255,255,255,.9);',
      'cursor:pointer;',
      'opacity:0;transform:translateY(4px);',
      'transition:opacity .18s,transform .18s;',
      'user-select:none;white-space:nowrap;',
    '}',
    '[data-orig]:hover .jbe-btn{opacity:1;transform:translateY(0)}',
    '.jbe-btn:hover{background:#111;color:#fff;transform:translateY(-1px)}',

    /* Element actif ? bordure jaune JBE */
    '.jbe-on{',
      'outline:3px solid #FFCF00 !important;',
      'outline-offset:6px;',
      'background:rgba(255,207,0,.06) !important;',
      'cursor:text !important;',
    '}',
    '[contenteditable="true"]{caret-color:#111;user-select:text !important}',

    /* Nav connecte */
    '.nav-btn-admin{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;background:rgba(255,255,255,.95);color:#111;padding:7px 14px;border-radius:5px;text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;box-shadow:0 1px 6px rgba(0,0,0,.2);transition:all .18s}',
    '.nav-btn-admin:hover{background:#fff}',
    '.nav-btn-logout{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.45);background:transparent;padding:7px 13px;border-radius:5px;border:1px solid rgba(255,255,255,.15);cursor:pointer;transition:all .18s;white-space:nowrap}',
    '.nav-btn-logout:hover{color:#fff;border-color:rgba(255,255,255,.4)}',
    '.nav-btn-user{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.55)}'
  ].join('')
  document.head.appendChild(s)
}
