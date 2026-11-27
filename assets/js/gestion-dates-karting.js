// gestion-dates-karting.js : l'onglet des dates karting.
//
// Demande de Yoan, 7 novembre 2026 : JB crée, modifie et supprime ses dates.
// Une date karting est une ligne de la table `events` qui pointe une formule.
// Le nom affiché, le prix et les places viennent de la formule quand JB les
// laisse vides. « Afficher sur le site » la fait apparaître dans la section
// Dates de l'accueil et de l'Académie (dates.js).

;(function () {
  var MOIS = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']
  function enClair(iso) {
    if (!iso) return ''
    var d = new Date(iso + 'T12:00:00')
    return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear()
  }

  var STATUTS = [
    { valeur: 'Open',      titre: 'Ouvert aux réservations' },
    { valeur: 'Full',      titre: 'Complet' },
    { valeur: 'Potential', titre: 'En préparation' },
    { valeur: 'Draft',     titre: 'Brouillon' },
  ]

  // Formules et circuits viennent de la base : JB en ajoute sans toucher au code.
  var formules = [{ valeur: '', titre: 'Chargement…' }]
  var parFormule = {}
  JBE.requete('formules?select=id,libelle,prix_conseille,places_defaut&nature=in.(karting,groupe)&actif=eq.true&order=ordre.asc')
    .then(function (l) {
      formules.length = 0
      formules.push({ valeur: '', titre: 'Choisir une formule' })
      l.forEach(function (f) { parFormule[f.id] = f; formules.push({ valeur: f.id, titre: f.libelle }) })
    })
    .catch(function () { formules[0] = { valeur: '', titre: 'Formules injoignables' } })

  var circuits = [{ valeur: '', titre: 'Chargement…' }]
  JBE.requete('circuits?select=id,nom&order=nom')
    .then(function (l) {
      circuits.length = 0
      circuits.push({ valeur: '', titre: 'Aucun circuit' })
      l.forEach(function (c) { circuits.push({ valeur: c.id, titre: c.nom }) })
    })
    .catch(function () { circuits[0] = { valeur: '', titre: 'Circuits injoignables' } })

  JBE.onglet({
    cle:   'dates-karting',
    titre: 'Dates karting',
    table: 'events',
    voir:  '/academie.html#dates',
    tri:   'date_event.desc',
    restreindre: 'formule_id=not.is.null',

    nommer: function (l) { return enClair(l.date_event) + ', ' + (l.type || 'journée') },
    vide: 'Aucune date karting. Le bouton « Nouveau » crée la première.',

    colonnes: [
      { titre: 'Date', rendu: function (l) { return JBE.ech(enClair(l.date_event)) } },
      { cle: 'type', titre: 'Formule' },
      {
        titre: 'Places',
        rendu: function (l) {
          if (!l.nb_places) return '<span class="g-fade">non limité</span>'
          return JBE.ech((l.nb_inscrits || 0) + ' / ' + l.nb_places)
        },
      },
      { titre: 'Prix', rendu: function (l) { return l.prix == null ? '' : JBE.ech(l.prix + ' €') } },
      {
        titre: 'Sur le site',
        rendu: function (l) { return l.visible_site ? '<span class="g-oui">oui</span>' : '<span class="g-non">non</span>' },
      },
    ],

    champs: [
      { cle: 'formule_id', titre: 'Formule', type: 'choix', options: formules, obligatoire: true },
      { cle: 'date_event', titre: 'Date', type: 'date', obligatoire: true },
      { cle: 'circuit_id', titre: 'Circuit', type: 'choix', options: circuits, defaut: 1 },
      { cle: 'prix', titre: 'Prix par personne', type: 'number', pas: '5',
        aide: 'Vide : le prix de la formule.' },
      { cle: 'nb_places', titre: 'Places', type: 'number',
        aide: 'Vide : les places de la formule.' },
      { cle: 'status', titre: 'Statut', type: 'choix', options: STATUTS, defaut: 'Open' },
      { cle: 'visible_site', titre: 'Afficher sur le site', type: 'bascule', defaut: true, oui: 'en ligne' },
    ],

    completer: function (corps) {
      corps.formule_id = corps.formule_id ? Number(corps.formule_id) : null
      corps.circuit_id = corps.circuit_id ? Number(corps.circuit_id) : null
      var f = parFormule[corps.formule_id]
      if (f) {
        corps.type = f.libelle
        if (corps.prix == null) corps.prix = f.prix_conseille
        if (corps.nb_places == null) corps.nb_places = f.places_defaut
      }
      return corps
    },
  })
})()
