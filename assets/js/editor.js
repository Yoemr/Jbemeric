/**
 * editor.js — JB EMERIC
 * ═══════════════════════════════════════════════════════════════════
 * Système d'édition "Crayon" papa-proof
 *
 * Fonctionnalités :
 *  - Éditeur contentEditable avec nettoyage strict (texte brut uniquement)
 *  - Sauvegarde Supabase sur onBlur via updateText()
 *  - Crayon flottant sur le site public pour les admins connectés
 *  - Table site_content : clé/valeur par page
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Référence Supabase (injectée depuis admin.html) ────────────────
let _supabase = null
let _role     = null

export function initEditor(supabaseClient, role) {
  _supabase = supabaseClient
  _role     = role
  buildEditorBlocks('all', document.getElementById('main-editor'))
  window._initEditorPage = buildEditorBlocks
}

// ═══════════════════════════════════════════════════════════════════
//  CATALOGUE DES BLOCS ÉDITABLES
//  { id, page, label, defaultText, multiline }
// ═══════════════════════════════════════════════════════════════════
const CONTENT_BLOCKS = [
  // ── Index ───────────────────────────────────────────────────────
  { id:'index_hero_title',   page:'index',   label:'Hero — Titre principal',     multiline:false, default:'JB EMERIC' },
  { id:'index_acad_title',   page:'index',   label:'Section Académie — Titre',   multiline:false, default:'DEVENIR PILOTE' },
  { id:'index_acad_desc',    page:'index',   label:'Section Académie — Accroche',multiline:true,  default:'Du karting enfant à la compétition officielle.' },
  { id:'index_coach_title',  page:'index',   label:'Section Coaching — Titre',   multiline:false, default:'LE COACHING JB' },
  { id:'index_coach_desc',   page:'index',   label:'Section Coaching — Accroche',multiline:true,  default:'JB coache depuis 1989.' },
  { id:'index_track_title',  page:'index',   label:'Section Track — Titre',      multiline:false, default:'TRACK-DAYS & STAGES' },
  { id:'index_paddock_title',page:'index',   label:'Section Paddock — Titre',    multiline:false, default:'LE PADDOCK' },

  // ── Coaching ────────────────────────────────────────────────────
  { id:'coach_off1_tag',     page:'coaching', label:'Offre 01 — Badge',          multiline:false, default:'Offre 01' },
  { id:'coach_off1_pretitle',page:'coaching', label:'Offre 01 — Sous-titre',     multiline:false, default:'Pour le pilote amateur' },
  { id:'coach_off1_name',    page:'coaching', label:'Offre 01 — Nom',            multiline:false, default:'COACHING CIRCUIT' },
  { id:'coach_off1_hook',    page:'coaching', label:'Offre 01 — Accroche',       multiline:true,  default:'Vous stagnez depuis des années sans savoir pourquoi.' },
  { id:'coach_off1_cta',     page:'coaching', label:'Offre 01 — Bouton CTA',     multiline:false, default:'Réserver une session' },
  { id:'coach_off2_tag',     page:'coaching', label:'Offre 02 — Badge',          multiline:false, default:'Offre 02' },
  { id:'coach_off2_pretitle',page:'coaching', label:'Offre 02 — Sous-titre',     multiline:false, default:'Pilote licencié en compétition' },
  { id:'coach_off2_name',    page:'coaching', label:'Offre 02 — Nom',            multiline:false, default:'COACHING COMPÉTITION' },
  { id:'coach_off2_hook',    page:'coaching', label:'Offre 02 — Accroche',       multiline:true,  default:'Vous avez des chronos, pas les résultats que vous méritez.' },
  { id:'coach_off2_cta',     page:'coaching', label:'Offre 02 — Bouton CTA',     multiline:false, default:'Parler de ma saison' },
  { id:'coach_faq_q1',       page:'coaching', label:'FAQ — Question 1',          multiline:false, default:'Faut-il un niveau minimum ?' },
  { id:'coach_faq_a1',       page:'coaching', label:'FAQ — Réponse 1',           multiline:true,  default:'Aucun. JB coache des débutants complets.' },

  // ── Paddock ─────────────────────────────────────────────────────
  { id:'paddock_subtitle',   page:'paddock',  label:'Paddock — Sous-titre une',  multiline:false, default:'Toute l\'actu en un coup d\'œil' },
  { id:'paddock_art1_title', page:'paddock',  label:'Article 1 — Titre',         multiline:false, default:'Titre de l\'article' },
  { id:'paddock_art1_desc',  page:'paddock',  label:'Article 1 — Description',   multiline:true,  default:'Résumé de l\'article…' },
  { id:'paddock_art2_title', page:'paddock',  label:'Article 2 — Titre',         multiline:false, default:'Titre de l\'article' },
  { id:'paddock_art2_desc',  page:'paddock',  label:'Article 2 — Description',   multiline:true,  default:'Résumé de l\'article…' },

  // ── Track ───────────────────────────────────────────────────────
  { id:'track_section_title',page:'track',    label:'Track — Titre section',     multiline:false, default:'PROCHAINES SESSIONS DISPONIBLES' },
  { id:'track_section_lead', page:'track',    label:'Track — Accroche',          multiline:true,  default:'Inscrivez-vous aux sessions confirmées ou votez pour déclencher une date.' },
]

// ═══════════════════════════════════════════════════════════════════
//  CHARGER LES CONTENUS SUPABASE
// ═══════════════════════════════════════════════════════════════════
let _contentCache = {}

async function loadAllContent() {
  if (!_supabase) return
  try {
    const { data } = await _supabase
      .from('site_content')
      .select('key, value')
    if (data) {
      _contentCache = Object.fromEntries(data.map(r => [r.key, r.value]))
    }
  } catch(e) {
    console.warn('[editor] Impossible de charger site_content:', e.message)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CONSTRUIRE LES BLOCS D'ÉDITION
// ═══════════════════════════════════════════════════════════════════
export async function buildEditorBlocks(pageFilter, container) {
  if (!container) return
  await loadAllContent()

  const blocks = pageFilter === 'all'
    ? CONTENT_BLOCKS
    : CONTENT_BLOCKS.filter(b => b.page === pageFilter)

  container.innerHTML = blocks.map(block => {
    const currentVal = _contentCache[block.id] ?? block.default
    return `
      <div class="editable-block" data-page="${block.page}" id="eb-${block.id}">
        <div class="eb-header">
          <div>
            <div class="eb-page">${block.page}</div>
            <div class="eb-key">${block.label}</div>
          </div>
          <span class="eb-status saved" id="st-${block.id}">Enregistré</span>
        </div>
        <div
          class="eb-field"
          id="ef-${block.id}"
          contenteditable="true"
          data-block-id="${block.id}"
          data-multiline="${block.multiline}"
          data-placeholder="Cliquez pour modifier…"
          spellcheck="false"
          onpaste="handlePaste(event)"
          oninput="markDirty('${block.id}')"
          onblur="saveBlock('${block.id}')"
          onkeydown="handleKeydown(event, ${block.multiline})"
        >${escHtml(currentVal)}</div>
        <div class="eb-actions">
          <button class="btn btn-ghost btn-sm" onclick="resetBlock('${block.id}','${escAttr(block.default)}')">Réinitialiser</button>
          <button class="btn btn-ok btn-sm" onclick="saveBlock('${block.id}')">✓ Sauvegarder</button>
        </div>
      </div>`
  }).join('')
}

// ═══════════════════════════════════════════════════════════════════
//  NETTOYAGE DU TEXTE — Coeur du système "papa-proof"
// ═══════════════════════════════════════════════════════════════════

/**
 * Intercepte le coller (Ctrl+V) et n'insère que du texte brut.
 * Supprime : gras, italique, couleurs, polices, tailles, liens, HTML.
 */
window.handlePaste = function(e) {
  e.preventDefault()

  // Récupérer uniquement le texte brut du presse-papier
  const raw = e.clipboardData?.getData('text/plain') ?? ''

  // Nettoyage supplémentaire : retirer les retours chariot multiples
  const clean = sanitizeText(raw)

  // Insérer via execCommand (compatible tous navigateurs)
  document.execCommand('insertText', false, clean)
}

/**
 * Nettoyer un texte : texte brut uniquement, sans HTML ni entités.
 * Utilisé aussi avant la sauvegarde.
 */
function sanitizeText(text) {
  return text
    .replace(/\r\n|\r/g, '\n')        // normaliser les sauts de ligne
    .replace(/\n{3,}/g, '\n\n')       // max 2 sauts de ligne consécutifs
    .replace(/\t/g, ' ')              // tabs → espaces
    .trim()
}

/**
 * Lire le texte brut d'un contenteditable
 * (ignore tous les tags HTML qui auraient pu s'y glisser)
 */
function getCleanText(el) {
  // Remplacer les <br> par des sauts de ligne avant extraction
  const clone = el.cloneNode(true)
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
  clone.querySelectorAll('p, div').forEach(block => {
    if (block.nextSibling) block.after('\n')
  })
  return sanitizeText(clone.textContent || '')
}

/**
 * Empêcher les touches qui insèrent du formatage (Ctrl+B, Ctrl+I, etc.)
 * et gérer Enter selon multiline.
 */
window.handleKeydown = function(e, multiline) {
  // Bloquer le formatage clavier
  const BLOCKED = ['b','i','u','k']  // gras, italique, souligné, lien
  if ((e.ctrlKey || e.metaKey) && BLOCKED.includes(e.key.toLowerCase())) {
    e.preventDefault()
    return
  }

  // Enter : interdire en mode mono-ligne
  if (e.key === 'Enter') {
    if (!multiline) {
      e.preventDefault()
      e.target.blur() // sauvegarder et quitter
    }
    // En multiline : laisser passer mais insérer \n propre
  }
}

// ═══════════════════════════════════════════════════════════════════
//  ÉTAT DES BLOCS
// ═══════════════════════════════════════════════════════════════════
const _dirty = new Set()

window.markDirty = function(blockId) {
  _dirty.add(blockId)
  setStatus(blockId, 'unsaved', 'Non sauvegardé')

  // Auto-nettoyage : s'assurer qu'aucun style parasite ne s'est glissé
  const field = document.getElementById(`ef-${blockId}`)
  if (field) {
    // Retirer tous les styles inline sur les éléments enfants
    field.querySelectorAll('[style],[class],[face],[color],[size]').forEach(el => {
      el.removeAttribute('style')
      el.removeAttribute('class')
      el.removeAttribute('face')
      el.removeAttribute('color')
      el.removeAttribute('size')
    })
    // Retirer les balises de formatage indésirables
    ;['b','strong','i','em','u','s','strike','font','span'].forEach(tag => {
      field.querySelectorAll(tag).forEach(el => {
        el.replaceWith(...el.childNodes)
      })
    })
  }
}

function setStatus(blockId, cls, label) {
  const st = document.getElementById(`st-${blockId}`)
  if (st) { st.className = `eb-status ${cls}`; st.textContent = label }
}

// ═══════════════════════════════════════════════════════════════════
//  SAUVEGARDE SUPABASE
// ═══════════════════════════════════════════════════════════════════

/**
 * Sauvegarder un bloc dans site_content (upsert)
 * Appelé sur onBlur ou manuellement
 */
window.saveBlock = async function(blockId) {
  if (!_supabase) return
  const field = document.getElementById(`ef-${blockId}`)
  if (!field) return

  const newValue = getCleanText(field)

  // Mettre à jour le DOM avec le texte nettoyé
  field.textContent = newValue

  setStatus(blockId, 'saving', 'Sauvegarde…')

  try {
    const { error } = await updateText(blockId, newValue)
    if (error) throw error

    _contentCache[blockId] = newValue
    _dirty.delete(blockId)
    setStatus(blockId, 'saved', 'Enregistré ✓')

    // Toast discret
    if (typeof window.toast === 'function') {
      window.toast(`"${blockId}" sauvegardé`)
    }
  } catch(e) {
    setStatus(blockId, 'error', 'Erreur !')
    console.error('[editor] saveBlock:', e)
    if (typeof window.toast === 'function') {
      window.toast(e.message, 'err')
    }
  }
}

/**
 * Sauvegarder tous les blocs modifiés non sauvegardés
 */
export async function saveAllPending() {
  const pending = [..._dirty]
  if (!pending.length) {
    if (typeof window.toast === 'function') window.toast('Rien à sauvegarder','info')
    return
  }
  await Promise.all(pending.map(id => window.saveBlock(id)))
  if (typeof window.toast === 'function') {
    window.toast(`${pending.length} bloc${pending.length>1?'s':''} sauvegardé${pending.length>1?'s':''}`)
  }
}

/**
 * Réinitialiser un bloc à sa valeur par défaut
 */
window.resetBlock = function(blockId, defaultValue) {
  const field = document.getElementById(`ef-${blockId}`)
  if (!field) return
  if (!confirm('Réinitialiser ce bloc à sa valeur par défaut ?')) return
  field.textContent = defaultValue
  markDirty(blockId)
}

// ═══════════════════════════════════════════════════════════════════
//  SUPABASE — updateText()
// ═══════════════════════════════════════════════════════════════════

/**
 * Envoyer une modification de contenu vers Supabase
 * Table : site_content (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ)
 */
export async function updateText(key, value) {
  if (!_supabase) throw new Error('Supabase non initialisé')
  return _supabase
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

// ═══════════════════════════════════════════════════════════════════
//  FILTRE PAR PAGE
// ═══════════════════════════════════════════════════════════════════
export function filterEditor(btn, page) {
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('on'))
  btn.classList.add('on')

  document.querySelectorAll('.editable-block').forEach(block => {
    const show = page === 'all' || block.dataset.page === page
    block.style.display = show ? '' : 'none'
  })
}

// ═══════════════════════════════════════════════════════════════════
//  CRAYON FLOTTANT — Injection sur les pages publiques
// ═══════════════════════════════════════════════════════════════════

/**
 * À appeler sur les pages publiques (index, coaching, etc.)
 * Si l'utilisateur est admin/moderateur → affiche les crayons
 */
export async function initPublicEditor(supabaseClient) {
  _supabase = supabaseClient
  await loadAllContent()

  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) return
  const role = user?.user_metadata?.role
  if (!['admin','moderateur'].includes(role)) return

  // Appliquer les contenus Supabase au DOM
  applyContentToDom()

  // Injecter les crayons
  injectPencils()

  // Barre de statut
  injectStatusBar(user)
}

/**
 * Appliquer les contenus sauvegardés sur les éléments du DOM public
 * Chaque élément doit avoir data-content-id="coach_off1_name" etc.
 */
function applyContentToDom() {
  document.querySelectorAll('[data-content-id]').forEach(el => {
    const key = el.dataset.contentId
    if (_contentCache[key] !== undefined) {
      el.textContent = _contentCache[key]
    }
  })
}

/**
 * Injecter des crayons à côté des éléments data-content-id
 */
function injectPencils() {
  // CSS des crayons
  const style = document.createElement('style')
  style.textContent = `
    .pencil-wrap { position:relative; display:inline-block }
    .pencil-btn {
      position:absolute; top:-8px; right:-24px;
      width:20px; height:20px; border-radius:50%;
      background:rgba(255,207,0,.9); border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      font-size:10px; opacity:0; transition:opacity .15s;
      z-index:1000; box-shadow:0 2px 8px rgba(0,0,0,.3);
    }
    .pencil-wrap:hover .pencil-btn { opacity:1 }
    .pencil-editing {
      outline:2px dashed rgba(255,207,0,.5) !important;
      outline-offset:4px;
      background:rgba(255,207,0,.04) !important;
    }
    .pencil-bar {
      position:fixed; top:0; left:0; right:0; z-index:9998;
      background:rgba(4,10,30,.97); border-bottom:2px solid rgba(255,207,0,.4);
      padding:6px 16px; display:flex; align-items:center; gap:12px;
      font-family:'DM Mono'; font-size:9px; letter-spacing:1.5px;
      text-transform:uppercase; color:rgba(255,255,255,.6);
      backdrop-filter:blur(8px);
    }
    .pencil-bar .pb-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px rgba(34,197,94,.6) }
    .pencil-bar a { color:rgba(255,207,0,.7); text-decoration:none; margin-left:auto }
    .pencil-bar .pb-save {
      padding:4px 12px; background:linear-gradient(135deg,#F5D061,#C8860A);
      color:#000; border:none; border-radius:4px; cursor:pointer;
      font-family:'DM Mono'; font-size:8px; letter-spacing:1.5px;
      text-transform:uppercase; font-weight:700;
    }
    [data-content-id] { cursor:default }
  `
  document.head.appendChild(style)

  // Envelopper chaque élément éditable dans un .pencil-wrap
  document.querySelectorAll('[data-content-id]').forEach(el => {
    const blockId = el.dataset.contentId
    const block   = CONTENT_BLOCKS.find(b => b.id === blockId)
    if (!block) return

    const wrap = document.createElement('div')
    wrap.className = 'pencil-wrap'
    el.parentNode.insertBefore(wrap, el)
    wrap.appendChild(el)

    const btn = document.createElement('button')
    btn.className = 'pencil-btn'
    btn.textContent = '✏'
    btn.title = `Modifier : ${block.label}`
    btn.addEventListener('click', () => activatePencil(el, blockId, block.multiline))
    wrap.appendChild(btn)
  })
}

let _activeField = null

function activatePencil(el, blockId, multiline) {
  // Désactiver le précédent
  if (_activeField && _activeField !== el) {
    deactivatePencil(_activeField)
  }
  _activeField = el

  el.classList.add('pencil-editing')
  el.contentEditable = 'true'
  el.dataset.blockId = blockId
  el.dataset.multiline = multiline
  el.focus()

  // Sélectionner tout le texte
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)

  // Attacher les handlers
  el.addEventListener('paste',   handlePaste, { once: false })
  el.addEventListener('input',   () => markDirty(blockId))
  el.addEventListener('blur',    () => { window.saveBlock(blockId); deactivatePencil(el) })
  el.addEventListener('keydown', (e) => {
    window.handleKeydown(e, multiline)
    if (e.key === 'Escape') { deactivatePencil(el); el.blur() }
  })
}

function deactivatePencil(el) {
  el.contentEditable = 'false'
  el.classList.remove('pencil-editing')
  _activeField = null
}

function injectStatusBar(user) {
  const bar = document.createElement('div')
  bar.className = 'pencil-bar'
  bar.innerHTML = `
    <div class="pb-dot"></div>
    Mode édition · ${user.user_metadata?.prenom ?? 'Admin'}
    <button class="pb-save" onclick="import('./assets/js/editor.js').then(m=>m.saveAllPending())">
      ✓ Tout sauvegarder
    </button>
    <a href="admin.html">Dashboard →</a>
  `
  document.body.prepend(bar)
  document.body.style.paddingTop = '34px'
}

// ═══════════════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════════════
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function escAttr(str) {
  return String(str).replace(/'/g,"\\'")
}
