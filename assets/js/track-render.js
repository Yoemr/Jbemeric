// track-render.js — JB EMERIC
// Rendu dynamique track.html : dots places, calendrier Supabase, inscriptions, votes
// Chargé dans track.html

(function() {
  /* ── Points places disponibles ── */
  function renderDots(id, total, taken) {
    var el = document.getElementById('dots-' + id);
    if (!el) return;
    el.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var d = document.createElement('div');
      d.className = 'sr-dot' + (i < taken ? ' taken' : '');
      el.appendChild(d);
    }
  }
  renderDots('1', 12, 8);   // Brignoles : 8/12 pris
  renderDots('2', 10, 4);   // Cuges : 4/10 pris
  renderDots('ricard', 12, 12); // Ricard : full

  /* ── Filtres tabs ── */
  window.filterCards = function(tab, filter) {
    var _tabs=document.querySelectorAll('.sr-tab'); for(var _ti=0;_ti<_tabs.length;_ti++) _tabs[_ti].classList.remove('active');
    tab.classList.add('active');
    var grid = document.getElementById('sr-grid');
    grid.dataset.filter = filter;
  };

  /* ── Système de vote ── */
  var voteState = { ledenon: 3, albi: 1 };
  window.vote = function(circuit, max) {
    var btn = document.getElementById('btn-vote-' + circuit);
    if (btn.classList.contains('voted')) return;
    btn.classList.add('voted');
    btn.textContent = '✓ Votre vote est enregistré';

    voteState[circuit]++;
    var count = voteState[circuit];
    var pct = Math.min(100, Math.round(count / max * 100));

    document.getElementById('vote-count-' + circuit).textContent = count;
    var fill = document.getElementById('vote-fill-' + circuit);
    fill.style.width = pct + '%';
    var hint = document.getElementById('vote-hint-' + circuit);

    if (pct >= 100) {
      fill.className = 'sr-vote-fill full';
      hint.className = 'sr-vote-hint full';
      hint.textContent = '✅ Seuil atteint — validation en cours';
      // Changer le badge
      var badge = document.getElementById('badge-' + circuit);
      badge.className = 'sr-badge open';
      badge.textContent = 'Proche de la validation';
    } else if (pct >= 60) {
      fill.className = 'sr-vote-fill almost';
      hint.className = 'sr-vote-hint almost';
      hint.textContent = '⚡ Proche de la validation — encore ' + (max - count) + ' vote' + (max - count > 1 ? 's' : '');
    }
  };

  /* ── Modal inscription ── */
  var modalBase = 195;
  var hasVeh = false;
  var hasCoach = false;

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
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-sub').textContent = 'Inscription · JB EMERIC';
    document.getElementById('price-base').textContent = price + ' €';
    document.getElementById('price-total').textContent = price + ' €';
    document.getElementById('recap-veh-row').style.display = 'none';
    document.getElementById('recap-coach-row').style.display = 'none';
    // Reset form
    var _ci=document.querySelectorAll('.sr-check-item'); for(var _cii=0;_cii<_ci.length;_cii++) _ci[_cii].classList.remove('checked');
    var _vo=document.querySelectorAll('.sr-veh-option'); for(var _voi=0;_voi<_vo.length;_voi++) _vo[_voi].classList.toggle('selected', _voi===0);
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
    if (e.target === document.getElementById('sr-modal-overlay')) closeModal();
  };

  window.selectVeh = function(el, extra) {
    var _vr=document.querySelectorAll('.sr-veh-option'); for(var _vri=0;_vri<_vr.length;_vri++) _vr[_vri].classList.remove('selected');
    el.classList.add('selected');
    hasVeh = extra > 0;
    updateTotal();
  };

  window.toggleCheck = function(el) {
    el.classList.toggle('checked');
    var box = el.querySelector('.sr-check-box');
    box.textContent = el.classList.contains('checked') ? '✓' : '';
  };

  window.toggleCoaching = function() {
    var opt = document.getElementById('coaching-opt');
    opt.classList.toggle('selected');
    hasCoach = opt.classList.contains('selected');
    updateTotal();
  };

  window.confirmInscription = function() {
    // Validation basique
    var prenom = (document.getElementById('sr-prenom')||{}).value || ''
    var nom    = (document.getElementById('sr-nom')||{}).value || ''
    var email  = (document.getElementById('sr-email')||{}).value || ''
    var tel    = (document.getElementById('sr-tel')||{}).value || ''
    if (!prenom || !nom || !email) {
      alert('Veuillez remplir votre prénom, nom et email.')
      return
    }
    // Envoyer à Supabase
    var total = document.getElementById('price-total')
    var prix  = total ? total.textContent : '195 €'
    var titre = (document.getElementById('modal-title')||{}).textContent || ''
    try {
      fetch('https://fyaybxamuabawerqzuud.supabase.co/rest/v1/inscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD',
          'Authorization': 'Bearer sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_name: prenom + ' ' + nom,
          prenom:    prenom,
          nom:       nom,
          email:     email,
          telephone: tel,
          car_model: tel,
          coaching_requested: hasCoach || false,
          avec_vehicule: hasVeh || false,
          avec_coaching: hasCoach || false,
          event_id:  window._currentEventId || null,
          statut:    'en_attente'
        })
      }).catch(function(){})
    } catch(e) {}
    // Afficher confirmation
    document.getElementById('sr-form-view').style.display = 'none'
    var confirmEl = document.getElementById('sr-confirm-view')
    if (confirmEl) confirmEl.style.display = 'flex'
    // Mettre à jour l'email de confirmation
    var emailConf = document.getElementById('confirm-email')
    if (emailConf) emailConf.textContent = email
  };
})();

// ─────────────────────────────────────────────────────────────

// ── Génération dynamique du calendrier depuis Supabase ────────────
(async function() {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var SB_H   = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  var MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
  var DAYS   = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

  try {
    // Charger events visibles
    var r = await fetch(SB_URL + 'events?visible_site=eq.true&order=date_event.asc&select=id,date_event,type,status,prix,nb_places,nb_inscrits,circuits(nom,region)',
      { headers: SB_H })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    var events = await r.json()

    var grid = document.getElementById('sr-grid')
    if (!grid || !events || !events.length) return

    function statusBadge(s) {
      if (s === 'Open')      return '<span class="sr-badge open">Inscriptions ouvertes</span>'
      if (s === 'Potential') return '<span class="sr-badge potential">Bientôt disponible</span>'
      if (s === 'Full')      return '<span class="sr-badge full">Complet</span>'
      return '<span class="sr-badge">' + s + '</span>'
    }

    function dotsHtml(total, taken) {
      var html = '<div class="sr-dots">'
      for (var i = 0; i < total; i++) {
        html += '<div class="sr-dot' + (i < taken ? ' taken' : '') + '"></div>'
      }
      html += '</div>'
      return html
    }

    // Associer une image selon le type
    function imgForType(type) {
      var t = (type||'').toLowerCase()
      if (t.includes('karting')) return 'assets/images/karting-enfant-circuit.jpg'
      if (t.includes('gt') || t.includes('tourisme')) return 'assets/images/bmw-325i-htcc.jpg'
      if (t.includes('206') || t.includes('peugeot')) return 'assets/images/peugeot-206-sambuc.jpg'
      if (t.includes('caterham')) return 'assets/images/lotus-circuit-du-luc.jpg'
      if (t.includes('ferrari')) return 'assets/images/ferrari-f8-tributo.jpg'
      if (t.includes('porsche')) return 'assets/images/porsche-gt3-stage.jpg'
      return 'assets/images/sambuc-circuit.jpg'
    }

    var cards = events.map(function(ev) {
      var d = new Date(ev.date_event)
      var dayStr  = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      var circuit = ev.circuits ? ev.circuits.nom : '—'
      var region  = ev.circuits ? ev.circuits.region : ''
      var taken   = ev.nb_inscrits || 0
      var total   = ev.nb_places   || 10
      var left    = Math.max(0, total - taken)
      var status  = ev.status || 'Open'
      var prix    = ev.prix ? parseFloat(ev.prix) : 195
      var img     = imgForType(ev.type)
      var dataStatus = status === 'Open' ? 'open' : status === 'Full' ? 'full' : 'potential'

      return '<div class="sr-card" data-status="' + dataStatus + '">' +
        '<div class="sr-card-img">' +
          '<img src="' + img + '" alt="' + (ev.type||'Stage') + ' JB EMERIC" loading="lazy">' +
          statusBadge(status) +
          '<div class="sr-card-date">' + dayStr + '</div>' +
        '</div>' +
        '<div class="sr-card-body">' +
          '<div class="sr-card-circuit">' + circuit + '</div>' +
          '<div class="sr-card-meta">' +
            region + ' · <strong>' + prix + ' €</strong> / pilote<br>' + (ev.type||'Stage') +
          '</div>' +
          '<div class="sr-card-places">' +
            dotsHtml(total, taken) +
            '<span id="left-' + ev.id + '">' + left + ' place' + (left !== 1 ? 's' : '') + ' restante' + (left !== 1 ? 's' : '') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="sr-card-foot">' +
          (status === 'Open'
            ? '<button class="sr-btn-inscr" onclick="openModal('' + (ev.type||'Stage') + '',' + prix + ','' + circuit + '','' + ev.id + '')">S'inscrire →</button>'
            : '<button class="sr-btn-inscr" style="opacity:.4;cursor:default" disabled>Bientôt disponible</button>'
          ) +
        '</div>' +
      '</div>'
    })

    grid.innerHTML = cards.join('')

    // Mettre à jour le compteur total
    var openCount = events.filter(function(e) { return e.status === 'Open' }).length
    var countEl = document.getElementById('sessions-count')
    if (countEl) countEl.textContent = events.length + ' dates · ' + openCount + ' inscriptions ouvertes'

  } catch(e) {
    console.warn('[Track calendrier]', e.message)
    // Garder le contenu statique si Supabase échoue
  }
})()

// ANCIEN script places — remplacé, garder pour compatibilité
;(async function() {
  try {
    var r = await fetch(
      'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/inscriptions?select=event_id&event_id=not.is.null',
      { headers: {
        'apikey': 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD',
        'Authorization': 'Bearer sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
      }}
    )
    if (!r.ok) return
    var inscrits = await r.json()

    // Compter par event_id
    var counts = {}
    for (var i = 0; i < inscrits.length; i++) {
      var eid = inscrits[i].event_id
      if (eid) counts[eid] = (counts[eid] || 0) + 1
    }

    // Charger les events ouverts
    var r2 = await fetch(
      'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/events?status=eq.Open&visible_site=eq.true&select=id,date_event,type,nb_places,circuit_id,circuits(nom)',
      { headers: {
        'apikey': 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD',
        'Authorization': 'Bearer sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
      }}
    )
    if (!r2.ok) return
    var events = await r2.json()

    // Mettre à jour les dots de chaque card
    events.forEach(function(ev, idx) {
      var taken = counts[ev.id] || 0
      var total = ev.nb_places || 10
      var left  = Math.max(0, total - taken)
      var dotId = 'dots-' + (idx + 1)
      var leftId = 'left-' + (idx + 1)
      if (typeof window.renderDots === 'function') {
        window.renderDots(dotId, total, taken)
      }
      var leftEl = document.getElementById(leftId)
      if (leftEl) leftEl.textContent = left
      // Si complet → changer le badge
      if (left === 0) {
        var card = document.querySelector('[data-status="open"]:nth-of-type(' + (idx+1) + ')')
        var badge = card && card.querySelector('.sr-badge')
        if (badge) { badge.textContent = 'Complet'; badge.className = 'sr-badge full' }
      }
    })
  } catch(e) { console.log('[Track] Supabase events:', e.message) }
})()

// ─────────────────────────────────────────────────────────────

// Charger les events depuis Supabase et lier les boutons S'inscrire
(async function() {
  try {
    var r = await fetch(
      'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/events?status=eq.Open&visible_site=eq.true&order=date_event.asc&select=id,date_event,type,prix,nb_places,circuits(nom)',
      { headers: {
        'apikey': 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD',
        'Authorization': 'Bearer sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
      }}
    )
    if (!r.ok) return
    var events = await r.json()
    if (!events || !events.length) return

    // Associer chaque card à son event_id par correspondance de date/type
    var buttons = document.querySelectorAll('.sr-btn-inscr')
    buttons.forEach(function(btn, idx) {
      var ev = events[idx]
      if (!ev) return
      // Remplacer le onclick pour inclure l'event_id
      var circuitNom = ev.circuits ? ev.circuits.nom : ''
      var d = new Date(ev.date_event)
      var MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc']
      var label = (ev.type || '') + ' — ' + d.getDate() + ' ' + MONTHS[d.getMonth()]
      btn.onclick = function() {
        window.openModal(label, ev.prix || 195, circuitNom, ev.id)
      }
    })
  } catch(e) { console.log('[Track events]', e.message) }
})()

// ─────────────────────────────────────────────────────────────

function vote(circuitId, pts) {
  var btn = event.currentTarget
  if (btn.disabled) return
  btn.disabled = true
  btn.textContent = 'Voté ✓'
  btn.style.background = '#22c55e'
  btn.style.color = '#000'
  var cnt = document.getElementById('vote-count-' + circuitId)
  if (cnt) cnt.textContent = parseInt(cnt.textContent || 0) + 1
  var fill = document.getElementById('vote-fill-' + circuitId)
  if (fill) fill.style.width = Math.min(100, parseFloat(fill.style.width||0) + 20) + '%'
}
function openModal(id) {
  var m = document.getElementById(id)
  if (!m) return
  m.style.display = 'flex'
  document.body.style.overflow = 'hidden'
}
function closeModal() {
  var _els_tmp = document.querySelectorAll('.modal, [id$="-modal"]'); for (var _i=0;_i<_els_tmp.length;_i++) { var m=_els_tmp[_i]; m.style.display='none' }
  document.body.style.overflow = ''
}
function closeModalOutside(e) {
  if (e.target === e.currentTarget) closeModal()
}
function confirmInscription() {
  var nom  = document.getElementById('insc-nom')
  var mail = document.getElementById('insc-email')
  if (nom && !nom.value.trim()) { alert('Veuillez saisir votre nom.'); return }
  if (mail && !mail.value.trim()) { alert('Veuillez saisir votre email.'); return }
  var sujet = 'Inscription Track-Day JB EMERIC'
  var corps = 'Nom : ' + (nom?nom.value:'') + '%0AEmail : ' + (mail?mail.value:'')
  closeModal()
  window.location.href = 'mailto:jbemeric@jbemeric.com?subject=' + encodeURIComponent(sujet) + '&body=' + corps
}
function filterCards(btn, type) {
  // Activer le tab cliqué
  var tabs = document.querySelectorAll('.sr-tab')
  for (var ti = 0; ti < tabs.length; ti++) {
    tabs[ti].classList.remove('active')
  }
  if (btn) btn.classList.add('active')

  // Filtrer les cards
  var cards = document.querySelectorAll('.sr-card')
  var visible = 0
  for (var ci = 0; ci < cards.length; ci++) {
    var card = cards[ci]
    var show = (type === 'all' || card.getAttribute('data-status') === type)
    card.style.display = show ? '' : 'none'
    if (show) visible++
  }

  // Afficher un message si aucun résultat
  var grid = document.getElementById('sr-grid')
  var empty = document.getElementById('sr-empty')
  if (grid) {
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement('div')
        empty.id = 'sr-empty'
        empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;font-family:'DM Mono';font-size:10px;color:rgba(255,255,255,.3)'
        empty.textContent = 'Aucune date dans cette catégorie pour le moment.'
        grid.appendChild(empty)
      }
      empty.style.display = ''
    } else if (empty) {
      empty.style.display = 'none'
    }
  }
}
function selectVeh(el, id) {
  var _els_tmp = document.querySelectorAll('[data-veh]'); for (var _i=0;_i<_els_tmp.length;_i++) { var v=_els_tmp[_i]; v.classList.remove('selected') }
  el.classList.add('selected')
  var inp = document.getElementById('selected-veh')
  if (inp) inp.value = id
}
function toggleCoaching(el) { el.classList.toggle('selected') }
function toggleCheck(el) { el.classList.toggle('checked') }
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal() })
