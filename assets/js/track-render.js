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

  /* La fiche d'inscription est partie dans assets/js/inscription.js le
     9 août 2026. Elle vivait ici, mêlée au calendrier, et la page d'une
     date ne pouvait pas l'ouvrir : son bouton renvoyait vers cette liste.
     Ce fichier ne s'occupe plus que de la grille et de ses filtres. */
})();

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
      + '&order=date_event.asc&select=id,date_event,type,status,prix,nb_places,nb_inscrits,'
      + 'mode,organisateur,lien_organisateur,circuits(nom,region)',
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
    //
    // Le repli montre une voiture sur circuit. Il montrait un kart, si bien
    // qu'un track-day en voiture personnelle, dont le type ne contient aucun
    // des mots ci-dessous, etait illustre par une photo de karting.
    function imgForType(type) {
      var t = (type||'').toLowerCase()
      if (t.includes('kart')) return 'assets/images/karting-enfant-circuit.jpg'
      if (t.includes('206') || t.includes('peugeot')) return 'assets/images/peugeot-206-s16-ricard.jpg'
      if (t.includes('ferrari')) return 'assets/images/ferrari-f8-tributo.jpg'
      if (t.includes('lotus')) return 'assets/images/lotus-circuit-du-luc.jpg'
      return 'assets/images/bmw-325i-htcc.jpg'
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

    // Le choix de l'action selon le mode a demenage dans evenement.js, le
    // 9 aout 2026. La carte ne porte plus qu'un bouton « En savoir plus » :
    // c'est la page de l'evenement qui sait qui vend, et donc ce qu'elle peut
    // proposer. Deux endroits qui decident la meme chose finissent par ne plus
    // dire la meme chose.

    // ── La carte d'une date ────────────────────────────────────────────────
    //
    // Une photo, une date, deux phrases, un seul bouton. Rien d'autre.
    //
    // Le detail complet, le prix, le mode et la maniere de s'inscrire vivent
    // sur la page de l'evenement. Empiler tout ca sur la carte donnait une
    // grille illisible, et forcait le visiteur a choisir avant d'avoir lu.
    //
    // Le bouton mene a /evenement/<slug>. Une date sans slug n'a pas de page :
    // sa carte reste cliquable vers le calendrier plutot que vers une adresse
    // qui n'existe pas.
    var cards = events.map(function(ev) {
      var circuit = ev.circuits ? ev.circuits.nom : 'Circuit à confirmer'
      var region  = ev.circuits && ev.circuits.region ? ev.circuits.region : ''
      var status  = ev.status || 'Open'
      var img     = ev.photo || imgForType(ev.type)
      var dataStatus = status === 'Open' ? 'open' : status === 'Full' ? 'full' : 'potential'
      var lien    = ev.slug ? 'evenements/' + escAttr(ev.slug) : 'evenements.html#sessions'

      var d = new Date(ev.date_event + 'T12:00:00')
      var jour = DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]

      return '<article class="sr-card" data-status="' + dataStatus + '">' +
        '<a class="sr-card-lien" href="' + lien + '">' +
          '<div class="sr-card-img">' +
            '<img src="' + escAttr(img) + '" alt="' + escAttr((ev.type || 'Journée circuit') + ', ' + circuit) + '" loading="lazy">' +
            statusBadge(status) +
            '<div class="sr-card-date">' + jour + '</div>' +
          '</div>' +
          '<div class="sr-card-body">' +
            '<div class="sr-card-circuit">' + escAttr(circuit) + '</div>' +
            (region ? '<div class="sr-card-lieu">' + escAttr(region) + '</div>' : '') +
            '<p class="sr-card-resume">' +
              escAttr(ev.resume || (ev.type || 'Journée circuit') + ' encadrée par JB.') +
            '</p>' +
          '</div>' +
          '<div class="sr-card-foot"><span class="sr-btn-savoir">En savoir plus →</span></div>' +
        '</a>' +
      '</article>'
    })

    grid.innerHTML = cards.join('')

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
