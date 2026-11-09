// gestion-formules.js : l'onglet Formules, ce que JB vend en karting.
//
// Demande de Yoan, 7 novembre 2026 : « il doit pouvoir créer des formules,
// les modifier, et les supprimer ». Une formule est un produit : un nom, un
// prix, une unité. Une date du calendrier (onglet Dates karting) pointe une
// formule et en reprend le nom, le prix et les places. La future boutique
// lira les formules actives.
//
// La table `formules` porte aussi d'anciennes formules de coaching et de
// track-day : cet onglet ne montre que le karting (restreindre).

;(function () {
  var NATURES = [
    { valeur: 'karting', titre: 'Karting, à la personne' },
    { valeur: 'groupe',  titre: 'Karting en groupe' },
  ]
  var UNITES = [
    { valeur: 'journee',      titre: 'La journée' },
    { valeur: 'demi-journee', titre: 'La demi-journée' },
    { valeur: 'session',      titre: 'La session' },
    { valeur: 'forfait',      titre: 'Le forfait' },
    { valeur: 'place',        titre: 'La place' },
  ]
  var NOM_UNITE = {}
  UNITES.forEach(function (u) { NOM_UNITE[u.valeur] = u.titre.toLowerCase() })

  // La clé technique se fabrique depuis le nom : JB ne la voit jamais.
  function cleDe(nom) {
    return String(nom || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  }

  JBE.onglet({
    cle:   'formules',
    titre: 'Formules',
    table: 'formules',
    tri:   'ordre.asc',
    restreindre: 'nature=in.(karting,groupe)',

    nommer: function (l) { return l.libelle },
    vide: 'Aucune formule. Le bouton « Nouveau » crée la première, par exemple « Karting enfant, la journée ».',

    colonnes: [
      { cle: 'libelle', titre: 'Formule' },
      {
        titre: 'Prix',
        rendu: function (l) {
          return l.prix_conseille == null
            ? '<span class="g-fade">à fixer</span>'
            : JBE.ech(l.prix_conseille + ' € ' + (NOM_UNITE[l.unite] || ''))
        },
      },
      {
        titre: 'Bon cadeau',
        rendu: function (l) { return l.bon_cadeau ? '<span class="g-oui">oui</span>' : '<span class="g-fade">non</span>' },
      },
      {
        titre: 'Proposée',
        rendu: function (l) { return l.actif ? '<span class="g-oui">oui</span>' : '<span class="g-non">non</span>' },
      },
    ],

    champs: [
      { cle: 'libelle', titre: 'Nom de la formule', obligatoire: true,
        aide: 'Tel que le client le lira. Par exemple « Karting adulte, la journée ».' },
      { cle: 'nature', titre: 'Pour qui', type: 'choix', options: NATURES, defaut: 'karting' },
      { cle: 'prix_conseille', titre: 'Prix en euros', type: 'number', pas: '5',
        aide: 'Laisser vide tant que le prix n\'est pas fixé.' },
      { cle: 'unite', titre: 'Le prix est pour', type: 'choix', options: UNITES, defaut: 'journee' },
      { cle: 'places_defaut', titre: 'Places par date', type: 'number',
        aide: 'Reprises quand on crée une date avec cette formule. Modifiables date par date.' },
      { cle: 'description', titre: 'Ce qui est compris', type: 'texte-long', lignes: 4,
        aide: 'Deux ou trois phrases : l\'âge, les horaires, ce qui est inclus.' },
      { cle: 'bon_cadeau', titre: 'Vendable en bon cadeau', type: 'bascule', oui: 'oui' },
      { cle: 'actif', titre: 'Proposée aux clients', type: 'bascule', defaut: true, oui: 'proposée' },
      { cle: 'ordre', titre: 'Ordre d\'affichage', type: 'number', defaut: 200,
        aide: 'Les plus petits nombres passent en premier.' },
    ],

    // À la création, la clé technique se déduit du nom. Une modification la
    // garde : des dates et des ventes peuvent déjà s'y rattacher.
    completer: function (corps, id) {
      if (!id) corps.cle = cleDe(corps.libelle) + '-' + Date.now().toString(36)
      return corps
    },
  })
})()
