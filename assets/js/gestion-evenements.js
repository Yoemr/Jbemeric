// gestion-evenements.js : l'onglet des track-days.
//
// Même forme que l'onglet FAQ : une table, des colonnes, des champs. La
// coquille fait le reste.
//
// Une ligne créée ici crée une page publique, à l'adresse /evenements/<slug>.
// C'est pour ça que le slug est traité comme un champ à part entière et non
// comme un détail technique.

;(function () {
  var MOIS = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc']

  var MODES = [
    { valeur: '',         titre: 'Non renseigné' },
    { valeur: 'entier',   titre: 'JB loue le circuit, il vend tout' },
    { valeur: 'box',      titre: 'Box partagé sur la journée d\'un autre' },
    { valeur: 'coaching', titre: 'Coaching seul, JB se déplace' },
    { valeur: 'greffe',   titre: 'Greffé, frais partagés' },
    { valeur: 'moniteur', titre: 'Moniteur loué par une autre école' },
  ]
  var NOM_MODE = {}
  MODES.forEach(function (m) { NOM_MODE[m.valeur] = m.titre })

  var STATUTS = [
    { valeur: 'Open',      titre: 'Ouvert aux inscriptions' },
    { valeur: 'Potential', titre: 'En préparation' },
    { valeur: 'Full',      titre: 'Complet' },
    { valeur: 'Draft',     titre: 'Brouillon' },
  ]

  function enClair(iso) {
    if (!iso) return ''
    var d = new Date(iso + 'T12:00:00')
    return d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear()
  }

  // Les circuits viennent de la base. Les écrire en dur ici obligerait à
  // toucher le code chaque fois que JB en ajoute un.
  var circuits = [{ valeur: '', titre: 'Chargement…' }]
  JBE.requete('circuits?select=id,nom&order=nom')
    .then(function (l) {
      circuits.length = 0
      circuits.push({ valeur: '', titre: 'Aucun circuit' })
      l.forEach(function (c) { circuits.push({ valeur: c.id, titre: c.nom }) })
    })
    .catch(function () { circuits[0] = { valeur: '', titre: 'Circuits injoignables' } })

  JBE.onglet({
    cle:   'evenements',
    titre: 'Track-days',
    table: 'events',
    tri:   'date_event.desc',

    nommer: function (l) { return enClair(l.date_event) + ', ' + (l.type || 'journée') },

    colonnes: [
      { titre: 'Date',    rendu: function (l) { return JBE.ech(enClair(l.date_event)) } },
      { cle: 'type',      titre: 'Type' },
      {
        titre: 'Mode',
        rendu: function (l) {
          return l.mode
            ? JBE.ech(NOM_MODE[l.mode] || l.mode)
            : '<span class="g-fade">non renseigné</span>'
        },
      },
      {
        titre: 'Page',
        // Sans slug, pas de page publique. C'est la chose la plus utile à
        // voir d'un coup d'oeil sur la liste.
        rendu: function (l) {
          return l.slug
            ? '<a class="g-lien" href="/evenements/' + JBE.ech(l.slug) + '" target="_blank" rel="noopener">voir</a>'
            : '<span class="g-fade">pas d\'adresse</span>'
        },
      },
      {
        titre: 'En ligne',
        rendu: function (l) {
          return l.visible_site
            ? '<span class="g-oui">oui</span>'
            : '<span class="g-non">non</span>'
        },
      },
    ],

    champs: [
      { cle: 'date_event', titre: 'Date', type: 'date', obligatoire: true },
      { cle: 'type', titre: 'Type de journée', obligatoire: true,
        aide: 'Ce qui s\'affiche sur la carte. Par exemple « Track-Day GT & Tourisme ».' },
      { cle: 'circuit_id', titre: 'Circuit', type: 'choix', options: circuits },

      { cle: 'slug', titre: 'Adresse de la page', obligatoire: true,
        aide: 'Minuscules, chiffres et tirets seulement. Donne /evenements/<adresse>. Deux dates ne peuvent pas partager la même.' },
      { cle: 'photo', titre: 'Photo', aide: 'Chemin depuis la racine, par exemple assets/images/…' },
      { cle: 'resume', titre: 'Résumé', type: 'texte-long', lignes: 3,
        aide: 'Deux phrases. C\'est ce que la carte annonce.' },
      { cle: 'description', titre: 'Le détail de la journée', type: 'texte-long', lignes: 10,
        aide: 'Le corps de la page. Une ligne vide fait un nouveau paragraphe.' },

      { cle: 'mode', titre: 'Mode d\'engagement', type: 'choix', options: MODES,
        aide: 'Décide de ce que le site propose. Sur les modes où JB ne vend pas, le visiteur est envoyé chez l\'organisateur.' },
      { cle: 'organisateur', titre: 'Organisateur', aide: 'Quand ce n\'est pas JB. Son nom s\'affiche sur le bouton.' },
      { cle: 'lien_organisateur', titre: 'Lien vers son inscription',
        aide: 'Sans adresse, aucun lien n\'est fabriqué et le visiteur est invité à appeler.' },

      { cle: 'prix', titre: 'Prix par pilote', type: 'number', pas: '5' },
      { cle: 'cout', titre: 'Ce que ça coûte à JB', type: 'number', pas: '10',
        aide: 'Jamais affiché sur le site. Sert à savoir si la date vaut le déplacement.' },
      { cle: 'nb_places', titre: 'Places', type: 'number', defaut: 10 },

      { cle: 'status', titre: 'Statut', type: 'choix', options: STATUTS, defaut: 'Open' },
      { cle: 'visible_site', titre: 'Afficher sur le site', type: 'bascule', oui: 'en ligne' },
    ],
  })
})()
