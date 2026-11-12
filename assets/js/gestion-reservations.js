// gestion-reservations.js : l'onglet Réservations de la boutique.
//
// Les réservations payées arrivent seules, par paiement-valider. JB les lit
// ici, peut noter quelque chose, changer un statut (annulée, confirmée à la
// main pour un paiement reçu autrement) ou supprimer une réservation restée
// en attente. La jauge des places de la date suit (déclencheur de la base).

;(function () {
  var MOIS = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']
  function enClair(iso) {
    if (!iso) return ''
    var d = new Date(iso + 'T12:00:00')
    return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear()
  }
  var STATUTS = [
    { valeur: 'payee',            titre: 'Payée' },
    { valeur: 'confirmee',        titre: 'Confirmée (bon cadeau ou à la main)' },
    { valeur: 'attente_paiement', titre: 'Paiement non terminé' },
    { valeur: 'annulee',          titre: 'Annulée' },
  ]
  var NOM = {}; STATUTS.forEach(function (s) { NOM[s.valeur] = s.titre })

  JBE.onglet({
    cle:   'reservations',
    titre: 'Réservations',
    table: 'inscriptions',
    select: '*,events(date_event,type)',
    tri:   'created_at.desc',
    restreindre: 'statut=in.(payee,confirmee,attente_paiement,annulee)',
    voir:  '/academie.html#dates',
    boutonNouveau: false,

    nommer: function (l) { return (l.prenom || '') + ' ' + (l.nom || '') },
    vide: 'Aucune réservation pour l\'instant. Elles arrivent ici dès qu\'un client paie une date.',

    colonnes: [
      { titre: 'Date', rendu: function (l) { return JBE.ech(enClair(l.events && l.events.date_event)) } },
      { titre: 'Formule', rendu: function (l) { return JBE.ech(l.events && l.events.type) } },
      { titre: 'Pilote', rendu: function (l) { return JBE.ech((l.prenom || '') + ' ' + (l.nom || '') + (l.age ? ', ' + l.age + ' ans' : '')) } },
      { titre: 'Contact', rendu: function (l) {
          return '<a class="g-lien" href="mailto:' + JBE.ech(l.email) + '">' + JBE.ech(l.email) + '</a>' +
            (l.telephone ? '<br><a class="g-lien" href="tel:' + JBE.ech(l.telephone) + '">' + JBE.ech(l.telephone) + '</a>' : '')
        } },
      { titre: 'Réglé', rendu: function (l) { return l.bon_code ? 'Bon ' + JBE.ech(l.bon_code) : (l.montant ? JBE.ech(l.montant + ' €') : '') } },
      { titre: 'Statut', rendu: function (l) {
          var c = l.statut === 'payee' || l.statut === 'confirmee' ? 'g-oui' : 'g-non'
          return '<span class="' + c + '">' + JBE.ech(NOM[l.statut] || l.statut) + '</span>'
        } },
    ],

    champs: [
      { cle: 'statut', titre: 'Statut', type: 'choix', options: STATUTS },
      { cle: 'notes', titre: 'Note de JB', type: 'texte-long', lignes: 3, aide: 'Jamais montrée au client.' },
    ],
  })
})()
