/**
 * live-editor.js — JB EMERIC  v4  "Senior-Ready"
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Ce que fait ce fichier, dans l'ordre :
 *
 *  1. SCAN du DOM → attribue un id "txt-01", "txt-02"… à chaque
 *     texte éditable qui n'en a pas encore.
 *
 *  2. SUPABASE → charge site_content (colonnes: id, content)
 *     et remplace les textes AVANT le premier affichage (via
 *     visibility:hidden sur le body jusqu'au remplacement).
 *
 *  3. SESSION → getSession() (cookie local, 0 appel réseau).
 *     Si admin/moderateur → active le mode crayon.
 *
 *  4. CRAYONS → boutons blancs ultra-visibles, bordure jaune
 *     sur l'élément actif.
 *
 *  5. ANTI-CASSE → paste = texte brut seulement.
 *     Ctrl+B/I/U bloqués. Entrée = sauvegarde + quitter.
 *
 *  6. BARRE ADMIN → barre blanche fixe en haut : "Mode Édition
 *     Activé — Bonjour JB".
 *
 *  Table Supabase : site_content
 *  Colonnes       : id TEXT PRIMARY KEY, content TEXT, page TEXT
 * ═══════════════════════════════════════════════════════════════════
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ── Config ────────────────────────────────────────────────────────
const SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
const SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
const sb      = createClient(SB_URL, SB_ANON)

// Page courante : "index", "coaching", "track"…
const PAGE = location.pathname.split('/').pop().replace('.html','') || 'index'

// Sélecteurs de texte éditorial — tout sauf nav, footer, scripts
// On cible les classes réelles observées dans le site JBE
const SELECTORS = [
  /* Titres génériques */
  'h1','h2','h3','h4',
  /* Classes texte hero */
  '.hero-title','.hero-lead','.hero-sub','.hero-kicker','.hero-eyebrow',
  /* Overview index */
  '.ov-title','.ov-desc','.ov-eyebrow','.ov-card-name','.ov-card-sub','.ov-card-num',
  /* Coaching */
  '.flyer-name','.flyer-hook','.flyer-pretitle','.flyer-tag','.fcard-desc',
  /* Académie */
  '.pc-title','.pc-lead','.man-title','.man-lead',
  /* Track */
  '.sr-title','.sr-lead','.body-txt',
  /* Générique */
  '.section-title','.section-lead','.kicker','.sh',
  /* Fallback paragraphes orphelins */
  'p'
].join(',')

// Cache Supabase { "index__txt-01": "texte...", ... }
let _db = {}
// Éléments indexés
let _els = []
// Modifications en attente
let _dirty = new Set()
// Barre de statut
let _statusEl = null
// Élément actif
let _active = null

// ═══════════════════════════════════════════════════════════════════
//  MASQUER le body pour éviter le flash de l'ancien texte
// ═══════════════════════════════════════════════════════════════════
;(function hideDuringLoad() {
  const s = document.createElement('style')
  s.id = 'jbe-hide'
  s.textContent = 'body{visibility:hidden!important}'
  document.head.appendChild(s)
})()

function showBody() {
  const s = document.getElementById('jbe-hide')
  if (s) s.remove()
}

// ═══════════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Scanner et attribuer les IDs en premier (synchrone, rapide)
  scanAndAssignIds()

  // 2. Charger Supabase + session en parallèle
  const [dbResult, sessResult] = await Promise.allSettled([
    loadFromSupabase(),
    sb.auth.getSession()
  ])

  // 3. Appliquer les textes sauvegardés au DOM
  applyTexts()

  // 4. Révéler la page
  showBody()

  // 5. Analyser la session
  const session = sessResult.value?.data?.session ?? null
  const user    = session?.user ?? null
  const role    = user?.user_metadata?.role ?? null
  const isAdmin = role === 'admin' || role === 'moderateur'

  // 6. Adapter le nav
  updateNav(user, isAdmin)

  // 7. Activer le mode édition si admin
  if (isAdmin) {
    buildStyles()
    buildCrayons()
    buildStatusBar(user)
  }
})

// ═══════════════════════════════════════════════════════════════════
//  1. SCAN — attribue txt-01, txt-02… aux éléments sans id
// ═══════════════════════════════════════════════════════════════════
function scanAndAssignIds() {
  _els = []
  let counter = 1

  document.querySelectorAll(SELECTORS).forEach(el => {
    // Exclure nav, footer, scripts, éléments vides
    if (el.closest('nav, footer, script, style, [data-no-edit]')) return
    // Exclure SVG et leurs enfants
    if (el.closest('svg') || el.tagName === 'SVG') return
    // Exclure si pas de texte visible
    const txt = el.textContent.trim()
    if (!txt || txt.length < 2) return
    // Exclure les wrappers qui contiennent eux-mêmes d'autres cibles
    if (el.querySelector(SELECTORS)) return

    // Attribuer un id si absent
    if (!el.id) {
      el.id = `txt-${String(counter).padStart(2,'0')}`
    }
    counter++

    // Stocker le texte original comme fallback (touche Échap)
    el.dataset.originalText = txt
    // Clé Supabase = "page__id"
    el.dataset.sbKey = `${PAGE}__${el.id}`

    _els.push(el)
  })

  console.info(`[JBE] ${_els.length} éléments indexés (${PAGE})`)
}

// ═══════════════════════════════════════════════════════════════════
//  2. CHARGER depuis Supabase — colonnes id + content
// ═══════════════════════════════════════════════════════════════════
async function loadFromSupabase() {
  try {
    const { data, error } = await sb
      .from('site_content')
      .select('id, content')
      .eq('page', PAGE)

    if (error) {
      // 400 ou table vide → normal, pas de crash
      console.info('[JBE] site_content:', error.message)
      return
    }
    if (data?.length) {
      _db = Object.fromEntries(data.map(r => [r.id, r.content]))
      console.info(`[JBE] ${data.length} texte(s) chargé(s) depuis Supabase`)
    }
  } catch (e) {
    console.info('[JBE] Supabase inaccessible:', e.message)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  3. APPLIQUER les textes Supabase au DOM (texte brut, jamais HTML)
// ═══════════════════════════════════════════════════════════════════
function applyTexts() {
  if (!Object.keys(_db).length) return
  _els.forEach(el => {
    const val = _db[el.dataset.sbKey]
    if (val) el.textContent = val
  })
}

// ═══════════════════════════════════════════════════════════════════
//  4. NAV — connecté ou non
// ═══════════════════════════════════════════════════════════════════
function updateNav(user, isAdmin) {
  if (!user) return

  const prenom = user.user_metadata?.prenom
    || user.email?.split('@')[0]
    || 'Admin'

  // Desktop
  const desk = document.querySelector('.nav-auth')
  if (desk) {
    desk.innerHTML = isAdmin
      ? `<a class="nav-btn-admin" href="admin.html">✦ Espace Admin</a>
         <button class="nav-btn-logout" onclick="window.__jbeOut()">Déconnexion</button>`
      : `<span class="nav-btn-user">${prenom}</span>
         <button class="nav-btn-logout" onclick="window.__jbeOut()">Déconnexion</button>`
  }

  // Mobile
  const mob = document.querySelector('.nav-mobile-cta, .nav-mobile-auth')
  if (mob) {
    mob.innerHTML = isAdmin
      ? `<a class="nav-mobile-btn" href="admin.html">✦ Espace Admin</a>
         <button class="nav-mobile-btn nav-mobile-logout" onclick="window.__jbeOut()">Déconnexion</button>`
      : `<button class="nav-mobile-btn nav-mobile-logout" onclick="window.__jbeOut()">Déconnexion</button>`
  }

  window.__jbeOut = async () => { await sb.auth.signOut(); location.reload() }
}

// ═══════════════════════════════════════════════════════════════════
//  5. CRAYONS — boutons ultra-visibles
// ═══════════════════════════════════════════════════════════════════
function buildCrayons() {
  _els.forEach(el => attachPencil(el))
}

function attachPencil(el) {
  // Appliquer le contenu Supabase si dispo
  const val = _db[el.dataset.sbKey]
  if (val) el.textContent = val

  // Position relative pour le bouton absolu
  if (getComputedStyle(el).position === 'static') {
    el.style.position = 'relative'
  }

  // Créer le bouton "Modifier"
  const btn = document.createElement('button')
  btn.className   = 'jbe-btn-edit'
  btn.textContent = '✎ Modifier'
  btn.title       = `Clé : ${el.dataset.sbKey}`
  btn.setAttribute('type', 'button')
  btn.addEventListener('click', e => { e.stopPropagation(); startEdit(el) })
  el.appendChild(btn)
}

// ── Démarrer l'édition ────────────────────────────────────────────
function startEdit(el) {
  // Fermer l'édition précédente
  if (_active && _active !== el) endEdit(_active, true)
  _active = el

  // Retirer le bouton le temps de l'édition
  el.querySelector('.jbe-btn-edit')?.remove()

  // Surbrillance active
  el.classList.add('jbe-active')
  el.contentEditable = 'true'
  el.spellcheck      = false

  // Placer le curseur — sélectionner tout
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)

  // Handlers (stockés pour pouvoir les retirer proprement)
  el._jPaste   = e  => interceptPaste(e)
  el._jKey     = e  => interceptKey(e)
  el._jInput   = () => onInput(el)
  el._jBlur    = () => endEdit(el, true)

  el.addEventListener('paste',   el._jPaste)
  el.addEventListener('keydown', el._jKey)
  el.addEventListener('input',   el._jInput)
  el.addEventListener('blur',    el._jBlur)

  setStatus('✎  Tapez votre texte · Entrée = sauvegarder · Échap = annuler')
}

// ── Terminer l'édition ────────────────────────────────────────────
function endEdit(el, save = false) {
  el.contentEditable = 'false'
  el.classList.remove('jbe-active')

  el.removeEventListener('paste',   el._jPaste)
  el.removeEventListener('keydown', el._jKey)
  el.removeEventListener('input',   el._jInput)
  el.removeEventListener('blur',    el._jBlur)

  // Remettre le bouton
  attachPencil(el)

  if (save && _dirty.has(el.dataset.sbKey)) saveElement(el)
  if (_active === el) _active = null
}

// ═══════════════════════════════════════════════════════════════════
//  6. ANTI-CASSE — texte brut absolu
// ═══════════════════════════════════════════════════════════════════

// Coller → texte brut uniquement, zéro HTML
function interceptPaste(e) {
  e.preventDefault()
  const raw   = e.clipboardData?.getData('text/plain') ?? ''
  const clean = purify(raw)
  // insertText = seule méthode qui respecte la position du curseur
  document.execCommand('insertText', false, clean)
}

// Clavier → bloquer le formatage, gérer Entrée et Échap
function interceptKey(e) {
  // Bloquer Ctrl/Cmd + B I U K H (gras, italique, souligné, lien, titre)
  if ((e.ctrlKey || e.metaKey) && 'biukh'.includes(e.key.toLowerCase())) {
    e.preventDefault()
    return
  }
  // Entrée → sauvegarder et quitter
  if (e.key === 'Enter') {
    e.preventDefault()
    e.target.blur()
    return
  }
  // Échap → restaurer le texte original
  if (e.key === 'Escape') {
    const original = _db[e.target.dataset.sbKey] ?? e.target.dataset.originalText ?? ''
    e.target.textContent = original
    _dirty.delete(e.target.dataset.sbKey)
    e.target.blur()
  }
}

// Input → nettoyer en temps réel les balises de style
function onInput(el) {
  // Supprimer toutes les balises de formatage
  ;['b','strong','i','em','u','s','strike','font','mark','span','code'].forEach(tag => {
    el.querySelectorAll(tag).forEach(n => n.replaceWith(...n.childNodes))
  })
  // Retirer les attributs style/color/face sur les descendants
  el.querySelectorAll('[style],[color],[face],[size],[class]').forEach(n => {
    ;['style','color','face','size'].forEach(a => n.removeAttribute(a))
  })
  _dirty.add(el.dataset.sbKey)
  setStatus('✎  Modification non sauvegardée · cliquez ailleurs ou appuyez Entrée')
}

// Texte brut depuis le DOM (retire le bouton crayon du texte)
function extractText(el) {
  const clone = el.cloneNode(true)
  clone.querySelectorAll('.jbe-btn-edit').forEach(b => b.remove())
  clone.querySelectorAll('br').forEach(b => b.replaceWith('\n'))
  return purify(clone.textContent || '')
}

// Nettoyage final : retours ligne normalisés, trim
function purify(t) {
  return t.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

// ═══════════════════════════════════════════════════════════════════
//  7. SAUVEGARDE — upsert sur colonnes id + content
// ═══════════════════════════════════════════════════════════════════
async function saveElement(el) {
  const key     = el.dataset.sbKey
  const content = extractText(el)
  if (!key || !content) return

  // Remettre le DOM propre (textContent retire les enfants)
  const btn = el.querySelector('.jbe-btn-edit')
  btn?.remove()
  el.textContent = content
  // Le bouton sera remis par endEdit → attachPencil

  setStatus('⏳  Sauvegarde en cours…')

  try {
    const { error } = await sb
      .from('site_content')
      .upsert(
        {
          id:         key,          // ex: "coaching__txt-03"
          content:    content,      // texte brut
          page:       PAGE,         // ex: "coaching"
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )

    if (error) throw error

    _db[key] = content
    _dirty.delete(key)
    setStatus('✅  Texte sauvegardé !')
    flash(el, true)

  } catch (err) {
    setStatus('❌  Erreur : ' + err.message)
    flash(el, false)
    console.error('[JBE] Sauvegarde:', err)
  }
}

// Tout sauvegarder d'un coup (bouton dans la barre)
async function saveAll() {
  const todo = _els.filter(el => _dirty.has(el.dataset.sbKey))
  if (!todo.length) { setStatus('✅  Rien à sauvegarder'); return }
  setStatus(`⏳  Sauvegarde de ${todo.length} élément(s)…`)
  await Promise.all(todo.map(el => saveElement(el)))
}

// ═══════════════════════════════════════════════════════════════════
//  8. BARRE DE STATUT ADMIN
// ═══════════════════════════════════════════════════════════════════
function buildStatusBar(user) {
  const prenom = user.user_metadata?.prenom
    || user.email?.split('@')[0]
    || 'JB'

  const bar = document.createElement('div')
  bar.id = 'jbe-bar'
  bar.innerHTML = `
    <div class="jbe-bar-l">
      <span class="jbe-dot"></span>
      <strong>Mode Édition Activé</strong>
      <span class="jbe-sep">—</span>
      <span>Bonjour <strong>${prenom}</strong> 👋</span>
    </div>
    <div id="jbe-status" class="jbe-bar-c">
      Survolez un texte pour voir le bouton Modifier
    </div>
    <div class="jbe-bar-r">
      <span class="jbe-zones">${_els.length} zones éditables</span>
      <button class="jbe-save" onclick="window.__jbeSaveAll()">
        ✓ Tout sauvegarder
      </button>
      <a class="jbe-dash" href="admin.html">Dashboard →</a>
    </div>
  `
  document.body.prepend(bar)
  // Compenser la hauteur de la barre
  document.body.style.paddingTop = '48px'

  _statusEl = document.getElementById('jbe-status')
  window.__jbeSaveAll = saveAll
}

function setStatus(msg) {
  if (!_statusEl) return
  _statusEl.textContent = msg
  if (msg.startsWith('✅')) {
    setTimeout(() => {
      if (_statusEl) _statusEl.textContent = 'Survolez un texte pour voir le bouton Modifier'
    }, 3000)
  }
}

function flash(el, ok) {
  el.style.transition = 'outline .15s'
  el.style.outline    = ok
    ? '3px solid rgba(34,197,94,.8)'
    : '3px solid rgba(239,68,68,.8)'
  setTimeout(() => el.style.outline = '', 1600)
}

// ═══════════════════════════════════════════════════════════════════
//  9. CSS — injecté une seule fois, uniquement pour les admins
// ═══════════════════════════════════════════════════════════════════
function buildStyles() {
  if (document.getElementById('jbe-styles')) return

  const s = document.createElement('style')
  s.id = 'jbe-styles'
  s.textContent = `

  /* ═══════════════════════════════════════
     BARRE ADMIN — blanche, épurée, fixe
     ═══════════════════════════════════════ */
  #jbe-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 99999;
    height: 48px;
    background: #ffffff;
    border-bottom: 2px solid #e5e7eb;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    color: #111111;
    box-shadow: 0 2px 12px rgba(0,0,0,.10);
  }
  .jbe-bar-l {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    font-size: 13px;
    color: #333;
  }
  .jbe-dot {
    display: inline-block;
    width: 9px; height: 9px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 0 rgba(34,197,94,.5);
    animation: jbe-ping 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes jbe-ping {
    0%   { box-shadow: 0 0 0 0   rgba(34,197,94,.5) }
    70%  { box-shadow: 0 0 0 10px rgba(34,197,94,0) }
    100% { box-shadow: 0 0 0 0   rgba(34,197,94,0) }
  }
  .jbe-sep { color: #ccc }
  .jbe-bar-c {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: #888;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .jbe-bar-r {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .jbe-zones {
    font-size: 11px;
    color: #bbb;
    white-space: nowrap;
  }
  .jbe-save {
    padding: 7px 16px;
    background: #111111;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background .15s;
    white-space: nowrap;
    font-family: inherit;
  }
  .jbe-save:hover { background: #333 }
  .jbe-dash {
    padding: 7px 16px;
    background: #fff;
    color: #111;
    border: 1.5px solid #d1d5db;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all .15s;
    white-space: nowrap;
  }
  .jbe-dash:hover { background: #f9fafb; border-color: #9ca3af }

  /* ═══════════════════════════════════════
     BOUTON "MODIFIER" — ultra-visible
     Fond blanc pur, texte noir, gras
     ═══════════════════════════════════════ */
  .jbe-btn-edit {
    /* Positioning */
    position: absolute;
    top: -14px;
    right: -8px;
    z-index: 1000;

    /* Apparence — blanc pur, bien visible */
    background: #ffffff;
    color: #111111;
    font-weight: 700;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    letter-spacing: 0.3px;

    /* Forme */
    padding: 4px 10px;
    border: 1.5px solid #111111;
    border-radius: 20px;
    white-space: nowrap;

    /* Ombre pour visibilité sur tous fonds */
    box-shadow:
      0 2px 8px rgba(0,0,0,.20),
      0 0 0 3px rgba(255,255,255,.8);

    /* Interaction */
    cursor: pointer;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity .18s ease, transform .18s ease;

    /* Empêcher la sélection du bouton */
    user-select: none;
  }

  /* Apparaît au survol du parent */
  [data-sb-key]:hover .jbe-btn-edit {
    opacity: 1;
    transform: translateY(0);
  }

  .jbe-btn-edit:hover {
    background: #111111;
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.3), 0 0 0 3px rgba(255,255,255,.8);
  }

  /* ═══════════════════════════════════════
     SURBRILLANCE ACTIVE — bordure jaune vif
     Visible sur tous les fonds (clair/sombre)
     ═══════════════════════════════════════ */
  .jbe-active {
    outline: 3px solid #FFCF00 !important;
    outline-offset: 6px;
    background: rgba(255, 207, 0, 0.06) !important;
    border-radius: 2px;
    cursor: text !important;
  }
  /* Caret visible en édition */
  [contenteditable="true"] {
    caret-color: #111111;
    user-select: text !important;
  }

  /* ═══════════════════════════════════════
     NAV — état connecté
     ═══════════════════════════════════════ */
  .nav-btn-admin {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 700;
    background: rgba(255,255,255,.95);
    color: #111;
    padding: 7px 14px;
    border-radius: 5px;
    text-decoration: none;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 1px 6px rgba(0,0,0,.20);
    transition: all .18s;
  }
  .nav-btn-admin:hover { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.3) }

  .nav-btn-logout {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,.45);
    background: transparent;
    padding: 7px 13px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,.15);
    cursor: pointer;
    transition: all .18s;
    white-space: nowrap;
  }
  .nav-btn-logout:hover { color: #fff; border-color: rgba(255,255,255,.4) }

  .nav-btn-user {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,.55);
  }
  `

  document.head.appendChild(s)
}
