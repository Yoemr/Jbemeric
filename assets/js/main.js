// ═══════════════════════════════════════════════════════════════════
//  main.js — JB EMERIC · Index dynamique
//  Affiche les 3 prochaines sessions + état nav auth
// ═══════════════════════════════════════════════════════════════════

import { getNextSessions, updateNavAuth, supabase } from './assets/js/supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
  updateNavAuth()
  await loadNextSessions()
})

// ── 3 prochaines sessions ───────────────────────────────────────────
async function loadNextSessions() {
  const container = document.getElementById('next-sessions')
  if (!container) return

  // Skeleton loader
  container.innerHTML = `
    <div class="ns-skeleton"></div>
    <div class="ns-skeleton"></div>
    <div class="ns-skeleton"></div>
  `

  try {
    const sessions = await getNextSessions(3)

    if (!sessions.length) {
      container.innerHTML = `
        <div class="ns-empty">
          <span>Aucune session programmée pour le moment.</span>
          <a href="track.html" class="ns-link">Voir toutes les dates →</a>
        </div>
      `
      return
    }

    container.innerHTML = sessions.map(ev => {
      const date     = new Date(ev.date_event)
      const jour     = date.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
      const isOpen   = ev.status === 'Open'
      const isFull   = ev.nb_inscrits >= ev.nb_places
      const restant  = ev.nb_places - ev.nb_inscrits
      const pct      = Math.round(ev.nb_inscrits / ev.nb_places * 100)

      const badgeClass = isFull ? 'ns-badge-full' : isOpen ? 'ns-badge-open' : 'ns-badge-vote'
      const badgeText  = isFull ? 'Complet' : isOpen ? 'Ouvert' : 'Vote'

      return `
        <a class="ns-card" href="track.html#ev-${ev.id}">
          <div class="ns-card-top">
            <div class="ns-date">
              <div class="ns-day">${date.getDate()}</div>
              <div class="ns-month">${date.toLocaleDateString('fr-FR',{month:'short'})}</div>
            </div>
            <div class="ns-info">
              <div class="ns-circuit">${ev.circuits?.nom ?? '—'}</div>
              <div class="ns-type">${ev.type} · ${ev.circuits?.region ?? ''}</div>
            </div>
            <span class="ns-badge ${badgeClass}">${badgeText}</span>
          </div>
          ${isOpen && !isFull ? `
          <div class="ns-bar-wrap">
            <div class="ns-bar">
              <div class="ns-bar-fill" style="width:${pct}%"></div>
            </div>
            <span class="ns-places">${restant} place${restant > 1 ? 's' : ''}</span>
          </div>` : ''}
          <div class="ns-prix">${Number(ev.prix).toLocaleString('fr-FR')} €</div>
        </a>
      `
    }).join('')

  } catch (err) {
    console.error('Sessions:', err)
    container.innerHTML = `
      <div class="ns-empty">
        <a href="track.html" class="ns-link">Voir les prochaines sessions →</a>
      </div>
    `
  }
}
