// gestion-vocabulaire.js : les listes que plusieurs onglets partagent.
//
// ── Pourquoi ce fichier ─────────────────────────────────────────────────────
// Deux listes étaient recopiées. `PAGES` dans `gestion-faq.js` et
// `gestion-avis.js`, `MODES` dans `gestion-evenements.js` et maintenant dans
// `gestion-veille.js`. Deux copies d'un même vocabulaire finissent par
// diverger, et ce projet l'a déjà payé trois fois avec la FAQ.
//
// Ces listes ne sont pas de la présentation, ce sont des mots du métier. Elles
// vivent donc en un seul endroit, et chaque onglet y puise.
//
// ── Ce qui doit rester identique à la base ──────────────────────────────────
// `PAGES` doit correspondre aux contraintes `faq_tags_connus` et
// `avis_tags_connus`. `MODES` doit correspondre à la contrainte `mode` de la
// table `events`. Un mot absent de la contrainte serait refusé à
// l'enregistrement, sans que JB comprenne pourquoi.
//
// Ce fichier se charge avant les onglets.

window.JBE_VOCABULAIRE = {

  // Les pages qui portent un bloc FAQ ou un bloc d'avis. Règle de Yoan du
  // 9 août : le tag se crée sur la page où on insère le bloc, pas pour les
  // sous-pages, ce sont les mêmes questions. Les trois pages de l'Académie
  // portent donc le tag du parent.
  PAGES: [
    { valeur: 'academie',   titre: 'Académie' },
    { valeur: 'coaching',   titre: 'Coaching' },
    { valeur: 'evenements', titre: 'Événements' },
  ],

  // Ce que JB loue ce jour-là. C'est ce qui décide de ce que la page
  // d'événement propose au visiteur, et plus tard du calcul du prix.
  MODES: [
    { valeur: '',         titre: 'Non renseigné' },
    { valeur: 'entier',   titre: 'JB loue le circuit, il vend tout' },
    { valeur: 'box',      titre: 'Box partagé sur la journée d\'un autre' },
    { valeur: 'coaching', titre: 'Coaching seul, JB se déplace' },
    { valeur: 'greffe',   titre: 'Greffé, frais partagés' },
    { valeur: 'moniteur', titre: 'Moniteur loué par une autre école' },
  ],
}
