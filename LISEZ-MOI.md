### /sauvegardes/
Les anciennes versions pour archive :
- `academie-karting.html.old` — ancienne version (enfant uniquement)
- `academie-adulte.html.old` — ancien fichier qui disparaît (fusionné dans karting)

Le fichier `academie-challenge.html` original n'est pas sauvegardé ici
(il disparaît aussi, son contenu passe dans `academie-competition.html`).



## Architecture finale

```
academie.html (hub)
│
├─ academie-karting.html       → Formation karting (enfant + adulte + niveaux C1-C5)
│
└─ academie-competition.html   → Vers la compétition
   ├─ #voiture        → Formation en voiture
   ├─ #challenge      → Le Challenge JB EMERIC
   ├─ #disciplines    → Disciplines compétition (Mitjet, Clio Cup, etc.)
   └─ #simulateur     → Simulateur (en construction)
```

## Actions à faire après intégration

### 1. Supprimer les anciens fichiers
- `academie-adulte.html` (racine) → supprimer
- `academie-challenge.html` (racine) → supprimer
- `assets/css/karting.css` (ancien) → **ATTENTION** : si un ancien karting.css existe déjà,
  le nouveau le remplace. Vérifie qu'aucune autre page ne l'utilisait (grep dans le projet).

### 2. Vérifier les liens dans les autres pages
Chercher dans tout le projet les références aux anciennes pages :

```bash
grep -rn "academie-adulte\|academie-challenge" --include="*.html" .
```

Remplacer :
- `academie-adulte.html` → `academie-karting.html`
- `academie-adulte.html#niveaux` → `academie-karting.html#niveaux`
- `academie-challenge.html` → `academie-competition.html#challenge`

### 3. Tester
- Ouvrir `academie.html` → vérifier les 4 voies + les 2 portes
- Cliquer sur "Formation Karting" → doit mener à la nouvelle page karting
- Cliquer sur "Vers la Compétition" → doit mener à la nouvelle page compétition
- Sur la page compétition, tester les ancres `#voiture`, `#challenge`, `#disciplines`, `#simulateur`

## Ce qui change vs l'ancienne version

### academie.html (hub)
- Section cursus : **5 étapes linéaires → 4 voies parallèles**
- Portes du bas : **3 portes → 2 portes** (Karting / Vers la Compétition)
- Chip hero : "3 cursus" → "Plusieurs voies · Tous profils"

### academie-karting.html (nouveau contenu)
- Fusionne l'ancien `academie-karting.html` (enfant) + `academie-adulte.html`
- Angle narratif : "Du volant à la course"
- 3 étapes internes : Bases / Comprendre / Pousser les limites
- Grille C1→C5 transparente
- Pont visuel vers la page compétition
- Tarifs enfant/adulte différenciés (185€ / 195€)

### academie-competition.html (nouvelle page)
- 4 voies à égalité, même traitement visuel :
  1. **Former en voiture** (voie principale, détaillée)
  2. **Tenter le Challenge** (détaillée, avec placeholder affiche)
  3. **Disciplines compétition** (version basique, à enrichir)
  4. **Simulateur** (en construction)
- FAQ orientée "par où commencer selon mon profil"
- Renvois vers la page Coaching pour ceux qui ont leur voiture personnelle

## Prochaines étapes

1. **Affiche Challenge** — récupérer celle de jbemeric.com et la placer dans la section Challenge
2. **Disciplines** — enrichir quand tu auras clarifié les infos avec ton père
3. **Simulateur** — quand l'offre sera construite
4. **Voie voiture** — préciser les voitures et les tarifs quand c'est consolidé
