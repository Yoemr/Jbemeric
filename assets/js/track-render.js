// track-render.js : JB EMERIC
// Rendu dynamique track.html : dots places, calendrier Supabase, inscriptions
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
  // Trois appels vivaient ici avec des chiffres inventés, « Brignoles 8/12 »,
  // « Cuges 4/10 », « Ricard complet ». Ils visaient dots-1, dots-2 et
  // dots-ricard, trois identifiants absents de track.html : la grille est
  // construite en entier par le calendrier plus bas, qui pose ses propres
  // points à partir de nb_inscrits. Ces appels ne faisaient rien, protégés par
  // le if (!el) return de renderDots. Retirés le 8 août 2026.

  /* ── Filtres tabs ── */
  window.filterCards = function(tab, filter) {
    var _tabs=document.querySelectorAll('.sr-tab'); for(var _ti=0;_ti<_tabs.length;_ti++) _tabs[_ti].classList.remove('active');
    tab.classList.add('active');
    var grid = document.getElementById('sr-grid');
    grid.dataset.filter = filter;
  };

  /* Le vote a été retiré le 8 août 2026, décision de Yoan : « y a plus besoin
     de vote car même un seul client génère des bénéfices ». Le seuil de cinq
     pilotes venait du modèle où JB louait la piste entière. Il loue désormais
     un box, ou se greffe sur l'événement d'un autre.

     Ces deux fonctions n'écrivaient de toute façon rien en base. Le compteur
     vivait dans une variable du navigateur et disparaissait au rechargement :
     le visiteur lisait « Votre vote est enregistré » alors que rien ne partait
     nulle part. */

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
    // Ce qu'on affiche quand l'enregistrement a reellement eu lieu.
    function afficherConfirmation() {
      document.getElementById('sr-form-view').style.display = 'none'
      var confirmEl = document.getElementById('sr-confirm-view')
      if (confirmEl) confirmEl.style.display = 'flex'
      var emailConf = document.getElementById('confirm-email')
      if (emailConf) emailConf.textContent = email
    }

    // Et quand il a echoue. Le formulaire reste a l'ecran, avec ses valeurs,
    // et un moyen de joindre JB directement. Le message est cree ici plutot
    // qu'ecrit dans track.html : aucun balisage a maintenir, et il survivra a
    // la refonte de la page.
    function afficherEchec() {
      var vue = document.getElementById('sr-form-view')
      if (!vue) return
      var msg = document.getElementById('sr-erreur')
      if (!msg) {
        msg = document.createElement('p')
        msg.id = 'sr-erreur'
        msg.style.cssText = 'margin:14px 0 0;padding:12px 14px;border:1px solid rgba(220,38,38,.5);'
          + 'background:rgba(220,38,38,.12);color:#fca5a5;font-size:13px;line-height:1.6;border-radius:4px'
        vue.appendChild(msg)
      }
      msg.innerHTML = 'Votre inscription n\'a pas pu être enregistrée. '
        + 'Rien n\'a été retenu de votre côté. Appelez JB au '
        + '<a href="tel:+33660188787" style="color:#fca5a5;text-decoration:underline">06 60 18 87 87</a> '
        + 'ou écrivez à <a href="mailto:jbemeric@jbemeric.com" style="color:#fca5a5;text-decoration:underline">jbemeric@jbemeric.com</a>.'
    }

    // On n'annonce la confirmation que si elle a lieu.
    //
    // Avant le 8 aout 2026, l'erreur etait avalee par un « .catch(function(){}) »
    // et l'ecran de confirmation s'affichait quoi qu'il arrive, sans meme
    // attendre la reponse. Un visiteur pouvait repartir en croyant sa place
    // reservee alors que rien n'etait enregistre. C'est le pire defaut
    // possible sur un formulaire : il ne se voit ni cote client, ni cote JB.
    //
    // Retire au passage : « car_model: tel », qui ecrivait le numero de
    // telephone dans la colonne du modele de voiture. Il n'existe aucun champ
    // voiture dans la page, c'etait un copier-coller.
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
        coaching_requested: hasCoach || false,
        avec_vehicule: hasVeh || false,
        avec_coaching: hasCoach || false,
        event_id:  window._currentEventId || null,
        statut:    'en_attente'
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status)
      afficherConfirmation()
    }).catch(function () {
      afficherEchec()
    })
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

  // La grille ne contient qu'un « Chargement du calendrier… » que ce script
  // remplace. Tant que rien ne le remplaçait, une panne de Supabase, un
  // téléphone qui perd le réseau ou une simple lenteur laissaient le visiteur
  // devant ce mot, pour toujours, sans un numéro à appeler. Ces deux fonctions
  // existent pour qu'il ait toujours quelque chose à faire.
  function messageGrille(titre, texte) {
    var grid = document.getElementById('sr-grid')
    if (!grid) return
    grid.innerHTML =
      '<div class="sr-vide">' +
        '<div class="sr-vide-titre">' + titre + '</div>' +
        '<p class="sr-vide-texte">' + texte + '</p>' +
        '<a class="sr-vide-tel" href="tel:+33660188787">06 60 18 87 87</a>' +
        '<a class="sr-vide-mail" href="mailto:jbemeric@jbemeric.com">jbemeric@jbemeric.com</a>' +
      '</div>'
  }

  // Une date passée n'est pas une offre. La requête n'avait aucun filtre de
  // date : le 8 août 2026, la page proposait de s'inscrire à six journées
  // d'avril, mai, juin et juillet, toutes marquées « Inscriptions ouvertes ».
  // Le filtre se calcule ici plutôt que dans la base pour que le jour même
  // d'un événement reste affiché jusqu'à son terme.
  var aujourdhui = new Date().toISOString().slice(0, 10)

  try {
    // Charger events visibles
    var r = await fetch(SB_URL + 'events?visible_site=eq.true&date_event=gte.' + aujourdhui
      + '&order=date_event.asc&select=id,date_event,type,status,prix,nb_places,nb_inscrits,circuits(nom,region)',
      { headers: SB_H })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    var events = await r.json()

    var grid = document.getElementById('sr-grid')
    if (!grid) return
    if (!events || !events.length) {
      messageGrille('Aucune date ouverte pour le moment',
        'Le calendrier se remplit au fil des accords avec les circuits. Appelez JB, il vous dira ce qui se prépare et sur quelle date vous inscrire.')
      return
    }

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

    // Associer une image selon le type.
    //
    // Trois chemins pointaient ici dans le vide : peugeot-206-sambuc.jpg,
    // porsche-gt3-stage.jpg et sambuc-circuit.jpg n'existent pas. Le pire
    // etait le dernier, qui sert de repli : toute date dont le type ne
    // contient aucun des mots ci-dessous affichait une image cassee. Personne
    // ne l'avait vu parce qu'il faut une date du bon type pour s'en rendre
    // compte, et les dates viennent de Supabase.
    //
    // Regle desormais : on ne cite que des fichiers qui existent. Une
    // discipline sans photo tombe dans le repli plutot que de promettre une
    // image absente. Il n'y a aujourd'hui ni Caterham ni Porsche en photo.
    function imgForType(type) {
      var t = (type||'').toLowerCase()
      if (t.includes('karting')) return 'assets/images/karting-enfant-circuit.jpg'
      if (t.includes('gt') || t.includes('tourisme')) return 'assets/images/bmw-325i-htcc.jpg'
      if (t.includes('206') || t.includes('peugeot')) return 'assets/images/peugeot-206-s16-ricard.jpg'
      if (t.includes('ferrari')) return 'assets/images/ferrari-f8-tributo.jpg'
      return 'assets/images/karting-adulte-circuit.jpg'
    }

    /* Échappement pour insertion dans un attribut HTML. Les valeurs viennent
       de Supabase et peuvent contenir une apostrophe ou un guillemet. */
    function escAttr(v) {
      return String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    var cards = events.map(function(ev) {
      var d = new Date(ev.date_event)
      var dayStr  = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      var circuit = ev.circuits ? ev.circuits.nom : '…'
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
            ? '<button class="sr-btn-inscr" data-inscr' +
                ' data-type="'    + escAttr(ev.type || 'Stage') + '"' +
                ' data-prix="'    + escAttr(prix)               + '"' +
                ' data-circuit="' + escAttr(circuit)            + '"' +
                ' data-ev="'      + escAttr(ev.id)              + '">S\'inscrire →</button>'
            : '<button class="sr-btn-inscr" style="opacity:.4;cursor:default" disabled>Bientôt disponible</button>'
          ) +
        '</div>' +
      '</div>'
    })

    grid.innerHTML = cards.join('')

    /* Branchement du bouton d'inscription après injection. Un handler écrit
       dans la chaîne HTML obligeait à replier les valeurs entre quotes, ce qui
       était la cause du défaut de syntaxe précédent. */
    Array.prototype.forEach.call(grid.querySelectorAll('[data-inscr]'), function(btn) {
      btn.addEventListener('click', function() {
        window.openModal(
          btn.getAttribute('data-type'),
          parseFloat(btn.getAttribute('data-prix')),
          btn.getAttribute('data-circuit'),
          btn.getAttribute('data-ev')
        )
      })
    })

    // Un compteur « X dates, Y inscriptions ouvertes » etait ecrit ici, vers un
    // identifiant sessions-count qui n'existe nulle part dans track.html. Il ne
    // s'est jamais affiche. Le code est retire plutot que de lui inventer une
    // place dans la page : ou le mettre est une decision de Yoan, pas la mienne.

  } catch(e) {
    console.warn('[Track calendrier]', e.message)
    messageGrille('Le calendrier ne répond pas',
      'Impossible d\'afficher les dates pour l\'instant. Rechargez la page dans un moment, ou appelez JB directement : il connaît son calendrier par cœur.')
  }
})()

// ── Deux blocs retirés le 8 août 2026 ───────────────────────────────────────
// Ils rechargeaient les mêmes événements et rattachaient les boutons par
// position : le premier bouton de la grille recevait le premier événement de
// leur requête. Les deux listes n'ont jamais eu la même définition, l'une
// filtrant sur le statut Open et l'autre non, et depuis que la grille écarte
// les dates passées elles n'ont même plus la même longueur.
//
// Vérifié sur les données réelles du 8 août : les trois boutons affichés
// auraient ouvert la fiche d'inscription d'une journée d'avril, d'une autre
// d'avril et d'une de mai. Un visiteur se serait inscrit à une date révolue
// en croyant réserver celle qu'il venait de lire.
//
// La grille ci-dessus porte déjà l'identifiant de chaque événement dans un
// attribut data- et le lit au clic. Rien ne se perd, le rattachement par
// position n'avait plus lieu d'être.

// ─────────────────────────────────────────────────────────────

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
        empty.style.cssText = "grid-column:1/-1;text-align:center;padding:40px;font-family:'DM Mono';font-size:10px;color:rgba(255,255,255,.3)"
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
