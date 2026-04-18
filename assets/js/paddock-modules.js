// paddock-modules.js — JB EMERIC
// Bibliothèque technique + Forum Paddock
// Chargé dans paddock.html

// ═══════════════════════════════════════════════════════════════════
//  paddock-modules.js — Bibliothèque technique + Forum
//  Chargement Supabase (si configuré) ou données statiques
// ═══════════════════════════════════════════════════════════════════

// ── Import Supabase (optionnel — commenter si pas encore configuré) ──
// Supabase disponible via live-editor.js

// ── Données statiques de démo ───────────────────────────────────────
var DEMO_DOCS  = [] // Charge depuis Supabase

var DEMO_POSTS = [] // Charge depuis Supabase

// ═══════════════════════════════════════════════════════════════════
//  BIBLIOTHÈQUE — RENDU
// ═══════════════════════════════════════════════════════════════════
let _libFilter = 'all'
let _libSearch = ''
let _libPage   = 0
const LIB_PER_PAGE = 8

const CAT_MAP = {
  meca:     { label:'Mécanique',     cls:'cat-meca',     icon:'🔧' },
  elec:     { label:'Électronique',  cls:'cat-elec',     icon:'⚡' },
  chas:     { label:'Châssis',       cls:'cat-chas',     icon:'🏗' },
  data:     { label:'Data',          cls:'cat-data',     icon:'📊' },
  regl:     { label:'Réglages',      cls:'cat-regl',     icon:'⚙' },
  coaching: { label:'Coaching',      cls:'cat-coaching', icon:'🎯' },
  actu:     { label:'Actualités',    cls:'cat-actu',     icon:'📣' },
}

function getFilteredDocs() {
  return DEMO_DOCS.filter(doc => {
    const matchTag = _libFilter === 'all' || doc.category === _libFilter
    const q = _libSearch.toLowerCase()
    const matchSearch = !q ||
      doc.title.toLowerCase().includes(q) ||
      (doc.intro && doc.intro.toLowerCase().includes(q))
    return matchTag && matchSearch
  })
}

function renderLib() {
  var docs  = getFilteredDocs()
  var grid  = document.getElementById('lib-grid')
  var count = document.getElementById('lib-count-num')
  var more  = document.getElementById('lib-loadmore')
  if (!grid) return

  if (count) count.textContent = docs.length
  var page = docs.slice(0, (_libPage + 1) * LIB_PER_PAGE)
  // Sur le paddock on masque "charger plus" — le bouton "Voir tous" est statique
  if (more) more.style.display = 'none'

  if (!docs.length) {
    if (typeof _loadingData !== 'undefined' && _loadingData) return
    grid.innerHTML = '<div class="lib-empty"><span>&#128269;</span>Aucun article trouv&#233; pour ces crit&#232;res.</div>'
    return
  }

  grid.innerHTML = page.map(function(doc) {
    var cat = CAT_MAP[doc.category] || { label: doc.category, cls: 'cat-coaching', icon: '📁' }
    var href = doc.slug ? 'article.html#' + encodeURIComponent(doc.slug) : '#'
    var imgHtml = doc.image_url
      ? '<img src="' + doc.image_url + '" alt="' + doc.title.replace(/"/g,'') + '" loading="lazy">'
      : '<div class="lib-card-img-placeholder">' + cat.icon + '</div>'

    return (
      '<a class="lib-card" href="' + href + '" data-cat="' + doc.category + '">' +
        '<div class="lib-card-img-wrap">' + imgHtml + '</div>' +
        '<div class="lib-card-body">' +
          '<span class="lib-card-cat ' + cat.cls + '">' + cat.icon + ' ' + cat.label + '</span>' +
          '<div class="lib-card-title">' + doc.title + '</div>' +
          '<div class="lib-card-intro">' + (doc.intro || '') + '</div>' +
        '</div>' +
        '<div class="lib-card-foot">' +
          '<span class="lib-btn lib-btn-view">Lire l\'article &#8594;</span>' +
        '</div>' +
      '</a>'
    )
  }).join('')
}

window.filterLib = function(q) {
  _libSearch = q; _libPage = 0; renderLib()
}
window.filterLibTag = function(btn, tag) {
  document.querySelectorAll('.lib-tag').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  _libFilter = tag; _libPage = 0; renderLib()
}
window.loadMoreDocs = function() { _libPage++; renderLib() }

// ═══════════════════════════════════════════════════════════════════
//  FORUM — RENDU LISTE
// ═══════════════════════════════════════════════════════════════════
let _forumFilter = 'all'
let _currentPost = null

const FTAG_MAP = {
  meca:    { label:'Mécanique',    cls:'fb-meca' },
  elec:    { label:'Électronique', cls:'fb-elec' },
  chas:    { label:'Châssis',      cls:'fb-chas' },
  data:    { label:'Data',         cls:'fb-data' },
  regl:    { label:'Réglages',     cls:'fb-regl' },
  coaching:{ label:'Coaching',     cls:'fb-coaching' },
}

function getFilteredPosts() {
  return DEMO_POSTS.filter(p => _forumFilter === 'all' || p.tag === _forumFilter)
}

function renderForumList() {
  var list  = document.getElementById('forum-list')
  var posts = getFilteredPosts()
  if (!list) return

  if (!posts.length) {
    list.innerHTML = '<div style="padding:32px;text-align:center;color:rgba(255,255,255,.3);font-family:DM Mono,monospace;font-size:10px">Aucun sujet dans cette cat&#233;gorie</div>'
    return
  }

  list.innerHTML = posts.map(function(p) {
    var ft2 = FTAG_MAP[p.tag] || { label: p.tag, cls: 'fb-meca' }
    var pd2 = typeof p.id === 'string' ? '"' + p.id + '"' : p.id
    var pinIcon = p.pinned ? '<span style="font-size:11px;margin-right:4px">&#128204;</span>' : ''
    var isJBPost = p.posts && p.posts.length > 0 && p.posts[0].jb
    var authorStyle = isJBPost
      ? 'color:#FFCF00;font-weight:700'
      : 'color:rgba(255,255,255,.5)'
    var repBadge = p.replies > 0
      ? '<span style="background:rgba(255,207,0,.15);color:#FFCF00;border:1px solid rgba(255,207,0,.25);font-family:DM Mono,monospace;font-size:8px;padding:2px 7px;border-radius:10px">' + p.replies + ' r&#233;p.</span>'
      : '<span style="color:rgba(255,255,255,.2);font-family:DM Mono,monospace;font-size:8px">0 r&#233;p.</span>'

    return (
      '<div class="forum-row' + (p.pinned ? ' pinned' : '') + '" ' +
           'data-post-id="' + p.id + '" onclick="openDiscussion(' + pd2 + ')">' +
        '<div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
            pinIcon +
            '<span class="ftag-badge ' + ft2.cls + '">' + ft2.label + '</span>' +
            repBadge +
          '</div>' +
          '<div class="forum-row-title">' + p.title + '</div>' +
          (p.preview ? '<div class="forum-row-preview">' + p.preview + '</div>' : '') +
          '<div style="font-family:DM Mono,monospace;font-size:9px;' + authorStyle + '">' +
            (isJBPost ? '&#11088; ' : '') + p.author + ' &middot; ' + p.date +
          '</div>' +
        '</div>' +
      '</div>'
    )
  }).join('')
}

window.filterForum = function(btn, tag) {
  document.querySelectorAll('.ftag').forEach(b => b.classList.remove('on'))
  btn.classList.add('on')
  _forumFilter = tag
  renderForumList()
  closeDiscussion()
}

// ═══════════════════════════════════════════════════════════════════
//  FORUM — VUE DISCUSSION
// ═══════════════════════════════════════════════════════════════════
window.openDiscussion = async function(postId) {
  var post = null
  for (var i = 0; i < DEMO_POSTS.length; i++) {
    if (String(DEMO_POSTS[i].id) === String(postId)) { post = DEMO_POSTS[i]; break }
  }
  if (!post) return

  var disc    = document.getElementById('forum-discussion')
  var postsEl = document.getElementById('discussion-posts')
  if (!disc || !postsEl) return
  disc.style.display    = 'flex'
  disc.style.flexDirection = 'column'

  // Afficher immediatement le post principal
  _currentPost = post
  var ft3  = FTAG_MAP[post.tag] || { label: post.tag, cls: 'fb-meca' }
  var noM3 = '<div style="padding:24px;text-align:center;color:rgba(255,255,255,.3);font-family:DM Mono,monospace;font-size:10px">Chargement des réponses...</div>'

  postsEl.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.07)">' +
      '<button class="forum-back" onclick="closeDiscussion()">← Retour</button>' +
      '<span class="ftag-badge ' + ft3.cls + '">' + ft3.label + '</span>' +
    '</div>' +
    '<div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.06)">' +
      '<div style="font-family:Bebas Neue,sans-serif;font-size:clamp(20px,3.5vw,32px);color:#fff;line-height:1.05;margin-bottom:6px">' + post.title + '</div>' +
      '<div style="font-family:DM Mono,monospace;font-size:9px;color:rgba(255,255,255,.35)">' +
        post.replies + ' réponse' + (post.replies > 1 ? 's' : '') + ' · ' + post.date +
      '</div>' +
    '</div>' +
    post.posts.map(renderPost).join('') +
    noM3 +
    '<div id="new-posts-area"></div>'

  disc.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Charger les vraies replies Supabase
  var SB = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SK = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var SH = { apikey: SK, Authorization: 'Bearer ' + SK }
  var threadId = post.id

  fetch(SB + 'forum_replies?thread_id=eq.' + threadId + '&order=created_at.asc&limit=50', { headers: SH })
    .then(function(r) { return r.json() })
    .then(function(replies) {
      // Remplacer le "Chargement..." par les vraies replies
      var noM = '<div style="padding:24px;text-align:center;color:rgba(255,255,255,.3);font-family:DM Mono,monospace;font-size:10px">Aucune r&#233;ponse pour l\'instant. Soyez le premier !</div>'
      var newArea = document.getElementById('new-posts-area')

      // Trouver le div "Chargement..." et le remplacer
      var loadingDiv = postsEl.querySelector('div[style*="Chargement"]')
      if (loadingDiv) loadingDiv.remove()

      if (replies && replies.length) {
        var mo = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc']
        replies.forEach(function(r) {
          var d2   = new Date(r.created_at)
          var ds2  = d2.getDate() + ' ' + mo[d2.getMonth()] + ' ' + d2.getFullYear()
          var isJB = r.is_jb || (r.author_name || '').toLowerCase().indexOf('jean-baptiste') >= 0
          var rp   = {
            author:    r.author_name || 'Anonyme',
            initials:  (r.author_name || 'A').slice(0,2).toUpperCase(),
            role:      isJB ? 'Coach JB EMERIC' : 'Pilote',
            roleClass: isJB ? 'coach' : '',
            date:      ds2,
            jb:        isJB,
            content:   r.content || ''
          }
          if (newArea) {
            newArea.insertAdjacentHTML('beforebegin', renderPost(rp))
          }
        })
      }

      // Zone de réponse
      if (newArea) {
        newArea.innerHTML =
          '<div class="reply-area">' +
            '<textarea id="reply-input" class="reply-input" placeholder="Votre réponse..." rows="3"></textarea>' +
            '<button class="forum-reply-btn" onclick="submitReply()">Envoyer</button>' +
          '</div>'
      }
    })
    .catch(function(e) {
      console.error('[Forum replies]', e)
      var noM = document.querySelector('#discussion-posts div[style*="Chargement"]')
      if (noM) noM.textContent = 'Impossible de charger les réponses.'
    })
}

function renderPost(p) {
  var jbB = p.jb
    ? '<div style="font-family:DM Mono,monospace;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:#FFCF00;background:rgba(255,207,0,.1);border:1px solid rgba(255,207,0,.25);padding:3px 10px;border-radius:3px;display:inline-block;margin-bottom:6px">&#11088; Coach JB EMERIC</div>'
    : ''
  var avStyle = p.jb
    ? 'background:linear-gradient(135deg,#0A3D91,#1252C0);color:#FFCF00;border:2px solid #FFCF00;box-shadow:0 0 10px rgba(255,207,0,.2)'
    : 'background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)'
  return (
    '<div class="forum-post">' +
      '<div class="fp-author">' +
        '<div class="fp-av" style="' + avStyle + '">' + p.initials + '</div>' +
        '<div style="flex:1;min-width:0">' +
          jbB +
          '<div class="fp-name" style="' + (p.jb ? 'color:#FFCF00' : '') + '">' + p.author + '</div>' +
          '<div class="fp-role' + (p.jb ? ' coach' : '') + '">' + p.role + '</div>' +
        '</div>' +
        '<div class="fp-time">' + p.date + '</div>' +
      '</div>' +
      '<div class="fp-content">' + p.content + '</div>' +
    '</div>'
  )
}

window.closeDiscussion = function() {
  const disc = document.getElementById('forum-discussion')
  if (disc) disc.style.display = 'none'
  _currentPost = null
  var ri = document.getElementById('reply-input')
  if (ri) ri.value = ''
}

window.submitReply = async function() {
  var input = document.getElementById('reply-input')
  var text  = (input.value || '').trim()
  if (!text) return

  var btn = document.querySelector('.forum-reply-btn')
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi…' }

  // Envoyer dans Supabase forum_replies
  var threadId = _currentPost ? _currentPost.id : null
  var authorName = 'Pilote'

  // Essayer de récupérer le nom de l'utilisateur connecté
  try {
    var sessR = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    })
    if (sessR.ok) {
      var userData = await sessR.json()
      if (userData && userData.user_metadata) {
        authorName = (userData.user_metadata.prenom || '') + ' ' + (userData.user_metadata.nom || '')
        authorName = authorName.trim() || userData.email || 'Pilote'
      }
    }
  } catch(e) {}

  // Insérer la réponse
  if (threadId) {
    try {
      await fetch(SB_URL + '/rest/v1/forum_replies', {
        method: 'POST',
        headers: Object.assign({}, SB_H, { 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          thread_id:   threadId,
          author_name: authorName,
          content:     text,
          is_jb:       false
        })
      })
    } catch(e) { console.warn('[Forum reply]', e.message) }
  }

  // Afficher localement immédiatement
  var area = document.getElementById('new-posts-area')
  if (area) {
    area.insertAdjacentHTML('beforeend', renderPost({
      author: authorName, initials: authorName.substring(0,2).toUpperCase(),
      role: 'Pilote', roleClass: '', date: 'à l\'instant', jb: false, content: text
    }))
    var last = area.lastElementChild
    if (last) last.scrollIntoView({ behavior:'smooth', block:'nearest' })
  }

  input.value = ''
  if (_currentPost) _currentPost.replies++
  if (btn) { btn.disabled = false; btn.textContent = 'Envoyer →' }
}

window.openNewThread = function() {
  var modal = document.getElementById('new-thread-modal')
  if (modal) {
    modal.style.display = 'flex'
  } else {
    window.toast && window.toast('Connectez-vous pour poster un sujet', 'info')
  }
}

window.closeNewThread = function() {
  var modal = document.getElementById('new-thread-modal')
  if (modal) modal.style.display = 'none'
}

window.submitNewThread = async function() {
  var title   = (document.getElementById('nt-title')  || {}).value || ''
  var tag     = (document.getElementById('nt-tag')    || {}).value || 'meca'
  var content = (document.getElementById('nt-content')|| {}).value || ''
  if (!title || !content) {
    window.toast && window.toast('Titre et contenu obligatoires', 'info')
    return
  }
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    const sb = createClient('https://fyaybxamuabawerqzuud.supabase.co', 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD')
    const { data: { session } } = await sb.auth.getSession()
    if (!session) {
      window.toast && window.toast('Connectez-vous pour poster', 'info')
      return
    }
    const meta = session.user.user_metadata || {}
    const authorName = (meta.prenom || '') + ' ' + (meta.nom || session.user.email)
    const { error } = await sb.from('forum_threads').insert({
      title, tag, content,
      author_id:   session.user.id,
      author_name: authorName.trim()
    })
    if (error) throw error
    window.toast && window.toast('Sujet publié !', 'ok')
    window.closeNewThread()
    // Recharger la page après 1s pour voir le nouveau thread
    setTimeout(function() { location.reload() }, 1000)
  } catch(e) {
    window.toast && window.toast('Erreur: ' + e.message, 'err')
  }
}

window.loadMorePosts = function() {
  if (typeof window.toast === 'function') window.toast('Chargement…','info')
}

// ═══════════════════════════════════════════════════════════════════
//  INIT — Charge depuis Supabase en priorité, fallback données démo
// ═══════════════════════════════════════════════════════════════════
const SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co'
const SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
const SB_H   = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }

async function loadFromSupabase() {
  // ── 1. Forum threads ──────────────────────────────────────────
  try {
    const r = await fetch(
      SB_URL + '/rest/v1/forum_threads?visible=eq.true&order=pinned.desc,created_at.desc&limit=20',
      { headers: SB_H }
    )
    console.log('[Paddock] Forum HTTP status:', r.status)
    if (r.ok) {
      const threads = await r.json()
      console.log('[Paddock] Forum rows reçus:', threads && threads.length)
      if (threads && threads.length > 0) {
        const sbPosts = threads.map(function(t) {
          var d = new Date(t.created_at)
          var dateStr = d.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })
          var initials = (t.author_name||'A').substring(0,2).toUpperCase()
          var isJB = (t.author_name||'').toLowerCase().includes('jean-baptiste') ||
                     (t.author_name||'').toLowerCase().includes('jb emeric')
          return {
            id:      t.id,
            tag:     t.tag || 'meca',
            title:   t.title || '',
            preview: t.content ? t.content.substring(0, 120) + '…' : '',
            author:  t.author_name || 'Anonyme',
            date:    dateStr,
            replies: t.reply_count || 0,
            pinned:  t.pinned || false,
            legacy:  false,
            posts:   [{
              author:    t.author_name || 'Anonyme',
              initials:  initials,
              role:      isJB ? 'Coach · JB EMERIC' : 'Pilote',
              roleClass: isJB ? 'coach' : '',
              date:      dateStr,
              jb:        isJB,
              content:   t.content || ''
            }]
          }
        })
        DEMO_POSTS.length = 0
        sbPosts.forEach(function(p) { DEMO_POSTS.push(p) })
        console.log('[Paddock] Forum: ' + sbPosts.length + ' threads chargés depuis Supabase')
      }
    }
  } catch(e) {
    console.error('[Paddock] Forum ERREUR:', e.message, e)
  }

  // ── 2. Bibliothèque docs ──────────────────────────────────────
  try {
    const r2 = await fetch(
      SB_URL + '/rest/v1/docs?visible=eq.true&order=published_at.desc.nullslast,created_at.desc&limit=100&select=id,title,category,type,slug,image_url,intro,published_at',
      { headers: SB_H }
    )
    console.log('[Paddock] Docs HTTP status:', r2.status)
    if (r2.ok) {
      const docs = await r2.json()
      console.log('[Paddock] Docs rows reçus:', docs && docs.length)
      if (docs && docs.length > 0) {
        const sbDocs = docs
          .filter(function(d) { return d.slug })   // uniquement les articles avec slug
          .map(function(d) {
            return {
              id:        d.id,
              title:     d.title || '',
              category:  d.category || 'coaching',
              type:      d.type || 'article',
              slug:      d.slug,
              image_url: d.image_url || '',
              intro:     d.intro || '',
              date:      d.published_at ? d.published_at.split('T')[0] : ''
            }
          })
        DEMO_DOCS.length = 0
        sbDocs.forEach(function(d) { DEMO_DOCS.push(d) })
        console.log('[Paddock] Docs: ' + sbDocs.length + ' articles chargés depuis Supabase')
      }
    }
  } catch(e) {
    console.error('[Paddock] Docs ERREUR:', e.message, e)
  }
}

// Le script est chargé en type="module" → DOMContentLoaded est déjà passé.
// On utilise le top-level await directement (supporté dans les ES modules).
console.log('[Paddock] Init — début chargement Supabase')
await loadFromSupabase()
console.log('[Paddock] Init — DEMO_DOCS:', DEMO_DOCS.length, '| DEMO_POSTS:', DEMO_POSTS.length)
renderLib()
renderForumList()
console.log('[Paddock] Init — rendu terminé')
