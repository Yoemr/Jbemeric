/**
 * site-data.js — JB EMERIC · Source de vérité du site
 * ═══════════════════════════════════════════════════════════════════
 * Données extraites automatiquement depuis :
 * - emericjb.unblog.fr (blog officiel, palmarès complet 1986→2014)
 * - jbemeric.com (site officiel, données 2015→2026)
 * - Réseaux sociaux officiels
 *
 * window.JBEMERIC_DATA — utilisé par paddock.html et index.html
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

  /* ── PALMARÈS COMPLET 1986 → 2026 ────────────────────────────── */
  palmares: [
    { annee: 1986, titre: '1ère victoire', detail: 'Karting National 1', categorie: 'karting' },
    { annee: 1987, titre: 'Volant PALMYR', detail: "Remporte le volant de l'école de pilotage PALMYR", categorie: 'monoplace' },
    { annee: 1988, titre: 'Champion de France', detail: 'Championnat de France Formule Ford', categorie: 'monoplace', highlight: true },
    { annee: 1989, titre: 'Formule Renault', detail: "Entrée dans le monde de la Formule Renault — fondation de l'école JB EMERIC", categorie: 'monoplace' },
    { annee: 1990, titre: '7ème sur 70', detail: 'Championnat National Formule Renault — 4 fois 4ème sur 5 courses, 2 pôles position', categorie: 'monoplace' },
    { annee: 1991, titre: '3ème Championnat France B', detail: 'Formule 3 — victoire à Magny-Cours, discipline reine en monoplace', categorie: 'monoplace' },
    { annee: 1992, titre: 'Victoire Magny-Cours', detail: 'Formule Renault nationale — 1er à Magny-Cours', categorie: 'monoplace' },
    { annee: 1992, titre: '2 podiums en 6 courses', detail: 'Sport Prototype première saison — 1 pôle position, 1 record du tour à Rouen', categorie: 'prototype' },
    { annee: 1993, titre: 'Sport Prototype', detail: 'Confirmations en Série Sport Prototype', categorie: 'prototype' },
    { annee: 1994, titre: '1er Championnat B', detail: 'Championnat de France ALFA ROMEO Sport Prototype — 3ème place sur 3 courses. 5ème Grand Prix de Pau Peugeot Spider 905', categorie: 'prototype', highlight: true },
    { annee: 1994, titre: '15ème 2 Tours d\'Horloge', detail: 'Circuit Paul Ricard — Triumph Spitfire', categorie: 'endurance' },
    { annee: 1995, titre: 'Coupe Alfa 145', detail: 'Création de son équipe, 7 courses en Coupe Alfa Romeo 145', categorie: 'tourisme' },
    { annee: 1996, titre: 'Coupe Alfa 145', detail: 'Saison complète en Coupe Alfa Romeo 145', categorie: 'tourisme' },
    { annee: 1997, titre: 'Hommell — 1 victoire 5 podiums', detail: 'Coupe Barquette Hommell — 2 fois 1er de classe Championnat de France de la Montagne', categorie: 'gt' },
    { annee: 1998, titre: 'Vainqueur Coupe Hommell', detail: 'Vainqueur 1998 de la Coupe Barquette Hommell — Création du Club Peugeot Sport', categorie: 'gt', highlight: true },
    { annee: 1999, titre: 'Motorola Cup USA', detail: 'Sebring, USA — Chevrolet Camaro. 2ème Coupe Hommell avec Laurent Gremmel', categorie: 'gt' },
    { annee: 2000, titre: '1er Coupe Hommell RS', detail: 'Victoire avec Frédéric Dedours', categorie: 'gt', highlight: true },
    { annee: 2001, titre: '2ème Coupe Hommell RS2', detail: 'Avec Franck Martinez', categorie: 'gt' },
    { annee: 2002, titre: '2ème et 3ème Hommell RS2', detail: 'Avec Franck Martinez et Pascal Chaboseau. GT FFSA Nogaro sur Chevrolet Camaro', categorie: 'gt' },
    { annee: 2003, titre: '2ème Hommell RS2', detail: 'Avec Franck Martinez. Super Série FFSA en Ferrari 360 Modena NGT', categorie: 'gt' },
    { annee: 2004, titre: 'RC Cup', detail: '7ème Val de Vienne en 1 course', categorie: 'gt' },
    { annee: 2005, titre: 'Courses de côte', detail: '14ème Gémenos-la-Baume en Formule Renault école', categorie: 'montagne' },
    { annee: 2006, titre: 'Multi-disciplines', detail: 'LMES Spa sur Viper. 3ème catégorie Série FFSA Dijon. Course de côte Gémenos', categorie: 'gt' },
    { annee: 2007, titre: 'Sport Prototype Norma M20', detail: 'Série FFSA — Jarama, Magny-Cours, Dijon. Camaro Paul Ricard & Spa', categorie: 'prototype' },
    { annee: 2008, titre: '1er de classe x3', detail: 'Norma M20 courses de côte — 3ème Bouc-Bel-Air, 14ème Barcelonnette, 13ème Gémenos', categorie: 'montagne', highlight: true },
    { annee: 2009, titre: '1er de classe', detail: '5ème Bouc-Bel-Air (1er classe), 14ème Barcelonnette (3ème classe), 5ème Gémenos en F3000', categorie: 'montagne' },
    { annee: 2010, titre: 'F3 Classic', detail: 'Formule Renault Martini MK65 — 1er catégorie 1721 cm3', categorie: 'monoplace' },
    { annee: 2011, titre: 'F3 Classic — Victoires de classe', detail: '2ème Nogaro, 2ème Lédenon — victoire catégorie 1721 cm3 à chaque fois', categorie: 'monoplace' },
    { annee: 2012, titre: 'Vainqueur général F. Renault', detail: 'Victoires à Dijon (×2), Paul Ricard, Val de Vienne (sous la pluie), Charade (×2), Nogaro (×3), Lédenon — Élu meilleure équipe Formule Renault 2012', categorie: 'monoplace', highlight: true },
    { annee: 2013, titre: 'F. Renault Classic — 6 podiums', detail: 'Pôle Dijon + 2×2ème, Spa 2×2ème, 2×1er Paul Ricard — 2 records du tour', categorie: 'monoplace' },
    { annee: 2014, titre: 'Super-Tourisme GT Tour', detail: 'Mercedes — Spa 4ème (2 courses), Nogaro 8ème, Lédenon 12ème, Val de Vienne 7ème, Magny-Cours, Paul Ricard', categorie: 'tourisme' },
    { annee: 2015, titre: 'Compétition & formation', detail: 'Supertourisme + développement école de pilotage', categorie: 'tourisme' },
    { annee: 2018, titre: 'Rallye Sainte-Baume', detail: 'Peugeot 206 S16 avec équipiers de l\'école JB EMERIC', categorie: 'rallye' },
    { annee: 2019, titre: 'Course de côte', detail: 'Formule Renault FR2000 — 18ème général 2ème classe (Saint-Savournin), 20ème général 3ème classe (Barcelonnette)', categorie: 'montagne' },
    { annee: 2021, titre: 'VHRS Porsche 911 RS', detail: 'Rallycircuit Sainte-Baume — 5ème place, première participation en VHRS', categorie: 'historique' },
    { annee: 2021, titre: 'Sainte-Baume Rallycircuit', detail: 'Peugeot 206 S16 sur le tracé du Grand Prix de France F1 Paul Ricard', categorie: 'rallye' },
    { annee: 2022, titre: '2 Tours d\'Horloge Paul Ricard', detail: 'Porsche 911 Carrera 2.7L avec Pierre Setti (élève de l\'école) — VHRS', categorie: 'endurance' },
    { annee: 2023, titre: 'Circuit du Luc FR2000', detail: '12ème général, 7ème groupe, 1er de classe — avec mécanicien Hector Vaillant', categorie: 'montagne', highlight: true },
    { annee: 2024, titre: 'Challenge JB EMERIC', detail: '10 courses — 3ème Challenge, développement du programme karting/auto pour pilotes juniors', categorie: 'karting' },
    { annee: 2025, titre: 'Sainte-Baume Rallycircuit', detail: '13-15 novembre 2025 — Ferrari et voitures école', categorie: 'rallye' },
    { annee: 2026, titre: 'Calendrier actif', detail: 'Caterham, Peugeot 206 S16, voitures personnelles — 12 circuits actifs dont Spa, Barcelone, Monza', categorie: 'multi' }
  ],

  /* ── CALENDRIER COMPÉTITION 2026 ────────────────────────────── */
  interseries2026: [
    { date: '2026-05-08', circuit: 'Circuit Paul Ricard Le Castellet', country: 'France' },
    { date: '2026-05-29', circuit: 'Brands Hatch', country: 'Angleterre' },
    { date: '2026-06-19', circuit: 'Zandvoort', country: 'Pays-Bas' },
    { date: '2026-09-11', circuit: 'Dijon-Prenois', country: 'France' },
    { date: '2026-10-02', circuit: 'Mugello', country: 'Italie' },
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
    // Playlists connues (extraites du site officiel)
    playlists: [
      {
        id:    'PLP9M5a4kLIYGCbEbfB0JYE6-FULezpzq6',
        titre: 'Trajectoires circuits — Caméras embarquées',
        desc:  'Paul Ricard, Lédenon, Luc, Magny-Cours, Grand Sambuc, Spa...'
      }
    ],
    // Vidéos référencées sur le site officiel
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
