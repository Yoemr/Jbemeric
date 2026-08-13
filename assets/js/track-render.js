// track-render.js — JB EMERIC
// Calendrier Supabase, modal inscription, vote, filtres

(function() {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/';
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD';
  var SB_H   = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };

  /* ── Dots places ── */
  window.renderDots = function(id, total, taken) {
    var el = document.getElementById('dots-' + id);
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var d = document.createElement('div');
      d.className = 'sr-dot' + (i < taken ? ' taken' : '');
      el.appendChild(d);
    }
  };

  /* ── Filtres tabs ── */
  window.filterCards = function(tab, filter) {
    var tabs = document.querySelectorAll('.sr-tab');
    for (var ti = 0; ti < tabs.length; ti++) tabs[ti].classList.remove('active');
    tab.classList.add('active');
    var cards = document.querySelectorAll('.sr-card');
    var visible = 0;
    for (var ci = 0; ci < cards.length; ci++) {
      var show = filter === 'all' || cards[ci].getAttribute('data-status') === filter;
      cards[ci].style.display = show ? '' : 'none';
      if (show) visible++;
    }
    var grid = document.getElementById('sr-grid');
    var empty = document.getElementById('sr-empty');
    if (grid) {
      if (!visible) {
        if (!empty) {
          empty = document.createElement('div');
          empty.id = 'sr-empty';
          empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;font-family:\'DM Mono\';font-size:10px;color:rgba(255,255,255,.3)';
          empty.textContent = 'Aucune date dans cette catégorie pour le moment.';
          grid.appendChild(empty);
        }
        empty.style.display = '';
      } else if (empty) {
        empty.style.display = 'none';
      }
    }
  };

  /* ── Vote (persisté en Supabase via nb_votes) ── */
  window.vote = function(eventId, max) {
    var btn = document.getElementById('btn-vote-' + eventId);
    if (!btn || btn.classList.contains('voted')) return;
    btn.classList.add('voted');
    btn.textContent = '✓ Votre vote est enregistré';

    var countEl = document.getElementById('vote-count-' + eventId);
    var count = parseInt((countEl && countEl.textContent) || '0') + 1;
    if (countEl) countEl.textContent = count;

    var pct  = Math.min(100, Math.round(count / max * 100));
    var fill = document.getElementById('vote-fill-' + eventId);
    var hint = document.getElementById('vote-hint-' + eventId);
    if (fill) fill.style.width = pct + '%';
    if (fill && hint) {
      if (pct >= 100) {
        fill.className = 'sr-vote-fill full';
        hint.className = 'sr-vote-hint full';
        hint.textContent = '✅ Seuil atteint — validation en cours';
        var badge = document.getElementById('badge-' + eventId);
        if (badge) { badge.className = 'sr-badge open'; badge.textContent = 'Proche de la validation'; }
      } else if (pct >= 60) {
        fill.className = 'sr-vote-fill almost';
        hint.className = 'sr-vote-hint almost';
        hint.textContent = '⚡ Encore ' + (max - count) + ' vote' + (max - count > 1 ? 's' : '') + ' pour valider';
      }
    }

    try {
      fetch(SB_URL + 'events?id=eq.' + eventId, {
        method: 'PATCH',
        headers: Object.assign({}, SB_H, { 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ nb_votes: count })
      }).catch(function() {});
    } catch(e) {}
  };

  /* ── Modal inscription ── */
  var modalBase = 195;
  var hasVeh = false;
  var hasCoach = false;
  var selectedVehLabel = 'Ma propre voiture';

  function updateTotal() {
    var total = modalBase + (hasVeh ? 60 : 0) + (hasCoach ? 80 : 0);
    document.getElementById('price-total').textContent = total + ' €';
    document.getElementById('recap-veh-row').style.display = hasVeh ? '' : 'none';
    document.getElementById('recap-coach-row').style.display = hasCoach ? '' : 'none';
  }

  window._currentEventId = null;

  window.openModal = function(title, price, circuit, eventId) {
    modalBase = price;
    window._currentEventId = eventId || null;
    hasVeh = false; hasCoach = false;
    selectedVehLabel = 'Ma propre voiture';
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-sub').textContent = 'Inscription · JB EMERIC';
    document.getElementById('price-base').textContent = price + ' €';
    document.getElementById('price-total').textContent = price + ' €';
    document.getElementById('recap-veh-row').style.display = 'none';
    document.getElementById('recap-coach-row').style.display = 'none';
    var checks = document.querySelectorAll('.sr-check-item');
    for (var i = 0; i < checks.length; i++) checks[i].classList.remove('checked');
    var vehs = document.querySelectorAll('.sr-veh-option');
    for (var j = 0; j < vehs.length; j++) vehs[j].classList.toggle('selected', j === 0);
    document.getElementById('coaching-opt').classList.remove('selected');
    document.getElementById('sr-form-view').style.display = '';
    document.getElementById('sr-confirm-view').style.display = 'none';
    document.getElementById('sr-modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function() {
    document.getElementById('sr-modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.closeModalOutside = function(e) {
    if (e.target === document.getElementById('sr-modal-overlay')) window.closeModal();
  };

  window.selectVeh = function(el, extra) {
    var opts = document.querySelectorAll('.sr-veh-option');
    for (var i = 0; i < opts.length; i++) opts[i].classList.remove('selected');
    el.classList.add('selected');
    hasVeh = extra > 0;
    selectedVehLabel = extra > 0 ? 'Location JB EMERIC' : 'Ma propre voiture';
    updateTotal();
  };

  window.toggleCheck = function(el) {
    el.classList.toggle('checked');
    var box = el.querySelector('.sr-check-box');
    if (box) box.textContent = el.classList.contains('checked') ? '✓' : '';
  };

  window.toggleCoaching = function() {
    var opt = document.getElementById('coaching-opt');
    opt.classList.toggle('selected');
    hasCoach = opt.classList.contains('selected');
    updateTotal();
  };

  window.confirmInscription = function() {
    var prenom = (document.getElementById('sr-prenom') || {}).value || '';
    var nom    = (document.getElementById('sr-nom')    || {}).value || '';
    var email  = (document.getElementById('sr-email')  || {}).value || '';
    var tel    = (document.getElementById('sr-tel')    || {}).value || '';
    if (!prenom || !nom || !email) {
      alert('Veuillez remplir votre prénom, nom et email.');
      return;
    }
    try {
      fetch(SB_URL + 'inscriptions', {
        method: 'POST',
        headers: Object.assign({}, SB_H, { 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          user_name:          prenom + ' ' + nom,
          prenom:             prenom,
          nom:                nom,
          email:              email,
          telephone:          tel,
          car_model:          selectedVehLabel,
          coaching_requested: hasCoach,
          avec_vehicule:      hasVeh,
          avec_coaching:      hasCoach,
          event_id:           window._currentEventId || null,
          statut:             'en_attente'
        })
      }).catch(function() {});
    } catch(e) {}
    document.getElementById('sr-form-view').style.display = 'none';
    var confirmEl = document.getElementById('sr-confirm-view');
    if (confirmEl) confirmEl.style.display = 'flex';
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeModal();
  });

})();

// ── Calendrier dynamique depuis Supabase ─────────────────────────────────
(async function() {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/';
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD';
  var SB_H   = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
  var MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  var DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

  function statusBadge(s) {
    if (s === 'Open')      return '<span class="sr-badge open">Inscriptions ouvertes</span>';
    if (s === 'Potential') return '<span class="sr-badge potential">Bientôt disponible</span>';
    if (s === 'Full')      return '<span class="sr-badge full">Complet</span>';
    return '<span class="sr-badge">' + s + '</span>';
  }

  function dotsHtml(total, taken) {
    var html = '<div class="sr-dots">';
    for (var i = 0; i < total; i++) {
      html += '<div class="sr-dot' + (i < taken ? ' taken' : '') + '"></div>';
    }
    return html + '</div>';
  }

  function imgForType(type) {
    var t = (type || '').toLowerCase();
    if (t.indexOf('karting') !== -1)  return 'assets/images/karting-enfant-circuit.jpg';
    if (t.indexOf('gt') !== -1 || t.indexOf('tourisme') !== -1) return 'assets/images/bmw-325i-htcc.jpg';
    if (t.indexOf('206') !== -1 || t.indexOf('peugeot') !== -1) return 'assets/images/peugeot-206-sambuc.jpg';
    if (t.indexOf('caterham') !== -1) return 'assets/images/lotus-circuit-du-luc.jpg';
    if (t.indexOf('ferrari') !== -1)  return 'assets/images/ferrari-f8-tributo.jpg';
    if (t.indexOf('porsche') !== -1)  return 'assets/images/porsche-gt3-stage.jpg';
    return 'assets/images/sambuc-circuit.jpg';
  }

  var grid = document.getElementById('sr-grid');
  if (!grid) return;

  try {
    var r = await fetch(
      SB_URL + 'events?visible_site=eq.true&order=date_event.asc&select=id,date_event,type,status,prix,nb_places,nb_inscrits,circuits(nom,region)',
      { headers: SB_H }
    );
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var events = await r.json();
    if (!events || !events.length) return;

    var cards = events.map(function(ev) {
      var d       = new Date(ev.date_event);
      var dayStr  = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
      var circuit = ev.circuits ? ev.circuits.nom : '—';
      var region  = ev.circuits ? ev.circuits.region : '';
      var taken   = ev.nb_inscrits || 0;
      var total   = ev.nb_places   || 10;
      var left    = Math.max(0, total - taken);
      var status  = ev.status || 'Open';
      var prix    = ev.prix ? parseFloat(ev.prix) : 195;
      var img     = imgForType(ev.type);
      var ds      = status === 'Open' ? 'open' : status === 'Full' ? 'full' : 'potential';

      var btnHtml = status === 'Open'
        ? '<button class="sr-btn-inscr" onclick="openModal(\'' + (ev.type||'Stage') + '\',' + prix + ',\'' + circuit + '\',\'' + ev.id + '\')">S\'inscrire →</button>'
        : '<button class="sr-btn-inscr" style="opacity:.4;cursor:default" disabled>Bientôt disponible</button>';

      return '<div class="sr-card" data-status="' + ds + '">' +
        '<div class="sr-card-img">' +
          '<img src="' + img + '" alt="' + (ev.type||'Stage') + ' JB EMERIC" loading="lazy">' +
          statusBadge(status) +
          '<div class="sr-card-date">' + dayStr + '</div>' +
        '</div>' +
        '<div class="sr-card-body">' +
          '<div class="sr-card-circuit">' + circuit + '</div>' +
          '<div class="sr-card-meta">' + region + ' · <strong>' + prix + ' €</strong> / pilote<br>' + (ev.type||'Stage') + '</div>' +
          '<div class="sr-card-places">' + dotsHtml(total, taken) + '<span>' + left + ' place' + (left !== 1 ? 's' : '') + ' restante' + (left !== 1 ? 's' : '') + '</span></div>' +
        '</div>' +
        '<div class="sr-card-foot">' + btnHtml + '</div>' +
      '</div>';
    });

    grid.innerHTML = cards.join('');

    var openCount = events.filter(function(e) { return e.status === 'Open'; }).length;
    var countEl = document.getElementById('sessions-count');
    if (countEl) countEl.textContent = events.length + ' dates · ' + openCount + ' inscriptions ouvertes';

  } catch(e) {
    console.warn('[Track calendrier]', e.message);
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-family:\'DM Mono\';font-size:10px;color:rgba(255,255,255,.3)">' +
      'Impossible de charger le calendrier. ' +
      '<a href="mailto:jbemeric@jbemeric.com" style="color:rgba(255,207,0,.5)">Contactez-nous</a> pour les prochaines dates.' +
      '</div>';
  }
})();
