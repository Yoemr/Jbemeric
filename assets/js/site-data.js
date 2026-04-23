/**
 * site-data.js — JB EMERIC · Source de vérité du site
 * ═══════════════════════════════════════════════════════════════════
 * Données extraites et enrichies depuis :
 * - jbemeric.com (site officiel WordPress — palmarès complet)
 * - emericjb.unblog.fr (blog officiel archives)
 * - Réseaux sociaux officiels
 *
 * window.JBEMERIC_DATA — utilisé par palmares.html, paddock.html, index.html
 */

window.JBEMERIC_DATA = {

  /* ── IDENTITÉ ─────────────────────────────────────────────────── */
  identite: {
    nom:          'Jean-Baptiste Emeric',
    surnom:       'JB',
    naissance:    'Aubagne, Bouches-du-Rhône',
    adresse:      '475 Chemin du Bon Civet, 13400 Aubagne',
    tel:          '06 60 18 87 87',
    email:        'jbemeric@jbemeric.com',
    siret:        '38095916300037',
    association:  'Promotion Sport Auto (fondée mars 1987)',
    diplome:      'BPJEPS mention circuit et perfectionnement pilotage',
    debut:        1986,
    ecole:        1989
  },

  /* ── RÉSEAUX SOCIAUX ──────────────────────────────────────────── */
  reseaux: {
    youtube:   { handle: '@jbemeric',               id: 'UCMTQjYff8llakx2twVNH2SA', abonnes: '~10 000' },
    tiktok:    { handle: '@stagepilotagejbemeric',  abonnes: '~2 000' },
    facebook:  [
      { nom: 'JB EMERIC Since 1989',              url: 'https://www.facebook.com/JBEMERIC.Since1989', abonnes: '~1 600' },
      { nom: 'JB Emeric Stage de Pilotage',        url: 'https://www.facebook.com/pg/JBEMERIC.Since1989', abonnes: '~4 500' }
    ],
    instagram: { handle: '@jbemeric.ecoledepilotage', abonnes: '~800' },
    linkedin:  { url: 'https://www.linkedin.com/in/jbemeric/', relations: '~1 500' },
    vimeo:     { url: 'https://vimeo.com/jbemeric' },
    tripadvisor: { url: 'https://www.tripadvisor.fr/Attraction_Review-g488288-d12031338-Reviews-JB_EMERIC-Gemenos_Bouches_du_Rhone_Provence_Alpes_Cote_d_Azur.html' }
  },

  /* ── INTRO PALMARÈS ───────────────────────────────────────────── */
  palmaresIntro: {
    accroche: 'Le palmarès de JB EMERIC commence en 1986. Depuis, c\'est 40 ans de compétition sur dix disciplines différentes — aubagnais de naissance, pilote depuis le karting, fondateur de l\'école de pilotage JB EMERIC (1989) et président de l\'association Promotion Sport Auto.',
    citation: {
      texte: 'L\'amour de la course automobile qu\'il sait communiquer à tous. Hier la Formule 3, aujourd\'hui le Sport Prototype, demain le Tourisme. JB n\'a qu\'un seul but : <em>GAGNER !</em>',
      source: 'Présentation officielle JB EMERIC'
    },
    chiffres: [
      { n: '40', l: 'Années de compétition', suffix: ' ans' },
      { n: '1986', l: 'Débuts en karting', prefix: 'Depuis ' },
      { n: '10', l: 'disciplines différentes', prefix: 'Plus de ', suffix: '' }
    ]
  },

  /* ── PALMARÈS COMPLET 1986 → 2026 ─────────────────────────────
     Schéma par entrée :
       annee, titre, detail, categorie, highlight (bool)
       + voiture, coequipiers[], circuits[], resultats[],
         images[], presse[], citations[], anecdote
  ─────────────────────────────────────────────────────────────── */
  palmares: [
    {
      annee: 1986,
      titre: '1ère victoire en Karting',
      detail: 'Karting National 1 — Diplôme obtenu sur le circuit de la Châtre (École AVIA). Grand Prix de Nice avec 140 pilotes au départ, Grand Prix de Ganges en bagarre avec Sandrine Nahon.',
      categorie: 'karting',
      highlight: true,
      voiture: 'Karting National 1',
      adversaires: ['Sandrine Nahon'],
      circuits: ['La Châtre', 'Nice', 'Ganges'],
      images: ['assets/images/palmares/annees/1986-karting-avia.jpg', 'assets/images/palmares/annees/1986-karting-nice.jpg'],
      presse: [
        'assets/images/palmares/presse/1986-140-pilotes-nice.jpg',
        'assets/images/palmares/presse/1986-articles-pages-1.jpg',
        'assets/images/palmares/presse/1986-articles-pages-8.jpg',
        'assets/images/palmares/presse/1986-articles-pages-14.jpg'
      ],
      anecdote: 'Aubagne reconnaît ses débuts — ville natale de Marcel Pagnol.'
    },
    {
      annee: 1987,
      titre: 'Volant PALMYR remporté',
      detail: 'Remporte le volant de l\'école de pilotage PALMYR face à 7 finalistes. Participe au Championnat de France B de Formule Ford — plusieurs 2èmes places. Voiture : Rondeau de 1984.',
      categorie: 'monoplace',
      voiture: 'Rondeau FF 1984',
      circuits: ['Lédenon'],
      images: ['assets/images/palmares/annees/1987-formule-ford.jpg'],
      presse: [
        'assets/images/palmares/presse/1987-le-merite.jpg',
        'assets/images/palmares/presse/1987-volant-palmyr-equipe.jpg',
        'assets/images/palmares/presse/1987-publi-toulouse.jpg',
        'assets/images/palmares/presse/1987-var-matin-defferre.jpg',
        'assets/images/palmares/presse/1987-loin-devant.jpg',
        'assets/images/palmares/presse/1987-sacre-ledenon.jpg',
        'assets/images/palmares/presse/1987-7-en-finale-volant.jpg',
        'assets/images/palmares/presse/1987-salon-voit-course.jpg',
        'assets/images/palmares/presse/1987-1988-articles.jpg'
      ],
      anecdote: 'Résultats remarqués par la presse régionale et nationale — sponsor La Marseillaise.'
    },
    {
      annee: 1988,
      titre: 'Champion de France Formule Ford',
      detail: '9ème au classement général du Championnat de France de Formule Ford. À Paul Ricard : à 4 centièmes de la pôle. Finit meilleur pilote de l\'équipe PALMYR en fin de saison. Diplôme Marlboro. Revue Échappement couvre la saison.',
      categorie: 'monoplace',
      highlight: true,
      voiture: 'Van Diemen FF',
      circuits: ['Nogaro', 'Pau-Arnos', 'Paul Ricard', 'Albi'],
      resultats: [
        { circuit: 'Classement général', place: '9ème' },
        { circuit: 'Paul Ricard', place: '7ème (à 4 centièmes pôle)' },
        { circuit: 'Nogaro', place: 'La revanche de JB Emeric' }
      ],
      images: ['assets/images/palmares/annees/1988-ff-albi.jpg'],
      presse: [
        'assets/images/palmares/presse/1988-van-diemen-marseillaise.jpg',
        'assets/images/palmares/presse/1988-emeric-indiscutablement.jpg',
        'assets/images/palmares/presse/1988-en-piste-marseillaise.jpg',
        'assets/images/palmares/presse/1988-points-prometteurs.jpg',
        'assets/images/palmares/presse/1988-pilote-a-suivre.jpg',
        'assets/images/palmares/presse/1988-a-lombre-dieux.jpg',
        'assets/images/palmares/presse/1988-diplome-marlboro.jpg',
        'assets/images/palmares/presse/1988-revanche.jpg',
        'assets/images/palmares/presse/1988-echappement-pau-arnos.jpg',
        'assets/images/palmares/presse/1988-echappement-ricard.jpg',
        'assets/images/palmares/presse/1988-malchance-mars.jpg'
      ],
      citations: [
        { texte: 'Un pilote à suivre', source: 'Presse nationale' },
        { texte: 'JB Emeric à l\'ombre des dieux', source: 'Échappement Magazine' }
      ],
      anecdote: 'Presse compare JB à Alain Prost ("Prost roi du karting et JB Emeric dernier volant"). Diplôme Marlboro remis en fin de saison.'
    },
    {
      annee: 1989,
      titre: 'Entrée en Formule Renault — Fondation École JB EMERIC',
      detail: 'Saison stoppée après le départ de Malcolm Hill avec la caisse de l\'entreprise et le matériel. Fin de saison sauvée avec le team DAS Racing d\'Yves Déchaume. Voiture : Reynard. Création de l\'école de pilotage JB EMERIC à Aubagne — 35 ans d\'enseignement en 2024.',
      categorie: 'monoplace',
      voiture: 'Reynard FR',
      coequipiers: ['Pierre Derode', 'Yves Déchaume (team DAS Racing)', 'Malcolm Hill'],
      circuits: ['Magny-Cours'],
      anecdote: 'Malcolm Hill part avec la caisse et le matériel : Pierre Derode et JB se retrouvent à pied. Yves Déchaume sauve la saison — partenariat qui débouchera sur la superbe saison 1990.',
      images: ['assets/images/palmares/annees/1989-formule-renault.jpg', 'assets/images/palmares/annees/1989-fr-reynard.jpg'],
      presse: [
        'assets/images/palmares/presse/1989-fr-magny.jpg',
        'assets/images/palmares/presse/1989-aubaine-aubagne.jpg'
      ],
      citations: [
        { texte: 'Une aubaine pour Aubagne', source: 'Semaine Provence' }
      ]
    },
    {
      annee: 1990,
      titre: '7ème sur 70 — Championnat Formule Renault',
      detail: '4 fois 4ème sur 5 courses. 2 pôles position : Pau (à 4 centièmes de la pôle) et Nogaro. Meilleure équipe du championnat.',
      categorie: 'monoplace',
      voiture: 'Formule Renault',
      circuits: ['Pau', 'Nogaro'],
      resultats: [
        { circuit: 'Pau (ville)', place: 'Pôle position' },
        { circuit: 'Nogaro', place: 'Pôle position' }
      ],
      images: ['assets/images/palmares/annees/1990-fr-pau.jpg'],
      presse: [
        'assets/images/palmares/presse/1990-2-fois-4e.jpg',
        'assets/images/palmares/presse/1990-pole-pau.jpg',
        'assets/images/palmares/presse/1990-opignatrete.jpg',
        'assets/images/palmares/presse/1990-bitume.jpg',
        'assets/images/palmares/presse/1990-aubagne-course.jpg',
        'assets/images/palmares/presse/1990-nogaro-pole.jpg',
        'assets/images/palmares/presse/1990-aubagne-sans-galere.jpg',
        'assets/images/palmares/presse/1990-fr-20-11.jpg'
      ],
      citations: [
        { texte: 'L\'opiniâtreté récompensée', source: 'Bitume Magazine' },
        { texte: 'Aubagne est dans la course', source: 'Presse locale' }
      ]
    },
    {
      annee: 1991,
      titre: '3ème Championnat de France B de Formule 3',
      detail: '1ère victoire en F3 B à Magny-Cours, le jour du Grand Prix de France F1. 3ème sur le circuit de Nogaro. Départ sur les chapeaux de roues. Podium final au Championnat de France de Formule 3 B. Présence sur tous les médias — article "240 km/h".',
      categorie: 'monoplace',
      highlight: true,
      voiture: 'Formule 3',
      adversaires: ['Daniel-Delien (F3-B Magny-Cours)'],
      coequipiers: ['Bouilon', 'Lagorce', 'Bouchut'],
      circuits: ['Magny-Cours', 'Nogaro', 'Croix-en-Ternois'],
      resultats: [
        { circuit: 'Magny-Cours', place: '1ère victoire F3 B (jour du GP F1)' },
        { circuit: 'Nogaro', place: '3ème' },
        { circuit: 'Championnat final', place: '3ème au général F3 B' }
      ],
      images: [
        'assets/images/palmares/annees/1991-f3-magny.jpg',
        'assets/images/palmares/annees/1991-f3-croix.jpg',
        'assets/images/palmares/annees/1991-podium-magny-cours.jpg'
      ],
      presse: [
        'assets/images/palmares/presse/1991-bon-debuts.jpg',
        'assets/images/palmares/presse/1991-f3-premiers-visages.jpg',
        'assets/images/palmares/presse/1991-depart-chapeaux.jpg',
        'assets/images/palmares/presse/1991-1ere-victoire-f3.jpg',
        'assets/images/palmares/presse/1991-article.jpg',
        'assets/images/palmares/presse/1991-premiere-emeric.jpg',
        'assets/images/palmares/presse/1991-grignote-places.jpg',
        'assets/images/palmares/presse/1991-240-kmh.jpg',
        'assets/images/palmares/presse/1991-podium-final.jpg'
      ],
      citations: [
        { texte: 'La première d\'EMERIC', source: 'Presse F3' },
        { texte: 'JB EMERIC grignote ses places', source: 'Revue F3' }
      ]
    },
    {
      annee: 1992,
      titre: 'Sport Proto : 2 podiums, 1 pôle, 1 record du tour',
      detail: 'Première saison en Sport Prototype (6 courses seulement). Alfa Romeo Hydra avec Richard Solinas (France Boulon) et Claude Thepaut (Leroy Merlin). 2ème Paul Ricard. Parallèlement : Formule Renault — 1er à Magny-Cours.',
      categorie: 'prototype',
      voiture: 'Sport Prototype Alfa Romeo Hydra',
      coequipiers: ['Richard Solinas', 'Claude Thepaut', 'Arturo Merzario'],
      circuits: ['Paul Ricard', 'Rouen', 'Magny-Cours'],
      resultats: [
        { circuit: 'Paul Ricard', place: 'Pôle position + 2ème' },
        { circuit: 'Rouen', place: 'Record du tour' },
        { circuit: 'Magny-Cours', place: '1er Formule Renault' }
      ],
      images: [
        'assets/images/palmares/annees/1992-hydra-ricard-pole.jpg',
        'assets/images/palmares/annees/1992-hydra-sport-proto.jpg',
        'assets/images/palmares/annees/1992-sport-proto-alfa.jpg',
        'assets/images/palmares/annees/1986-pilote-hydra.jpg'
      ],
      presse: [
        'assets/images/palmares/presse/1992-pole-ricard.jpg',
        'assets/images/palmares/annees/1992-portrait-2e-place.jpg'
      ],
      anecdote: 'Autre pilote sur la même voiture : Arturo Merzario (légende F1).'
    },
    {
      annee: 1993,
      titre: 'Saison difficile — Problèmes mécaniques',
      detail: 'Mauvais choix d\'écurie. Saison jalonnée de problèmes mécaniques. Communication massive : 120 panneaux 4x3 sur la région.',
      categorie: 'prototype',
      images: ['assets/images/palmares/annees/1993-4x3-sponsors.jpg']
    },
    {
      annee: 1994,
      titre: '1er Championnat de France B ALFA ROMEO Sport Prototype',
      detail: 'Victoire au Championnat de France ALFA ROMEO Sport Prototype classe B (Paul Ricard). 3ème sur 3 courses. 5ème Grand Prix de Pau en Peugeot Spider 905. 15ème général aux 2 Tours d\'Horloge en Triumph Spitfire — un exploit.',
      categorie: 'prototype',
      highlight: true,
      voiture: 'Alfa Romeo Sport Proto · Peugeot Spider 905 · Triumph Spitfire',
      coequipiers: ['Guibbert', 'Tarres'],
      circuits: ['Paul Ricard', 'Pau'],
      resultats: [
        { circuit: 'Paul Ricard', place: '1er Championnat B' },
        { circuit: 'Pau (Spider 905)', place: '5ème' },
        { circuit: '2 Tours d\'Horloge', place: '15ème général (Triumph Spitfire)' }
      ],
      images: [
        'assets/images/palmares/annees/1994-proto-gache.jpg',
        'assets/images/palmares/annees/1994-spider-905-pau.jpg',
        'assets/images/palmares/annees/1994-podium-ricard.jpg'
      ],
      citations: [
        { texte: '2 Tours d\'Horloge la nuit en Triumph Spitfire, 15ème au général — un pur plaisir !', source: 'JB EMERIC' }
      ]
    },
    {
      annee: 1995,
      titre: 'Création de son équipe — Coupe Alfa 145',
      detail: 'Création de son équipe. 7 courses en Coupe Alfa Romeo 145. Triumph Spitfire aux 2 Tours d\'Horloge.',
      categorie: 'tourisme',
      voiture: 'Alfa Romeo 145 · Triumph Spitfire',
      circuits: ['Paul Ricard'],
      images: [
        'assets/images/palmares/annees/1995-triumph-stands.jpg'
      ],
      presse: [
        'assets/images/palmares/presse/1995-triumph-ricard-article.jpg'
      ]
    },
    {
      annee: 1996,
      titre: 'Saison complète Coupe Alfa 145',
      detail: 'Saison complète engagée en Coupe Alfa Romeo 145.',
      categorie: 'tourisme',
      voiture: 'Alfa Romeo 145'
    },
    {
      annee: 1997,
      titre: 'Coupe Barquette Hommell — 1 victoire 5 podiums',
      detail: 'Coupe Barquette Hommell. 2 fois 1er de classe au Championnat de France de la Montagne. Courses de côte : Bagnol Sabran, Col Saint Pierre, Mont Ventoux. Rallye du Mistral : 31ème au général sur 83 concurrents, 1ère GT.',
      categorie: 'gt',
      voiture: 'Barquette Hommell',
      circuits: ['Bagnol Sabran', 'Col Saint Pierre', 'Mont Ventoux']
    },
    {
      annee: 1998,
      titre: 'Vainqueur Coupe Barquette HOMMELL',
      detail: 'Vainqueur 1998 de la Coupe Barquette HOMMELL. Victoire à Paul Ricard. Création du Club Peugeot Sport.',
      categorie: 'gt',
      highlight: true,
      voiture: 'Barquette Hommell',
      circuits: ['Paul Ricard'],
      resultats: [
        { circuit: 'Paul Ricard', place: '1er Vainqueur Coupe' }
      ],
      images: [
        'assets/images/palmares/annees/1998-barquette-hommell.jpg'
      ],
      presse: [
        'assets/images/palmares/presse/1998-hommell-ricard-article.jpg',
        'assets/images/palmares/presse/1998-dedours-hommell-retour.jpg'
      ]
    },
    {
      annee: 1999,
      titre: 'Motorola Cup Sebring USA — 2ème Coupe Hommell',
      detail: 'Participation Motorola Cup à Sebring (USA) en Chevrolet Camaro. 2ème Coupe Hommell avec Laurent Gremmel.',
      categorie: 'gt',
      voiture: 'Chevrolet Camaro · Barquette Hommell',
      coequipiers: ['Laurent Gremmel'],
      circuits: ['Sebring (USA)'],
      citations: [
        { texte: 'Le prix de la passion', source: 'Aubagne Magazine' }
      ],
      presse: ['assets/images/palmares/presse/2000-aubagne-hommell.jpg']
    },
    {
      annee: 2000,
      titre: '1er Coupe HOMMELL RS avec Frédéric Dedours',
      detail: 'Victoire en Coupe HOMMELL RS avec Frédéric Dedours — vainqueur dès ses premières courses sous les couleurs du Team JB EMERIC. Victoire de la Porsche 964 RS avec Laurent Gremmel.',
      categorie: 'gt',
      highlight: true,
      voiture: 'Hommell RS · Porsche 964 RS',
      coequipiers: ['Frédéric Dedours', 'Laurent Gremmel'],
      anecdote: 'Frédéric Dedours "à peine arrivé dans l\'équipe JB EMERIC qu\'il gagne des courses".'
    },
    {
      annee: 2001,
      titre: '2ème Coupe HOMMELL RS2 — 3ème Fun Cup',
      detail: '2ème Coupe HOMMELL RS2 avec Franck Martinez. 2ème Coupe HOMMELL avec Laurent Gremmel. 3ème Fun Cup à Lédenon. Motorola Cup Sebring.',
      categorie: 'gt',
      voiture: 'Hommell RS2 · VW Fun Cup',
      coequipiers: ['Franck Martinez', 'Laurent Gremmel'],
      circuits: ['Lédenon', 'Sebring (USA)'],
      images: [
        'assets/images/palmares/annees/2001-fun-cup-ledenon.jpg',
        'assets/images/palmares/annees/2001-hommell-rs2-martinez.jpg'
      ]
    },
    {
      annee: 2002,
      titre: '2ème et 3ème Coupe Hommell RS2 — GT FFSA',
      detail: '2ème et 3ème en Coupe HOMMELL RS2 avec Franck Martinez et Pascal Chaboseau. GT FFSA à Nogaro sur Chevrolet Camaro (importée des USA).',
      categorie: 'gt',
      voiture: 'Hommell RS2 · Chevrolet Camaro',
      coequipiers: ['Franck Martinez', 'Pascal Chaboseau', 'Laurent Gremmel'],
      circuits: ['Nogaro'],
      images: ['assets/images/palmares/annees/2002-camaro-nogaro.jpg']
    },
    {
      annee: 2003,
      titre: '2ème Coupe Hommell RS2 — Super Série FFSA',
      detail: '2ème en Coupe HOMMELL RS2 avec Franck Martinez. Participation à la SUPER SÉRIE FFSA en Ferrari 360 Modena GT.',
      categorie: 'gt',
      voiture: 'Hommell RS2 · Ferrari 360 Modena',
      coequipiers: ['Franck Martinez'],
      images: ['assets/images/palmares/annees/2003-ferrari-360-modena.jpg']
    },
    {
      annee: 2004,
      titre: 'RC Cup Val de Vienne',
      detail: '7ème sur 1 course en RC CUP au Val de Vienne.',
      categorie: 'gt',
      circuits: ['Val de Vienne']
    },
    {
      annee: 2005,
      titre: 'LMES Spa sur Viper — Formule Renault',
      detail: 'LMES sur Chrysler Viper (équipe Paul Belmondo Racing) avec Pierre Perret à Spa-Francorchamps. 14ème à Gémenos-la-Baume en Formule Renault école.',
      categorie: 'gt',
      voiture: 'Chrysler Viper · Formule Renault',
      coequipiers: ['Pierre Perret (Paul Belmondo Racing)'],
      circuits: ['Spa-Francorchamps', 'Gémenos'],
      images: ['assets/images/palmares/annees/2005-viper-spa.jpg']
    },
    {
      annee: 2006,
      titre: 'Multi-disciplines — 3ème catégorie FFSA Dijon',
      detail: 'Série FFSA à Dijon : 3ème catégorie avec Philippe Azebrook. Chevrolet Camaro préparation Patrick Caldentey. Course de côte Gémenos en Formule Renault : 19ème.',
      categorie: 'gt',
      voiture: 'Chevrolet Camaro · Formule Renault',
      coequipiers: ['Philippe Azebrook'],
      circuits: ['Dijon', 'Gémenos'],
      images: ['assets/images/palmares/annees/2006-camaro-en-feu.jpg']
    },
    {
      annee: 2007,
      titre: 'Sport Prototype Norma M20 — Podium Dijon',
      detail: 'Sport Prototype Norma M20 à Jarama avec Richard Mori (sous les couleurs PID). Podium Sport Proto à Dijon. Chevrolet Camaro à Paul Ricard & Spa. VW Fun Cup également engagée. Courses de côte Gémenos en Formule Renault : 23ème général, 2ème classe.',
      categorie: 'prototype',
      voiture: 'Norma M20 · Chevrolet Camaro · VW Fun Cup · Formule Renault',
      coequipiers: ['Richard Mori'],
      circuits: ['Jarama', 'Dijon', 'Paul Ricard', 'Spa-Francorchamps', 'Gémenos'],
      images: [
        'assets/images/palmares/annees/2007-proto-jarama.jpg',
        'assets/images/palmares/annees/2007-podium-dijon-proto.jpg'
      ]
    },
    {
      annee: 2008,
      titre: '1er de classe x3 — Norma courses de côte',
      detail: '1er de classe à chaque course en Norma M20. 3ème à Bouc-Bel-Air (1er podium), 14ème à Barcelonnette, 13ème à Gémenos-la-Baume.',
      categorie: 'montagne',
      highlight: true,
      voiture: 'Norma M20',
      circuits: ['Bouc-Bel-Air', 'Barcelonnette', 'Gémenos'],
      resultats: [
        { circuit: 'Bouc-Bel-Air', place: '3ème général · 1er classe' },
        { circuit: 'Barcelonnette', place: '14ème général · 1er classe' },
        { circuit: 'Gémenos', place: '13ème général · 1er classe' }
      ],
      presse: ['assets/images/palmares/presse/2008-bouc-bel-air.png']
    },
    {
      annee: 2009,
      titre: '1er de classe Bouc-Bel-Air — F3000 Gémenos',
      detail: '5ème à Bouc-Bel-Air (1ère classe). 14ème à Barcelonnette (3ème classe). 5ème à Gémenos-la-Baume en F3000 (équipe Lionel Régal).',
      categorie: 'montagne',
      voiture: 'Norma M20 · F3000',
      coequipiers: ['Lionel Régal (équipe)'],
      circuits: ['Bouc-Bel-Air', 'Barcelonnette', 'Gémenos'],
      images: ['assets/images/palmares/annees/2009-f3000.jpg']
    },
    {
      annee: 2010,
      titre: 'F3 Classic — 1er catégorie 1721 cm³',
      detail: 'Formule Renault Martini MK65 en F3 Classic. 1er dans la catégorie 1721 cm³. Sortie de route à Istres (Norma M20).',
      categorie: 'monoplace',
      voiture: 'Formule Renault Martini MK65 · Norma M20',
      circuits: ['Istres']
    },
    {
      annee: 2011,
      titre: 'F3 Classic — Victoires de classe',
      detail: '2ème à Nogaro avec victoire de classe (1721 cm³). 2ème à Lédenon avec victoire de classe.',
      categorie: 'monoplace',
      voiture: 'Formule Renault Martini MK65',
      circuits: ['Nogaro', 'Lédenon']
    },
    {
      annee: 2012,
      titre: 'Vainqueur général F. Renault Classic — Meilleure équipe 2012',
      detail: 'Saison magistrale : Dijon (2×2ème + victoire FR), Paul Ricard (victoire FR), Val de Vienne (victoire générale sous la pluie — plus belle course du palmarès), Charade (victoire générale + 2×victoire FR), Nogaro (3×victoire FR), Lédenon (2ème général + victoire FR). Élu meilleure équipe Formule Renault 2012.',
      categorie: 'monoplace',
      highlight: true,
      voiture: 'Formule Renault Martini MK65',
      circuits: ['Dijon', 'Paul Ricard', 'Val de Vienne', 'Charade', 'Nogaro', 'Lédenon'],
      resultats: [
        { circuit: 'Dijon', place: '2ème général · victoire FR (×2)' },
        { circuit: 'Paul Ricard', place: 'Victoire FR' },
        { circuit: 'Val de Vienne', place: '1er général (pluie) + record tour' },
        { circuit: 'Charade', place: '1er général · victoire FR (×2)' },
        { circuit: 'Nogaro', place: 'Victoire FR (×3)' },
        { circuit: 'Lédenon', place: '2ème général · victoire FR' }
      ],
      images: ['assets/images/palmares/annees/2012-fr-martini-dijon.jpg'],
      presse: [
        'assets/images/palmares/presse/2012-resultats-f3-fr.jpg'
      ],
      citations: [
        { texte: 'La plus belle course du palmarès de JB EMERIC', source: 'Val de Vienne 2012' }
      ]
    },
    {
      annee: 2013,
      titre: 'Formule Renault Classic — 6 podiums, 2 records du tour',
      detail: 'Dijon : pôle + 2×2ème général + 1er classe 1721 cm³ + 2 records du tour. Spa-Francorchamps : 2×2ème général + 1er classe. Le Mans : 4ème et 5ème (ennuis mécaniques). Paul Ricard : 2×1er général.',
      categorie: 'monoplace',
      voiture: 'Formule Renault Classic',
      circuits: ['Dijon', 'Spa-Francorchamps', 'Le Mans', 'Paul Ricard'],
      resultats: [
        { circuit: 'Dijon', place: 'Pôle + 2×2ème + 2 records' },
        { circuit: 'Spa-Francorchamps', place: '2×2ème général' },
        { circuit: 'Paul Ricard', place: '2×1er général' }
      ],
      images: ['assets/images/palmares/annees/2013-book-vainqueur.jpg'],
      presse: ['assets/images/palmares/presse/2013-echap-classic-dijon.jpg']
    },
    {
      annee: 2014,
      titre: 'MitJet Super-Tourisme — GT Tour',
      detail: 'Nouvelle catégorie MitJet avec Franck Martinez (élève école JB). Spa : 4ème + 4ème + 16ème + 7ème. Val de Vienne course endurance arrêtée par orage. Paul Ricard : 10ème endurance avec Guy Landini. Rencontre avec Yvan Muller au paddock.',
      categorie: 'tourisme',
      voiture: 'MitJet Super-Tourisme',
      coequipiers: ['Franck Martinez', 'Guy Landini'],
      circuits: ['Nogaro', 'Spa-Francorchamps', 'Lédenon', 'Val de Vienne', 'Magny-Cours', 'Paul Ricard'],
      resultats: [
        { circuit: 'Spa', place: '4ème (×2) · 7ème · 16ème' },
        { circuit: 'Paul Ricard', place: '10ème endurance · 11ème sprint' }
      ],
      images: [
        'assets/images/palmares/annees/2014-mitjet-grille.jpg',
        'assets/images/palmares/annees/2014-yvan-muller-vigeant.jpg'
      ],
      presse: [
        'assets/images/palmares/presse/2014-echappement-oct.jpg',
        'assets/images/palmares/presse/2014-var-matin-oct.jpg'
      ],
      citations: [
        { texte: 'Le décathlonien du sport auto', source: 'Échappement Magazine · René Martorell' }
      ],
      anecdote: 'Rencontre avec Yvan Muller au paddock de Vigeant.'
    },
    {
      annee: 2015,
      titre: 'Grand Prix de Pau Formule Ford Historique — Magny-Cours Supertourisme',
      detail: 'GP de Pau en Formule Ford Vaney 1971 : qualif 4ème catégorie + 10ème général. Course 2 : 12ème général + 4ème catégorie. Retour Supertourisme à Magny-Cours (V6 Nissan 3.5L). Paul Ricard : 10ème endurance avec Guy Landini (11ème sprint).',
      categorie: 'historique',
      voiture: 'Formule Ford Vaney 1971 · Supertourisme V6 Nissan',
      coequipiers: ['Guy Landini'],
      circuits: ['Pau (GP historique)', 'Magny-Cours', 'Paul Ricard'],
      resultats: [
        { circuit: 'Pau GP historique', place: '10ème général · 4ème catégorie' },
        { circuit: 'Paul Ricard', place: '10ème endurance' }
      ]
    },
    {
      annee: 2016,
      titre: 'Décathlonien du sport auto — Ferrari & Pilotage au féminin',
      detail: 'Année communication majeure. "Le décathlonien du sport auto" par René Martorell (Échappement Magazine). Businews octobre : "JB EMERIC vous prête sa Ferrari". Échappement septembre : reportage pilotage au féminin. Coaching Ferrari pour clients privés. Développement de l\'offre école.',
      categorie: 'multi',
      presse: [
        'assets/images/palmares/presse/2016-decathlonien.jpg',
        'assets/images/palmares/presse/2016-businews.jpg',
        'assets/images/palmares/presse/2016-echappement-sept.jpg'
      ],
      citations: [
        { texte: 'Le décathlonien du sport auto', source: 'René Martorell · Échappement Magazine' }
      ]
    },
    {
      annee: 2018,
      titre: 'Rallye Sainte-Baume — Podium',
      detail: 'Catégorie promotion avec 2 clients école. Peugeot 206 S16 de l\'école de pilotage. Podium à la fin. Spéciale du Grand Caunet Roquefort-la-Bédoule.',
      categorie: 'rallye',
      voiture: 'Peugeot 206 S16',
      coequipiers: ['Clients école JB EMERIC'],
      circuits: ['Sainte-Baume (Grand Caunet)'],
      images: [
        'assets/images/palmares/annees/2018-206-podium-stebaume.jpg',
        'assets/images/palmares/annees/2018-206-stebaume-3-4.jpg'
      ]
    },
    {
      annee: 2019,
      titre: 'Courses de côte FR2000 — 1er Rallycircuit VHRS',
      detail: 'Formule Renault FR2000 : Côte Saint-Savournin 18ème général + 2ème classe, Côte Barcelonnette 20ème général + 3ème classe. Rallycircuit VHRS Porsche 911 RS : 5ème — première en VHRS pour le palmarès.',
      categorie: 'montagne',
      voiture: 'Formule Renault FR2000 · Porsche 911 RS (VHRS)',
      circuits: ['Saint-Savournin', 'Barcelonnette', 'Rallycircuit VHRS'],
      images: [
        'assets/images/palmares/annees/2019-fr2000-ste-savournin.jpg',
        'assets/images/palmares/annees/2019-fr2000-ste-savournin-2.jpg',
        'assets/images/palmares/annees/2019-rallycircuit-3-4.jpg',
        'assets/images/palmares/annees/2019-rallycircuit-arriere.jpg'
      ]
    },
    {
      annee: 2020,
      titre: '9ème Côte du Circuit du Luc — 1er classe',
      detail: 'Formule Renault FR2000 école de pilotage. 12ème général, 7ème groupe, 1ère classe. Belle victoire avec mécanicien Hector Vaillant. Sport Mag reportage vidéo.',
      categorie: 'montagne',
      highlight: true,
      voiture: 'Formule Renault FR2000',
      coequipiers: ['Hector Vaillant (mécanicien)'],
      circuits: ['Circuit du Luc'],
      resultats: [
        { circuit: 'Circuit du Luc', place: '12ème général · 7ème groupe · 1er classe' }
      ],
      images: ['assets/images/palmares/annees/2020-fr-le-luc.jpg']
      // presse retirée : l'image "2020-le-luc-resultats" ne correspondait pas (photo karting, pas un article)
    },
    {
      annee: 2021,
      titre: 'Sainte-Baume Rallycircuit — Unique en France',
      detail: 'Décembre 16-19. Épreuve unique en France mixant spéciales rallye et circuit Paul Ricard. Centaine de voitures. Présence de Valtteri Bottas et pilotes F1/Rallye mondial. Association Promotion Sport Auto. Peugeot 206 S16. Spéciales : L\'Espigoulier, Bastides, Grand Caunet, Sainte-Baume, Rougiers-Mazaugues, Circuit Paul Ricard.',
      categorie: 'rallye',
      voiture: 'Peugeot 206 S16 · Porsche 911 RS (VHRS)',
      coequipiers: ['Pierre Setti (élève école)'],
      circuits: ['L\'Espigoulier', 'Bastides', 'Grand Caunet', 'Sainte-Baume', 'Rougiers-Mazaugues', 'Paul Ricard'],
      anecdote: 'Présence de Valtteri Bottas (F1) sur l\'épreuve.'
    },
    {
      annee: 2022,
      titre: '2 Tours d\'Horloge Paul Ricard — Porsche VHRS',
      detail: 'Porsche 911 Carrera 2.7L avec Pierre Setti (élève de l\'école) en VHRS.',
      categorie: 'endurance',
      voiture: 'Porsche 911 Carrera 2.7L',
      coequipiers: ['Pierre Setti'],
      circuits: ['Paul Ricard'],
      images: ['assets/images/palmares/annees/2022-porsche-911-carrera-27.jpg']
    },
    {
      annee: 2023,
      titre: 'Circuit du Luc FR2000 — 1er de classe',
      detail: '12ème général, 7ème groupe, 1er de classe. Avec mécanicien Hector Vaillant.',
      categorie: 'montagne',
      highlight: true,
      voiture: 'Formule Renault FR2000',
      coequipiers: ['Hector Vaillant'],
      circuits: ['Circuit du Luc'],
      resultats: [
        { circuit: 'Circuit du Luc', place: '12ème général · 1er classe' }
      ]
    },
    {
      annee: 2024,
      titre: 'HTCC Nogaro — Honda Civic Groupe N',
      detail: 'Circuit Nogaro. Honda Civic groupe N. 2ème catégorie en qualif, 18ème général qualif. Course : 3ème classe, 29ème général (problème mécanique pit stop). Avec Didier Gheza.',
      categorie: 'tourisme',
      voiture: 'Honda Civic Groupe N',
      coequipiers: ['Didier Gheza'],
      circuits: ['Nogaro'],
      resultats: [
        { circuit: 'Nogaro qualif', place: '18ème général · 2ème catégorie' },
        { circuit: 'Nogaro course', place: '29ème général · 3ème classe' }
      ],
      images: ['assets/images/palmares/annees/2024-honda-civic-nogaro.jpg']
    },
    {
      annee: 2025,
      titre: 'Coaching — Sainte-Baume Rallycircuit',
      detail: 'Saison centrée sur le coaching karting enfants (dès 4 ans) et coaching adultes sur différents circuits. Sainte-Baume Rallycircuit 13-15 novembre 2025 — Ferrari et voitures école.',
      categorie: 'rallye',
      voiture: 'Ferrari · Voitures école',
      circuits: ['Sainte-Baume'],
      images: ['assets/images/ferrari-f8-tributo.jpg']
    },
    {
      annee: 2026,
      titre: 'Calendrier international actif',
      detail: 'Caterham, Peugeot 206 S16, voitures personnelles. 12 circuits actifs dont Spa, Barcelone, Monza. Interséries 2026 : Paul Ricard (8 mai), Brands Hatch (29 mai), Zandvoort (19 juin), Dijon-Prenois (11 sept), Mugello (2 oct).',
      categorie: 'multi',
      voiture: 'Caterham · Peugeot 206 S16',
      circuits: ['Paul Ricard', 'Brands Hatch', 'Zandvoort', 'Dijon-Prenois', 'Mugello'],
      images: ['assets/images/palmares/annees/2026-caterham-420-r.jpg']
    }
  ],

  /* ── RENCONTRES MARQUANTES ──────────────────────────────────── */
  rencontres: [
    { nom: 'Yvan Muller',       discipline: 'WTCC · 4× Champion du Monde',  contexte: 'Paddock Vigeant 2014',    annee: 2014 },
    { nom: 'Valtteri Bottas',   discipline: 'F1 · Mercedes · Alfa Romeo',   contexte: 'Sainte-Baume Rallycircuit 2021', annee: 2021 },
    { nom: 'Arturo Merzario',   discipline: 'Légende F1 · Ferrari 312',     contexte: 'Partage de Sport Proto Alfa Hydra', annee: 1992 },
    { nom: 'Paul Belmondo',     discipline: 'F1 · Le Mans · Paul Belmondo Racing', contexte: 'Chrysler Viper LMES à Spa', annee: 2005 },
    { nom: 'Lionel Régal',      discipline: 'Champion de France Course de Côte', contexte: 'F3000 Gémenos-la-Baume', annee: 2009 },
    { nom: 'René Martorell',    discipline: 'Journaliste Échappement Magazine', contexte: 'Article "Le décathlonien du sport auto"', annee: 2016 },
    { nom: 'Philippe Haezebrouck', discipline: 'Pilote endurance',           contexte: 'Série FFSA Dijon',  annee: 2006 },
    { nom: 'Patrick Caldentey', discipline: 'Préparateur moteur',           contexte: 'Préparation Chevrolet Camaro', annee: 2006 },
    { nom: 'Pierre Setti',      discipline: 'Élève école JB EMERIC',        contexte: '2 Tours d\'Horloge · Rallycircuit', annee: 2021 }
  ],

  /* ── SPONSORS HISTORIQUES ────────────────────────────────────── */
  sponsorsPalmares: [
    { nom: 'France Boulon',      depuis: 1986, duree: '35 ans',  logo: 'assets/images/palmares/sponsors/france-boulon.png', highlight: true, note: 'Fournitures industrielles — partenaire historique de 1986 à 2021' },
    { nom: 'Ville d\'Aubagne',   depuis: 1986, duree: '40 ans',  logo: 'assets/images/palmares/sponsors/aubagne.png',       highlight: true, note: 'Ville natale de JB — soutien historique' },
    { nom: 'Gémenos',            depuis: 2005, duree: '20 ans+', logo: 'assets/images/palmares/sponsors/gemenos.jpg',       note: 'Seconde ville de résidence' },
    { nom: 'La Marseillaise',    depuis: 1990, duree: '3 ans',   logo: 'assets/images/palmares/sponsors/la-marseillaise.png', note: 'Sponsor 1990-1992' },
    { nom: 'Leroy Merlin',       depuis: 1992, duree: '—',       logo: 'assets/images/palmares/sponsors/leroy-merlin.png',  note: 'Via Claude Thepaut — Sport Proto' },
    { nom: 'IGOL',               depuis: 2022, duree: '3 ans+',  logo: 'assets/images/palmares/sponsors/igol.jpg',          note: 'Huiles moteur' },
    { nom: 'Var Matin',          depuis: 2014, duree: '10 ans+', logo: 'assets/images/palmares/sponsors/var-matin.jpg',     note: 'Presse régionale' },
    { nom: 'GT2i',               logo: 'assets/images/palmares/sponsors/gt2i.jpg',          note: 'Équipement sport auto' },
    { nom: 'GTRA / Tempo One',   logo: 'assets/images/palmares/sponsors/gtra.jpg',          note: 'Transport' },
    { nom: 'Dedeco',             logo: 'assets/images/palmares/sponsors/dedeco.jpg',        note: 'Peinture casques' },
    { nom: 'CMB',                logo: 'assets/images/palmares/sponsors/cmb.jpg' },
    { nom: 'Alris',              logo: 'assets/images/palmares/sponsors/alris.jpg' },
    { nom: 'Antico',             logo: 'assets/images/palmares/sponsors/antico.png' },
    { nom: 'Auto Custom',        logo: 'assets/images/palmares/sponsors/auto-custom.jpg' },
    { nom: 'Avon',               logo: 'assets/images/palmares/sponsors/avon.jpg' },
    { nom: 'BTR',                logo: 'assets/images/palmares/sponsors/btr.png' },
    { nom: 'Carrosserie Berenger', logo: 'assets/images/palmares/sponsors/berenger.jpg' },
    { nom: 'Copsi Quad',         logo: 'assets/images/palmares/sponsors/copsi-quad.jpg' },
    { nom: 'i-fones',            logo: 'assets/images/palmares/sponsors/i-fones.jpg' },
    { nom: 'Lux Immo',           logo: 'assets/images/palmares/sponsors/lux-immo.jpg' },
    { nom: 'Guide Prestige',     logo: 'assets/images/palmares/sponsors/guide-prestige.jpg' },
    { nom: 'Olympic Location',   logo: 'assets/images/palmares/sponsors/olympic-location.jpg' },
    { nom: 'PID',                logo: 'assets/images/palmares/sponsors/pid.jpg' },
    { nom: 'Vallon de Valrugues', logo: 'assets/images/palmares/sponsors/vallon-valrugues.jpg' },
    { nom: 'Rohmer',             logo: 'assets/images/palmares/sponsors/rohmer.jpg' },
    { nom: 'Gambetta',           logo: 'assets/images/palmares/sponsors/gambetta.jpg' },
    { nom: 'USAG',               logo: 'assets/images/palmares/sponsors/usag.jpg' }
  ],

  /* ── CALENDRIER COMPÉTITION 2026 ────────────────────────────── */
  interseries2026: [
    { date: '2026-05-08', circuit: 'Circuit Paul Ricard Le Castellet', country: 'France' },
    { date: '2026-05-29', circuit: 'Brands Hatch', country: 'Angleterre' },
    { date: '2026-06-19', circuit: 'Zandvoort', country: 'Pays-Bas' },
    { date: '2026-09-11', circuit: 'Dijon-Prenois', country: 'France' },
    { date: '2026-10-02', circuit: 'Mugello', country: 'Italie' }
  ],

  /* ── CIRCUITS PARTENAIRES ─────────────────────────────────────── */
  circuits: [
    { nom: 'Circuit de Brignoles',           region: 'Var (83)',         type: 'kart + auto' },
    { nom: 'KIP La Penne-sur-Huveaune',      region: 'Bouches-du-Rhône', type: 'karting intérieur' },
    { nom: 'Circuit de Trets',               region: 'Bouches-du-Rhône', type: 'karting' },
    { nom: 'Circuit d\'Hyères',              region: 'Var (83)',         type: 'karting' },
    { nom: 'Cuges-les-Pins',                 region: 'Bouches-du-Rhône', type: 'karting' },
    { nom: 'Circuit Paul Ricard HTTT',       region: 'Le Castellet (83)', type: 'grand circuit', gp: true },
    { nom: 'Circuit du Grand Sambuc',        region: 'Bouches-du-Rhône', type: 'circuit' },
    { nom: 'Circuit de Lédenon',             region: 'Gard (30)',        type: 'circuit technique' },
    { nom: 'Circuit du Luc',                 region: 'Var (83)',         type: 'circuit' },
    { nom: 'Circuit de Nogaro',              region: 'Gers (32)',        type: 'circuit' },
    { nom: 'Circuit de Magny-Cours',         region: 'Nièvre (58)',      type: 'circuit GP' },
    { nom: 'Circuit de Dijon-Prenois',       region: 'Côte-d\'Or (21)', type: 'circuit' },
    { nom: 'Circuit de Barcelone Catalunya', region: 'Espagne',          type: 'circuit international' },
    { nom: 'Circuit de Spa-Francorchamps',   region: 'Belgique',         type: 'circuit légendaire' },
    { nom: 'Circuit de Monza',               region: 'Italie',           type: 'circuit légendaire' }
  ],

  /* ── VIDÉOS YOUTUBE ───────────────────────────────────────────── */
  youtube: {
    channelId:  'UCMTQjYff8llakx2twVNH2SA',
    channelUrl: 'https://www.youtube.com/channel/UCMTQjYff8llakx2twVNH2SA',
    handle:     '@jbemeric',
    abonnes:    '~10 000',
    playlists: [
      {
        id:    'PLP9M5a4kLIYGCbEbfB0JYE6-FULezpzq6',
        titre: 'Trajectoires circuits — Caméras embarquées',
        desc:  'Paul Ricard, Lédenon, Luc, Magny-Cours, Grand Sambuc, Spa...'
      }
    ],
    videos_connues: [
      { titre: 'Trajectoires circuit de Lédenon',     circuit: 'Lédenon',    type: 'trajectoires' },
      { titre: 'Coaching pilotage automobile',         circuit: 'multi',      type: 'coaching' },
      { titre: 'JB EMERIC sur BFM TV janvier 2026',    circuit: 'media',      type: 'presse',    id: '_P2KztdVsW8' },
      { titre: 'Karting enfant JB EMERIC',            circuit: 'karting',    type: 'academie' },
      { titre: 'Paul Ricard Grand Prix tracé 5.8km',  circuit: 'Paul Ricard',type: 'trajectoires' },
      { titre: 'Sainte-Baume Rallycircuit',           circuit: 'Paul Ricard',type: 'competition' },
      { titre: 'Magny-Cours embarquée',               circuit: 'Magny-Cours',type: 'trajectoires' },
      { titre: 'Grand Sambuc embarquée',              circuit: 'Grand Sambuc',type: 'trajectoires' },
      { titre: 'Val de Vienne embarquée',             circuit: 'Val de Vienne',type: 'trajectoires' },
      { titre: 'Charade embarquée',                   circuit: 'Charade',    type: 'trajectoires' },
      { titre: 'Course de côte Bouc-Bel-Air',         circuit: 'Bouc-Bel-Air',type: 'competition' },
      { titre: 'Course de côte Barcelonnette',        circuit: 'Barcelonnette',type: 'competition' },
      { titre: 'Course de côte Gémenos-la-Baume',     circuit: 'Gémenos',    type: 'competition' }
    ]
  },

  /* ── PRESSE ───────────────────────────────────────────────────── */
  presse: [
    { media: 'Échappement Magazine', titre: 'Le décathlonien du sport auto', auteur: 'René Martorell' },
    { media: 'BFM Marseille',        titre: 'Reportage vidéo JB EMERIC', type: 'TV' },
    { media: 'Sport Mag',            titre: 'Reportage vidéo JB EMERIC', type: 'TV' },
    { media: 'Caradisiac',           titre: 'Stage de pilotage JB EMERIC en toute simplicité', url: 'https://www.caradisiac.com/Stage-de-pilotage-J-B-Emeric-en-toute-simplicite-16312.htm' }
  ],

  /* ── ÉQUIPE HISTORIQUE ────────────────────────────────────────── */
  equipe: [
    { prenom: 'Jean-Baptiste', nom: 'Emeric',    role: 'Fondateur & Directeur technique', depuis: 1989 },
    { prenom: 'Bruno',         nom: '',          role: 'Moniteur diplômé BPJEPS', note: 'Expert trajectoires et technique' },
    { prenom: 'Guillaume',     nom: '',          role: 'Moniteur / Marketing Relationnel', depuis: 2014 },
    { prenom: 'Jessica',       nom: 'Emeric',    role: 'Community Manager / Accueil', linkedin: 'https://fr.linkedin.com/in/jessica-emeric-4811b2148' },
    { prenom: 'Yoan',          nom: 'Emeric',    role: 'Pilote karting / Développement', note: 'Fils de JB, pilote émérite de karting' },
    { prenom: 'Ector',         nom: '',          role: 'Mécanicien en chef', note: 'Responsable remontage MitJet Super-Tourisme' },
    { prenom: 'Franck',        nom: 'Martinez',  role: 'Pilote partenaire', note: 'Co-pilote GT Tour 2014' },
    { prenom: 'Patrick',       nom: '',          role: 'Moniteur diplômé BPJEPS' },
    { prenom: 'Jean-Christophe', nom: 'Balon',   role: 'Moniteur diplômé BPJEPS' },
    { prenom: 'Pascal',        nom: 'Zarb',      role: 'Club Promotion Sport Auto — membre fondateur' },
    { prenom: 'Maxence',       nom: 'Benech',    role: 'Pilote FR2000' }
  ],

  /* ── VOITURES DE L'ÉCOLE ─────────────────────────────────────── */
  voitures: [
    { nom: 'BMW 325i HTCC',                categorie: 'Challenge auto',     annee: '2020+' },
    { nom: 'MitJet Super-Tourisme',        categorie: 'Supertourisme',      annee: '2014-2016' },
    { nom: 'Peugeot 206 S16 préparée',     categorie: 'Rallye & circuit',   annee: '2018+' },
    { nom: 'Clio 3 Cup',                   categorie: 'Circuit / course de côte', annee: '2019+' },
    { nom: 'Caterham',                     categorie: 'Track-day',          annee: '2026' },
    { nom: 'Formule Renault FR2000',       categorie: 'Monoplace école',    annee: '2005+' },
    { nom: 'Karts SODI RX8 270cc',         categorie: 'Karting adulte',     annee: 'actuel' }
  ]

}
