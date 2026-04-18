// paddock-une.js — JB EMERIC
// Alimentation de la grille newsletter "À la Une" depuis Supabase
// Chargé dans paddock.html

// ── Newsletter "À la Une" — données Supabase ────────────────────
(async function() {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var H = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  var MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
  var MONTHS_LONG = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  // Date du jour dans le masthead
  var now = new Date()
  var dateEl = document.getElementById('nl-date')
  if (dateEl) {
    dateEl.textContent = now.getDate() + ' ' + MONTHS_LONG[now.getMonth()] + ' ' + now.getFullYear()
  }

  try {
    // ① Prochain événement
    var r1 = await fetch(SB_URL + 'events?status=eq.Open&visible_site=eq.true&order=date_event.asc&limit=1&select=date_event,type,circuit_id,circuits(nom)', { headers: H })
    var evts = await r1.json()
    if (evts && evts[0]) {
      var ev = evts[0]
      var d = new Date(ev.date_event)
      var dayEl   = document.getElementById('une-day')
      var monEl   = document.getElementById('une-month')
      var titleEl = document.getElementById('une-title')
      var subEl   = document.getElementById('une-sub')
      if (dayEl)   dayEl.childNodes[0].textContent = d.getDate()
      if (monEl)   monEl.textContent = MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      if (titleEl) titleEl.textContent = ev.type
      if (subEl)   subEl.textContent = ev.circuits ? ev.circuits.nom : ''
    }

    // ② Forum threads
    var r2 = await fetch(SB_URL + 'forum_threads?visible=eq.true&order=pinned.desc,created_at.desc&limit=4&select=id,title,tag,author_name,reply_count', { headers: H })
    var threads = await r2.json()
    var forumList = document.getElementById('une-forum-list')
    if (forumList && threads && threads.length) {
      var TAG_MAP = { meca:'meca', regl:'regl', chas:'chas', data:'data', elec:'elec' }
      forumList.innerHTML = threads.map(function(t) {
        var tag = TAG_MAP[t.tag] || 'meca'
        return '<a class="nl-forum-row" href="#forum">' +
          '<span class="nl-forum-tag ' + tag + '">' + t.tag + '</span>' +
          '<div class="nl-forum-title">' + t.title + '</div>' +
          '<div class="nl-forum-meta">' + (t.author_name||'Anonyme') + ' · ' + (t.reply_count||0) + ' réponse' + (t.reply_count!==1?'s':'') + '</div>' +
          '</a>'
      }).join('')
      // Compteur threads dans stats
      var threadsEl = document.getElementById('une-threads')
      if (threadsEl) threadsEl.textContent = threads.length
    }

    // ③ Calendrier — 4 prochaines dates
    var r3 = await fetch(SB_URL + 'events?visible_site=eq.true&order=date_event.asc&limit=4&select=date_event,type,circuits(nom)', { headers: H })
    var evtsCal = await r3.json()
    var calList = document.getElementById('une-cal-list')
    if (calList && evtsCal && evtsCal.length) {
      calList.innerHTML = evtsCal.map(function(ev) {
        var d = new Date(ev.date_event)
        return '<div class="nl-cal-row">' +
          '<div class="nl-cal-date">' + d.getDate() + '<span>' + MONTHS[d.getMonth()] + '</span></div>' +
          '<div class="nl-cal-info">' +
            '<div class="nl-cal-title">' + ev.type + '</div>' +
            '<div class="nl-cal-sub">' + (ev.circuits ? ev.circuits.nom : '') + '</div>' +
          '</div>' +
        '</div>'
      }).join('')
    }

  } catch(e) { console.log('[Paddock UNE]', e.message) }
})()
