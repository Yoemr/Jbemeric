// gestion-avis.js : l'onglet Avis.
//
// Même forme que gestion-faq.js à côté, pour la même raison : la coquille
// fabrique le tableau et le formulaire à partir de cette déclaration, il n'y a
// donc ni balise ni gestionnaire de clic à écrire ici.

;(function () {
  // Le même vocabulaire que la FAQ, et il doit rester identique à la
  // contrainte `avis_tags_connus` de la base. Un tag absent de la contrainte
  // serait refusé à l'enregistrement, sans que JB comprenne pourquoi.
  var PAGES = [
    { valeur: 'academie',   titre: 'Académie' },
    { valeur: 'coaching',   titre: 'Coaching' },
    { valeur: 'evenements', titre: 'Événements' },
  ]
  var NOMS = {}
  PAGES.forEach(function (p) { NOMS[p.valeur] = p.titre })

  JBE.onglet({
    cle:   'avis',
    titre: 'Avis',
    table: 'avis',
    tri:   'ordre.asc',

    nommer: function (l) { return l.auteur },

    colonnes: [
      { cle: 'auteur', titre: 'Qui' },
      {
        cle: 'texte', titre: 'Ce qu\'il dit',
        // Un avis fait quelques lignes. Dans un tableau, le début suffit à
        // reconnaître lequel c'est ; le reste se lit dans le formulaire.
        rendu: function (l) {
          var t = String(l.texte || '')
          return JBE.ech(t.length > 90 ? t.slice(0, 90) + '…' : t)
        },
      },
      {
        titre: 'Pages',
        rendu: function (l) {
          var t = l.tags || []
          if (!t.length) return '<span class="g-oui">partout</span>'
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
      { cle: 'auteur', titre: 'Qui l\'a écrit', obligatoire: true,
        aide: 'Le nom tel qu\'il apparaît sur TripAdvisor.' },
      { cle: 'texte', titre: 'L\'avis', type: 'texte-long', lignes: 6, obligatoire: true,
        aide: 'Recopié tel quel, sans les guillemets : le site les ajoute.' },
      { cle: 'contexte', titre: 'Où et avec quoi',
        aide: 'Facultatif. Par exemple « Circuit du Luc » ou « Voiture personnelle · Paul Ricard ».' },
      { cle: 'note', titre: 'Nombre d\'étoiles', type: 'number', defaut: 5,
        aide: 'De 1 à 5.' },
      // Le contraire de la FAQ, et c'est voulu. Une question sans page ne
      // s'affiche nulle part, parce qu'une question porte toujours sur
      // quelque chose. Un avis sans page s'affiche partout, parce que la
      // plupart parlent de JB et non d'une prestation.
      { cle: 'tags', titre: 'Sur quelles pages ?', type: 'cases', options: PAGES,
        aide: 'Ne rien cocher affiche l\'avis sur tout le site, c\'est le cas courant. Cocher une page le réserve à celle-là.' },
      { cle: 'ordre', titre: 'Ordre d\'affichage', type: 'number', defaut: 50,
        aide: 'Les plus petits nombres passent en premier.' },
      { cle: 'visible', titre: 'Afficher sur le site', type: 'bascule', defaut: true, oui: 'visible' },
    ],
  })
})()
