# Refonte de la page karting.html — Académie de pilotage

**Date :** 2026-04-26
**Cible :** `academie/karting.html` + `assets/css/karting.css`
**Statut :** validé en brainstorming, à implémenter

---

## Contexte

La page actuelle est correctement structurée (hero · manifeste · 3 étapes · niveaux · pont · chiffres · FAQ · CTA), mais elle souffre de deux défauts visuels :

1. **Monotonie** : tout est en bleu nuit uniforme, ce qui rend la lecture plate.
2. **Manque d'identité d'académie** : la page lit comme une page produit, pas comme la vitrine d'une école de pilotage avec un héritage de Champion de France et 37 ans d'enseignement.

L'objectif est une **refonte visuelle** qui :
- garde la palette actuelle (bleu nuit `#040a1e` + or `#FFCF00`) — pas d'autre couleur de fond, pas d'élargissement de palette
- introduit des **codes d'académie** (badge, livret d'évaluation, archive, signature) sans tomber dans le pastiche
- met en valeur **JB EMERIC comme formateur** (pas juste comme nom sur une enseigne)
- diversifie le rythme visuel par la **composition** (photos, asymétrie, encadrements) plutôt que par la couleur

Le contenu textuel reste globalement le même. Les changements de copy sont limités à :
- correction des dates (école née en **1989**, pas 1988 — 1988 c'est le titre Champion de France)
- mise à jour du compteur d'années d'enseignement : **37+** au lieu de 35+ (1989 → 2026)
- ajout de la copy de la section formateur (nouvelle)

---

## Direction visuelle

**Mix de 3 registres** explorés pendant le brainstorming, appliqués section par section :

- **A — Élite institutionnelle** (codes officiels, archive, sceau, livret) → section formateur, hero
- **B — Atelier du maître** (citations, signature manuscrite, asymétrie éditoriale) → 3 étapes
- **C — Paddock pro** (fiche FFSA, données techniques) → niveaux C1→C5

**Polices** :

| Police | Usage actuel | Action |
|---|---|---|
| Bebas Neue | titres | inchangé |
| Outfit | corps | inchangé |
| DM Mono | eyebrows, captions techniques | inchangé |
| **Cormorant Garamond** | nouveau | italique pour devises, codes institutionnels (section formateur) |
| **Caveat** | nouveau | signature manuscrite "JBE" pour citations en B et CTA |

> **À tester** : l'utilisateur a exprimé une réserve sur ces deux nouvelles polices. On les implémente, on regarde le rendu, et on retire si ça ne passe pas. Fallback : tout en Bebas Neue + Outfit + DM Mono.

---

## Structure de la page

```
1 · HERO                    — refonte légère (photo statique grille de départ)
2 · LE FORMATEUR (NOUVEAU)  — diptyque archive 1986/1991 + texte
3 · MANIFESTE               — inchangé
4 · LES 3 ÉTAPES            — refonte complète (asymétrique + photos + citations)
5 · NIVEAUX C1→C5           — refonte complète (fiche FFSA tableau)
6 · PONT CHALLENGE          — inchangé
7 · CHIFFRES                — maj 35+ → 37+ ans
8 · FAQ                     — inchangé
9 · CTA FINAL               — inchangé
```

---

## Détails par section

### 1. Hero

**Changement** : remplacer la vidéo background par la photo `karting-adulte-circuit.jpg` (déplacée depuis `academie.html` qui prendra une photo plus générale plus tard, hors scope).

Cette photo représente une **grille de départ** avec plusieurs karts adultes alignés casques sur la tête — elle raconte la dimension académique (un groupe en formation) là où la vidéo enfant solo ne le faisait pas.

**Structure HTML** : inchangée. Juste remplacer le `<video>` par un `<img>` ou conserver la balise `<video>` avec l'image en poster (le mode édition permettra de switcher facilement). Décision d'implémentation : **garder `<video>` mais avec `karting-adulte-circuit.jpg` en poster**, et pointer le `<source>` vers la même vidéo qu'avant pour l'instant. L'utilisateur ajustera en mode édition.

**Overlay** : conserver le dégradé actuel.

**Contenu textuel** : strictement inchangé.

---

### 2. Le formateur (nouveau)

**Position** : entre le hero et le manifeste.

**Pourquoi** : la page parle du cursus mais ne présente jamais qui le délivre. Cette section pose la crédibilité avant le détail du parcours.

**Structure** :

```
┌─────────────────────────────────────────────────────────┐
│  — Chapitre I · Le formateur                            │
│                                                          │
│  37 ans à former                                         │
│  des pilotes.                                            │
│                                                          │
│   ┌───────────┐  ╎  ┌───────────┐                        │
│   │           │  ╎  │           │                        │
│   │   1986    │  ╎  │   1991    │                        │
│   │   N&B     │  ╎  │  couleur  │                        │
│   │           │  ╎  │           │                        │
│   └───────────┘  ╎  └───────────┘                        │
│   1986 · École      1991 · 1ère victoire F3              │
│   AVIA · La Châtre  Magny-Cours (jour du GP F1)          │
│                                                          │
│   En 1986, JB obtient son diplôme à l'École AVIA         │
│   de La Châtre. Trois ans plus tard, il fonde son        │
│   école d'académie de pilotage. En 1991, il signe sa     │
│   première victoire en Formule 3 B à Magny-Cours,        │
│   le jour du Grand Prix de France F1.                    │
│                                                          │
│   Trente-sept saisons plus tard, l'Académie a formé      │
│   plusieurs centaines de pilotes — du gamin de sept      │
│   ans qui découvre le volant jusqu'au coureur licencié   │
│   FFSA qui défend ses chronos en compétition.            │
│                                                          │
│   ─── Jean-Baptiste EMERIC                               │
│       Fondateur · Champion de France Formule Ford 1988   │
└─────────────────────────────────────────────────────────┘
```

**Détails visuels** :
- Eyebrow `— Chapitre I · Le formateur` en DM Mono or
- H2 "37 ans à former *des pilotes.*" en Bebas Neue, l'accent or sur l'italique "des pilotes"
- **Diptyque archive** : 2 photos côte à côte sur grille `1fr 1fr`
  - Gauche : `assets/images/palmares/annees/1986-karting-avia.jpg` avec filtre `grayscale(1) contrast(1.05)` (effet archive)
  - Ligne or fine de séparation (1px solid `rgba(255,207,0,.35)`)
  - Droite : `assets/images/palmares/annees/1991-podium-magny-cours.jpg` en couleur naturelle
- Captions en DM Mono 10px sous chaque photo : `1986 · École AVIA · La Châtre` à gauche / `1991 · 1ère victoire F3 · Magny-Cours (jour du GP F1)` à droite
- Texte narratif en 2 paragraphes Outfit, max 720px de large, centré
- Signature finale en Cormorant Garamond italique pour le nom + DM Mono pour le rôle

**Photos utilisées** :
- `assets/images/palmares/annees/1986-karting-avia.jpg` — JB jeune élève, école AVIA La Châtre, "Diplôme 4ème degré"
- `assets/images/palmares/annees/1991-podium-magny-cours.jpg` — JB sur la plus haute marche du podium F3 B, GP de France F1, costume Marlboro, trophée brandi

**Responsive** : sur mobile (<700px), les 2 photos passent en stack vertical avec la ligne or remplacée par une ligne horizontale.

---

### 3. Manifeste

**Pas de changement.** Le contenu actuel ("La plupart des écoles vendent des journées. Nous enseignons un métier.") garde toute sa pertinence et ne fait pas double emploi avec la nouvelle section formateur (sujets différents : philosophie pédagogique vs identité du formateur).

---

### 4. Les 3 étapes (refonte)

**Direction** : mockup B atelier — alternance asymétrique avec photos pleines + citations manuscrites.

**Structure** :

```
Étape 01 — Découverte
┌─────────────┐  Tag · Découverte · Enfant dès 7 ans
│   photo     │
│             │  Les bases du pilotage
│      i      │  Position, regard, trajectoire...
└─────────────┘
                 « Piloter à l'aveugle, c'est tricher
                   avec soi-même. »
                 — JBE (signature Caveat)

Étape 02 — Progression
                 Tag · Progression · C1 → C3      ┌─────────────┐
                                                   │   photo     │
                 Comprendre sa conduite           │             │
                 On filme, on repasse...           │     ii      │
                                                   └─────────────┘

Étape 03 — Performance
┌─────────────┐  Tag · Performance · C4 → C5
│   photo     │
│             │  Pousser les limites
│     iii     │  Trail braking, transfert de charge...
└─────────────┘
                 « C5 n'est pas donné. Et ce n'est
                   pas le but. »
                 — JBE
```

**Détails visuels** :
- Layout grid `1fr 1.3fr` pour étapes 01, 03 (photo gauche)
- Layout grid `1.3fr 1fr` pour étape 02 (photo droite)
- Chiffres romains (i / ii / iii) en superposition or sur chaque photo, en bas à gauche, Cormorant Garamond italique grande taille
- Tags en DM Mono or
- H3 en Bebas Neue avec italique sur le mot accent
- Citations entre « » en Cormorant Garamond italique avec une bordure or à gauche
- Signature "— JBE" en Caveat (manuscrite), légèrement inclinée

**Photos** :
- Étape 01 : `assets/images/karting-enfant-circuit.jpg`
- Étape 02 : `assets/images/briefing-karting-enfant.jpg` (à confirmer — sinon `assets/images/karting-challenge-auto.jpg`)
- Étape 03 : `assets/images/karting-adulte-depart.jpg`

**Tarifs** : intégrés discrètement dans le texte de l'étape 01 ("À partir de 185 € la journée pour les enfants, 195 € pour les adultes — équipement complet inclus."), pas de cartes séparées.

**Responsive** : sur mobile (<800px), tout passe en stack vertical, les images d'abord, le texte ensuite.

---

### 5. Niveaux C1→C5 (refonte)

**Direction** : mockup C paddock — fiche d'évaluation officielle FFSA.

**Structure** :

```
                    — Chapitre III · La grille d'évaluation

                    Cinq niveaux. Aucun raccourci.

  ┌─ FICHE D'ÉVALUATION · CURSUS JB EMERIC · ÉD. 2026 ────────────┐
  │                                                                │
  │ CODE  NIVEAU       CRITÈRE TECHNIQUE          CHRONO   STATUT  │
  │ ──────────────────────────────────────────────────────────────│
  │ C1    Débutant     Position, trajectoires,    référ.   ouvert  │
  │                    régularité 5 tours                          │
  │ C2    Amateur      Freinage à la corde,       ±0.5s    val. piste│
  │                    gestion du regard                           │
  │ C3    Confirmé     Diagnostic autonome,       ±0.3s    vidéo   │
  │                    dégradation pneumatique                     │
  │ C4    Avancé       Compétition, gestion       ±0.2s    val. JB │
  │                    course longue durée                         │
  │ C5*   Compétiteur  Niv. entrée Challenge      référence ↗ Challenge
  │                    Chronos atteints                            │
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
                                          * gradient or sur la ligne C5
```

**Détails visuels** :
- Cadre `border:1px solid rgba(255,207,0,.35)` autour du tableau, fond `bg-elev`
- Header rectangle au-dessus du cadre (collé au bord), texte centré `FICHE D'ÉVALUATION · CURSUS JB EMERIC · ÉD. 2026` en DM Mono or
- 5 colonnes : `80px 1fr 2fr 1fr 80px` (CODE / NIVEAU / CRITÈRE / CHRONO / STATUT)
- Ligne header de tableau : DM Mono 9px gris mute
- Chaque ligne :
  - CODE en Bebas Neue 32px or
  - NIVEAU en DM Mono 11px majuscule
  - CRITÈRE en Outfit 13px ink-soft
  - CHRONO en Bebas Neue 18px ink
  - STATUT en DM Mono 9px or
- Ligne C5 : gradient or `linear-gradient(90deg,transparent 0%,rgba(255,207,0,.15) 100%)`

**Responsive** : sur mobile (<768px), bascule en cards verticales (CODE + NIVEAU sur ligne 1, CRITÈRE + CHRONO + STATUT empilés en dessous).

---

### 6. Pont Challenge

**Pas de changement.** L'image BMW 325i HTCC en background avec overlay et le CTA "Découvrir le Challenge" fonctionnent bien.

---

### 7. Chiffres

**Changement minime** :

| Bloc | Avant | Après |
|---|---|---|
| 1 | 1988 / Champion de France | inchangé |
| 2 | **35+** / Années d'enseignement | **37+** / Années d'enseignement |
| 3 | 5 / Circuits partenaires | inchangé |
| 4 | BPJEPS / Diplôme d'État | inchangé |

L'école est née en 1989, on est en 2026 → 37 ans.

---

### 8. FAQ

**Pas de changement.** Le contenu et le toggle accordion fonctionnent.

---

### 9. CTA final

**Pas de changement.** Garder "Commencer par où ?" + 2 boutons.

---

## Implémentation

### Fichiers modifiés

- `academie/karting.html` :
  - Ajout `<link>` Google Fonts pour Cormorant Garamond et Caveat
  - Hero : remplacer le poster vidéo par `karting-adulte-circuit.jpg` (et garder le `<source>` actuel pour la vidéo, l'utilisateur ajustera en mode édition)
  - Ajout de la nouvelle section `<section class="formateur">` entre le hero et le manifeste
  - 3 étapes : refonte du HTML (nouveaux noms de classes, ajout `<img>`, ajout `<blockquote>` citations)
  - Niveaux : refonte du HTML en tableau type fiche
  - Chiffres : changer `35+` en `37+`

- `assets/css/karting.css` :
  - Ajout des styles pour `.formateur` (diptyque, captions, signature)
  - Refonte des styles pour `.parcours .etape` (asymétrie, citations)
  - Refonte des styles pour `.niveaux` (cadre fiche FFSA, tableau)
  - Pas de touche aux autres sections

### Fichiers non modifiés

- `academie.html` (sera retraité plus tard avec une photo plus générale, hors scope ici)
- Tous les autres fichiers CSS, JS, HTML

### Risques techniques

- **Polices** : si Cormorant Garamond ou Caveat ne plaisent pas, fallback vers `serif` et `cursive` du système, ou retrait pur.
- **Photo `briefing-karting-enfant.jpg` étape 02** : à confirmer sur preview — si l'image n'est pas adaptée, alternative `karting-challenge-auto.jpg` ou autre.
- **Mode édition** : la page est éditable inline via `live-editor.js`. Vérifier que les nouvelles sections respectent les conventions de classes pour rester éditables.

### Validation finale

- Comparer visuellement la nouvelle version avec les 3 mockups pour s'assurer que les directions A/B/C sont bien reflétées dans les sections respectives
- Tester en local via `npx serve` sur port 3000
- Vérifier le responsive sur 375px / 768px / 1280px

---

## Hors scope

- Refonte du header de `academie.html` (sera traité séparément avec `salle-briefing.jpg`)
- Refonte des autres pages académie (adulte, coaching, competition, track)
- Modification du contenu textuel au-delà des corrections de dates et de la copy de la section formateur
- Modifications de logique métier ou de routing

---

## Décisions à valider

| Point | Statut |
|---|---|
| Photo hero = `karting-adulte-circuit.jpg` (grille de départ) | ✅ validé |
| Section formateur entre hero et manifeste | ✅ validé |
| Diptyque 1986 N&B + 1991 couleur avec ligne or | ✅ validé (option D) |
| 3 étapes : alternance asymétrique + photos + citations | ✅ validé |
| Niveaux : fiche FFSA tableau | ✅ validé |
| 35+ → 37+ ans d'enseignement | ✅ validé |
| Polices Cormorant Garamond + Caveat | 🔄 à tester (réserve utilisateur) |
| Photo étape 02 (briefing-karting-enfant ou autre) | 🔄 à confirmer sur preview |
