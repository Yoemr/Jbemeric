// gestion-bons.js : l'onglet Bons cadeaux de la boutique.
//
// Un bon payé arrive seul, avec son code (paiement-valider). Il n'expire pas,
// règle de JB. Il passe « utilisé » quand son code règle une date.

;(function () {
  var STATUTS = [
    { valeur: 'paye',             titre: 'Payé, à utiliser' },
    { valeur: 'utilise',          titre: 'Utilisé' },
    { valeur: 'attente_paiement', titre: 'Paiement non terminé' },
    { valeur: 'annule',           titre: 'Annulé' },
  ]
  var NOM = {}; STATUTS.forEach(function (s) { NOM[s.valeur] = s.titre })

  JBE.onglet({
    cle:   'bons',
    titre: 'Bons cadeaux',
    table: 'bons_cadeaux',
    tri:   'cree_le.desc',
    voir:  '/academie.html',
    boutonNouveau: false,

    nommer: function (l) { return l.code },
    vide: 'Aucun bon cadeau pour l\'instant.',

    colonnes: [
      { cle: 'code', titre: 'Code' },
      { cle: 'libelle', titre: 'Formule' },
      { titre: 'Offert par', rendu: function (l) { return JBE.ech(l.acheteur_nom) + '<br><span class="g-fade">' + JBE.ech(l.acheteur_email) + '</span>' } },
      { cle: 'beneficiaire', titre: 'Pour' },
      { titre: 'Statut', rendu: function (l) {
          var c = l.statut === 'paye' ? 'g-oui' : 'g-non'
          return '<span class="' + c + '">' + JBE.ech(NOM[l.statut] || l.statut) + '</span>'
        } },
    ],

    champs: [
      { cle: 'statut', titre: 'Statut', type: 'choix', options: STATUTS },
      { cle: 'beneficiaire', titre: 'Pour qui' },
      { cle: 'message', titre: 'Le mot de l\'acheteur', type: 'texte-long', lignes: 3 },
    ],
  })
})()
