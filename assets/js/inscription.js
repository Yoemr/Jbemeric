// inscription.js : la fiche d'inscription, écrite une seule fois.
//
// ── Ce qui a changé ─────────────────────────────────────────────────────────
// Le balisage de la fiche, 140 lignes, vivait dans `evenements.html`. Ses
// gestionnaires vivaient dans `track-render.js`, mêlés au calendrier. La page
// d'une date en avait besoin, et son bouton « Réserver JB » se contentait de
// renvoyer vers la liste, faute de pouvoir l'ouvrir.
//
// Même régime que la FAQ et les avis : le composant écrit son propre balisage.
// Une page n'a qu'à charger `inscription.css` et ce fichier, puis appeler
// `openModal(...)`. Rien à recopier, rien à tenir à jour en double.
//
// ── Où la fiche se pose, et pourquoi ────────────────────────────────────────
// En fin de `<body>`, hors de `.sessions-root` qui portait les couleurs. Elle
// les porte donc elle-même, dans `inscription.css`. C'est la condition pour
// qu'elle s'ouvre sur une page qui n'a pas de calendrier.
//
// ── Les noms globaux sont gardés tels quels ─────────────────────────────────
// `openModal`, `closeModal`, `selectVeh`, `toggleCheck`, `toggleCoaching`,
// `confirmInscription`. Le balisage construit ci-dessous les appelle par
// attribut `onclick`, et `evenement.js` appelle `openModal`. Les renommer
// n'apporterait rien et casserait les deux.

(function () {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

  // Les deux options payantes. Elles sont ici, en un seul endroit, parce que
  // leur montant apparaît trois fois chacune : dans le choix, dans le récap,
  // et dans le total. Trois copies divergeraient.
  var LOCATION = 60
  var COACHING = 80

  var base = 195
  var avecVehicule = false
  var avecCoaching = false

  // ── Le balisage, commun à toutes les pages ────────────────────────────────
  // Construit une seule fois, à la première ouverture. Le poser au chargement
  // ferait payer sa construction à chaque visiteur, y compris à ceux qui ne
  // l'ouvriront jamais.
  var pose = false

  function poser() {
    if (pose) return
    pose = true
    var d = document.createElement('div')
    d.className = 'sr-modal-overlay'
    d.id = 'sr-modal-overlay'
    d.setAttribute('onclick', 'closeModalOutside(event)')
    d.innerHTML =
      '<div class="sr-modal" id="sr-modal">' +

        '<div id="sr-form-view">' +
          '<div class="sr-modal-header">' +
            '<div>' +
              '<div class="sr-modal-title" id="modal-title">S\'inscrire</div>' +
              '<div class="sr-modal-sub" id="modal-sub">Session · JB EMERIC</div>' +
            '</div>' +
            '<button class="sr-modal-close" onclick="closeModal()">✕</button>' +
          '</div>' +

          '<div class="sr-modal-body">' +

            '<div class="sr-duo">' +
              '<div class="sr-field">' +
                '<label class="sr-label">Prénom</label>' +
                '<input class="sr-input" type="text" id="sr-prenom" placeholder="Jean" autocomplete="given-name">' +
              '</div>' +
              '<div class="sr-field">' +
                '<label class="sr-label">Nom</label>' +
                '<input class="sr-input" type="text" id="sr-nom" placeholder="Dupont" autocomplete="family-name">' +
              '</div>' +
            '</div>' +
            '<div class="sr-field">' +
              '<label class="sr-label">Email</label>' +
              '<input class="sr-input" type="email" id="sr-email" placeholder="pilote@email.com" autocomplete="email">' +
            '</div>' +
            '<div class="sr-field">' +
              '<label class="sr-label">Téléphone</label>' +
              '<input class="sr-input" type="tel" id="sr-tel" placeholder="06 XX XX XX XX" autocomplete="tel">' +
            '</div>' +

            '<div class="sr-field">' +
              '<label class="sr-label">Véhicule</label>' +
              '<div class="sr-veh-grid">' +
                '<div class="sr-veh-option selected" onclick="selectVeh(this,0)">' +
                  '<div class="sr-veh-icon">🏎️</div>' +
                  '<div class="sr-veh-name">Ma propre voiture</div>' +
                  '<div class="sr-veh-sub">Inclus dans le tarif</div>' +
                '</div>' +
                '<div class="sr-veh-option" onclick="selectVeh(this,' + LOCATION + ')">' +
                  '<div class="sr-veh-icon">⭐</div>' +
                  '<div class="sr-veh-name">Location JB EMERIC</div>' +
                  '<div class="sr-veh-sub">+ ' + LOCATION + ' € / session</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="sr-field">' +
              '<label class="sr-label">Équipements (cocher pour confirmer)</label>' +
              '<div class="sr-checklist">' +
                item('J\'ai mon assurance Responsabilité Civile Sport Auto', '🛡️') +
                item('J\'ai mon casque homologué (ou je souhaite en louer un)', '⛑️') +
                item('J\'ai un crochet de remorquage sur mon véhicule', '🔗') +
                item('J\'ai lu et accepté le règlement intérieur JB EMERIC', '📋') +
              '</div>' +
            '</div>' +

            '<div class="sr-field">' +
              '<label class="sr-label">Option Coaching</label>' +
              '<div class="sr-coaching-opt" id="coaching-opt" onclick="toggleCoaching()">' +
                '<div class="sr-coaching-toggle"></div>' +
                '<div class="sr-coaching-info">' +
                  '<div class="sr-coaching-name">Coaching personnalisé JB sur place</div>' +
                  '<div class="sr-coaching-sub">+ ' + COACHING + ' € · Suivi individuel toute la journée</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="sr-recap">' +
              '<div class="sr-recap-row">' +
                '<span class="sr-recap-label">Session Track-Day</span>' +
                '<span class="sr-recap-val" id="price-base">' + base + ' €</span>' +
              '</div>' +
              '<div class="sr-recap-row" id="recap-veh-row" style="display:none">' +
                '<span class="sr-recap-label">Location véhicule JB</span>' +
                '<span class="sr-recap-val">+ ' + LOCATION + ' €</span>' +
              '</div>' +
              '<div class="sr-recap-row" id="recap-coach-row" style="display:none">' +
                '<span class="sr-recap-label">Coaching JB sur place</span>' +
                '<span class="sr-recap-val">+ ' + COACHING + ' €</span>' +
              '</div>' +
              '<div class="sr-recap-row sr-recap-total">' +
                '<span class="sr-recap-label">Total</span>' +
                '<span class="sr-recap-val" id="price-total">' + base + ' €</span>' +
              '</div>' +
            '</div>' +

          '</div>' +

          '<div class="sr-modal-footer">' +
            '<button class="sr-btn-cancel" onclick="closeModal()">Annuler</button>' +
            '<button class="sr-btn-confirm" onclick="confirmInscription()">Confirmer l\'inscription →</button>' +
          '</div>' +
        '</div>' +

        '<div class="sr-confirm-screen" id="sr-confirm-view">' +
          '<div class="sr-confirm-icon">✓</div>' +
          '<div class="sr-confirm-title">Inscription envoyée !</div>' +
          '<p class="sr-confirm-sub">' +
            'JB vous contactera dans les 24h pour confirmer votre place et vous envoyer les détails pratiques.<br>' +
            'Il écrira à <strong id="confirm-email" style="color:#fff">votre adresse</strong>, vérifiez qu\'elle est juste.<br><br>' +
            '<strong style="color:#fff"><a href="mailto:jbemeric@jbemeric.com">jbemeric@jbemeric.com</a> · 06 60 18 87 87</strong>' +
          '</p>' +
          '<button class="sr-btn-inscr" style="margin-top:8px;padding:12px 28px" onclick="closeModal()">Fermer</button>' +
        '</div>' +

      '</div>'
    document.body.appendChild(d)
  }

  function item(texte, icone) {
    return '<div class="sr-check-item" onclick="toggleCheck(this)">' +
      '<div class="sr-check-box"></div>' +
      '<div class="sr-check-text">' + texte + '</div>' +
      '<div class="sr-check-icon">' + icone + '</div>' +
    '</div>'
  }

  function el(id) { return document.getElementById(id) }

  function majTotal() {
    var total = base + (avecVehicule ? LOCATION : 0) + (avecCoaching ? COACHING : 0)
    el('price-total').textContent = total + ' €'
    el('recap-veh-row').style.display   = avecVehicule ? '' : 'none'
    el('recap-coach-row').style.display = avecCoaching ? '' : 'none'
  }

  // ── Ce que la page appelle ────────────────────────────────────────────────
  window._currentEventId = null

  window.openModal = function (titre, prix, circuit, eventId) {
    poser()
    base = prix
    window._currentEventId = eventId || null
    avecVehicule = false
    avecCoaching = false

    el('modal-title').textContent = titre
    el('modal-sub').textContent   = 'Inscription · JB EMERIC'
    el('price-base').textContent  = prix + ' €'
    el('price-total').textContent = prix + ' €'
    el('recap-veh-row').style.display   = 'none'
    el('recap-coach-row').style.display = 'none'

    // La fiche est rouverte plusieurs fois de suite sur la même page. Sans
    // cette remise à zéro, elle rouvrirait avec les cases de la fois d'avant.
    var cases = document.querySelectorAll('.sr-check-item')
    for (var i = 0; i < cases.length; i++) {
      cases[i].classList.remove('checked')
      cases[i].querySelector('.sr-check-box').textContent = ''
    }
    var vehs = document.querySelectorAll('.sr-veh-option')
    for (var v = 0; v < vehs.length; v++) vehs[v].classList.toggle('selected', v === 0)
    el('coaching-opt').classList.remove('selected')

    var erreur = el('sr-erreur')
    if (erreur) erreur.remove()

    el('sr-form-view').style.display    = ''
    el('sr-confirm-view').style.display = 'none'
    el('sr-modal-overlay').classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  window.closeModal = function () {
    var voile = el('sr-modal-overlay')
    if (voile) voile.classList.remove('open')
    document.body.style.overflow = ''
  }

  window.closeModalOutside = function (e) {
    if (e.target === el('sr-modal-overlay')) window.closeModal()
  }

  // Échap ferme la fiche. L'écoute vit ici, à côté de la fonction qu'elle
  // appelle : posée en bas de `track-render.js`, elle a appelé pendant des
  // semaines une seconde version de closeModal qui ne fermait que la boîte et
  // laissait le voile en place, soit un écran sombre et vide.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeModal()
  })

  window.selectVeh = function (element, supplement) {
    var vehs = document.querySelectorAll('.sr-veh-option')
    for (var i = 0; i < vehs.length; i++) vehs[i].classList.remove('selected')
    element.classList.add('selected')
    avecVehicule = supplement > 0
    majTotal()
  }

  window.toggleCheck = function (element) {
    element.classList.toggle('checked')
    element.querySelector('.sr-check-box').textContent =
      element.classList.contains('checked') ? '✓' : ''
  }

  window.toggleCoaching = function () {
    var opt = el('coaching-opt')
    opt.classList.toggle('selected')
    avecCoaching = opt.classList.contains('selected')
    majTotal()
  }

  window.confirmInscription = function () {
    var prenom = (el('sr-prenom') || {}).value || ''
    var nom    = (el('sr-nom')    || {}).value || ''
    var email  = (el('sr-email')  || {}).value || ''
    var tel    = (el('sr-tel')    || {}).value || ''
    if (!prenom || !nom || !email) {
      alert('Veuillez remplir votre prénom, nom et email.')
      return
    }

    function afficherConfirmation() {
      el('sr-form-view').style.display = 'none'
      var vue = el('sr-confirm-view')
      if (vue) vue.style.display = 'flex'
      var adresse = el('confirm-email')
      if (adresse) adresse.textContent = email
    }

    // Quand l'enregistrement échoue, le formulaire reste à l'écran avec ses
    // valeurs, et un moyen de joindre JB directement.
    function afficherEchec() {
      var vue = el('sr-form-view')
      if (!vue) return
      var msg = el('sr-erreur')
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
    // Avant le 8 août 2026, l'erreur était avalée par un « .catch(function(){}) »
    // et l'écran de confirmation s'affichait quoi qu'il arrive, sans même
    // attendre la réponse. Un visiteur pouvait repartir en croyant sa place
    // réservée alors que rien n'était enregistré. C'est le pire défaut
    // possible sur un formulaire : il ne se voit ni côté client, ni côté JB.
    fetch(SB_URL + 'inscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_name: prenom + ' ' + nom,
        prenom:    prenom,
        nom:       nom,
        email:     email,
        telephone: tel,
        coaching_requested: avecCoaching || false,
        avec_vehicule: avecVehicule || false,
        avec_coaching: avecCoaching || false,
        event_id:  window._currentEventId || null,
        statut:    'en_attente'
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status)
      afficherConfirmation()
    }).catch(function () {
      afficherEchec()
    })
  }
})()
