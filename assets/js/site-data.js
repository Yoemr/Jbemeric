/**
 * site-data.js — JB EMERIC · Source de vérité du site
 * ═══════════════════════════════════════════════════════
 * Modifier ce fichier = mise à jour automatique de l'index
 * et de toutes les sections dynamiques.
 *
 * Structure : window.JBEMERIC_DATA
 */

window.JBEMERIC_DATA = {

  /* ── TICKER ─────────────────────────────────── */
  ticker: [
    "Challenge 2026 — Inscriptions ouvertes · Brignoles",
    "Karting Enfant — Pâques 5–6 Avril · Places disponibles",
    "Finale 1 HTCC · Pau-Arnos · 21 Mars 2026",
    "Coaching vidéo · Retour garanti sous 48h",
    "Ferrari F8 disponible · Grand Sambuc · 5 & 6 Avril",
  ],

  /* ── ACTUALITÉS (La Une Paddock) ─────────────
     Modifier ici = La Une se met à jour          */
  news: [
    {
      id: "n01",
      cat: "Challenge 2026",
      catColor: "#FFCF00",
      catBg: "#040a1e",
      title: "Pau-Arnos dans 24 heures — le premier vainqueur du Challenge sera connu demain",
      excerpt: "Après plusieurs sessions qualificatives à Brignoles et sur le simulateur World SIM RACER, JB a finalisé sa sélection. Le pilote retenu prend le volant de la BMW 325i HTCC pour la première des quatre finales nationales HTCC.",
      img: "https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-3-4-AVANT.jpg",
      date: "Il y a 2 heures",
      author: "JB EMERIC",
      url: "academie-challenge.html",
      featured: true,
    },
    {
      id: "n02",
      cat: "Karting",
      catColor: "#000",
      catBg: "#FFCF00",
      title: "Pâques 2026 — 3 places restantes à Brignoles",
      excerpt: "Sessions karting enfant et adulte pendant les vacances de Pâques.",
      img: "https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-2-AV-768x512.jpg",
      date: "Il y a 4h",
      author: "JB EMERIC",
      url: "academie-karting.html",
    },
    {
      id: "n03",
      cat: "Coaching",
      catColor: "#FFCF00",
      catBg: "#0A3D91",
      title: "Nouveau format vidéo — retour en 24h au lieu de 48h",
      excerpt: "JB accélère son process d'analyse embarquée.",
      img: "https://jbemeric.com/wp-content/uploads/2022/01/COACHING-CIRCUIT-compresse-768x576.jpg",
      date: "Il y a 1 jour",
      author: "JB EMERIC",
      url: "coaching.html",
    },
    {
      id: "n04",
      cat: "Paddock",
      catColor: "#000",
      catBg: "#C8A000",
      title: "Ferrari F8 disponible les 5 et 6 avril au Grand Sambuc",
      excerpt: "Deux journées exceptionnelles sur le circuit d'Aix-en-Provence.",
      img: "https://jbemeric.com/wp-content/uploads/2023/08/ferrari_f8_tributo-1-big-300x173.jpg",
      date: "Il y a 2 jours",
      author: "JB EMERIC",
      url: "paddock.html",
    },
    {
      id: "n05",
      cat: "YouTube",
      catColor: "#FFCF00",
      catBg: "#040a1e",
      title: "Nouvelle analyse — trajectoires Lédenon, virage 7",
      excerpt: "La vidéo la plus demandée par les abonnés.",
      img: "https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-2-AV-768x512.jpg",
      date: "Il y a 3 jours",
      author: "JB EMERIC",
      url: "paddock.html#media",
    },
  ],

  /* ── SECTIONS INDEX ──────────────────────────
     Chaque section correspond à une page.
     Modifier ici = index se met à jour.          */
  sections: {

    academie: {
      eyebrow: "01 · Académie",
      title: "DEVENIR <span class='b'>PILOTE</span>",
      desc: "Sur un circuit, on ne peut pas tricher. Du karting dès 7 ans jusqu'à la compétition officielle en BMW — un parcours en 3 étapes, encadré par JB EMERIC, Champion de France 1988.",
      cta: "Découvrir l'Académie",
      ctaUrl: "academie.html",
      theme: "light",
      cards: [
        {
          href: "academie-karting.html",
          img: "https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-2-AV-768x512.jpg",
          badge: "Étape 1", badgeGold: true,
          num: "Dès 7 ans · 195€",
          name: "Karting Enfant",
          sub: "Journée complète · Debrief JB · Diplôme · 5 circuits PACA",
          price: "Démarrer le cursus →",
        },
        {
          href: "academie-adulte.html",
          img: "https://jbemeric.com/wp-content/uploads/2022/05/Depart-avec-les-news-270cc-compresse-768x576.jpg",
          badge: "Étape 2", badgeGold: false,
          num: "Dès 14 ans · 195€",
          name: "Karting Adulte",
          sub: "5 niveaux C1→C5 · SODI RX8 270cc · Coaching individuel",
          price: "Analyser mon niveau →",
        },
        {
          href: "academie-challenge.html",
          img: "https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-3-4-AVANT.jpg",
          badge: "Étape 3", badgeGold: true,
          num: "Sélection ouverte · 0€",
          name: "Challenge Kart → Auto",
          sub: "BMW 325i HTCC · Licence FFSA · Mécanique incluse",
          price: "Rejoindre la sélection →",
          priceGold: true,
        },
      ],
      tags: [
        { label: "Dès 7 ans", gold: false },
        { label: "5 circuits PACA", gold: false },
        { label: "Diplôme JB EMERIC", gold: false },
        { label: "BPJEPS Sport Auto", gold: false },
        { label: "Champion de France 1988", gold: true },
      ],
    },

    coaching: {
      eyebrow: "02 · Coaching",
      title: "PROGRESSER <span class='b'>VITE</span>",
      desc: "Coaching individuel sur circuit ou par vidéo à distance. Amateur ou compétiteur — JB adapte son approche à votre niveau réel et à vos objectifs.",
      cta: "Voir le Coaching",
      ctaUrl: "coaching.html",
      theme: "dark",
      cards: [
        {
          href: "coaching.html",
          img: "https://jbemeric.com/wp-content/uploads/2022/01/COACHING-CIRCUIT-compresse-768x576.jpg",
          badge: "Sur circuit", badgeGold: false,
          num: "Piste · Présentiel",
          name: "Coaching Piste",
          sub: "JB toute la journée · Debrief individuel · Chrono",
          price: "Sur devis",
        },
        {
          href: "coaching.html",
          img: "https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-2-AV-768x512.jpg",
          badge: "En ligne", badgeGold: true,
          num: "À distance",
          name: "Coaching Vidéo",
          sub: "Analyse embarquée · Retour 48h · Tous circuits",
          price: "Accessible",
        },
        {
          href: "coaching.html",
          img: "https://jbemeric.com/wp-content/uploads/2020/07/JB-EXPLIQUE-PISTE-A-LANDINI-RICARD-SUPERTOURISME-300x169.png",
          badge: "Compétition", badgeGold: false,
          num: "Stand complet",
          name: "Coaching Course",
          sub: "Week-end de course · Qualif → Podium",
          price: "Sur devis",
        },
      ],
      tags: [
        { label: "Amateur → Confirmé", gold: false },
        { label: "Trajectoires", gold: false },
        { label: "Freinage tardif", gold: false },
        { label: "Analyse embarquée", gold: false },
        { label: "Retour JB direct", gold: true },
      ],
    },

    track: {
      eyebrow: "03 · Track-Days & Stages",
      title: "VOITURES DE <span class='b'>COURSE</span>",
      desc: "Lotus Elise, Peugeot 206 S16, Caterham, Ferrari F8, Porsche GT3 RS. Sur les plus beaux circuits de France — Grand Sambuc, Paul Ricard, Lédenon, Dijon.",
      cta: "Voir les dates 2026",
      ctaUrl: "track.html",
      theme: "warm",
      cards: [
        {
          href: "track.html",
          img: "https://jbemeric.com/wp-content/uploads/2019/01/LOTUS-AU-CIRCUIT-DU-LUC-LAURET9-300x194.jpg",
          badge: "Pure circuit", badgeGold: false,
          num: "Parc auto",
          name: "Lotus Elise S Cup",
          sub: "Grand Sambuc · Dijon-Prenois · Circuits techniques",
          price: "Stage",
        },
        {
          href: "track.html",
          img: "https://jbemeric.com/wp-content/uploads/2018/07/206-cote-PAUL-RICARD-2015-Taille-4-00267157-300x200.jpg",
          badge: "Rallye · Circuit", badgeGold: true,
          num: "Parc auto",
          name: "Peugeot 206 S16",
          sub: "Préparée course · Paul Ricard · Sainte-Baume",
          price: "Stage",
        },
        {
          href: "track.html",
          img: "https://jbemeric.com/wp-content/uploads/2023/08/ferrari_f8_tributo-1-big-300x173.jpg",
          badge: "Ferrari · Porsche", badgeGold: true,
          num: "Prestige",
          name: "GT & Prestige",
          sub: "Ferrari F8 Tributo · Porsche GT3 RS · Sur devis",
          price: "Sur devis",
          priceGold: true,
        },
        {
          href: "track.html",
          img: "https://jbemeric.com/wp-content/uploads/2021/07/BARCELONNETTE-LES-MONOPLACES-4.jpg",
          badge: "Légèreté extrême", badgeGold: false,
          num: "Parc auto",
          name: "Caterham Seven",
          sub: "Open wheel · Sensations pures · Lédenon",
          price: "Stage",
        },
      ],
      tags: [
        { label: "Paul Ricard", gold: false },
        { label: "Grand Sambuc", gold: false },
        { label: "Lédenon", gold: false },
        { label: "Dijon-Prenois", gold: false },
        { label: "Votre voiture possible", gold: true },
      ],
    },

    paddock: {
      eyebrow: "04 · Le Paddock",
      title: "L'UNIVERS <span class='b'>JB</span>",
      desc: "Blog technique, actualités, YouTube, calendrier des événements — tout ce qui se passe dans le paddock JB EMERIC.",
      cta: "Entrer dans le Paddock",
      ctaUrl: "paddock.html",
      theme: "slate",
      cards: [
        {
          href: "paddock.html#blog",
          img: "https://jbemeric.com/wp-content/uploads/2022/01/KARTING-X-2-AV-768x512.jpg",
          badge: "Blog technique", badgeGold: true,
          num: "6 articles",
          name: "Articles Techniques",
          sub: "Trajectoires · Freinage · Analyse embarquée",
          price: "Lire →",
        },
        {
          href: "paddock.html#media",
          img: "https://jbemeric.com/wp-content/uploads/2022/05/Depart-avec-les-news-270cc-compresse-768x576.jpg",
          badge: "YouTube", badgeGold: false,
          num: "Chaîne",
          name: "Vidéos YouTube",
          sub: "Analyses circuits · Conseils pilotage",
          price: "Regarder →",
        },
        {
          href: "paddock.html#events",
          img: "https://jbemeric.com/wp-content/uploads/2026/02/B-M-W-325-I-HTCC-3-4-AVANT.jpg",
          badge: "Agenda 2026", badgeGold: true,
          num: "6 événements",
          name: "Calendrier",
          sub: "Challenge HTCC · Stages · Sélections",
          price: "Agenda →",
          priceGold: true,
        },
      ],
      tags: [
        { label: "Actualités", gold: false },
        { label: "Blog pilotage", gold: false },
        { label: "Tribune pilotes", gold: false },
        { label: "Instagram · TikTok · YouTube", gold: false },
        { label: "Challenge 2026 ouvert", gold: true },
      ],
    },
  },

  /* ── ÉVÉNEMENTS ──────────────────────────────── */
  events: [
    { day: "21", month: "Mars", title: "Finale 1 HTCC — Challenge Kart → Auto", circuit: "Circuit de Pau-Arnos · Pyrénées-Atlantiques", type: "challenge" },
    { day: "5", month: "Avr", title: "Stage Karting Enfant — Pâques", circuit: "Circuit de Brignoles · Var (83)", type: "stage" },
    { day: "6", month: "Avr", title: "Session qualificative Challenge", circuit: "Circuit de Brignoles · Var (83)", type: "selection" },
    { day: "20", month: "Juin", title: "Finale 2 HTCC — Challenge Kart → Auto", circuit: "Circuit de Lédenon · Gard", type: "challenge" },
    { day: "Été", month: "2026", title: "Finale 3 HTCC — Challenge Kart → Auto", circuit: "Circuit d'Albi · Tarn", type: "challenge" },
    { day: "Aut.", month: "2026", title: "Finale 4 HTCC — Grand Final", circuit: "Circuit Bugatti · Le Mans · Sarthe", type: "challenge" },
  ],

  /* ── FORUM ───────────────────────────────────── */
  forum: [
    { cat: "karting", title: "Réglage freinage RX8 — quelle pression de pédale ?", preview: "JB a répondu hier sur la modulation progressive vs. blocage franc...", author: "Lucas M.", time: "23 min", replies: 12 },
    { cat: "challenge", title: "Sélection 2026 — retour d'expérience session Brignoles", preview: "3 pilotes partagent leurs impressions après la session de février...", author: "Thomas R.", time: "1h", replies: 28 },
    { cat: "sim", title: "World SIM RACER vs. iRacing pour préparer Lédenon", preview: "Débat ouvert après que JB a mentionné l'utilité du simulateur...", author: "Mathieu D.", time: "3h", replies: 7 },
    { cat: "coaching", title: "Coaching vidéo — comment préparer sa vidéo embarquée ?", preview: "Angle de caméra, qualité, durée optimale — les tips des membres...", author: "Camille F.", time: "5h", replies: 15 },
  ],

};
