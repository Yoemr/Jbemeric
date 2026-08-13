# Chantier, application de D-007 au dépôt

**Date** : 4 août 2026
**Demandé par** : Yoan
**Périmètre** : les 18 pages HTML, les 16 CSS, les 16 JS. Le dossier `old/` est exclu.
**État** : terminé

---

## 1. Pourquoi

D-007 interdit le tiret cadratin depuis avril 2026, dans le site comme dans la conversation. La règle vivait dans `CLAUDE.md` et dans la fiche de chaque agent, mais elle n'avait jamais été passée sur les fichiers eux-mêmes.

Relevé d'ouverture : **517 occurrences**.

| Emplacement | Nombre | Vu par le visiteur |
|---|---|---|
| HTML, `title` et métadonnées | 46 | oui |
| HTML, corps des pages | 158 | oui |
| Chaînes JavaScript | 92 | oui |
| Placeholders de valeur vide | 43 | oui |
| Kickers décoratifs | 4 | oui |
| Commentaires HTML | 35 | non |
| Commentaires JS | 59 | non |
| Commentaires CSS | 125 | non |
| Cache live-editor | 1 | oui, non traité |

Le chiffre annoncé au départ, 238, ne couvrait que le HTML. Les 92 chaînes JavaScript étaient le vrai piège : `site-data.js` en concentrait 49 et alimente le palmarès, donc corriger le HTML seul aurait laissé le site regénérer des cadratins à chaque chargement.

## 2. Comment le travail a été réparti

Les choix de langue et de référencement reviennent au rôle éditorial, sur consigne de Yoan qui a refusé de trancher occurrence par occurrence. Le reste est mécanique et vérifiable.

| Lot | Traité par | Occurrences | Commit |
|---|---|---|---|
| Commentaires CSS | mécanique | 125 | `072f661` |
| Commentaires JS, fichiers sans texte visible | mécanique | 19 | `3084d4b` |
| Texte visible, HTML et JS | rôle éditorial | 242 | `6960ecc` |
| Commentaires HTML et JS restants | mécanique | 83 | `6960ecc` |
| Placeholders de valeur vide | mécanique | 43 | `6960ecc` |
| Kickers décoratifs | mécanique | 4 | `6960ecc` |

## 3. Les conventions retenues

Consignées en D-015. Le point saillant est le choix du point médian pour les métadonnées, parce que le site l'employait déjà dans huit titres, parfois dans le même titre qu'un cadratin. Les 18 onglets, résultats de recherche et cartes sociales sont désormais homogènes.

Deux règles méritent d'être retenues au-delà de ce chantier :

- **Les attributs `alt` et les légendes prennent la virgule, jamais le point médian.** Un lecteur d'écran rend une virgule par une pause et le point médian par un mot.
- **Un caractère décoratif se code en CSS.** Voir D-017.

## 4. Ce que le remplacement mécanique ne savait pas faire

Cinq phrases ont été réécrites par le rôle éditorial parce que la substitution rendait mal, et trois commentaires ont été repris à la main :

- `live-editor.js`, une phrase courant sur deux lignes avec le tiret en tête de la seconde. Un remplacement aveugle produisait un commentaire commençant par deux points.
- `index-sb.js`, incise entre parenthèses, où la virgule passe mieux.
- `import-wp.js`, commentaire en anglais, où l'espace avant deux points de l'usage français n'a pas lieu d'être.
- `admin/legal/contact.html`, la formule était déjà agrammaticale avant correction.

C'est l'argument contre le `sed` sur ce genre de chantier.

## 5. Contrôles

- Un seul cadratin subsiste dans le dépôt hors `old/`, celui du cache live-editor de `academie/karting.html`. Volontaire.
- `node --check` passe sur tous les JS sauf `track-render.js`, dont l'erreur est antérieure et documentée en 6.3 de l'état des lieux.
- Séquence des balises identique avant et après sur les 18 pages, 5889 balises comparées, aucune divergence.
- Sur les lots mécaniques, vérification automatique qu'aucune ligne modifiée ne diffère de l'originale au-delà de la ponctuation.
- Accolades équilibrées dans les 16 CSS.

## 6. Ce qui reste

**Le contenu Supabase.** La table `site_content` porte le texte saisi par JB dans le live-editor. Il n'est pas dans le dépôt, il n'a pas été traité, et il peut contenir des cadratins que le site affichera. C'est le prolongement naturel de ce chantier.

**Trois anomalies rencontrées au passage**, toutes préexistantes, aucune corrigée ici. Voir sections 6.3 et 6.4 de l'état des lieux. La première est prioritaire : `track-render.js` ne s'exécute pas, donc toute la partie dynamique de `track.html` est morte.

**Le Challenge JB EMERIC est encore nommé** dans du texte visible : `academie.html` (trois titres de vidéos YouTube réelles), `academie/karting.html` (« les sélections du Challenge JB EMERIC »), `admin/legal/contact.html`. D-008 le déclare mort. Le cas des titres de vidéos est particulier, ce sont des intitulés de contenus qui existent vraiment sur la chaîne.
