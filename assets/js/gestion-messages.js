// gestion-messages.js : l'onglet Messages, ce que les visiteurs écrivent par
// le formulaire de contact (contact-envoyer). JB reçoit aussi chaque message
// par email ; ici il les retrouve tous, et note où il en est.

;(function () {
  var STATUTS = [
    { valeur: 'nouveau',  titre: 'Nouveau' },
    { valeur: 'lu',       titre: 'Lu' },
    { valeur: 'repondu',  titre: 'Répondu' },
    { valeur: 'archive',  titre: 'Archivé' },
  ]
  var NOM = {}; STATUTS.forEach(function (s) { NOM[s.valeur] = s.titre })
  var SUJETS = { karting: 'Karting enfant', 'karting-adulte': 'Karting adulte', entreprise: 'Entreprise ou CE', colonie: 'Colonie', course: 'Course', autre: 'Autre' }

  function quand(iso) {
    if (!iso) return ''
    var d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  JBE.onglet({
    cle:   'messages',
    titre: 'Messages',
    table: 'messages',
    tri:   'created_at.desc',
    voir:  '/admin/legal/contact.html',
    boutonNouveau: false,

    nommer: function (l) { return 'le message de ' + l.prenom + ' ' + l.nom },
    vide: 'Aucun message pour l\'instant. Ils arrivent ici dès qu\'un visiteur écrit par le formulaire de contact.',

    colonnes: [
      { titre: 'Reçu', rendu: function (l) { return JBE.ech(quand(l.created_at)) } },
      { titre: 'De', rendu: function (l) {
          return JBE.ech(l.prenom + ' ' + l.nom) + '<br><a class="g-lien" href="mailto:' + JBE.ech(l.email) + '">' + JBE.ech(l.email) + '</a>' +
            (l.telephone ? '<br><a class="g-lien" href="tel:' + JBE.ech(l.telephone) + '">' + JBE.ech(l.telephone) + '</a>' : '')
        } },
      { titre: 'Sujet', rendu: function (l) { return JBE.ech(SUJETS[l.sujet] || l.sujet || '') } },
      { titre: 'Message', rendu: function (l) { var t = l.message || ''; return JBE.ech(t.length > 160 ? t.slice(0, 160) + '…' : t) } },
      { titre: 'Statut', rendu: function (l) { return '<span class="' + (l.statut === 'nouveau' ? 'g-non' : 'g-oui') + '">' + JBE.ech(NOM[l.statut] || l.statut) + '</span>' } },
    ],

    champs: [
      { cle: 'statut', titre: 'Statut', type: 'choix', options: STATUTS },
      { cle: 'message', titre: 'Le message', type: 'texte-long', lignes: 8 },
    ],
  })
})()
