// index-sb.js — JB EMERIC
// Supabase : paddock grille (événement, forum, calendrier)

(async function() {
  var SB  = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var H   = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  var MO  = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
  var MOL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  // Date du jour
  var now = new Date()
  var dateEl = document.getElementById('idx-nl-date')
  if (dateEl) dateEl.textContent = now.getDate() + ' ' + MOL[now.getMonth()] + ' ' + now.getFullYear()

  try {
    // ① Prochain événement (sans jointure circuits — évite le 400)
    var r1 = await fetch(SB + 'events?status=eq.Open&visible_site=eq.true&order=date_event.asc&limit=1&select=date_event,type', { headers: H })
    var evts = await r1.json()
    if (evts && evts[0]) {
      var ev = evts[0]
      var d = new Date(ev.date_event)
      var dayEl   = document.getElementById('idx-une-day')
      var monEl   = document.getElementById('idx-une-month')
      var titleEl = document.getElementById('idx-une-title')
      if (dayEl && dayEl.childNodes[0]) dayEl.childNodes[0].textContent = d.getDate()
      if (monEl)   monEl.textContent = MO[d.getMonth()] + ' ' + d.getFullYear()
      if (titleEl) titleEl.textContent = ev.type
    }

    // ② Forum threads
    var r2 = await fetch(SB + 'forum_threads?visible=eq.true&order=pinned.desc,created_at.desc&limit=4&select=id,title,tag,author_name,reply_count', { headers: H })
    var threads = await r2.json()
    var forumList = document.getElementById('idx-une-forum-list')
    if (forumList && threads && threads.length) {
      forumList.innerHTML = threads.map(function(t) {
        var tag = t.tag || 'meca'
        return '<a class="nl-forum-row" href="paddock.html#forum">' +
          '<span class="nl-forum-tag ' + tag + '">' + tag + '</span>' +
          '<div class="nl-forum-title">' + t.title + '</div>' +
          '<div class="nl-forum-meta">' + (t.author_name || 'Anonyme') + ' · ' + (t.reply_count || 0) + ' réponse' + (t.reply_count !== 1 ? 's' : '') + '</div>' +
          '</a>'
      }).join('')
      var threadsEl = document.getElementById('idx-une-threads')
      if (threadsEl) threadsEl.textContent = threads.length
    }

    // ③ Calendrier (sans jointure circuits)
    var r3 = await fetch(SB + 'events?visible_site=eq.true&order=date_event.asc&limit=4&select=date_event,type', { headers: H })
    var cal = await r3.json()
    var calList = document.getElementById('idx-une-cal-list')
    if (calList && cal && cal.length) {
      calList.innerHTML = cal.map(function(ev) {
        var d = new Date(ev.date_event)
        return '<div class="nl-cal-row">' +
          '<div class="nl-cal-date">' + d.getDate() + '<span>' + MO[d.getMonth()] + '</span></div>' +
          '<div class="nl-cal-info"><div class="nl-cal-title">' + ev.type + '</div></div>' +
          '</div>'
      }).join('')
    }

  } catch(e) { console.warn('[idx-sb]', e.message) }
})()
