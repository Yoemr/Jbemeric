/**
 * live-editor.js — JB EMERIC
 * ═══════════════════════════════════════════════════════════════════
 * Système "Crayon Live" — Édition directe sur toutes les pages
 *
 * Ce script fait 4 choses :
 *  1. Détecte si l'utilisateur est admin/moderateur (Supabase Auth)
 *  2. Met à jour le nav (remplace Login/Inscr par Espace Admin + Déco)
 *  3. Charge les textes sauvegardés depuis site_content et les injecte
 *  4. Si admin → affiche les crayons ✎ sur tous les textes éditables
 *
 * Usage : ajouter dans chaque page HTML, juste avant </body> :
 *   <script type="module" src="assets/js/live-editor.js"></script>
 * ═══════════════════════════════════════════════════════════════════
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ── Connexion Supabase ────────────────────────────────────────────
const SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
const SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
const sb      = createClient(SB_URL, SB_ANON)

// ── Sélecteurs éditables (tout sauf nav et footer) ────────────────
const EDITABLE_SELECTOR = `
  main h1, main h2, main h3, main h4,
  main p, main li, main span,
  main .hero-title, main .hero-lead, main .hero-eyebrow,
  main .ov-title, main .ov-desc, main .ov-card-name, main .ov-card-sub,
  main .flyer-name, main .flyer-hook, main .flyer-pretitle,
  main .sec-title, main .sec-lead, main .sr-title, main .sr-lead,
  main .kicker, main .pc-title, main .pc-lead,
  main .nl-subtitle, main .lib-card-title,
  [data-editable="true"]
`
  .split(',').map(s => s.trim()).filter(Boolean).join(', ')

// ── Page courante (ex: "coaching" depuis "coaching.html") ─────────
const PAGE_KEY = location.pathname.split('/').pop().replace('.html','') || 'index'

// ── Cache local des contenus Supabase ────────────────────────────
let _content = {}

// ═══════════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE
// ═══════════════════════════════════════════════════════════════════
async function init() {
  // 1. Charger les textes sauvegardés (pour tout le monde)
  await loadContent()
  applyContent()

  // 2. Vérifier si admin
  const { data: { user } } = await sb.auth.getUser()
  const role = user?.user_metadata?.role ?? null
  const isAdmin = role === 'admin' || role === 'moderateur'

  // 3. Mettre à jour le nav selon l'état de connexion
  updateNav(user, isAdmin)

  // 4. Activer les crayons si admin
  if (isAdmin) {
    injectStyles()
    injectCrayons()
    injectStatusBar(user)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  1. CHARGER LES TEXTES DEPUIS SUPABASE
// ═══════════════════════════════════════════════════════════════════
async function loadContent() {
  try {
    const { data, error } = await sb
      .from('site_content')
      .select('key, value')
    if (error) throw error
    if (data) {
      _content = Object.fromEntries(data.map(r => [r.key, r.value]))
    }
  } catch (e) {
    // Silencieux en public — Supabase peut ne pas encore être configuré
    console.info('[JBE] site_content non disponible:', e.message)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  2. APPLIQUER LES TEXTES AU DOM
//  Chaque élément doit avoir data-content-key="ma_cle"
// ═══════════════════════════════════════════════════════════════════
function applyContent() {
  document.querySelectorAll('[data-content-key]').forEach(el => {
    const key = el.dataset.contentKey
    if (_content[key] !== undefined) {
      el.textContent = _content[key]
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
//  3. NAV — ADAPTER SELON L'ÉTAT D'AUTH
// ═══════════════════════════════════════════════════════════════════
function updateNav(user, isAdmin) {
  const authZone = document.querySelector('.nav-auth')
  const mobileAuthZone = document.querySelector('.nav-mobile-cta, .nav-mobile-auth')

  if (!user) {
    // Non connecté → nav standard inchangé
    return
  }

  const prenom = user.user_metadata?.prenom ?? 'Admin'

  // ── Desktop nav-auth ──────────────────────────────────────────
  if (authZone) {
    authZone.innerHTML = isAdmin
      ? `<a class="nav-btn-admin" href="admin.html">✦ Espace Admin</a>
         <button class="nav-btn-logout" onclick="window.__jbeLogout()">Déconnexion</button>`
      : `<span class="nav-btn-user">${prenom}</span>
         <button class="nav-btn-logout" onclick="window.__jbeLogout()">Déconnexion</button>`
  }

  // ── Mobile ───────────────────────────────────────────────────
  if (mobileAuthZone) {
    mobileAuthZone.innerHTML = isAdmin
      ? `<a class="nav-mobile-btn" href="admin.html">✦ Espace Admin</a>
         <button class="nav-mobile-btn nav-mobile-logout" onclick="window.__jbeLogout()">Déconnexion</button>`
      : `<button class="nav-mobile-btn nav-mobile-logout" onclick="window.__jbeLogout()">Déconnexion</button>`
  }

  // Déconnexion globale
  window.__jbeLogout = async () => {
    await sb.auth.signOut()
    location.reload()
  }
}

// ═══════════════════════════════════════════════════════════════════
//  4. CRAYONS — INJECTION ET ÉDITION
// ═══════════════════════════════════════════════════════════════════
let _activeEl   = null
let _pendingSave = new Set()

function injectCrayons() {
  // Trouver tous les éléments éditables avec contenu texte
  document.querySelectorAll(EDITABLE_SELECTOR).forEach(el => {
    // Ignorer les éléments vides, les liens de navigation, les éléments enfants d'un éditable
    if (!el.textContent.trim()) return
    if (el.closest('a[data-content-key]')) return
    if (el.querySelectorAll(EDITABLE_SELECTOR).length > 2) return // pas de gros containers

    makePencil(el)
  })
}

function makePencil(el) {
  // Générer une clé automatique si pas de data-content-key
  if (!el.dataset.contentKey) {
    const tag  = el.tagName.toLowerCase()
    const cls  = (el.className || '').split(' ').filter(Boolean)[0] || ''
    const text = el.textContent.trim().slice(0, 20).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
    el.dataset.contentKey = `${PAGE_KEY}__${tag}${cls ? '_' + cls : ''}_${text}`
  }

  // Appliquer le contenu Supabase si disponible
  const key = el.dataset.contentKey
  if (_content[key] !== undefined) el.textContent = _content[key]

  // Wrapper position:relative
  el.style.position = 'relative'

  // Crayon
  const btn = document.createElement('button')
  btn.className = 'jbe-pencil'
  btn.textContent = '✎'
  btn.title = `Modifier — clé : ${key}`
  btn.addEventListener('click', (e) => { e.stopPropagation(); activateEdit(el) })
  el.appendChild(btn)
}

function activateEdit(el) {
  // Désactiver le champ précédent si différent
  if (_activeEl && _activeEl !== el) deactivateEdit(_activeEl, true)

  _activeEl = el
  const key = el.dataset.contentKey

  // Marquer visuellement
  el.classList.add('jbe-editing')

  // Activer contentEditable
  el.contentEditable = 'true'
  el.spellcheck = false
  el.focus()

  // Sélectionner tout
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)

  // Events
  el._jbe_paste    = (e) => handlePaste(e)
  el._jbe_keydown  = (e) => handleKeydown(e)
  el._jbe_input    = ()  => handleInput(el)
  el._jbe_blur     = ()  => deactivateEdit(el, true)

  el.addEventListener('paste',   el._jbe_paste)
  el.addEventListener('keydown', el._jbe_keydown)
  el.addEventListener('input',   el._jbe_input)
  el.addEventListener('blur',    el._jbe_blur)

  updateStatus(`✎ Modification en cours — ${el.tagName.toLowerCase()}`)
}

function deactivateEdit(el, save = false) {
  el.contentEditable = 'false'
  el.classList.remove('jbe-editing')

  el.removeEventListener('paste',   el._jbe_paste)
  el.removeEventListener('keydown', el._jbe_keydown)
  el.removeEventListener('input',   el._jbe_input)
  el.removeEventListener('blur',    el._jbe_blur)

  if (save) saveElement(el)
  if (_activeEl === el) _activeEl = null
}

// ═══════════════════════════════════════════════════════════════════
//  NETTOYAGE TEXTE — Anti-casse total
// ═══════════════════════════════════════════════════════════════════

// Intercepte le coller → texte brut uniquement
function handlePaste(e) {
  e.preventDefault()
  const raw   = e.clipboardData?.getData('text/plain') ?? ''
  const clean = sanitize(raw)
  document.execCommand('insertText', false, clean)
}

// Bloque les raccourcis de formatage
function handleKeydown(e) {
  const BLOCKED = ['b', 'i', 'u', 'k']
  if ((e.ctrlKey || e.metaKey) && BLOCKED.includes(e.key.toLowerCase())) {
    e.preventDefault()
    return
  }
  // Entrée → sortir du champ (pas de retour ligne)
  if (e.key === 'Enter') {
    e.preventDefault()
    e.target.blur()
  }
  // Échap → annuler et restaurer
  if (e.key === 'Escape') {
    const key = e.target.dataset.contentKey
    e.target.textContent = _content[key] ?? e.target.dataset.originalText ?? ''
    e.target.blur()
  }
}

// Nettoie en temps réel les styles parasites collés
function handleInput(el) {
  // Retirer toutes les balises de style qui se glissent
  ;['b','strong','i','em','u','s','font','span'].forEach(tag => {
    el.querySelectorAll(tag).forEach(node => node.replaceWith(...node.childNodes))
  })
  el.querySelectorAll('[style],[class],[face],[color],[size]').forEach(node => {
    node.removeAttribute('style')
    node.removeAttribute('class')
    node.removeAttribute('face')
    node.removeAttribute('color')
    node.removeAttribute('size')
  })
  _pendingSave.add(el.dataset.contentKey)
  updateStatus(`✎ Modification en cours — appuyez sur Entrée ou cliquez ailleurs pour sauvegarder`)
}

// Texte brut final depuis le DOM
function getPlainText(el) {
  const clone = el.cloneNode(true)
  // Retirer le bouton crayon du clone
  clone.querySelectorAll('.jbe-pencil').forEach(b => b.remove())
  // Convertir <br> en \n
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
  return sanitize(clone.textContent || '')
}

function sanitize(text) {
  return text
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ═══════════════════════════════════════════════════════════════════
//  SAUVEGARDE SUPABASE
// ═══════════════════════════════════════════════════════════════════
async function saveElement(el) {
  const key   = el.dataset.contentKey
  const value = getPlainText(el)
  if (!key || !value) return

  // Mettre à jour le DOM proprement
  // Retirer l'ancien crayon, remettre le texte, remettre le crayon
  const pencil = el.querySelector('.jbe-pencil')
  pencil?.remove()
  el.textContent = value
  if (pencil) el.appendChild(pencil)

  updateStatus('⏳ Sauvegarde…')

  try {
    const { error } = await sb
      .from('site_content')
      .upsert(
        { key, value, page: PAGE_KEY, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    if (error) throw error

    _content[key] = value
    _pendingSave.delete(key)
    updateStatus(`✅ Sauvegardé`)
    flashEl(el, 'success')

  } catch (e) {
    console.error('[JBE] Sauvegarde:', e)
    updateStatus(`❌ Erreur : ${e.message}`)
    flashEl(el, 'error')
  }
}

// Sauvegarder toutes les modifs en attente
async function saveAll() {
  const elements = document.querySelectorAll('[data-content-key]')
  const toSave = [...elements].filter(el => _pendingSave.has(el.dataset.contentKey))
  if (!toSave.length) { updateStatus('✅ Tout est déjà sauvegardé'); return }
  await Promise.all(toSave.map(el => saveElement(el)))
}

// ═══════════════════════════════════════════════════════════════════
//  BARRE DE STATUT ADMIN
// ═══════════════════════════════════════════════════════════════════
let _statusBar, _statusMsg

function injectStatusBar(user) {
  const prenom = user.user_metadata?.prenom ?? 'Admin'

  _statusBar = document.createElement('div')
  _statusBar.id = 'jbe-bar'
  _statusBar.innerHTML = `
    <div class="jbe-bar-left">
      <div class="jbe-bar-dot"></div>
      <span class="jbe-bar-user">Mode édition — <strong>${prenom}</strong></span>
    </div>
    <div class="jbe-bar-msg" id="jbe-bar-msg">Survolez un texte pour le modifier</div>
    <div class="jbe-bar-right">
      <button class="jbe-bar-btn jbe-bar-save" onclick="window.__jbeSaveAll()">
        ✓ Tout sauvegarder
      </button>
      <a class="jbe-bar-btn" href="admin.html">Dashboard →</a>
    </div>
  `
  document.body.prepend(_statusBar)
  document.body.style.paddingTop = '40px'

  _statusMsg = document.getElementById('jbe-bar-msg')
  window.__jbeSaveAll = saveAll
}

function updateStatus(msg) {
  if (_statusMsg) _statusMsg.textContent = msg
  // Reset après 3s si message de succès
  if (msg.startsWith('✅')) {
    setTimeout(() => {
      if (_statusMsg) _statusMsg.textContent = 'Survolez un texte pour le modifier'
    }, 3000)
  }
}

function flashEl(el, type) {
  el.style.transition = 'outline .15s'
  el.style.outline    = type === 'success'
    ? '2px solid rgba(34,197,94,.6)'
    : '2px solid rgba(239,68,68,.6)'
  setTimeout(() => { el.style.outline = '' }, 1200)
}

// ═══════════════════════════════════════════════════════════════════
//  CSS INJECTÉ
// ═══════════════════════════════════════════════════════════════════
function injectStyles() {
  if (document.getElementById('jbe-styles')) return

  const style = document.createElement('style')
  style.id = 'jbe-styles'
  style.textContent = `
  /* ── Barre admin ── */
  #jbe-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    height: 40px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    display: flex; align-items: center;
    padding: 0 20px; gap: 16px;
    font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    font-size: 12px; color: #111;
    box-shadow: 0 1px 6px rgba(0,0,0,.08);
  }
  .jbe-bar-left  { display: flex; align-items: center; gap: 8px; flex-shrink: 0 }
  .jbe-bar-dot   {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 0 rgba(34,197,94,.4);
    animation: jbe-ping 2s ease-in-out infinite;
  }
  @keyframes jbe-ping {
    0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.4) }
    70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0) }
    100% { box-shadow: 0 0 0 0 rgba(34,197,94,0) }
  }
  .jbe-bar-user  { font-size: 12px; color: #555 }
  .jbe-bar-user strong { color: #111; font-weight: 600 }
  .jbe-bar-msg   { flex: 1; font-size: 11px; color: #888; text-align: center }
  .jbe-bar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0 }
  .jbe-bar-btn {
    padding: 5px 14px;
    background: #fff; color: #111;
    border: 1px solid #d1d5db; border-radius: 6px;
    font-size: 11px; font-weight: 500; cursor: pointer;
    text-decoration: none;
    transition: all .15s;
    font-family: inherit;
  }
  .jbe-bar-btn:hover { background: #f9fafb; border-color: #9ca3af }
  .jbe-bar-save {
    background: #111; color: #fff; border-color: #111;
  }
  .jbe-bar-save:hover { background: #333 }

  /* ── Crayon ── */
  .jbe-pencil {
    position: absolute;
    top: -10px; right: -10px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #d1d5db;
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
    font-size: 11px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .15s, transform .15s;
    z-index: 100;
    color: #111;
  }
  [data-content-key]:hover > .jbe-pencil,
  [data-content-key]:focus-within > .jbe-pencil {
    opacity: 1; transform: scale(1.1);
  }
  .jbe-pencil:hover { background: #111; color: #fff; border-color: #111 }

  /* ── Élément en cours d'édition ── */
  .jbe-editing {
    outline: 2px dashed rgba(0,0,0,.2) !important;
    outline-offset: 6px;
    background: rgba(255,255,255,.03) !important;
    cursor: text !important;
  }

  /* ── Nav admin buttons ── */
  .nav-btn-admin {
    font-family: 'DM Mono', monospace;
    font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
    background: #fff; color: #111;
    padding: 6px 13px; border-radius: 4px;
    text-decoration: none; font-weight: 700;
    transition: all .18s; white-space: nowrap;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .nav-btn-admin:hover { background: #f3f4f6 }
  .nav-btn-logout {
    font-family: 'DM Mono', monospace;
    font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
    color: rgba(255,255,255,.4); background: none;
    padding: 6px 13px; border-radius: 4px;
    border: 1px solid rgba(255,255,255,.1);
    cursor: pointer; transition: all .18s; white-space: nowrap;
  }
  .nav-btn-logout:hover { color: #fff; border-color: rgba(255,255,255,.3) }
  .nav-btn-user {
    font-family: 'DM Mono', monospace;
    font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
    color: rgba(255,255,255,.6);
  }

  /* ── Accessibilité ── */
  [contenteditable="true"] { user-select: text !important }
  `
  document.head.appendChild(style)
}

// ── Lancer ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init)
