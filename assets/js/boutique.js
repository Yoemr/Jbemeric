// boutique.js : réserver une journée ou offrir un bon cadeau, payé par PayPal.
//
// Fiche : docs/chantiers/2026-11-10-boutique.md.
//
// ── Ce que fait ce script ────────────────────────────────────────────────────
// Il demande d'abord à la fonction paiement-config si la boutique est ouverte
// (les clés PayPal sont rangées dans Netlify). Si elle ne l'est pas, il ne
// fait rien : les boutons « Réserver » gardent leur lien vers le formulaire de
// contact, le site fonctionne comme avant.
//
// Si elle l'est :
//   - tout lien portant data-reserver="<id de la date>" ouvre la fenêtre de
//     réservation (dates.js les pose sur les cartes de dates) ;
//   - tout élément data-offrir ouvre la fenêtre du bon cadeau ;
//   - tout élément data-pp-montant="195" reçoit le message officiel de PayPal
//     sur le paiement en 4 fois, si le compte de l'association y a droit.
//
// Le prix affiché vient de la page, mais le prix payé est relu dans la base
// par paiement-creer : le navigateur ne décide jamais du montant.
(function () {
  var FN = '/.netlify/functions/'
  var SB = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  // Le texte de la FAQ de JB (question « Et s'il pleut, ou si je dois annuler ? »).
  var CONDITIONS = 'Les journées ont lieu même sous la pluie. Un report de date se demande au moins 15 jours avant. ' +
    'Une annulation se notifie par lettre recommandée : jusqu\'à 11 jours avant, JB conserve l\'acompte de 30 % ; ' +
    'à moins de 10 jours, le règlement complet est conservé. Si le circuit annule, ou pour une raison de sécurité, un report est proposé.'

  var etat = { config: null, sdk: null }

  function ech(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
  function poster(nom, corps) {
    return fetch(FN + nom, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.erreur || 'Erreur ' + r.status); return j }) })
  }

  // ── Le script PayPal, chargé une seule fois ────────────────────────────────
  function chargerPaypal() {
    if (etat.sdk) return etat.sdk
    etat.sdk = new Promise(function (ok, ko) {
      var s = document.createElement('script')
      s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(etat.config.clientId) +
        '&currency=EUR&locale=fr_FR&intent=capture&components=buttons,messages&enable-funding=paylater,card'
      s.onload = function () { ok(window.paypal) }
      s.onerror = function () { ko(new Error('PayPal ne répond pas')) }
      document.head.appendChild(s)
    })
    return etat.sdk
  }

  // ── La fenêtre ─────────────────────────────────────────────────────────────
  function fenetre(titre, corpsHtml) {
    fermer()
    var f = document.createElement('div')
    f.className = 'btq-fond'
    f.innerHTML = '<div class="btq-fenetre" role="dialog" aria-modal="true" aria-label="' + ech(titre) + '">' +
      '<button type="button" class="btq-fermer" aria-label="Fermer">×</button>' +
      '<h2 class="btq-titre">' + ech(titre) + '</h2>' + corpsHtml + '</div>'
    document.body.appendChild(f)
    f.addEventListener('click', function (e) { if (e.target === f || e.target.closest('.btq-fermer')) fermer() })
    document.addEventListener('keydown', echap)
    var premier = f.querySelector('input, select, textarea')
    if (premier) premier.focus()
    return f.querySelector('.btq-fenetre')
  }
  function echap(e) { if (e.key === 'Escape') fermer() }
  function fermer() {
    var f = document.querySelector('.btq-fond')
    if (f) f.remove()
    document.removeEventListener('keydown', echap)
  }
  function champ(nom, titre, type, requis, extra) {
    return '<label class="btq-champ"><span>' + ech(titre) + (requis ? '' : ' <em>(facultatif)</em>') + '</span>' +
      '<input name="' + nom + '" type="' + (type || 'text') + '"' + (requis ? ' required' : '') + (extra || '') + '></label>'
  }
  function lire(boite) {
    var v = {}
    boite.querySelectorAll('input, select, textarea').forEach(function (i) { v[i.name] = i.type === 'checkbox' ? i.checked : i.value.trim() })
    return v
  }
  function message(boite, texte, type) {
    var m = boite.querySelector('.btq-message')
    m.className = 'btq-message btq-message--' + (type || 'err')
    m.textContent = texte
  }
  function valide(boite) {
    var manque = [].filter.call(boite.querySelectorAll('[required]'), function (i) { return i.type === 'checkbox' ? !i.checked : !i.value.trim() })
    if (manque.length) { message(boite, 'Il manque : ' + manque.map(function (i) { return i.closest('label').querySelector('span').textContent.replace(' (facultatif)', '') }).join(', ') + '.'); return false }
    return true
  }

  // Les boutons PayPal, branchés sur nos deux fonctions.
  function boutons(boite, demande, reussite) {
    var zone = boite.querySelector('.btq-paypal')
    zone.innerHTML = '<p class="btq-attente">Chargement de PayPal…</p>'
    chargerPaypal().then(function (paypal) {
      zone.innerHTML = ''
      paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
        onClick: function (data, actions) { return valide(boite) ? actions.resolve() : actions.reject() },
        createOrder: function () { return poster('paiement-creer', demande()).then(function (r) { return r.orderID }) },
        onApprove: function (data) { return poster('paiement-valider', { orderID: data.orderID }).then(reussite) },
        onError: function (e) { message(boite, (e && e.message) || 'Le paiement n\'a pas abouti. Réessayez, ou appelez JB au 06 60 18 87 87.') },
      }).render(zone)
    }).catch(function () {
      zone.innerHTML = ''
      message(boite, 'PayPal ne répond pas pour le moment. Appelez JB au 06 60 18 87 87.')
    })
  }

  function confirmation(boite, titre, texte) {
    boite.innerHTML = '<button type="button" class="btq-fermer" aria-label="Fermer">×</button>' +
      '<h2 class="btq-titre">' + ech(titre) + '</h2><p class="btq-confirme">' + texte + '</p>' +
      '<p class="btq-note">PayPal vous envoie le reçu par email. Une question : 06 60 18 87 87.</p>'
  }

  // ── Réserver une journée ───────────────────────────────────────────────────
  function reserver(lien) {
    var d = lien.dataset
    var enfant = /enfant/i.test(d.libelle || '')
    var boite = fenetre('Réserver votre journée',
      '<p class="btq-resume"><strong>' + ech(d.libelle) + '</strong><br>' + ech(d.quand || '') + (d.lieu ? ' · ' + ech(d.lieu) : '') + '</p>' +
      '<p class="btq-prix">' + ech(d.prix) + ' €</p><div class="btq-4x" data-pp-montant="' + ech(d.prix) + '"></div>' +
      '<div class="btq-grille">' +
        champ('prenom', enfant ? 'Prénom du pilote' : 'Prénom', 'text', true, ' autocomplete="given-name"') +
        champ('nom', enfant ? 'Nom du pilote' : 'Nom', 'text', true, ' autocomplete="family-name"') +
        (enfant ? champ('age', 'Âge du pilote', 'number', true, ' min="4" max="17"') : '') +
        champ('email', enfant ? 'Email d\'un parent' : 'Email', 'email', true, ' autocomplete="email"') +
        champ('telephone', 'Téléphone', 'tel', false, ' autocomplete="tel"') +
        champ('bon_code', 'Code d\'un bon cadeau', 'text', false, ' placeholder="JB-XXXX-XXXX"') +
      '</div>' +
      '<label class="btq-case"><input type="checkbox" name="conditions" required> <span>J\'ai lu les conditions : ' + ech(CONDITIONS) + '</span></label>' +
      '<p class="btq-message" role="alert"></p>' +
      '<button type="button" class="btq-code">Réserver avec mon bon cadeau</button>' +
      '<div class="btq-paypal"></div>')
    function demande() { return Object.assign({ quoi: 'journee', event_id: d.reserver }, lire(boite)) }
    var codeBtn = boite.querySelector('.btq-code')
    var codeChamp = boite.querySelector('[name=bon_code]')
    function bascule() {
      var avecCode = !!codeChamp.value.trim()
      codeBtn.hidden = !avecCode
      boite.querySelector('.btq-paypal').hidden = avecCode
    }
    codeChamp.addEventListener('input', bascule); bascule()
    codeBtn.addEventListener('click', function () {
      if (!valide(boite)) return
      poster('paiement-creer', demande()).then(function () {
        confirmation(boite, 'Réservation confirmée', 'Votre bon cadeau règle la journée du ' + ech(d.quand || '') + '. À bientôt sur la piste.')
      }).catch(function (e) { message(boite, e.message) })
    })
    boutons(boite, demande, function () {
      confirmation(boite, 'Réservation confirmée', 'Merci, votre place est réservée pour le ' + ech(d.quand || '') + '. À bientôt sur la piste.')
    })
    messages4x(boite)
  }

  // ── Offrir un bon cadeau ───────────────────────────────────────────────────
  function offrir() {
    var boite = fenetre('Offrir une journée', '<p class="btq-attente">Chargement des formules…</p>')
    fetch(SB + 'formules?select=id,libelle,prix_conseille&actif=eq.true&bon_cadeau=eq.true&order=ordre.asc',
          { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
      .then(function (r) { return r.json() })
      .then(function (formules) {
        formules = (formules || []).filter(function (f) { return f.prix_conseille > 0 })
        if (!formules.length) { boite.querySelector('.btq-attente').textContent = 'Aucune formule à offrir pour le moment. Appelez JB au 06 60 18 87 87.'; return }
        boite.querySelector('.btq-attente').outerHTML =
          '<label class="btq-champ"><span>La journée offerte</span><select name="formule_id">' +
            formules.map(function (f) { return '<option value="' + f.id + '" data-prix="' + f.prix_conseille + '">' + ech(f.libelle) + ' · ' + f.prix_conseille + ' €</option>' }).join('') +
          '</select></label>' +
          '<div class="btq-4x" data-pp-montant="' + formules[0].prix_conseille + '"></div>' +
          '<div class="btq-grille">' +
            champ('acheteur_nom', 'Votre nom', 'text', true, ' autocomplete="name"') +
            champ('acheteur_email', 'Votre email', 'email', true, ' autocomplete="email"') +
            champ('beneficiaire', 'Pour qui', 'text', false) +
          '</div>' +
          '<label class="btq-champ"><span>Un mot pour accompagner le cadeau <em>(facultatif)</em></span><textarea name="message" rows="2" maxlength="500"></textarea></label>' +
          '<p class="btq-note">Le bon n\'a pas de durée de validité. La personne qui le reçoit réserve ensuite sa date avec son code.</p>' +
          '<p class="btq-message" role="alert"></p><div class="btq-paypal"></div>'
        boutons(boite, function () { return Object.assign({ quoi: 'cadeau' }, lire(boite)) }, function (r) {
          confirmation(boite, 'Merci pour ce cadeau', 'Voici le code du bon « ' + ech(r.libelle) + ' » : <strong class="btq-code-bon">' + ech(r.code) + '</strong><br>Notez-le ou faites une capture d\'écran : c\'est lui que la personne saisira pour réserver sa date.')
        })
        messages4x(boite)
      })
      .catch(function () { boite.querySelector('.btq-attente').textContent = 'Les formules ne se chargent pas. Appelez JB au 06 60 18 87 87.' })
  }

  // ── Le paiement en 4 fois, par le module officiel de PayPal ───────────────
  function messages4x(racine) {
    var zones = (racine || document).querySelectorAll('[data-pp-montant]')
    if (!zones.length) return
    chargerPaypal().then(function (paypal) {
      if (!paypal.Messages) return
      zones.forEach(function (z) {
        var montant = parseFloat(z.getAttribute('data-pp-montant'))
        if (montant > 0) paypal.Messages({ amount: montant, placement: 'product', style: { layout: 'text', text: { color: 'black', size: 12 } } }).render(z)
      })
    }).catch(function () {})
  }

  // ── Démarrage ──────────────────────────────────────────────────────────────
  function brancher() {
    document.addEventListener('click', function (e) {
      if (!etat.config) return
      var l = e.target.closest && e.target.closest('[data-reserver]')
      if (l) { e.preventDefault(); return reserver(l) }
      var o = e.target.closest && e.target.closest('[data-offrir]')
      if (o) { e.preventDefault(); return offrir() }
    })
    // dates.js remplit ses cartes après coup : les messages 4x suivent.
    document.addEventListener('jbe-dates-chargees', function () { messages4x() })
    messages4x()
    document.querySelectorAll('[data-offrir]').forEach(function (b) { b.hidden = false })
  }

  fetch(FN + 'paiement-config')
    .then(function (r) { return r.ok ? r.json() : { active: false } })
    .then(function (c) { if (c && c.active) { etat.config = c; brancher() } })
    .catch(function () { /* boutique fermée : le site garde ses liens vers le contact */ })
})()
