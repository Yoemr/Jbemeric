// evenement.js : une seule page pour tous les événements.
//
// ── Le principe ─────────────────────────────────────────────────────────────
// Il n'y a pas une page par événement, il y a un patron. L'adresse porte le
// slug, la page va chercher la ligne correspondante et se remplit.
//
//   /evenement/track-day-ledenon-19-septembre
//
// Ajouter un événement dans le dashboard suffira donc à créer sa page. Aucun
// fichier à écrire, aucun déploiement à déclencher.
//
// ── Ce qui est commun, ce qui est spécifique ────────────────────────────────
// Commun : la structure, le CSS, le menu, le pied de page, la mécanique des
// boutons. Écrits une fois, ici et dans evenement.css.
//
// Spécifique : la photo, la date, le titre, le texte, le prix, le mode. Tout
// cela vit dans la base, jamais dans le code.
//
// ── L'adresse ───────────────────────────────────────────────────────────────
// _redirects réécrit /evenement/<slug> vers cette page sans changer l'URL
// affichée. On lit donc le slug dans le chemin, et à défaut dans ?e=, qui sert
// en local quand aucune réécriture ne tourne.

(function () {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
  var SB_H   = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }

  var MOIS  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
  var JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']

  var TEL_JB  = '+33660188787'
  var TEL_LU  = '06 60 18 87 87'
  var MAIL_JB = 'jbemeric@jbemeric.com'

  // Les modes où JB n'est pas le vendeur. Le pilote s'inscrit chez
  // l'organisateur pour rouler, et paie JB pour le coaching.
  var MODES_TIERS = { box: 1, coaching: 1, greffe: 1 }

  function ech(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function slugDemande() {
    var m = location.pathname.match(/\/evenement\/([a-z0-9-]+)\/?$/)
    if (m) return m[1]
    var p = new URLSearchParams(location.search).get('e')
    return p && /^[a-z0-9-]+$/.test(p) ? p : null
  }

  function enClair(iso) {
    var d = new Date(iso + 'T12:00:00')
    return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear()
  }

  // Le texte libre saisi par JB. Les lignes vides séparent les paragraphes, et
  // rien n'est interprété comme du HTML : c'est du texte, il reste du texte.
  function paragraphes(texte) {
    return String(texte || '').split(/\n\s*\n/)
      .map(function (p) { return p.trim() })
      .filter(Boolean)
      .map(function (p) { return '<p>' + ech(p).replace(/\n/g, '<br>') + '</p>' })
      .join('')
  }

  function absent(titre, texte) {
    document.getElementById('ev-contenu').innerHTML =
      '<div class="ev-absent">' +
        '<h1>' + ech(titre) + '</h1>' +
        '<p>' + ech(texte) + '</p>' +
        '<a class="ev-btn ev-btn-or" href="track.html">Voir toutes les dates</a>' +
      '</div>'
    document.title = titre + ' · JB EMERIC'
  }

  function actions(ev) {
    if (ev.status !== 'Open') {
      return '<div class="ev-info">Cette date n\'est pas encore ouverte aux inscriptions. '
           + 'Appelez JB pour être prévenu quand elle le sera.</div>'
    }
    if (ev.mode === 'moniteur') {
      return '<div class="ev-info">JB encadre pour une autre école ce jour-là. '
           + 'Il n\'y a rien à réserver ici.</div>'
    }

    var reserver = '<button class="ev-btn ev-btn-or" data-inscr>'
                 + (MODES_TIERS[ev.mode] ? 'Réserver JB' : 'S\'inscrire') + '</button>'

    if (!MODES_TIERS[ev.mode]) return reserver

    var chez = ev.organisateur ? 'chez ' + ech(ev.organisateur) : 'chez l\'organisateur'
    // Sans adresse connue, on ne fabrique pas un lien mort.
    var premier = ev.lien_organisateur
      ? '<a class="ev-btn ev-btn-creux" href="' + ech(ev.lien_organisateur) + '" target="_blank" rel="noopener">'
        + 'S\'inscrire ' + chez + '</a>'
      : '<div class="ev-info">L\'inscription à la journée se fait ' + chez + '. '
        + 'Appelez JB, il vous dira comment.</div>'

    return premier + reserver
  }

  function afficher(ev) {
    var circuit = ev.circuits ? ev.circuits.nom : 'Circuit à confirmer'
    var region  = ev.circuits && ev.circuits.region ? ev.circuits.region : ''
    var photo   = ev.photo || 'assets/images/karting-adulte-circuit.jpg'
    var prix    = ev.prix ? parseFloat(ev.prix) : null
    var places  = Math.max(0, (ev.nb_places || 0) - (ev.nb_inscrits || 0))

    var faits = []
    if (region) faits.push('<span class="ev-fait">' + ech(region) + '</span>')
    if (ev.type) faits.push('<span class="ev-fait">' + ech(ev.type) + '</span>')
    if (ev.nb_places) faits.push('<span class="ev-fait"><strong>' + ev.nb_places + '</strong> pilotes au maximum</span>')
    if (ev.organisateur) faits.push('<span class="ev-fait">organisé par ' + ech(ev.organisateur) + '</span>')

    document.getElementById('ev-contenu').innerHTML =
      '<header class="ev-hero">' +
        '<img src="' + ech(photo) + '" alt="' + ech(ev.type || 'Journée circuit') + ', ' + ech(circuit) + '">' +
        '<div class="ev-hero-voile"></div>' +
        '<div class="ev-hero-dedans">' +
          '<div class="ev-fil"><a href="track.html">Événements</a> · ' + ech(ev.type || 'Journée circuit') + '</div>' +
          '<div class="ev-quand">' + enClair(ev.date_event) + '</div>' +
          '<h1 class="ev-titre">' + ech(circuit) + '</h1>' +
          (ev.resume ? '<p class="ev-ou">' + ech(ev.resume) + '</p>' : '') +
          (faits.length ? '<div class="ev-faits">' + faits.join('') + '</div>' : '') +
        '</div>' +
      '</header>' +

      '<div class="ev-corps">' +
        '<div class="ev-texte">' +
          (paragraphes(ev.description) || '<p>Le détail de cette journée arrive. Appelez JB, il vous dira tout.</p>') +
        '</div>' +
        '<aside class="ev-agir">' +
          (prix !== null
            ? '<div class="ev-prix">' + prix + ' €<small>' +
              (MODES_TIERS[ev.mode] ? 'le coaching, la journée' : 'par pilote, la journée') + '</small></div>'
            : '') +
          '<div class="ev-places">' +
            (places > 0
              ? '<strong>' + places + '</strong> place' + (places > 1 ? 's' : '') + ' restante' + (places > 1 ? 's' : '')
              : 'Complet') +
          '</div>' +
          '<div class="ev-boutons">' + actions(ev) + '</div>' +
          '<div class="ev-joindre">' +
            'Une question sur cette date ?<br>' +
            '<a href="tel:' + TEL_JB + '">' + TEL_LU + '</a> · ' +
            '<a href="mailto:' + MAIL_JB + '">' + MAIL_JB + '</a>' +
          '</div>' +
        '</aside>' +
      '</div>'

    // Le titre et la description de la page viennent de l'événement, sinon
    // toutes les pages d'événement partageraient le même titre.
    document.title = (ev.type || 'Journée circuit') + ' · ' + circuit + ' · ' + enClair(ev.date_event) + ' · JB EMERIC'
    var desc = document.querySelector('meta[name="description"]')
    if (desc && ev.resume) desc.setAttribute('content', ev.resume)
    var canon = document.querySelector('link[rel="canonical"]')
    if (canon && ev.slug) canon.setAttribute('href', location.origin + '/evenement/' + ev.slug)

    // La fiche d'inscription est celle de track.html, chargée par le même
    // script. Elle n'est pas réécrite ici.
    var bouton = document.querySelector('[data-inscr]')
    if (bouton && typeof window.openModal === 'function') {
      bouton.addEventListener('click', function () {
        window.openModal(ev.type || 'Journée circuit', prix || 195, circuit, ev.id)
      })
    } else if (bouton) {
      // Sans la fiche, le bouton renverrait dans le vide. On l'envoie sur la
      // page qui la porte plutôt que de ne rien faire.
      bouton.addEventListener('click', function () { location.href = 'track.html#sessions' })
    }
  }

  var slug = slugDemande()
  if (!slug) {
    absent('Quelle date ?', 'Cette adresse ne désigne aucun événement.')
    return
  }

  fetch(SB_URL + 'events?slug=eq.' + encodeURIComponent(slug)
        + '&select=id,slug,date_event,type,status,prix,nb_places,nb_inscrits,mode,organisateur,'
        + 'lien_organisateur,photo,resume,description,visible_site,circuits(nom,region)',
        { headers: SB_H })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    .then(function (lignes) {
      var ev = lignes && lignes[0]
      if (!ev || !ev.visible_site) {
        return absent('Cette date n\'existe plus',
          'Elle a peut-être été retirée ou déplacée. Les dates à venir sont sur la page Événements.')
      }
      afficher(ev)
    })
    .catch(function () {
      absent('Le calendrier ne répond pas',
        'Impossible d\'afficher cette date pour l\'instant. Rechargez dans un moment, ou appelez JB au ' + TEL_LU + '.')
    })
})()
