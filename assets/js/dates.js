// dates.js : les prochaines dates, lues dans la table events.
//
// ── Le principe ─────────────────────────────────────────────────────────────
// JB saisit ses journées dans le dashboard (gestion-evenements.js). Les pages
// les affichent d'elles-mêmes : aucune date n'est écrite dans le HTML, donc
// aucune ne devient fausse le lendemain.
//
// ── Comment une page s'en sert ──────────────────────────────────────────────
//     <section data-dates-bloc hidden>
//       ... titre de la section ...
//       <div class="dates-liste" data-dates="karting" data-dates-max="6"></div>
//     </section>
//
//   data-dates      un mot cherché dans le type de l'événement (« karting »
//                   prend « Karting Enfant » comme « Karting adulte »).
//                   Vide : toutes les activités.
//   data-dates-max  nombre de dates au plus. 6 par défaut.
//
// Le bloc parent marqué data-dates-bloc reste masqué tant qu'il n'y a pas de
// date à venir. Tout élément marqué data-si-dates (un bouton « Voir les
// dates », par exemple) suit le même sort. Une section vide ne s'affiche
// jamais, et elle apparaît seule le jour où JB ajoute une journée.
(function () {
  var SB = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var H = { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

  function ech(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  // Le lien de réservation suit le type : le formulaire de contact arrive
  // avec le bon sujet déjà choisi (contact-form.js, paramètre ?sujet=).
  function sujet(type) {
    var t = (type || '').toLowerCase()
    if (t.indexOf('enfant') !== -1) return 'karting'
    if (t.indexOf('karting') !== -1) return 'karting-adulte'
    return 'autre'
  }

  function carte(e, circuits) {
    var d = new Date(e.date_event + 'T12:00:00')
    var lieu = circuits[e.circuit_id] || ''
    var places = (e.nb_places > 0) ? Math.max(0, e.nb_places - (e.nb_inscrits || 0)) : null
    var complet = places === 0
    var contact = (window.ROUTES && window.ROUTES.contact) || '/admin/legal/contact.html'
    return '<article class="date-carte' + (complet ? ' date-carte--complet' : '') + '">' +
      '<div class="date-jour"><span class="date-num">' + d.getDate() + '</span>' +
        '<span class="date-mois">' + MOIS[d.getMonth()] + ' ' + d.getFullYear() + '</span></div>' +
      '<div class="date-info">' +
        '<span class="date-quand">' + JOURS[d.getDay()] + '</span>' +
        '<span class="date-type">' + ech(e.type) + (lieu ? ' · ' + ech(lieu) : '') + '</span>' +
        '<span class="date-detail">' +
          (places !== null ? (complet ? 'Complet' : places + (places > 1 ? ' places restantes' : ' place restante')) : '') +
          (e.prix ? (places !== null ? ' · ' : '') + Math.round(e.prix) + ' €' : '') +
        '</span>' +
      '</div>' +
      (complet ? '' : '<a class="date-cta" href="' + contact + '?sujet=' + sujet(e.type) + '">Réserver</a>') +
    '</article>'
  }

  var listes = document.querySelectorAll('[data-dates]')
  if (!listes.length) return
  var auj = new Date()
  var iso = auj.getFullYear() + '-' + ('0' + (auj.getMonth() + 1)).slice(-2) + '-' + ('0' + auj.getDate()).slice(-2)

  Promise.all([
    fetch(SB + 'events?visible_site=eq.true&date_event=gte.' + iso +
          '&order=date_event.asc&limit=60&select=date_event,type,status,prix,nb_places,nb_inscrits,circuit_id', H)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() }),
    // Les circuits à part : une jointure renvoyait une erreur 400 (index-sb.js).
    fetch(SB + 'circuits?select=id,nom', H)
      .then(function (r) { return r.ok ? r.json() : [] })
      .catch(function () { return [] })
  ]).then(function (res) {
    var events = (res[0] || []).filter(function (e) {
      return !/annul|cancel|clos/i.test(e.status || '')
    })
    var circuits = {}
    ;(res[1] || []).forEach(function (c) { circuits[c.id] = c.nom })
    var total = 0
    for (var i = 0; i < listes.length; i++) {
      var el = listes[i]
      var mot = (el.getAttribute('data-dates') || '').toLowerCase()
      var max = parseInt(el.getAttribute('data-dates-max'), 10) || 6
      var pour = events.filter(function (e) { return !mot || (e.type || '').toLowerCase().indexOf(mot) !== -1 }).slice(0, max)
      if (!pour.length) continue
      el.innerHTML = pour.map(function (e) { return carte(e, circuits) }).join('')
      var bloc = el.closest('[data-dates-bloc]')
      if (bloc) bloc.hidden = false
      total += pour.length
    }
    if (total) {
      var liens = document.querySelectorAll('[data-si-dates]')
      for (var j = 0; j < liens.length; j++) liens[j].hidden = false
    }
  }).catch(function () { /* rien à montrer : les blocs restent masqués */ })
})()
