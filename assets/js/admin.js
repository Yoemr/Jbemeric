// admin.js — JB EMERIC
// Dashboard admin : gestion événements, threads, documents
// Chargé dans admin.html (réservé admins connectés)

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SB_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
const SB_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
const supabase = createClient(SB_URL, SB_ANON)

// Fonctions auth
async function getUser() {
  // getUser() valide le token auprès du serveur Supabase (pas juste le cache local)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}
async function sbLogout() {
  await supabase.auth.signOut()
  window.location.href = 'login.html'
}

// Éditeur de contenu — non disponible (editor.js supprimé)
// Le contenu est éditable directement sur le site via live-editor.js
window.saveAllPending = function() { toast('Utilisez le mode édition sur le site', 'info') }
window.filterEditor   = function() {}

// ═══════════════════════════════════════════════════════════════════
//  AUTH GUARD — bloquer les non-admins
// ═══════════════════════════════════════════════════════════════════
const ALLOWED_ROLES = ['admin', 'moderateur']
let currentUser = null
let currentRole = null

;(async () => {
  const user = await getUser()
  if (!user) return redirect('login.html')

  const role = user.user_metadata?.role ?? 'client'
  if (!ALLOWED_ROLES.includes(role)) return redirect('index.html')

  currentUser = user
  currentRole = role

  // Remplir la sidebar
  const initials = ((user.user_metadata?.prenom?.[0] ?? '') +
                    (user.user_metadata?.nom?.[0] ?? '')).toUpperCase() || '?'
  document.getElementById('sb-av').textContent      = initials
  document.getElementById('sb-uname').textContent   = (user.user_metadata?.prenom ?? '') + ' ' + (user.user_metadata?.nom ?? '')
  document.getElementById('sb-urole').textContent   = role.toUpperCase()
  document.getElementById('sb-role-label').textContent = role === 'admin' ? 'ADMIN' : 'MODÉRATEUR'

  // Afficher les éléments admin-only
  if (role === 'admin') {
    document.getElementById('admin-only-group').style.display = ''
    document.getElementById('btn-users').style.display        = ''
  }

  // Charger les données initiales
  await Promise.all([loadKPIs(), loadEvents(), loadVotes(), loadInscriptions()])
  initEditor(supabase, currentRole)
  startClock()
})()

// ═══════════════════════════════════════════════════════════════════
//  ÉVÉNEMENTS — CRUD
// ═══════════════════════════════════════════════════════════════════
async function loadEvents() {
  const statusFilter = document.getElementById('filter-status')?.value || ''
  let query = supabase
    .from('events')
    .select('id,date_event,type,status,prix,nb_places,nb_inscrits,visible_site,circuit_id,circuits(nom)')
    .order('date_event', { ascending: true })
    .limit(50)

  if (statusFilter) query = query.eq('status', statusFilter)

  const { data, error } = await query
  if (error) { toast('Erreur chargement events: ' + error.message, 'err'); return }

  const tbody = document.querySelector('#v-sessions table tbody')
  if (!tbody) return

  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

  tbody.innerHTML = (data||[]).map(ev => {
    const d = new Date(ev.date_event)
    const dateStr = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
    const circuit = ev.circuits?.nom || '—'
    const badge = badgeStatus(ev.status)
    const vis = ev.visible_site
      ? '<span style="color:#4ade80;font-size:11px">✓ Visible</span>'
      : '<span style="color:rgba(255,255,255,.3);font-size:11px">Masqué</span>'

    return `<tr id="erow-${ev.id}">
      <td class="td-mono">${dateStr}</td>
      <td>${ev.type || '—'}</td>
      <td>${circuit}</td>
      <td>${badge}</td>
      <td class="td-mono">${ev.prix ? ev.prix + ' €' : '—'}</td>
      <td class="td-mono">${ev.nb_inscrits || 0} / ${ev.nb_places || 10}</td>
      <td>${vis}</td>
      <td><div class="td-acts">
        <button class="btn btn-sm" onclick="toggleEventVisible('${ev.id}', ${!vis})">
          ${vis ? '👁 Masquer' : '👁 Publier'}
        </button>
        <button class="btn btn-sm btn-err" onclick="deleteEvent('${ev.id}')">✕</button>
      </div></td>
    </tr>`
  }).join('') || `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">Aucun événement</td></tr>`
}

window.filterEventsTable = function(q) {
  const rows = document.querySelectorAll('#v-sessions table tbody tr')
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none'
  })
}

window.toggleEventVisible = async function(id, visible) {
  const { error } = await supabase.from('events').update({ visible_site: visible }).eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast(visible ? 'Event publié ✓' : 'Event masqué', 'ok')
  loadEvents()
}

window.deleteEvent = async function(id, btn) {
  if (!confirm('Supprimer cet événement ? Cette action est irréversible.')) return
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast('Événement supprimé', 'ok')
  const row = document.getElementById('erow-' + id)
  if (row) row.remove()
  loadKPIs()
}

// ═══════════════════════════════════════════════════════════════════
//  FORUM — MODÉRATION
// ═══════════════════════════════════════════════════════════════════
window.togglePin = async function(id, pinned) {
  const { error } = await supabase.from('forum_threads').update({ pinned }).eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast(pinned ? 'Thread épinglé ✓' : 'Thread désépinglé', 'ok')
  loadForumMod()
}

window.toggleThreadVisible = async function(id, visible) {
  const { error } = await supabase.from('forum_threads').update({ visible }).eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast(visible ? 'Thread visible ✓' : 'Thread masqué', 'ok')
  loadForumMod()
}

window.deleteThread = async function(id) {
  if (!confirm('Supprimer ce thread et toutes ses réponses ?')) return
  const { error } = await supabase.from('forum_threads').delete().eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast('Thread supprimé', 'ok')
  const row = document.getElementById('ft-' + id)
  if (row) row.remove()
}

// ═══════════════════════════════════════════════════════════════════
//  DOCS — CRUD
// ═══════════════════════════════════════════════════════════════════
window.saveDoc = async function() {
  const title    = document.getElementById('doc-title')?.value?.trim()
  const category = document.getElementById('doc-cat')?.value || 'meca'
  const url      = document.getElementById('doc-url')?.value?.trim()
  const keywords = document.getElementById('doc-keywords')?.value?.trim() || ''
  const type     = document.getElementById('doc-type')?.value || 'pdf'

  if (!title || !url) { toast('Titre et URL obligatoires', 'err'); return }

  const size = document.getElementById('doc-size')?.value?.trim() || ''
  const { error } = await supabase.from('docs').insert({
    title, category, file_url: url, keywords, type, file_size: size, visible: true
  })
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast('Document ajouté ✓', 'ok')
  // Vider le formulaire
  ;['doc-title','doc-url','doc-keywords'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
}

// ═══════════════════════════════════════════════════════════════════
//  INSCRIPTIONS — LISTE COMPLÈTE
// ═══════════════════════════════════════════════════════════════════
var _inscrPage = 0
var INSCR_PER_PAGE = 20

async function loadInscriptions() {
  var statusFilter = document.getElementById('inscr-filter-status')?.value || ''
  var tbody = document.getElementById('inscriptions-tbody')
  if (!tbody) return

  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px;font-family:'DM Mono';font-size:9px">Chargement…</td></tr>'

  var query = supabase
    .from('inscriptions')
    .select('id,created_at,user_name,prenom,nom,email,telephone,coaching_requested,statut,events(date_event,type,circuits(nom))')
    .order('created_at', { ascending: false })
    .limit(INSCR_PER_PAGE)

  if (statusFilter) query = query.eq('statut', statusFilter)

  const { data, error } = await query
  if (error) { toast('Erreur: ' + error.message, 'err'); return }

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:24px;font-family:'DM Mono';font-size:10px">Aucune inscription pour l'instant.</td></tr>'
    return
  }

  var MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']

  tbody.innerHTML = data.map(ins => {
    var d = new Date(ins.created_at)
    var dateStr = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
    var name = ins.prenom && ins.nom ? ins.prenom + ' ' + ins.nom : (ins.user_name || '—')
    var ev = ins.events
    var evDate = ev ? new Date(ev.date_event).toLocaleDateString('fr-FR', {day:'numeric',month:'short'}) : '—'
    var evType = ev ? (ev.type || '—') : '—'
    var circuit = ev && ev.circuits ? ev.circuits.nom : '—'
    var coaching = ins.coaching_requested ? '<span style="color:#FFCF00">✓ Oui</span>' : '<span style="color:rgba(255,255,255,.3)">Non</span>'
    var statutColor = ins.statut === 'confirme' ? '#4ade80' : ins.statut === 'annule' ? '#f87171' : '#FFCF00'
    var statutLabel = ins.statut === 'confirme' ? 'Confirmé' : ins.statut === 'annule' ? 'Annulé' : 'En attente'

    return `<tr>
      <td class="td-mono" style="font-size:10px">${dateStr}</td>
      <td style="font-weight:500">${name}</td>
      <td class="td-mono" style="font-size:9px">${ins.email || '—'}</td>
      <td class="td-mono" style="font-size:9px">${ins.telephone || '—'}</td>
      <td style="font-size:10px">${evDate} · ${evType}</td>
      <td style="font-size:10px">${circuit}</td>
      <td style="text-align:center">${coaching}</td>
      <td><span style="font-family:'DM Mono';font-size:9px;color:${statutColor};padding:2px 6px;background:${statutColor}22;border-radius:3px">${statutLabel}</span></td>
      <td><div class="td-acts">
        <button class="btn btn-ok btn-sm" onclick="confirmInscr('${ins.id}')">✓</button>
        <button class="btn btn-err btn-sm" onclick="cancelInscr('${ins.id}')">✕</button>
      </div></td>
    </tr>`
  }).join('')

  // Mettre à jour le pill
  var pill = document.getElementById('pill-inscr')
  if (pill) pill.textContent = data.length

  // Pagination info
  var pag = document.getElementById('inscr-pagination')
  if (pag) pag.textContent = data.length + ' inscription' + (data.length > 1 ? 's' : '') + ' affichée' + (data.length > 1 ? 's' : '')
}

window.confirmInscr = async function(id) {
  const { error } = await supabase.from('inscriptions').update({ statut: 'confirme' }).eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast('Inscription confirmée ✓', 'ok')
  loadInscriptions()
}

window.cancelInscr = async function(id) {
  if (!confirm('Annuler cette inscription ?')) return
  const { error } = await supabase.from('inscriptions').update({ statut: 'annule' }).eq('id', id)
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast('Inscription annulée', 'ok')
  loadInscriptions()
}

window.exportInscriptions = async function() {
  const { data } = await supabase
    .from('inscriptions')
    .select('created_at,user_name,prenom,nom,email,telephone,coaching_requested,statut,events(date_event,type,circuits(nom))')
    .order('created_at', { ascending: false })

  if (!data || !data.length) { toast('Aucune donnée à exporter', 'info'); return }

  var header = 'Date,Prénom,Nom,Email,Téléphone,Événement,Circuit,Coaching,Statut
'
  var rows = data.map(ins => {
    var ev = ins.events
    return [
      new Date(ins.created_at).toLocaleDateString('fr-FR'),
      ins.prenom || '', ins.nom || (ins.user_name || ''),
      ins.email || '', ins.telephone || '',
      ev ? ev.type || '' : '',
      ev && ev.circuits ? ev.circuits.nom : '',
      ins.coaching_requested ? 'Oui' : 'Non',
      ins.statut || 'en_attente'
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')
  }).join('
')

  var blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' })
  var a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'inscriptions-jbemeric-' + new Date().toISOString().slice(0,10) + '.csv'
  a.click()
  toast('Export CSV téléchargé ✓', 'ok')
}

function redirect(url) {
  window.location.href = url
}

window.doLogout = async () => { await sbLogout() }

// ═══════════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════════
const TITLES = {
  dashboard:    'Dashboard',
  sessions:     'Track-Days — Sessions',
  inscriptions: 'Inscriptions reçues',
  votes:        'Votes Potential',
  coaching:     'Coaching',
  paddock:      'Paddock',
  editeur:      'Éditeur de contenu',
  users:        'Utilisateurs'
}

window.nav = (name) => {
  document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'))

  const view = document.getElementById(`v-${name}`)
  if (view) view.classList.add('active')

  document.querySelectorAll('.sb-btn').forEach(b => {
    if (b.getAttribute('onclick') === `nav('${name}')`) b.classList.add('active')
  })

  document.getElementById('page-title').textContent = TITLES[name] || name

  // Lazy load des sections
  if (name === 'users')        loadUsers()
  if (name === 'inscriptions') loadInscriptions()
  if (name === 'coaching') loadContentEditor('coaching')
  if (name === 'paddock')  loadContentEditor('paddock')
  if (name === 'editeur')  loadMainEditor()
}

// ═══════════════════════════════════════════════════════════════════
//  KPIs
// ═══════════════════════════════════════════════════════════════════
async function loadKPIs() {
  try {
    const [open, potential, full, inscrits] = await Promise.all([
      supabase.from('events').select('id',{count:'exact'}).eq('status','Open'),
      supabase.from('events').select('id',{count:'exact'}).eq('status','Potential'),
      supabase.from('events').select('id',{count:'exact'}).eq('status','Full'),
      supabase.from('inscriptions').select('id',{count:'exact'}),
    ])
    document.getElementById('k-open').textContent    = open.count    ?? '—'
    document.getElementById('k-votes').textContent   = potential.count ?? '—'
    document.getElementById('k-full').textContent    = full.count    ?? '—'
    document.getElementById('k-inscrits').textContent =
      inscrits.count ?? 0

    document.getElementById('pill-open').textContent = open.count    ?? '?'
    document.getElementById('pill-vote').textContent = potential.count
    var _pillInscr = document.getElementById('pill-inscr')
    if (_pillInscr) _pillInscr.textContent = inscrits.count ?? '0' ?? '?'
    // KPIs supplémentaires
    const [threads, docs] = await Promise.all([
      supabase.from('forum_threads').select('id',{count:'exact'}),
      supabase.from('docs').select('id',{count:'exact'}).eq('visible',true),
    ])
    const kThreads = document.getElementById('k-threads')
    const kDocs    = document.getElementById('k-docs')
    if (kThreads) kThreads.textContent = threads.count ?? '—'
    if (kDocs)    kDocs.textContent    = docs.count    ?? '—'

    // Charger les inscriptions récentes
    const { data: recInscrits } = await supabase
      .from('inscriptions')
      .select('user_name, email, car_model, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    const inscList = document.getElementById('inscriptions-list')
    if (inscList && recInscrits) {
      if (recInscrits.length === 0) {
        inscList.innerHTML = '<div style="font-family:'DM Mono';font-size:10px;color:rgba(255,255,255,.3)">Aucune inscription pour l'instant.</div>'
      } else {
        inscList.innerHTML = recInscrits.map(function(ins) {
          var d = new Date(ins.created_at)
          var dd = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear()
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">' +
            '<div><div style="font-family:'DM Mono';font-size:11px;color:#fff">' + (ins.user_name||'—') + '</div>' +
            '<div style="font-family:'DM Mono';font-size:9px;color:rgba(255,255,255,.35);margin-top:2px">' + (ins.email||'') + '</div></div>' +
            '<div style="font-family:'DM Mono';font-size:9px;color:rgba(255,207,0,.5)">' + dd + '</div>' +
            '</div>'
        }).join('')
      }
    }
  } catch(e) { console.warn('KPIs:', e) }
}

// ═══════════════════════════════════════════════════════════════════
//  EVENTS TABLE
// ═══════════════════════════════════════════════════════════════════
window.loadEvents = async () => {
  const status  = document.getElementById('filter-status')?.value
  const today   = new Date().toISOString().split('T')[0]

  let q = supabase
    .from('events')
    .select('id,date_event,type,status,prix,nb_places,nb_inscrits,visible_site,circuit_id,circuits(nom)')
    .gte('date_event', today)
    .order('date_event')
    .limit(30)

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  const tbody = document.getElementById('events-tbody')
  const dashTbody = document.getElementById('dash-events-tbody')
  if (error) { tbody.innerHTML = `<tr><td colspan="8" style="color:var(--err);padding:16px;font-size:11px">${error.message}</td></tr>`; return }

  const rows = (data ?? []).map(ev => `
    <tr id="erow-${ev.id}">
      <td class="td-mono td-main">${fmtDate(ev.date_event)}</td>
      <td class="td-main">${ev.circuits?.nom ?? '—'}</td>
      <td style="font-size:11px">${ev.type}</td>
      <td>${badgeStatus(ev.status)}</td>
      <td class="td-mono">${ev.nb_inscrits}/${ev.nb_places}</td>
      <td class="td-mono">${Number(ev.prix).toLocaleString('fr-FR')} €</td>
      <td><div class="tog${ev.visible_site?' on':''}"
        onclick="toggleVisible(${ev.id},this)"></div></td>
      <td><div class="td-acts">
        ${ev.status==='Potential'?`<button class="btn btn-ok btn-sm" onclick="setStatus(${ev.id},'Open',this)">→ Open</button>`:''}
        <button class="btn btn-err btn-sm" onclick="deleteEvent(${ev.id},this)">✕</button>
      </div></td>
    </tr>`).join('')

  tbody.innerHTML = rows || `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px;font-family:'DM Mono';font-size:9px">Aucun événement</td></tr>`
  if (dashTbody) dashTbody.innerHTML = rows.split('</tr>').slice(0,5).join('</tr>')
}

window.filterEventsTable = (q) => {
  document.querySelectorAll('#events-tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none'
  })
}

window.setStatus = async (id, status, btn) => {
  btn.disabled = true; btn.textContent = '…'
  const { error } = await supabase.from('events').update({status}).eq('id',id)
  if (!error) {
    toast(`Statut → ${status}`)
    loadEvents(); loadKPIs()
  } else {
    toast(error.message,'err')
    btn.disabled=false; btn.textContent='→ Open'
  }
}

window.toggleVisible = async (id, tog) => {
  const vis = !tog.classList.contains('on')
  tog.classList.toggle('on')
  const { error } = await supabase.from('events').update({visible_site:vis}).eq('id',id)
  if (error) { tog.classList.toggle('on'); toast(error.message,'err') }
}

window.deleteEvent = async (id, btn) => {
  if (!confirm('Supprimer cet événement ?')) return
  btn.disabled = true
  const { error } = await supabase.from('events').delete().eq('id',id)
  if (!error) {
    document.getElementById(`erow-${id}`)?.remove()
    toast('Événement supprimé')
    loadKPIs()
  } else {
    toast(error.message,'err')
    btn.disabled=false
  }
}

// ── Upload doc Supabase Storage ───────────────────────────────────
window.previewDocFile = (input) => {
  const file = input.files[0]
  const prev = document.getElementById('doc-preview')
  if (file && prev) {
    const size = (file.size / 1024 / 1024).toFixed(1)
    prev.textContent = `✓ ${file.name} — ${size} Mo`
  }
}

window.uploadDoc = async () => {
  const title    = document.getElementById('doc-title').value.trim()
  const cat      = document.getElementById('doc-cat').value
  const keywords = document.getElementById('doc-keywords').value.trim()
  const fileInp  = document.getElementById('doc-file')
  const file     = fileInp.files[0]
  const btn      = document.getElementById('doc-upload-btn')

  if (!title) { toast('Titre obligatoire', 'err'); return }
  if (!file)  { toast('Fichier obligatoire', 'err'); return }

  btn.disabled = true; btn.textContent = '↑ Upload…'

  try {
    // 1. Upload vers Supabase Storage (bucket "docs")
    const ext      = file.name.split('.').pop()
    const filename = `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]/g,'-')}.${ext}`
    const { data: storageData, error: storageErr } = await supabase
      .storage.from('docs').upload(filename, file)
    if (storageErr) throw storageErr

    // 2. URL publique
    const { data: { publicUrl } } = supabase.storage.from('docs').getPublicUrl(filename)

    // 3. Insérer dans la table docs
    const { error: dbErr } = await supabase.from('docs').insert({
      title, category: cat, keywords,
      type: ext === 'pdf' ? 'pdf' : 'schema',
      file_url: publicUrl,
      file_size: (file.size / 1024 / 1024).toFixed(1) + ' Mo',
    })
    if (dbErr) throw dbErr

    toast('Document publié dans la bibliothèque !')
    document.getElementById('doc-title').value    = ''
    document.getElementById('doc-keywords').value = ''
    fileInp.value = ''
    document.getElementById('doc-preview').textContent = ''
  } catch(e) {
    toast(e.message, 'err')
  } finally {
    btn.disabled = false; btn.textContent = '↑ Publier dans la bibliothèque'
  }
}

// ── Chargement modération forum ───────────────────────────────────
async function loadForumMod() {
  const { data } = await supabase
    .from('forum_threads')
    .select('id,title,tag,author_name,reply_count,pinned,visible')
    .order('created_at', { ascending:false })
    .limit(20)

  const tbody = document.getElementById('forum-mod-tbody')
  if (!tbody) return
  const tagLabels = { meca:'🔧', elec:'⚡', chas:'🏗', data:'📊', regl:'⚙' }

  tbody.innerHTML = (data??[]).map(t => `
    <tr id="ft-${t.id}">
      <td class="td-main" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        ${t.pinned?'📌 ':''}${t.title}
      </td>
      <td>${tagLabels[t.tag]??'?'} ${t.tag}</td>
      <td style="font-size:11px">${t.author_name??'—'}</td>
      <td class="td-mono">${t.reply_count}</td>
      <td><div class="td-acts">
        <button class="btn btn-ok btn-sm" onclick="pinThread(${t.id},${!t.pinned})">
          ${t.pinned?'Désépingler':'Épingler'}
        </button>
        <button class="btn btn-err btn-sm" onclick="deleteThread(${t.id})">Suppr.</button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px;font-family:'DM Mono';font-size:9px">Aucun sujet</td></tr>'
}

window.pinThread = async (id, pin) => {
  const { error } = await supabase.from('forum_threads').update({ pinned: pin }).eq('id', id)
  if (!error) { toast(pin ? '📌 Épinglé' : 'Désépinglé'); loadForumMod() }
  else toast(error.message, 'err')
}

window.deleteThread = async (id) => {
  if (!confirm('Supprimer ce fil ? (irréversible)')) return
  const { error } = await supabase.from('forum_threads').delete().eq('id', id)
  if (!error) { document.getElementById(`ft-${id}`)?.remove(); toast('Fil supprimé') }
  else toast(error.message, 'err')
}

window.openNewEventForm = function() {
  var modal = document.getElementById('new-event-modal')
  if (modal) modal.style.display = 'flex'
}

window.closeEventModal = function() {
  var modal = document.getElementById('new-event-modal')
  if (modal) modal.style.display = 'none'
}

window.saveNewEvent = async function() {
  var date    = document.getElementById('ne-date').value
  var type    = document.getElementById('ne-type').value
  var circuit = parseInt(document.getElementById('ne-circuit').value) || null
  var prix    = parseFloat(document.getElementById('ne-prix').value) || 195
  var places  = parseInt(document.getElementById('ne-places').value) || 10
  var status  = document.getElementById('ne-status').value
  var visible = document.getElementById('ne-visible').checked

  if (!date || !type) { toast('Date et type obligatoires', 'err'); return }

  const { error } = await supabase.from('events').insert({
    date_event: date, type, circuit_id: circuit,
    prix, nb_places: places, status, visible_site: visible
  })
  if (error) { toast('Erreur: ' + error.message, 'err'); return }
  toast('Événement créé ✓', 'ok')
  window.closeEventModal()
  loadEvents()
}

// ═══════════════════════════════════════════════════════════════════
//  VOTES TABLE
// ═══════════════════════════════════════════════════════════════════
async function loadVotes() {
  const { data } = await supabase
    .from('events')
    .select('id,date_event,nb_votes,circuits(nom)')
    .eq('status','Potential')
    .order('nb_votes',{ascending:false})
    .limit(15)

  const tbody = document.getElementById('votes-tbody')
  if (!data?.length) { tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;font-family:'DM Mono';font-size:9px">Aucun vote</td></tr>`; return }

  const SEUIL = 5
  tbody.innerHTML = data.map(ev => {
    const pct = Math.min(100, Math.round((ev.nb_votes||0)/SEUIL*100))
    return `<tr>
      <td class="td-mono td-main">${fmtDate(ev.date_event)}</td>
      <td class="td-main">${ev.circuits?.nom??'—'}</td>
      <td class="td-mono">${ev.nb_votes||0}</td>
      <td><div class="vbar-wrap">
        <div class="vbar"><div class="vbar-fill" style="width:${pct}%"></div></div>
        <span class="vcnt">${ev.nb_votes||0}/${SEUIL}</span>
      </div></td>
      <td><div class="td-acts">
        <button class="btn btn-ok btn-sm" onclick="setStatus(${ev.id},'Open',this)">✓ Valider</button>
        <button class="btn btn-err btn-sm" onclick="setStatus(${ev.id},'Annulé',this)">✕</button>
      </div></td>
    </tr>`
  }).join('')
}

// ═══════════════════════════════════════════════════════════════════
//  UTILISATEURS
// ═══════════════════════════════════════════════════════════════════
async function loadUsers() {
  const { data } = await supabase
    .from('users')
    .select('id,prenom,nom,email,role,created_at')
    .order('created_at',{ascending:false})
    .limit(50)

  const tbody = document.getElementById('users-tbody')
  document.getElementById('users-count').textContent = `${data?.length??0} utilisateurs`

  tbody.innerHTML = (data??[]).map(u => `
    <tr>
      <td class="td-mono" style="font-size:10px">${u.id.substring(0,8)}…</td>
      <td class="td-main">${u.prenom??''} ${u.nom??''}</td>
      <td style="font-size:11px">${u.email}</td>
      <td>${u.role==='admin'?'<span class="badge b-admin">Admin</span>':u.role==='moderateur'?'<span class="badge b-mod">Modérateur</span>':'<span class="badge b-client">Client</span>'}</td>
      <td class="td-mono">${u.created_at?new Date(u.created_at).toLocaleDateString('fr-FR'):'-'}</td>
      <td><div class="td-acts"><button class="btn btn-ghost btn-sm">Modifier</button></div></td>
    </tr>`).join('')
}

// ═══════════════════════════════════════════════════════════════════
//  ÉDITEUR CONTENU (délégue à editor.js)
// ═══════════════════════════════════════════════════════════════════
function loadContentEditor(page) {
  const container = document.getElementById(`${page}-editor`)
  if (!container || container.dataset.loaded) return
  container.dataset.loaded = '1'
  // initEditor initialise les blocs pour cette page
  window._initEditorPage?.(page, container)
}

function loadMainEditor() {
  const container = document.getElementById('main-editor')
  if (!container || container.dataset.loaded) return
  container.dataset.loaded = '1'
  window._initEditorPage?.('all', container)
}

// ═══════════════════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════════════════
function badgeStatus(s) {
  const m = {Open:'b-open Open',Potential:'b-potential Vote',Full:'b-full Full',Draft:'b-draft Draft'}
  const [cls, lbl] = (m[s]||'b-draft '+s).split(' ')
  return `<span class="badge ${cls}">${lbl}</span>`
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})
}

window.toast = (msg, type='ok') => {
  const t = document.getElementById('toast')
  t.textContent = msg; t.className = `show ${type}`
  clearTimeout(t._to); t._to = setTimeout(()=>t.className='',3200)
}

// ═══════════════════════════════════════════════════════════════════
//  RADAR — Détection automatique de journées circuit
// ═══════════════════════════════════════════════════════════════════

// ── Configuration sources (ajouter des URLs ici) ───────────────────
const RADAR_SOURCES = [
  { id:'paul-ricard',    name:'Paul Ricard HTTT',      region:'PACA',       active:true,  type:'gt',   rss:null },
  { id:'grand-sambuc',   name:'Circuit Grand Sambuc',  region:'PACA',       active:true,  type:'tour', rss:null },
  { id:'cuges',          name:'Cuges-les-Pins',         region:'PACA',       active:true,  type:'tour', rss:null },
  { id:'brignoles',      name:'Circuit Brignoles',      region:'PACA',       active:true,  type:'tour', rss:null },
  { id:'ledenon',        name:'Circuit de Lédenon',     region:'Occitanie',  active:true,  type:'tour', rss:null },
  { id:'nogaro',         name:'Circuit de Nogaro',      region:'Occitanie',  active:false, type:'gt',   rss:null },
  { id:'albi',           name:'Circuit d'Albi',        region:'Occitanie',  active:false, type:'gt',   rss:null },
  { id:'magny-cours',    name:'Circuit de Magny-Cours', region:'Autre France',active:false,type:'gt',   rss:null },
]

// ── Données simulées (en prod → remplacer par fetch RSS/API) ───────
// Structure : { source_id, circuit, region, type, date, prix, url }
function generateSimulatedDates() {
  const today = new Date()
  const results = []

  // Simuler des dates futures pour les sources actives
  const fakeData = [
    { source_id:'paul-ricard',   circuit:'Circuit Paul Ricard HTTT', prix:320, days:12 },
    { source_id:'grand-sambuc',  circuit:'Circuit du Grand Sambuc',  prix:195, days:19 },
    { source_id:'ledenon',       circuit:'Circuit de Lédenon',       prix:245, days:33 },
    { source_id:'cuges',         circuit:'Cuges-les-Pins',           prix:195, days:47 },
    { source_id:'brignoles',     circuit:'Circuit de Brignoles',     prix:195, days:61 },
    { source_id:'nogaro',        circuit:'Circuit de Nogaro',        prix:310, days:75 },
  ]

  fakeData.forEach(item => {
    const src = RADAR_SOURCES.find(s => s.id === item.source_id)
    if (!src) return

    const eventDate = new Date(today)
    eventDate.setDate(today.getDate() + item.days)

    results.push({
      id:         `radar-${item.source_id}-${item.days}`,
      source_id:  item.source_id,
      circuit:    item.circuit,
      region:     src.region,
      type_tag:   src.type,
      date:       eventDate.toISOString().split('T')[0],
      prix:       item.prix,
      source_url: `https://${item.source_id}.fr/calendrier`,
      source_name:src.name,
      detected_at:new Date().toISOString(),
      status:     'new', // 'new' | 'validated' | 'ignored'
    })
  })

  return results
}

// ── État local du Radar ────────────────────────────────────────────
let _radarResults  = []
let _radarNewCount = 0

// Persistance localStorage — retrouver les décisions (validé/ignoré)
const RADAR_KEY = 'jbe_radar_decisions'
function getDecisions() { return JSON.parse(localStorage.getItem(RADAR_KEY) || '{}') }
function saveDecision(id, status) {
  const d = getDecisions(); d[id] = status; localStorage.setItem(RADAR_KEY, JSON.stringify(d))
}

// ── Rendu sources sidebar ──────────────────────────────────────────
function renderRadarSources() {
  const el = document.getElementById('radar-sources')
  if (!el) return
  el.innerHTML = RADAR_SOURCES.map(s => `
    <div class="radar-source-tag${s.active?'':' inactive'}">
      <div class="src-dot"></div>
      ${s.name}
    </div>`).join('')
}

// ── Lancer le scan ─────────────────────────────────────────────────
window.runRadarScan = async function() {
  const spinner = document.getElementById('radar-spinner')
  const status  = document.getElementById('radar-scan-status')
  const scanTime= document.getElementById('radar-scan-time')
  const results = document.getElementById('radar-results')

  // Anim scan
  spinner.style.display = 'block'
  status.textContent    = 'Analyse en cours…'
  results.innerHTML     = `<div style="padding:20px;text-align:center;font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(129,140,248,.5)">
    <div style="animation:spin .8s linear infinite;display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid rgba(129,140,248,.3);border-top-color:#818cf8;margin-bottom:8px"></div><br>
    Interrogation des sources…
  </div>`

  // Simuler un délai réseau (en prod → remplacer par Promise.all des fetch)
  await new Promise(r => setTimeout(r, 1800))

  // Générer les résultats
  const rawResults  = generateSimulatedDates()
  const decisions   = getDecisions()

  // Appliquer les décisions sauvegardées
  _radarResults = rawResults.map(r => ({
    ...r, status: decisions[r.id] || 'new'
  }))

  // Compter les nouvelles
  _radarNewCount = _radarResults.filter(r => r.status === 'new').length

  spinner.style.display = 'none'
  status.textContent    = `Scan terminé — ${_radarResults.length} dates trouvées`
  scanTime.textContent  = 'Mis à jour : ' + new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})

  // Mettre à jour la pastille
  updateRadarPill()
  renderRadarResults()

  // Mettre à jour le log
  addActivityLog(`Radar : ${_radarNewCount} nouvelle(s) date(s) détectée(s)`, '#818cf8')
}

// ── Rendu des résultats ────────────────────────────────────────────
function renderRadarResults() {
  const container = document.getElementById('radar-results')
  if (!container) return

  // Trier : nouvelles en premier, puis validées, puis ignorées
  const sorted = [..._radarResults].sort((a,b) => {
    const order = { new:0, validated:1, ignored:2 }
    return (order[a.status]||0) - (order[b.status]||0) || new Date(a.date) - new Date(b.date)
  })

  if (!sorted.length) {
    container.innerHTML = '<div style="padding:24px;text-align:center;font-family:'DM Mono';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.25)">Aucune date détectée</div>'
    return
  }

  const regionTag = { PACA:'rt-paca', Occitanie:'rt-occ' }
  const typeTag   = { gt:'rt-gt', tour:'rt-tour' }

  container.innerHTML = sorted.map(r => {
    const d    = new Date(r.date)
    const day  = d.getDate()
    const mo   = d.toLocaleDateString('fr-FR',{month:'short'})
    const rgCls= regionTag[r.region] || 'rt-other'
    const tyCls= typeTag[r.type_tag] || 'rt-other'

    const isNew       = r.status === 'new'
    const isValidated = r.status === 'validated'
    const isIgnored   = r.status === 'ignored'

    return `
    <div class="radar-row${isValidated?' validated':''}${isIgnored?' ignored':''}" id="rrow-${r.id}">
      <div class="radar-date-box">
        <div class="radar-day">${day}</div>
        <div class="radar-month">${mo}</div>
      </div>
      <div class="radar-info">
        <div class="radar-circuit">${r.circuit}</div>
        <div class="radar-tags">
          <span class="radar-tag ${rgCls}">${r.region}</span>
          <span class="radar-tag ${tyCls}">${r.type_tag === 'gt' ? 'GT' : 'Tourisme'}</span>
          ${isValidated ? '<span class="radar-tag" style="background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.2)">✓ Ajouté</span>' : ''}
          ${isIgnored   ? '<span class="radar-tag" style="background:rgba(255,255,255,.05);color:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.08)">Ignoré</span>' : ''}
        </div>
        <div class="radar-source">Source : <em>${r.source_name}</em></div>
      </div>
      <div>
        <div class="radar-price">${r.prix} €</div>
        <div class="radar-price-sub">/ pilote</div>
      </div>
      <div class="radar-actions">
        ${isNew ? `
          <button class="btn-validate-radar" onclick="validateRadarDate('${r.id}')">✅ Valider</button>
          <button class="btn-ignore-radar"   onclick="ignoreRadarDate('${r.id}')">❌ Ignorer</button>
        ` : isValidated ? `
          <span style="font-family:'DM Mono';font-size:8px;color:rgba(34,197,94,.5)">✓ Validé</span>
        ` : `
          <span style="font-family:'DM Mono';font-size:8px;color:rgba(255,255,255,.2)">Ignoré</span>
        `}
      </div>
    </div>`
  }).join('')
}

// ── Valider une date ───────────────────────────────────────────────
window.validateRadarDate = async function(id) {
  const result = _radarResults.find(r => r.id === id)
  if (!result) return

  const btn = document.querySelector(`#rrow-${id} .btn-validate-radar`)
  if (btn) { btn.disabled = true; btn.textContent = '…' }

  try {
    // Trouver le circuit_id dans Supabase
    const { data: circuits } = await supabase
      .from('circuits')
      .select('id')
      .ilike('nom', `%${result.circuit.split(' ').slice(-2).join(' ')}%`)
      .limit(1)

    const circuit_id = circuits?.[0]?.id ?? 1 // fallback au premier circuit

    // Insérer dans la table events
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        circuit_id,
        date_event:   result.date,
        type:         result.type_tag === 'gt' ? 'Stage GT' : 'Track-Day',
        status:       'Potential',       // Démarre en Potential — JB valide ensuite
        prix:         result.prix,
        visible_site: false,             // Masqué jusqu'à validation manuelle
        source_veille:result.source_url,
        nb_places:    10,
        nb_votes:     0,
      })
      .select()
      .single()

    if (error) throw error

    // Sauvegarder la décision localement
    result.status = 'validated'
    saveDecision(id, 'validated')

    // Mettre à jour le compteur
    _radarNewCount = Math.max(0, _radarNewCount - 1)
    updateRadarPill()
    renderRadarResults()

    toast(`✅ ${result.circuit} ajouté en Potential`)
    addActivityLog(`Radar : "${result.circuit}" validé → Potential`, '#22c55e')

    // Refresh KPIs
    loadKPIs()

  } catch(e) {
    toast('Erreur : ' + e.message, 'err')
    if (btn) { btn.disabled = false; btn.textContent = '✅ Valider' }
  }
}

// ── Ignorer une date ───────────────────────────────────────────────
window.ignoreRadarDate = function(id) {
  const result = _radarResults.find(r => r.id === id)
  if (!result) return

  result.status = 'ignored'
  saveDecision(id, 'ignored')
  _radarNewCount = Math.max(0, _radarNewCount - 1)
  updateRadarPill()
  renderRadarResults()
  toast('Date ignorée')
}

// ── Pastille notification ──────────────────────────────────────────
function updateRadarPill() {
  const pill    = document.getElementById('pill-radar')
  const counter = document.getElementById('radar-new-count')

  if (_radarNewCount > 0) {
    if (pill)    { pill.textContent = _radarNewCount; pill.style.display = '' }
    if (counter) { counter.textContent = `${_radarNewCount} nouvelle${_radarNewCount>1?'s':''}`; counter.style.display = ''; counter.classList.add('new') }
  } else {
    if (pill)    pill.style.display = 'none'
    if (counter) { counter.style.display = 'none'; counter.classList.remove('new') }
  }
}

// ── Log activité ───────────────────────────────────────────────────
function addActivityLog(text, color) {
  const log = document.getElementById('activity-log')
  if (!log) return
  const item = document.createElement('div')
  item.className = 'log-item'
  item.innerHTML = `
    <div class="log-dot" style="background:${color}"></div>
    <div class="log-txt">${text}</div>
    <div class="log-time">${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>`
  log.insertBefore(item, log.firstChild)
  // Garder max 6 logs
  while (log.children.length > 6) log.removeChild(log.lastChild)
}

// ── Auto-scan au chargement ────────────────────────────────────────
// Lancer automatiquement après 1.5s
setTimeout(() => {
  renderRadarSources()
  runRadarScan()
}, 1500)

function startClock() {
  const el = document.getElementById('tb-clock')
  const tick = () => { el.textContent = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) }
  tick(); setInterval(tick, 30000)
  document.getElementById('log-time-1').textContent = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
}
