# Correction `academie.html` — partir de la bonne base

## Le problème

Lors de la session précédente, j'ai modifié une **vieille version** du fichier `academie.html` au lieu de la version `academie_backup_pre_refonte.html` qui était la vraie dernière version. Ça a écrasé une bonne partie de ton travail récent.

## La correction

J'ai repris **`academie_backup_pre_refonte.html`** comme base saine, et j'ai appliqué uniquement les modifications nécessaires à la refonte multi-voies :

### Modifications appliquées

1. **Section cursus** (`section.cursus`) — 5 niveaux linéaires remplacés par **4 voies parallèles**
   - Niveau 1 : Karting Enfant → **Voie 1 : Formation Karting** (enfant + adulte fusionnés)
   - Niveau 2 : Karting Adulte C1-C3 → **Voie 2 : Formation Voiture** (entrée directe à la voiture)
   - Niveau 3 : Karting Adulte C4-C5 → **Voie 3 : Le Challenge** (sélectif, BMW HTCC)
   - Niveau 4 : Sélection Challenge → **Voie 4 : Disciplines Compétition** (Mitjet, Clio Cup)
   - Niveau 5 : BMW HTCC → supprimé (fusionné dans la voie 3)
   - Tag-label : "Le cursus complet" → "Les voies d'accès"
   - Titre : "De la prise en main à la course" → "Plusieurs chemins pour devenir pilote"

2. **Section offres** (`section.offres`) — 3 cards remplacées par **2 cards**
   - Card "Karting Enfant" + "Karting Adulte" → fusionnées en **"Formation Karting"** (185€-195€)
   - Card "Challenge Kart → Auto" → remplacée par **"Vers la Compétition"** (renvoie vers academie-competition.html)
   - Titre : "Choisissez votre programme" → "Deux entrées dans l'Académie"

3. **Chip hero** — "3 cursus · Tous niveaux" → "Plusieurs voies · Tous profils"

4. **Mentions PACA** — toutes supprimées (5 occurrences) :
   - Title et meta titles : "Karting & Auto · PACA" → "Karting & Voiture"
   - Hero eyebrow : "Académie · Formation · PACA" → "Académie · Formation · Du karting à la course"
   - FAQ : "circuits partenaires en PACA" → "nos circuits partenaires"

## Ce qui n'a PAS été touché

Tout le reste du fichier est **strictement identique** à `academie_backup_pre_refonte.html` :
- Hero
- Section trajectoires YouTube
- Section méthode (3 piliers)
- Section témoignages / palmarès
- Section FAQ (sauf la modif PACA)
- Section CTA finale
- Footer

## Action à faire

Remplace ton `academie.html` actuel par celui dans ce zip.

Vérifie ensuite que les **classes CSS utilisées** (`.cursus`, `.niveau`, `.niv-num`, `.niv-corps`, `.niv-badge`, `.niv-titre`, `.niv-texte`, `.niv-lien`, `.niv-img`, `.offres`, `.offre-card`, etc.) sont bien définies dans ton `academie.css`. Vu que je suis parti de `academie_backup_pre_refonte.html`, ces classes devraient déjà exister. Mais vérifie après remplacement.

## Note pour la mémoire du projet

Cet incident a été ajouté aux **anti-patterns du MEMOIRE.md** :

> Avant de modifier un fichier existant, toujours demander à Yoan la dernière version. Ne pas se fier aux fichiers présents dans /uploads/ par défaut — ils peuvent être obsolètes.
