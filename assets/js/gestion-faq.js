// gestion-faq.js : l'onglet FAQ.
//
// Un fichier par fonction gérée. Celui-ci ne sait rien de la coquille, et la
// coquille ne sait rien de lui : il déclare une table, des colonnes et des
// champs, elle fabrique le tableau et le formulaire.
//
// Ajouter une colonne à la table `faq` se fait donc en ajoutant une ligne
// ci-dessous, sans écrire une balise ni un gestionnaire de clic.

;(function () {
  // Les pages où une question peut apparaître. Cette liste doit rester
  // identique à la contrainte `faq_tags_connus` de la base : un tag absent
  // de la contrainte serait refusé à l'enregistrement, sans que JB comprenne
  // pourquoi. Le jour où une page s'ajoute, les deux se complètent ensemble.
  var PAGES = [
    { valeur: 'index',          titre: 'Accueil' },
    { valeur: 'academie',       titre: 'Académie' },
    { valeur: 'karting-enfant', titre: 'Karting enfant' },
    { valeur: 'karting-adulte', titre: 'Karting adulte' },
    { valeur: 'competition',    titre: 'Compétition' },
    { valeur: 'coaching',       titre: 'Coaching' },
    { valeur: 'evenements',     titre: 'Événements' },
    { valeur: 'evenement',      titre: 'Page d\'une date' },
    { valeur: 'paddock',        titre: 'Paddock' },
    { valeur: 'palmares',       titre: 'Palmarès' },
  ]
  var NOMS = {}
  PAGES.forEach(function (p) { NOMS[p.valeur] = p.titre })

  JBE.onglet({
    cle:   'faq',
    titre: 'FAQ',
    table: 'faq',
    tri:   'ordre.asc',

    nommer: function (l) { return l.question },

    colonnes: [
      { cle: 'question', titre: 'Question' },
      {
        titre: 'Pages',
        // Les tags s'affichent avec leur nom lisible. « karting-enfant » est
        // une clé technique, JB ne devrait jamais avoir à la déchiffrer.
        rendu: function (l) {
          var t = l.tags || []
          if (!t.length) return '<span class="g-fade">nulle part</span>'
          return t.map(function (x) {
            return '<span class="g-tag">' + JBE.ech(NOMS[x] || x) + '</span>'
          }).join('')
        },
      },
      { cle: 'ordre', titre: 'Ordre' },
      {
        titre: 'Visible',
        rendu: function (l) {
          return l.visible
            ? '<span class="g-oui">oui</span>'
            : '<span class="g-non">non</span>'
        },
      },
    ],

    champs: [
      { cle: 'question', titre: 'La question', obligatoire: true,
        aide: 'Telle qu\'un visiteur se la poserait, avec le point d\'interrogation.' },
      { cle: 'reponse', titre: 'La réponse', type: 'texte-long', lignes: 7, obligatoire: true,
        aide: 'Du texte simple. Une ligne vide fait un nouveau paragraphe.' },
      { cle: 'tags', titre: 'Sur quelles pages ?', type: 'cases', options: PAGES, obligatoire: true,
        aide: 'La question apparaît sur toutes les pages cochées. Une seule ligne, plusieurs pages.' },
      { cle: 'ordre', titre: 'Ordre d\'affichage', type: 'number', defaut: 50,
        aide: 'Les plus petits nombres passent en premier.' },
      { cle: 'visible', titre: 'Afficher sur le site', type: 'bascule', defaut: true, oui: 'visible' },
    ],
  })
})()
