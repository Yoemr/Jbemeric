// ═══════════════════════════════════════════════════════════════════
//  track-sessions.js — JB EMERIC
//  Votes + Inscriptions pour track.html (remplace vote.php + track.php)
// ═══════════════════════════════════════════════════════════════════

import {
  supabase,
  getOpenEvents, getPotentialEvents,
  voteForEvent, hasVoted,
  createInscription, updateNavAuth, getUser
} from './assets/js/supabase.js'

const SEUIL_VOTES = 5

document.addEventListener('DOMContentLoaded', async () => {
  updateNavAuth()
  await Promise.all([renderOpen(), renderPotential()])
  initTabs()
})

// ═══════════════════════════════════════════════════════════════════
//  PHOTOS FALLBACK
// ═══════════════════════════════════════════════════════════════════
const PHOTO = {
  default:  'https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-3-4-AVANT.jpg',
  GT:       'https://jbemeric.com/wp-content/uploads/2020/07/G-T-3-R-S-3-4-AVANT-JOELLE-LE-LUC-15-8-19-4-300x200.jpg',
  Tourisme: 'https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-COTE.jpg',
  Lotus:    'https://jbemeric.com/wp-content/uploads/2022/01/LOTUS-AU-CIRCUIT-DU-LUC-LAURET9-300x194.jpg',
  Podium:   'https://jbemeric.com/wp-content/uploads/2025/12/PODIUM-RICARD-94-CHAMP-B-JB-GUIBBERT-TARRES-DANIEL-DELIEN-300x216-1.jpg',
}
const getPhoto = ev =>
  ev.circuits?.photo_url ||
  PHOTO[ev.vehicules?.type_vehicule] ||
  PHOTO.default

// ═══════════════════════════════════════════════════════════════════
//  SESSIONS OPEN
// ═══════════════════════════════════════════════════════════════════
async function renderOpen() {
  const grid = document.getElementById('grid-open')
  if (!grid) return

  grid.innerHTML = skeletons(3)

  try {
    const events = await getOpenEvents()
    if (!events.length) {
      grid.innerHTML = emptyState('Aucune session ouverte pour le moment')
      return
    }
    grid.innerHTML = events.map(ev => cardOpen(ev)).join('')
    // Dots animés
    events.forEach(ev => renderDots(ev))
  } catch (e) {
    console.error(e)
    grid.innerHTML = emptyState('Erreur de chargement — réessayez')
  }
}

function cardOpen(ev) {
  const date    = new Date(ev.date_event)
  const isFull  = ev.nb_inscrits >= ev.nb_places
  const restant = ev.nb_places - ev.nb_inscrits
  const photo   = getPhoto(ev)

  return `
  <div class="ev-card status-${isFull?'full':'open'}" id="ev-${ev.id}">
    <div class="ev-img">
      <img src="${photo}" alt="${ev.circuits?.nom}" loading="lazy">
      <span class="ev-badge ${isFull?'full':'open'}">${isFull?'Complet':'Confirmé'}</span>
      <div class="ev-date-overlay">${fmtDate(date)}</div>
    </div>
    <div class="ev-body">
      <div class="ev-circuit">${ev.circuits?.nom ?? '—'}</div>
      <div class="ev-meta">
        ${ev.circuits?.region ?? ''} · ${ev.circuits?.ville ?? ''}<br>
        ${ev.type} · <strong>${fmtPrix(ev.prix)} €</strong>
        ${ev.prix_coaching ? ` · Coaching +${fmtPrix(ev.prix_coaching)} €` : ''}
      </div>
      <div class="ev-places">
        <div class="ev-dots" id="dots-${ev.id}"></div>
        <span class="ev-places-lbl">${isFull ? 'Complet' : `${restant} place${restant>1?'s':''}`}</span>
      </div>
    </div>
    <div class="ev-foot">
      ${isFull
        ? `<button class="ev-btn ev-btn-full">Complet — liste d'attente</button>`
        : `<button class="ev-btn ev-btn-inscr" onclick="window.openModal(${ev.id}, ${JSON.stringify({
            titre: `${ev.circuits?.nom} — ${fmtDate(date)}`,
            type: ev.type,
            prix: parseFloat(ev.prix),
            prix_coaching: parseFloat(ev.prix_coaching||0),
            prix_location: parseFloat(ev.prix_location||0),
          })})">S'inscrire →</button>`
      }
      <button class="ev-btn-share" onclick="shareEvent('${ev.circuits?.nom}')">⎘</button>
    </div>
  </div>`
}

function renderDots(ev) {
  const el = document.getElementById(`dots-${ev.id}`)
  if (!el) return
  el.innerHTML = Array.from({ length: ev.nb_places }, (_, i) =>
    `<div class="ev-dot${i < ev.nb_inscrits ? ' taken' : ''}"></div>`
  ).join('')
}

// ═══════════════════════════════════════════════════════════════════
//  SESSIONS POTENTIAL — VOTES
// ═══════════════════════════════════════════════════════════════════
async function renderPotential() {
  const grid = document.getElementById('grid-vote')
  if (!grid) return

  grid.innerHTML = skeletons(2)

  try {
    const events = await getPotentialEvents()
    if (!events.length) {
      grid.innerHTML = emptyState('Aucun projet en attente de vote')
      return
    }

    // Vérifier les votes déjà effectués
    const votedMap = {}
    await Promise.all(events.map(async ev => {
      votedMap[ev.id] = await hasVoted(ev.id)
    }))

    grid.innerHTML = events.map(ev => cardVote(ev, votedMap[ev.id])).join('')
  } catch (e) {
    console.error(e)
    grid.innerHTML = emptyState('Erreur de chargement')
  }
}

function cardVote(ev, alreadyVoted) {
  const date  = new Date(ev.date_event)
  const nb    = ev.nb_votes || 0
  const pct   = Math.min(100, Math.round(nb / SEUIL_VOTES * 100))
  const photo = getPhoto(ev)
  const fillCls = pct >= 100 ? 'done' : pct >= 60 ? 'almost' : ''
  const hintCls = pct >= 100 ? 'done' : pct >= 60 ? 'almost' : 'normal'
  const hint = pct >= 100
    ? '✅ Seuil atteint — validation en cours'
    : pct >= 60
      ? `⚡ Proche — encore ${SEUIL_VOTES - nb} vote${SEUIL_VOTES-nb>1?'s':''}`
      : `${SEUIL_VOTES - nb} vote${SEUIL_VOTES-nb>1?'s':''} pour valider`

  return `
  <div class="ev-card status-vote" id="ev-${ev.id}">
    <div class="ev-img">
      <img src="${photo}" alt="${ev.circuits?.nom}" loading="lazy">
      <span class="ev-badge vote" id="badge-${ev.id}">${pct>=100?'Proche validation':'Vote en cours'}</span>
      <div class="ev-date-overlay">${fmtDate(date)}</div>
    </div>
    <div class="ev-body">
      <div class="ev-circuit">${ev.circuits?.nom ?? '—'}</div>
      <div class="ev-meta">
        ${ev.circuits?.region ?? ''} · ${ev.type} · <strong>${fmtPrix(ev.prix)} €</strong>
      </div>
      <div class="ev-vote-block">
        <div class="ev-vote-top">
          <span class="ev-vote-lbl">Pilotes intéressés</span>
          <span class="ev-vote-num" id="vnum-${ev.id}">${nb}</span>
        </div>
        <div class="ev-vote-bar">
          <div class="ev-vote-fill ${fillCls}" id="vfill-${ev.id}" style="width:${pct}%"></div>
        </div>
        <span class="ev-vote-hint ${hintCls}" id="vhint-${ev.id}">${hint}</span>
      </div>
    </div>
    <div class="ev-foot">
      <button
        class="ev-btn ev-btn-vote${alreadyVoted?' voted':''}"
        id="vbtn-${ev.id}"
        onclick="window.doVote(${ev.id}, this)"
        ${alreadyVoted?'disabled':''}>
        ${alreadyVoted?'✓ Votre vote est enregistré':'✋ Voter pour cette date'}
      </button>
      <button class="ev-btn-share" onclick="shareEvent('${ev.circuits?.nom}')">⎘</button>
    </div>
  </div>`
}

// ═══════════════════════════════════════════════════════════════════
//  ACTIONS GLOBALES (appelées depuis le HTML via onclick)
// ═══════════════════════════════════════════════════════════════════
window.doVote = async (eventId, btn) => {
  btn.disabled = true
  btn.textContent = '…'

  try {
    await voteForEvent(eventId)
    // Refresh les données de cet event
    const { data } = await supabase
      .from('events')
      .select('nb_votes')
      .eq('id', eventId)
      .single()

    const nb  = data?.nb_votes ?? 0
    const pct = Math.min(100, Math.round(nb / SEUIL_VOTES * 100))

    const num  = document.getElementById(`vnum-${eventId}`)
    const fill = document.getElementById(`vfill-${eventId}`)
    const hint = document.getElementById(`vhint-${eventId}`)
    const badge= document.getElementById(`badge-${eventId}`)

    if (num) num.textContent = nb
    if (fill) {
      fill.style.width = pct + '%'
      fill.className = `ev-vote-fill${pct>=100?' done':pct>=60?' almost':''}`
    }
    if (hint) {
      hint.className = `ev-vote-hint ${pct>=100?'done':pct>=60?'almost':'normal'}`
      hint.textContent = pct>=100
        ? '✅ Seuil atteint — validation en cours'
        : pct>=60
          ? `⚡ Proche — encore ${SEUIL_VOTES-nb} vote${SEUIL_VOTES-nb>1?'s':''}`
          : `${SEUIL_VOTES-nb} vote${SEUIL_VOTES-nb>1?'s':''} pour valider`
    }
    if (pct >= 100 && badge) {
      badge.className = 'ev-badge open'
      badge.textContent = 'Proche validation'
    }

    btn.classList.add('voted')
    btn.textContent = '✓ Votre vote est enregistré'
    toast('Vote enregistré ! Merci 🏁')

  } catch (err) {
    btn.disabled = false
    btn.textContent = '✋ Voter pour cette date'
    toast(err.message, 'err')
  }
}

// ── Modal inscription ─────────────────────────────────────────────
let _modal = {}
window.openModal = (eventId, meta) => {
  _modal = { eventId, ...meta, hasVeh: false, hasCoach: false }
  document.getElementById('mo-title').textContent = meta.titre
  document.getElementById('mo-sub').textContent   = meta.type + ' · JB EMERIC'
  document.getElementById('recap-base').textContent = fmtPrix(meta.prix) + ' €'
  document.getElementById('mo-alert').style.display = 'none'
  document.getElementById('mo-form').style.display  = ''
  document.getElementById('mo-confirm').style.display = 'none'
  // Reset checks
  document.querySelectorAll('.mo-check').forEach(c => {
    c.classList.remove('checked')
    const box = c.querySelector('.mo-checkbox')
    if (box) box.textContent = ''
  })
  document.querySelectorAll('.mo-veh').forEach((v,i) => v.classList.toggle('sel', i===0))
  document.getElementById('mo-coaching')?.classList.remove('sel')
  updateRecap()
  document.getElementById('mo-overlay').classList.add('open')
  document.body.style.overflow = 'hidden'
}

window.closeModal = () => {
  document.getElementById('mo-overlay').classList.remove('open')
  document.body.style.overflow = ''
}
window.closeModalOutside = e => {
  if (e.target === document.getElementById('mo-overlay')) window.closeModal()
}
window.selectVeh = (el, isLoc) => {
  document.querySelectorAll('.mo-veh').forEach(v => v.classList.remove('sel'))
  el.classList.add('sel')
  _modal.hasVeh = !!isLoc
  updateRecap()
}
window.toggleCheck = (el) => {
  el.classList.toggle('checked')
  const box = el.querySelector('.mo-checkbox')
  if (box) box.textContent = el.classList.contains('checked') ? '✓' : ''
}
window.toggleCoaching = () => {
  const opt = document.getElementById('mo-coaching')
  opt?.classList.toggle('sel')
  _modal.hasCoach = opt?.classList.contains('sel') ?? false
  updateRecap()
}

function updateRecap() {
  const total = _modal.prix
    + (_modal.hasVeh   ? (_modal.prix_location || 0) : 0)
    + (_modal.hasCoach ? (_modal.prix_coaching || 0) : 0)
  const el = document.getElementById('recap-total')
  if (el) el.textContent = fmtPrix(total) + ' €'
  const rv = document.getElementById('recap-veh-row')
  const rc = document.getElementById('recap-coach-row')
  if (rv) rv.style.display = (_modal.hasVeh && _modal.prix_location) ? '' : 'none'
  if (rc) rc.style.display = (_modal.hasCoach && _modal.prix_coaching) ? '' : 'none'
}

window.submitInscription = async () => {
  const alertEl = document.getElementById('mo-alert')
  const btn = document.getElementById('mo-submit')

  // Vérif assurance obligatoire
  const assur = document.querySelector('.mo-check[onclick*="check_assurance"]')
  if (!assur?.classList.contains('checked')) {
    showMoAlert(alertEl, '⚠ L\'assurance RC est obligatoire.')
    return
  }

  btn.disabled = true
  btn.textContent = '…'
  alertEl.style.display = 'none'

  const user = await getUser()
  const payload = {
    eventId:      _modal.eventId,
    nom:          user ? user.user_metadata?.nom    : (document.getElementById('mo-nom')?.value.trim() ?? ''),
    prenom:       user ? user.user_metadata?.prenom : (document.getElementById('mo-prenom')?.value.trim() ?? ''),
    email:        user ? user.email                 : (document.getElementById('mo-email')?.value.trim() ?? ''),
    tel:          document.getElementById('mo-tel')?.value.trim() ?? '',
    optCoaching:  _modal.hasCoach,
    optLocation:  _modal.hasVeh,
    checklist: {
      assurance: !!document.querySelector('.mo-check[onclick*="check_assurance"]')?.classList.contains('checked'),
      casque:    !!document.querySelector('.mo-check[onclick*="check_casque"]')?.classList.contains('checked'),
      crochet:   !!document.querySelector('.mo-check[onclick*="check_crochet"]')?.classList.contains('checked'),
      reglement: !!document.querySelector('.mo-check[onclick*="check_reglement"]')?.classList.contains('checked'),
    }
  }

  if (!payload.nom || !payload.prenom || !payload.email) {
    showMoAlert(alertEl, '⚠ Nom, prénom et email sont obligatoires.')
    btn.disabled = false
    btn.textContent = 'Confirmer l\'inscription →'
    return
  }

  try {
    const result = await createInscription(payload)
    document.getElementById('mo-form').style.display    = 'none'
    document.getElementById('mo-confirm').style.display = 'flex'
    document.getElementById('mo-ref').textContent = 'Référence : ' + result.ref
    // Mettre à jour un dot
    const dots = document.getElementById(`dots-${_modal.eventId}`)
    const free = dots?.querySelector('.ev-dot:not(.taken)')
    if (free) free.classList.add('taken')
    toast('Inscription confirmée ! 🏁')
  } catch (err) {
    showMoAlert(alertEl, '⚠ ' + err.message)
    btn.disabled = false
    btn.textContent = 'Confirmer l\'inscription →'
  }
}

function showMoAlert(el, msg) {
  if (!el) return
  el.className = 'mo-alert mo-alert-err'
  el.textContent = msg
  el.style.display = 'block'
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// ── Partage ───────────────────────────────────────────────────────
window.shareEvent = name => {
  if (navigator.share) {
    navigator.share({ title: name + ' — JB EMERIC', url: location.href })
  } else {
    navigator.clipboard?.writeText(location.href)
    toast('Lien copié !')
  }
}

// ── Tabs ──────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.sr-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sr-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      const f = tab.dataset.filter || 'all'
      document.getElementById('section-open').style.display = (f==='all'||f==='open') ? '' : 'none'
      document.getElementById('section-vote').style.display = (f==='all'||f==='vote') ? '' : 'none'
    })
  })
}

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(d) {
  return d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}
function fmtPrix(n) {
  return Number(n).toLocaleString('fr-FR')
}
function skeletons(n) {
  return Array(n).fill('<div class="ev-card" style="min-height:280px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;animation:shimmer 1.5s infinite"></div>').join('')
}
function emptyState(msg) {
  return `<div class="ev-empty-state" style="grid-column:1/-1;text-align:center;padding:44px;color:rgba(255,255,255,.3);font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase">${msg}</div>`
}
function toast(msg, type='ok') {
  const t = document.getElementById('tr-toast')
  if (!t) return
  t.textContent = msg
  t.className = `show ${type}`
  clearTimeout(t._to)
  t._to = setTimeout(() => t.className = '', 3500)
}
