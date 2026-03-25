/**
 * sync-mirror.js — JB EMERIC
 * ═══════════════════════════════════════════════════════════════════
 * Système de miroir intelligent pour index.html
 * Aspire les sections clés des pages piliers et les injecte
 * dynamiquement dans les conteneurs de l'index.
 *
 * Architecture :
 *  - Académie   → extrait #portes     de academie.html
 *  - Coaching   → extrait #formules   de coaching.html (2 panels)
 *  - Track      → Supabase : 3 prochaines sessions
 *  - Paddock    → extrait #une        de paddock.html
 *
 * Chaque section a un conteneur id="mirror-[nom]" sur l'index.
 * Modifier la source → l'index se met à jour au prochain chargement.
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Configuration ──────────────────────────────────────────────────
const MIRROR_CONFIG = {
  academie: {
    url:       'academie.html',
    sourceId:  'portes',          // id="portes" dans academie.html
    targetId:  'mirror-academie', // id="mirror-academie" dans index.html
    transform: transformAcademie,
  },
  coaching: {
    url:       'coaching.html',
    sourceId:  'formules',
    targetId:  'mirror-coaching',
    transform: transformCoaching,
  },
  paddock: {
    url:       'paddock.html',
    sourceId:  'une',
    targetId:  'mirror-paddock',
    transform: transformPaddock,
  },
  // Track : pas de fetch HTML, données live Supabase
  track: {
    targetId:  'mirror-track',
    transform: null, // géré séparément
  },
}

// ── Supabase (optionnel — mettre les clés si Supabase activé) ──────
const SB_URL  = null  // 'https://XXXXX.supabase.co'
const SB_ANON = null  // 'eyJ...'

// ── Cache en mémoire (évite les fetch répétés dans la même session) ─
const _cache = {}

// ═══════════════════════════════════════════════════════════════════
//  POINT D'ENTRÉE
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  mirrorAcademie()
  mirrorCoaching()
  mirrorTrack()
  mirrorPaddock()
})

// ═══════════════════════════════════════════════════════════════════
//  FETCH HELPER — parse HTML distant
// ═══════════════════════════════════════════════════════════════════
async function fetchSection(url, sectionId) {
  const cacheKey = `${url}#${sectionId}`
  if (_cache[cacheKey]) return _cache[cacheKey]

  try {
    const res  = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`${url} → ${res.status}`)
    const html = await res.text()

    // Parser le HTML dans un document fantôme
    const parser = new DOMParser()
    const doc    = parser.parseFromString(html, 'text/html')
    const el     = doc.getElementById(sectionId)

    if (!el) throw new Error(`#${sectionId} introuvable dans ${url}`)

    _cache[cacheKey] = el
    return el
  } catch (err) {
    console.warn(`[mirror] ${url}#${sectionId} :`, err.message)
    return null
  }
}

// ── Injecter dans le conteneur cible ───────────────────────────────
function injectInto(targetId, html, label = '') {
  const target = document.getElementById(targetId)
  if (!target) return

  target.classList.remove('mirror-loading')
  target.classList.add('mirror-loaded')

  if (typeof html === 'string') {
    target.innerHTML = html
  } else if (html instanceof Element) {
    target.innerHTML = ''
    target.appendChild(html)
  }
}

function setLoading(targetId) {
  const target = document.getElementById(targetId)
  if (!target) return
  target.classList.add('mirror-loading')
  target.innerHTML = `
    <div class="mirror-skeleton">
      <div class="ms-bar ms-w80"></div>
      <div class="ms-bar ms-w60"></div>
      <div class="ms-bar ms-w70"></div>
    </div>`
}

function setError(targetId, msg = 'Contenu temporairement indisponible') {
  const target = document.getElementById(targetId)
  if (!target) return
  target.classList.remove('mirror-loading')
  target.innerHTML = `<div class="mirror-error">${msg} — <a href="${getPageUrl(targetId)}">Voir la page →</a></div>`
}

function getPageUrl(targetId) {
  const map = {
    'mirror-academie': 'academie.html',
    'mirror-coaching': 'coaching.html',
    'mirror-track':    'track.html',
    'mirror-paddock':  'paddock.html',
  }
  return map[targetId] || 'index.html'
}

// ═══════════════════════════════════════════════════════════════════
//  MIROIR ACADÉMIE — extrait les 3 portes (Enfant / Adulte / Challenge)
// ═══════════════════════════════════════════════════════════════════
async function mirrorAcademie() {
  const cfg = MIRROR_CONFIG.academie
  setLoading(cfg.targetId)

  const section = await fetchSection(cfg.url, cfg.sourceId)
  if (!section) { setError(cfg.targetId); return }

  injectInto(cfg.targetId, transformAcademie(section))
}

function transformAcademie(section) {
  // Extraire les 3 portes (divs .porte)
  const portes = section.querySelectorAll('.porte')
  if (!portes.length) return section.outerHTML

  const cards = Array.from(portes).map(porte => {
    const tag     = porte.querySelector('.porte-tag')?.textContent.trim()    ?? ''
    const title   = porte.querySelector('.porte-title')?.textContent.trim()  ?? ''
    const desc    = porte.querySelector('.porte-desc')?.textContent.trim()   ?? ''
    const img     = porte.querySelector('img')?.src                           ?? ''
    const href    = porte.getAttribute('onclick')?.match(/'([^']+)'/)?.[1]   ?? 'academie.html'
    const badge   = porte.querySelector('.porte-badge')?.textContent.trim()  ?? ''

    return `
      <a href="${href}" class="ov-card mirror-ov-card" data-source="academie">
        <div class="ov-card-img">
          ${img ? `<img src="${img}" alt="${title}" loading="lazy">` : ''}
          ${badge ? `<span class="ov-card-badge">${badge}</span>` : ''}
        </div>
        <div class="ov-card-body">
          ${tag ? `<div class="ov-card-num">${tag}</div>` : ''}
          <div class="ov-card-name">${title}</div>
          ${desc ? `<p class="ov-card-sub">${desc}</p>` : ''}
          <span class="ov-card-link">Découvrir →</span>
        </div>
      </a>`
  }).join('')

  return `<div class="ov-cards rv d1 mirror-cards">${cards}</div>`
}

// ═══════════════════════════════════════════════════════════════════
//  MIROIR COACHING — extrait les 2 panels (Circuit / Compétition)
// ═══════════════════════════════════════════════════════════════════
async function mirrorCoaching() {
  const cfg = MIRROR_CONFIG.coaching
  setLoading(cfg.targetId)

  const section = await fetchSection(cfg.url, cfg.sourceId)
  if (!section) { setError(cfg.targetId); return }

  injectInto(cfg.targetId, transformCoaching(section))
}

function transformCoaching(section) {
  const panels = section.querySelectorAll('.panel')
  if (!panels.length) return section.outerHTML

  const cards = Array.from(panels).map((panel, i) => {
    const tag    = panel.querySelector('.flyer-tag')?.textContent.trim()      ?? `Offre 0${i+1}`
    const name   = panel.querySelector('.flyer-name')?.innerHTML              ?? ''
    const hook   = panel.querySelector('.flyer-hook')?.textContent.trim()     ?? ''
    const cta    = panel.querySelector('.flyer-cta')?.textContent.trim()      ?? 'En savoir plus'
    const isPro  = panel.classList.contains('panel-r')
    const href   = 'coaching.html'

    return `
      <a href="${href}" class="ov-card mirror-ov-card mirror-coaching-card ${isPro?'mirror-pro':''}"
         data-source="coaching">
        <div class="ov-card-body">
          <div class="ov-card-num ${isPro?'gold':''}">${tag}</div>
          <div class="ov-card-name coaching-name">${name}</div>
          ${hook ? `<p class="ov-card-sub">${hook}</p>` : ''}
          <span class="ov-card-link">${cta} →</span>
        </div>
      </a>`
  }).join('')

  return `<div class="ov-cards rv d1 mirror-cards mirror-coaching-cards">${cards}</div>`
}

// ═══════════════════════════════════════════════════════════════════
//  MIROIR TRACK — données live Supabase (ou fallback statique)
// ═══════════════════════════════════════════════════════════════════
async function mirrorTrack() {
  const targetId = MIRROR_CONFIG.track.targetId
  setLoading(targetId)

  // Si Supabase configuré → données live
  if (SB_URL && SB_ANON) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(
        `${SB_URL}/rest/v1/events?select=id,date_event,type,prix,status,nb_places,nb_inscrits,circuits(nom,region)&status=in.(Open,Potential)&visible_site=eq.true&date_event=gte.${today}&order=date_event.asc&limit=3`,
        { headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` } }
      )
      const events = await res.json()
      if (events?.length) {
        injectInto(targetId, renderTrackCards(events))
        return
      }
    } catch (e) {
      console.warn('[mirror-track] Supabase:', e.message)
    }
  }

  // Fallback — données statiques depuis site-data.js ou message
  injectInto(targetId, renderTrackFallback())
}

function renderTrackCards(events) {
  const cards = events.map(ev => {
    const date    = new Date(ev.date_event)
    const isOpen  = ev.status === 'Open'
    const isFull  = ev.nb_inscrits >= ev.nb_places
    const restant = ev.nb_places - ev.nb_inscrits
    const pct     = Math.round(ev.nb_inscrits / ev.nb_places * 100)

    const badgeClass = isFull  ? 'ov-card-badge-full'
                     : isOpen  ? 'ov-card-badge-y'
                     :           'ov-card-badge'
    const badgeText  = isFull  ? 'Complet'
                     : isOpen  ? 'Ouvert'
                     :           'Vote'

    return `
      <a href="track.html#ev-${ev.id}" class="ov-card mirror-ov-card mirror-track-card"
         data-source="track">
        <div class="ov-card-body">
          <span class="ov-card-badge ${badgeClass}" style="position:static;margin-bottom:8px">${badgeText}</span>
          <div class="ov-card-num track-date">
            ${date.getDate()} ${date.toLocaleDateString('fr-FR',{month:'short'})}
          </div>
          <div class="ov-card-name">${ev.circuits?.nom ?? '—'}</div>
          <div class="ov-card-sub">${ev.type} · ${ev.circuits?.region ?? ''}</div>
          ${isOpen && !isFull ? `
          <div class="mirror-track-bar" style="margin-top:8px">
            <div class="mirror-track-fill" style="width:${pct}%"></div>
            <span class="mirror-track-places">${restant} place${restant>1?'s':''}</span>
          </div>` : ''}
          <div class="ov-card-price y" style="margin-top:8px">${Number(ev.prix).toLocaleString('fr-FR')} €</div>
        </div>
      </a>`
  }).join('')

  return `<div class="ov-cards rv d1 mirror-cards">${cards}</div>`
}

function renderTrackFallback() {
  // Utilise les données de site-data.js si disponibles
  if (typeof SITE_DATA !== 'undefined' && SITE_DATA.trackdays?.length) {
    const upcoming = SITE_DATA.trackdays
      .filter(d => d.status === 'Open' || d.status === 'Potential')
      .slice(0, 3)
    if (upcoming.length) return renderTrackCards(upcoming.map(d => ({
      id: d.id, date_event: d.date, type: d.type, prix: d.prix,
      status: d.status, nb_places: d.places, nb_inscrits: d.inscrits,
      circuits: { nom: d.circuit, region: d.region }
    })))
  }

  return `
    <div class="ov-cards rv d1 mirror-cards">
      <a href="track.html" class="ov-card mirror-ov-card mirror-track-cta">
        <div class="ov-card-body" style="text-align:center;padding:32px 20px">
          <div class="ov-card-name">Sessions 2026</div>
          <p class="ov-card-sub">Voir toutes les prochaines dates disponibles</p>
          <span class="ov-card-link" style="margin-top:12px">Voir les sessions →</span>
        </div>
      </a>
    </div>`
}

// ═══════════════════════════════════════════════════════════════════
//  MIROIR PADDOCK — extrait la section "une" (newsletter)
// ═══════════════════════════════════════════════════════════════════
async function mirrorPaddock() {
  const cfg = MIRROR_CONFIG.paddock
  setLoading(cfg.targetId)

  const section = await fetchSection(cfg.url, cfg.sourceId)
  if (!section) { setError(cfg.targetId); return }

  injectInto(cfg.targetId, transformPaddock(section))
}

function transformPaddock(section) {
  // Extraire les articles/événements de la section "une"
  // Chercher nl-event-poster, yt-card, ou article items
  const items = []

  // Dernières nouvelles (nl-items)
  section.querySelectorAll('.nl-item, .nl-event-poster, .art-card').forEach(item => {
    const title = item.querySelector('h3, .nl-item-title, .art-title')?.textContent.trim()
    const desc  = item.querySelector('p, .nl-item-body, .art-desc')?.textContent.trim()
    const img   = item.querySelector('img')?.src
    const href  = item.closest('a')?.href || item.querySelector('a')?.href || 'paddock.html'

    if (title) items.push({ title, desc, img, href })
  })

  // Si rien trouvé, extraire les textes principaux de la section une
  if (!items.length) {
    const subtitle = section.querySelector('.nl-subtitle')?.textContent.trim()
    const label    = section.querySelector('.nl-label')?.textContent.trim()
    const date     = section.querySelector('.nl-date')?.textContent.trim()

    return `
      <div class="mirror-paddock-preview">
        <div class="mpp-label">${label ?? 'Le Paddock'}</div>
        <div class="mpp-title">${subtitle ?? 'Toute l\'actu en un coup d\'œil'}</div>
        ${date ? `<div class="mpp-date">${date}</div>` : ''}
        <a href="paddock.html" class="ov-card-link" style="display:inline-block;margin-top:16px">
          Lire l'édition →
        </a>
      </div>`
  }

  // Construire les cards à partir des items trouvés
  const cards = items.slice(0, 3).map(item => `
    <a href="${item.href}" class="ov-card mirror-ov-card" data-source="paddock">
      ${item.img ? `<div class="ov-card-img"><img src="${item.img}" alt="${item.title}" loading="lazy"></div>` : ''}
      <div class="ov-card-body">
        <div class="ov-card-name">${item.title}</div>
        ${item.desc ? `<p class="ov-card-sub">${item.desc.substring(0,100)}…</p>` : ''}
        <span class="ov-card-link">Lire →</span>
      </div>
    </a>`).join('')

  return `<div class="ov-cards rv d1 mirror-cards">${cards}</div>`
}

// ═══════════════════════════════════════════════════════════════════
//  CSS INJECTÉ — styles pour les états miroir
// ═══════════════════════════════════════════════════════════════════
const MIRROR_CSS = `
/* ── Mirror states ── */
.mirror-loading { opacity: .4; transition: opacity .3s }
.mirror-loaded  { opacity: 1;  transition: opacity .4s }
.mirror-error   {
  font-family: 'DM Mono', monospace;
  font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
  color: rgba(255,255,255,.3); padding: 24px 0;
}
.mirror-error a { color: rgba(255,207,0,.5); text-decoration: none }

/* ── Skeleton ── */
.mirror-skeleton { display:flex; flex-direction:column; gap:10px; padding:8px 0 }
.ms-bar {
  height: 12px; border-radius: 4px;
  background: linear-gradient(90deg,
    rgba(255,255,255,.06) 0%,
    rgba(255,255,255,.12) 50%,
    rgba(255,255,255,.06) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
.ms-w80 { width:80% } .ms-w60 { width:60% } .ms-w70 { width:70% }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Cards miroir ── */
.mirror-ov-card { text-decoration:none }
.mirror-coaching-card { background: rgba(10,61,145,.08); border:1px solid rgba(10,61,145,.15) }
.mirror-coaching-card.mirror-pro { background:rgba(245,208,97,.06); border-color:rgba(245,208,97,.15) }
.mirror-coaching-card .coaching-name { font-family:'Bebas Neue'; font-size:clamp(28px,5vw,42px); line-height:.9; letter-spacing:-1px }
.ov-card-num.gold {
  background: linear-gradient(135deg,#F5D061,#C8860A);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.ov-card-link {
  display:inline-block; margin-top:10px;
  font-family:'DM Mono'; font-size:9px; letter-spacing:2px; text-transform:uppercase;
  color:rgba(255,207,0,.6); transition:color .15s;
}
.mirror-ov-card:hover .ov-card-link { color:#FFCF00 }

/* ── Track cards ── */
.mirror-track-card { border-top:3px solid #22c55e }
.track-date { font-family:'Bebas Neue'; font-size:32px; letter-spacing:-1px; line-height:1; color:inherit }
.mirror-track-bar {
  height:4px; background:rgba(255,255,255,.1); border-radius:2px; overflow:hidden;
  display:flex; align-items:center; gap:8px;
}
.mirror-track-fill { height:100%; background:linear-gradient(90deg,#22c55e,#16a34a); border-radius:2px; transition:width 1s }
.mirror-track-places { font-family:'DM Mono'; font-size:8px; color:rgba(255,255,255,.4); white-space:nowrap }
.ov-card-badge-full { background:rgba(239,68,68,.15); color:#f87171; border:1px solid rgba(239,68,68,.3) }

/* ── Paddock preview ── */
.mirror-paddock-preview { padding:8px 0 }
.mpp-label { font-family:'DM Mono'; font-size:9px; letter-spacing:3px; text-transform:uppercase; color:rgba(255,207,0,.5); margin-bottom:8px }
.mpp-title { font-family:'Bebas Neue'; font-size:clamp(24px,4vw,36px); color:#fff; line-height:1.1; margin-bottom:6px }
.mpp-date  { font-family:'DM Mono'; font-size:10px; letter-spacing:1px; color:rgba(255,255,255,.3) }
`

// Injecter le CSS une seule fois
;(function injectCSS() {
  if (document.getElementById('mirror-css')) return
  const style = document.createElement('style')
  style.id = 'mirror-css'
  style.textContent = MIRROR_CSS
  document.head.appendChild(style)
})()
