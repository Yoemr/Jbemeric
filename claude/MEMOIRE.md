# MÉMOIRE DU PROJET — JB EMERIC École de Pilotage

> **À lire en premier** — Ce fichier est la mémoire long-terme du projet. Il est conçu pour qu'une personne (humaine ou IA) reprenant le projet puisse en quelques minutes comprendre la vision, les décisions déjà prises, l'état du travail, et éviter les erreurs déjà commises.
>
> **Mise à jour** — Ce document doit évoluer. Chaque décision significative doit être actée ici. Chaque convention doit y être documentée. Si une section devient fausse, elle doit être corrigée — pas laissée en place.
>
> **Dernière mise à jour majeure** : refonte architecture Académie (3 pages, 4 voies d'accès à la compétition)

---

## TABLE DES MATIÈRES

1. [Identité et philosophie](#1-identité-et-philosophie)
2. [Persona narratif et ton éditorial](#2-persona-narratif-et-ton-éditorial)
3. [Audiences et profils clients](#3-audiences-et-profils-clients)
4. [Architecture du site](#4-architecture-du-site)
5. [Stack technique](#5-stack-technique)
6. [Conventions de code](#6-conventions-de-code)
7. [État actuel du projet](#7-état-actuel-du-projet)
8. [Historique des décisions importantes](#8-historique-des-décisions-importantes)
9. [Tâches restantes](#9-tâches-restantes)
10. [Glossaire métier](#10-glossaire-métier)
11. [Anti-patterns — ce qu'on ne fait pas](#11-anti-patterns--ce-quon-ne-fait-pas)
12. [Références et inspirations](#12-références-et-inspirations)
13. [Bugs connus et contournements](#13-bugs-connus-et-contournements)
14. [Historique des versions](#14-historique-des-versions)
15. [Notes personnelles et matière brute](#15-notes-personnelles-et-matière-brute)

---

## 1. IDENTITÉ ET PHILOSOPHIE

### Qu'est-ce que JB EMERIC École de Pilotage

Une école de pilotage fondée et dirigée par Jean-Baptiste Emeric, Champion de France de karting 1988, diplômé BPJEPS Sport Automobile. L'école est historiquement ancrée dans le sud de la France (circuits partenaires à Brignoles, La Penne, Trets, Hyères, Cuges-les-Pins), mais **ne se limite plus à cette région** — voir section Anti-patterns.

L'école propose plusieurs types de prestations :
- **Formation karting** — cursus structuré enfant + adulte, niveaux C1 à C5
- **Formation voiture** — stages sur circuit vers la compétition
- **Coaching** — accompagnement personnalisé pour pilotes venant avec leur propre voiture
- **Stages** — offres plus loisir, souvent avec voitures de prestige, parfois en partenariat
- **Track-days** — journées où les particuliers viennent avec leur voiture personnelle
- **Challenge JB EMERIC** — sélection avec dotation BMW 325i HTCC à la clé (historiquement fragile)
- **Disciplines compétition** — accompagnement vers Mitjet, Clio Cup, karting compétition (en construction)
- **Simulateur** — en développement

### Qui est le client de ce projet web

- **Jean-Baptiste Emeric** — le pilote, fondateur, visage de l'école. C'est lui qui enseigne.
- **Yoan** — son fils, développeur autodidacte du site (par métier : Diesel Fitter en mining + mécanicien motorsport). Il pilote toutes les décisions du projet, même s'il s'appuie sur une IA pour l'implémentation technique.

### Vision commerciale

La phrase fondatrice, actée lors de la refonte Académie :

> **"Il n'y a pas qu'une seule voie pour devenir pilote."**

Cette vision remplace l'ancienne logique linéaire (karting → adulte → challenge → BMW) par une logique **multi-voies parallèles** où chaque pilote trouve le chemin adapté à son profil, son budget et ses ambitions.

### Ce qui distingue JB EMERIC de la concurrence

- **Un vrai champion** — pas un moniteur générique, un Champion de France qui enseigne personnellement
- **Une verticale complète** — de l'initiation karting à la course en championnat. Aucune école concurrente ne couvre autant
- **Une approche pédagogique honnête** — évaluation franche, pas de flatterie, progression mesurée
- **Un accompagnement personnalisé** — JB aide même à s'orienter vers une autre structure si c'est plus pertinent pour le profil

---

## 2. PERSONA NARRATIF ET TON ÉDITORIAL

### La voix du site

Le site parle avec une voix **mature, sobre, humaine, exploratoire**. C'est une voix d'auteur, pas de commercial. On ne vend pas — on présente, on explique, on invite.

**Caractéristiques de cette voix :**
- Présente des idées plutôt que d'imposer des vérités
- Utilise des phrases complètes, pas des slogans
- Assume les limites (par exemple : "cette voie est en construction")
- Préfère la nuance à l'effet
- Respecte l'intelligence du lecteur

### Ce que la voix refuse

- Les superlatifs gratuits ("le meilleur", "l'unique", "le seul")
- Le langage de transformation ("devenez pilote en 10 jours", "libérez votre potentiel")
- Les CTA agressifs ("réservez vite !", "places limitées !")
- Les preuves sociales exagérées
- La séduction émotionnelle cheap

### Exemples concrets

**Ce qu'on dit :**
> "Un pilote ne s'invente pas. Il se construit — session après session, virage après virage, debrief après debrief."

**Ce qu'on ne dit pas :**
> "Devenez le pilote que vous avez toujours rêvé d'être avec nos stages révolutionnaires !"

**Ce qu'on dit :**
> "Cette voie est en cours de construction. Si ce format vous intéresse, faites-vous connaître."

**Ce qu'on ne dit pas :**
> "Bientôt disponible ! Inscrivez-vous à la liste d'attente VIP !"

### Préférence exprimée par Yoan

> Mature author voice, human and exploratory rather than assertive, presenting ideas as proposals rather than imposed truths.

Cette ligne guide toute la production éditoriale du site.

---

## 3. AUDIENCES ET PROFILS CLIENTS

### Profils identifiés

Le site s'adresse à plusieurs profils aux attentes très différentes. Ne pas confondre un profil avec un autre dans le contenu.

1. **Les parents**
   - Veulent offrir à leur enfant une expérience de qualité ou accompagner une passion naissante
   - Attentes : sécurité, pédagogie, encadrement diplômé, tarifs lisibles
   - Point d'entrée naturel : page Académie Karting (section enfant)

2. **Les curieux (loisir pur)**
   - Veulent juste s'initier, découvrir, se faire plaisir une fois
   - Pas forcément d'ambition sportive
   - Point d'entrée naturel : page Stages (plus orientée plaisir/prestige)

3. **Les jeunes avec ambition**
   - Veulent apprendre sérieusement, progresser, peut-être un jour courir
   - Attentes : progression mesurable, encadrement de haut niveau
   - Point d'entrée naturel : page Académie Karting ou Formation voiture selon l'âge

4. **Les compétiteurs (ambition carrière)**
   - Veulent courir pour de vrai, ont des objectifs de championnat
   - Attentes : accès aux bonnes disciplines, réseau, accompagnement stratégique
   - Point d'entrée naturel : page Vers la Compétition

5. **Les passionnés avec voiture personnelle**
   - Possèdent une sportive, une GT, une voiture préparée
   - Cherchent du coaching pour progresser sur leur propre machine
   - Attentes : expertise technique, accompagnement sur leur matériel
   - Point d'entrée naturel : page Coaching

6. **Les clients loisir qui basculent**
   - Viennent au départ pour un stage ponctuel
   - Se découvrent une vraie passion, veulent aller plus loin
   - Attentes : transition progressive vers des offres plus sérieuses
   - Parcours : Stages → Académie/Coaching

### Règle narrative

Chaque page du site doit être claire sur **à qui elle s'adresse**. Un visiteur doit comprendre en 5 secondes si la page est pour lui ou non. Ne pas essayer de plaire à tout le monde sur une seule page — ça mène à un discours mou.

---

## 4. ARCHITECTURE DU SITE

### Vue d'ensemble des pages

```
index.html                          Hub principal du site
│
├── academie.html                   Hub Académie (section formation)
│   ├── academie-karting.html       Formation karting (enfant + adulte, C1→C5)
│   └── academie-competition.html   Vers la Compétition (4 voies)
│       ├── #voiture                Formation voiture
│       ├── #challenge              Le Challenge JB EMERIC
│       ├── #disciplines            Disciplines compétition (Mitjet, Clio Cup...)
│       └── #simulateur             Simulateur (en construction)
│
├── coaching.html                   Coaching pour pilotes avec voiture personnelle
├── track.html                      Track-days avec voiture personnelle
├── paddock.html                    Paddock : forum, calendrier, médias, palmarès
├── nos-voitures.html               Parc véhicules disponibles
├── contact.html                    Contact
│
├── login.html                      Connexion admin/membre
├── signup.html                     Inscription
├── admin.html                      Dashboard admin (CMS)
├── coming-soon.html                Placeholder pages en construction
│
├── confidentialite.html            Mentions légales
├── mentions-legales.html
└── mot-de-passe-oublie.html
```

### Distinction claire entre les offres

Ce point est critique pour éviter les confusions éditoriales :

| Page | À qui | Avec quoi | Pour quoi |
|------|-------|-----------|-----------|
| **Académie Karting** | Débutants, jeunes, parents | Kart fourni par l'école | Apprendre les fondations |
| **Académie Competition** | Adultes motivés, compétiteurs | Voiture d'école ou dispositif dédié | Aller vers la course |
| **Coaching** | Pilotes confirmés | Leur propre voiture | Progresser sur leur machine |
| **Stages** | Curieux, loisir, prestige | Voiture fournie (souvent prestigieuse) | Se faire plaisir |
| **Track-days** | Pilotes avec voiture perso | Leur voiture personnelle | Rouler libre sur circuit |

Ne jamais confondre les audiences. Un passionné qui arrive par une page ne doit pas lire un discours conçu pour une autre audience.

### Les 4 voies d'accès à la compétition

Actées lors de la refonte Académie :

1. **Formation Karting** — la voie pédagogique classique, dès 7 ans
2. **Formation Voiture** — directement à la voiture pour les adultes motivés
3. **Le Challenge** — voie sélective, dotation BMW 325i HTCC
4. **Disciplines Compétition** — Mitjet, Clio Cup, karting compétition, accompagnement sur mesure

Ces 4 voies sont à égalité. **Aucune n'est la "voie principale"**. Chacune répond à un profil et un budget différents.

Plus une 5ème voie en construction : le **Simulateur**.

---

## 5. STACK TECHNIQUE

### Technologies utilisées

- **Front-end** — HTML statique, CSS vanilla, JavaScript vanilla
- **Hébergement** — Netlify
- **Backend** — Supabase (PostgreSQL + API REST + Auth + Storage)
- **Typographies** — Bebas Neue (titres), Outfit (corps), DM Mono (labels techniques)

### Configuration Supabase

- **URL** : `https://fyaybxamuabawerqzuud.supabase.co`
- **Clé publishable** (safe à exposer côté client) : `sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD`
- **Tables principales** :
  - `site_content` (id, content, alt_text?, file_name?, media_type?) — CMS inline pour textes et médias
  - `events` (date_event, type, prix, status, visible_site, circuit_id) — événements et track-days
  - `forum_threads` (id, title, tag, author_name, reply_count, visible, pinned, created_at) — forum paddock
  - `circuits` (id, nom) — **NON exposée via REST** (voir Bugs connus)

### Structure des fichiers

```
/racine/
├── assets/
│   ├── css/
│   │   ├── theme.css           Variables couleurs (source de vérité)
│   │   ├── nav.css             Nav + footer + burger (autorité unique)
│   │   ├── pages.css           Règles communes à plusieurs pages
│   │   ├── karting.css         CSS page academie-karting
│   │   ├── competition.css     CSS page academie-competition
│   │   ├── [page].css          Un CSS par page spécifique
│   ├── js/
│   │   ├── nav.js              Injecte nav + burger (autorité unique)
│   │   ├── footer.js           Injecte footer
│   │   ├── live-editor.js      CMS inline admin (ES5 STRICT)
│   │   ├── sync-mirror.js      Miroirs dynamiques inter-pages
│   │   ├── site-data.js        Données statiques
│   │   └── [autres scripts]
│   └── images/                 Images et vidéos
├── claude/
│   └── MEMOIRE.md              Ce fichier
├── [pages].html
├── favicon.svg
├── netlify.toml
├── robots.txt
├── sitemap.xml
└── database.sql
```

### Développement local

- Répertoire de travail : `D:\OneDrive\Documents\Documents Perso\Jbemeric`
- Serveur local : `npx serve .` → `localhost:3000`
- Fichier de lancement : `serveur.bat`

### Palette couleurs (charte)

- Fond principal : `#040a1e` (bleu profond)
- Fond élevé : `#0a1028`, `#0d1635`
- Bleu accent : `#0A3D91`
- Or accent : `#FFCF00` (couleur signature)
- Textes : blanc + variations d'opacité

---

## 6. CONVENTIONS DE CODE

### CSS

- **Source de vérité unique par responsabilité**
  - `theme.css` = variables couleurs et typos globales
  - `nav.css` = nav + footer + burger (ne JAMAIS redéfinir ailleurs)
  - `pages.css` = règles partagées entre plusieurs pages
  - `[page].css` = spécifique à la page
- **Ne pas automatiser l'extraction de CSS commun** — l'automatisation a produit trop de conflits par le passé. Mutualisation manuelle uniquement
- **Media queries par composant**, pas regroupées à la fin
- **`clamp()` systématique** pour les tailles responsives

### JavaScript

- **`live-editor.js` doit rester en ES5 STRICT**
  - Pas de backticks (template strings)
  - Pas d'arrow functions
  - Pas de classes ES6
  - Pas de `let` / `const` dans certaines branches (vérifier avant modif)
- Les autres scripts peuvent utiliser l'ES6+
- Variables locales `var _xxx` pour marquer le privé

### HTML

- **1 `<div id="nav-root"></div>` dans chaque page** — rempli par `nav.js`
- **1 `<div id="footer-root"></div>` dans chaque page** — rempli par `footer.js`
- **Scripts chargés en fin de `<body>`**, ordre strict :
  ```html
  <script src="assets/js/faq.js"></script>
  <script type="module" src="assets/js/live-editor.js"></script>
  <script src="assets/js/nav.js"></script>
  <script src="assets/js/footer.js"></script>
  ```
- Chaque page a ses propres metas SEO (title, description, og:*, canonical)

### Images et médias

- Stockés dans `assets/images/`
- Les noms peuvent contenir des espaces — mais éviter si possible, utiliser des tirets
- Formats acceptés : jpg, png, webp, mp4, webm

### Live-editor (CMS inline)

- Clé de sauvegarde : `PAGE + '__' + img.id` ou `PAGE + '__' + text.id`
- Les images injectées dynamiquement par `sync-mirror.js` doivent déclencher un rescan
- Événement custom : `document.dispatchEvent(new CustomEvent('jbe-mirror-loaded'))`

---

## 7. ÉTAT ACTUEL DU PROJET

### Ce qui est fait et stable

- **Structure globale du site** — toutes les pages principales existent
- **Nav + footer unifiés** — injectés par JS, une source unique
- **Live-editor.js** — CMS inline fonctionnel pour textes, images, vidéos (casse texte corrigée, support vidéo ajouté, renommage SEO contextuel)
- **Refonte Académie complète** — hub + page karting + page compétition
- **Backend Supabase** — tables créées, RLS configurées
- **Paddock** — grille fullscreen 5 cases, forum, calendrier, bibliothèque

### Ce qui est en cours ou partiel

- **Section Disciplines** (page compétition) — version basique, à enrichir avec infos consolidées
- **Section Simulateur** (page compétition) — en construction, offre à définir
- **Section Formation Voiture** — présente mais manque les voitures et tarifs précis
- **Page Coaching** — existe mais n'a pas été harmonisée avec la nouvelle vision multi-voies
- **Page Stages** — existe mais distinction loisir/formation à clarifier
- **Page Track-days** — incomplète, à retravailler

### Ce qui est en attente

- **Affiche Challenge** — à récupérer depuis `www.jbemeric.com` et intégrer dans le placeholder prévu
- **Photos et vidéos** — beaucoup d'images à remplacer par du contenu original ou IA
- **Contenu texte des offres** — certaines sections ont du texte générique à affiner
- **Sitemap.xml** — à mettre à jour avec les nouvelles pages (supprimer `academie-adulte.html` et `academie-challenge.html`)

---

## 8. HISTORIQUE DES DÉCISIONS IMPORTANTES

### Décision — Architecture Académie à 3 pages (avril 2026)

**Contexte** : la structure précédente avait 3 sous-pages séparées (karting, adulte, challenge) avec beaucoup de redondance.

**Options examinées** :
- A — 1 seule page Académie tout-en-un
- B — 1 hub + 5 sous-pages (une par étape)
- C — 1 hub + 2-3 sous-pages regroupées

**Décision retenue** : variante de C → **1 hub + 2 sous-pages**
- `academie-karting.html` fusionne enfant + adulte + niveaux C1-C5
- `academie-competition.html` regroupe les 4 voies vers la voiture/course

**Raison** : respecter la réalité pédagogique (karting enfant et adulte = même méthode), éviter la redondance SEO, garder une granularité suffisante par intention client.

### Décision — Passage à 4 voies parallèles (avril 2026)

**Contexte** : le hub académie présentait un parcours linéaire en 5 étapes (karting → karting adulte → C4-C5 → Challenge → BMW HTCC).

**Problème** : contradiction avec la vraie vision — certains pilotes attaquent directement à la voiture sans passer par le karting, d'autres visent des disciplines accessibles (Mitjet, Clio Cup) plutôt que le Challenge.

**Décision retenue** : remplacer les 5 étapes linéaires par **4 voies parallèles à égalité**.

**Raison** : la phrase de Yoan — *"y a certain pilote totalement débutant qui vont pas faire le karting et directement aller dans la 206"* — a invalidé la logique linéaire. Les 4 voies sont : Formation Karting, Formation Voiture, Challenge, Disciplines Compétition. Aucune n'est présentée comme principale.

### Décision — Pas de hiérarchie visuelle entre les voies (avril 2026)

**Contexte** : tentation de mettre le Challenge en avant comme "pièce maîtresse".

**Décision retenue** : traitement visuel identique pour les 4 voies.

**Raison** : le Challenge n'est pas la voie principale. Il n'a historiquement pas bien fonctionné. Le mettre en vedette trahirait la vision multi-voies et créerait un déséquilibre éditorial.

### Décision — Supprimer PACA du SEO (avril 2026)

**Contexte** : les metas et alt-texts mentionnaient systématiquement "PACA" par défaut.

**Décision retenue** : **ne plus ajouter "PACA" automatiquement** dans les descriptions SEO et alt-texts.

**Raison** : l'école n'opère pas uniquement en PACA. Restreindre artificiellement le SEO à cette région limite la portée du site et ne reflète pas la réalité.

### Décision — Renommage SEO contextuel (avril 2026)

**Contexte** : la fonction `suggestSEO` générait des noms et alt standardisés ("[slug] - JB EMERIC École de Pilotage PACA").

**Décision retenue** : fonction réécrite pour **lire le DOM autour de l'image cible** (h1 le plus proche, data-section, hero-title, porte-title, flyer-name, texte environnant).

**Raison** : un nom de fichier et un alt doivent refléter le vrai contenu de l'image et son contexte, pas un pattern générique.

### Décision — Casse du texte : ne jamais forcer le lowercase (avril 2026)

**Contexte** : `applyCasePattern` en mode "sentence" forçait `toLowerCase()` sur les mots non-initiaux, détruisant les mots en ALL_CAPS intentionnels ("KARTING ENFANT" devenait "Karting Enfant").

**Décision retenue** : en mode sentence, **seule la majuscule de début de phrase** est forcée. Tout le reste est laissé tel que tapé.

**Raison** : respecter l'intention de l'utilisateur. Ne pas réécrire ce qu'il a écrit.

### Décision — Fichier mémoire dans `claude/MEMOIRE.md` (avril 2026)

**Contexte** : perte de contexte entre sessions IA, oubli de décisions déjà prises, répétitions d'erreurs.

**Décision retenue** : fichier unique `claude/MEMOIRE.md` à la racine du projet, maintenu comme source de vérité.

**Raison** : un seul fichier = un seul endroit à consulter. Dossier `claude/` dédié pour séparer clairement des fichiers du site.

---

## 9. TÂCHES RESTANTES

### Court terme — à faire rapidement

- [ ] Intégrer le dossier `claude/` avec ce MEMOIRE.md à la racine du projet
- [ ] Finaliser l'intégration de la refonte Académie (supprimer les anciens fichiers, vérifier les liens)
- [ ] Récupérer l'affiche du Challenge depuis `www.jbemeric.com` et l'intégrer
- [ ] Mettre à jour le sitemap.xml

### Moyen terme — à planifier

- [ ] Consolider l'offre "Formation voiture" : quelles voitures exactement (206 S16, F. Renault, autres ?), quels circuits, quels tarifs
- [ ] Consolider l'offre "Disciplines compétition" avec Jean-Baptiste : karting compétition / Mitjet / Clio Cup / autres, avec budgets indicatifs réels
- [ ] Construire l'offre Simulateur : format, tarifs, calendrier, type de matériel
- [ ] Harmoniser la page Coaching avec la nouvelle vision multi-voies
- [ ] Clarifier la distinction Stages loisir vs Formation dans le ton et la nav
- [ ] Retravailler la page Track-days (actuellement incomplète)

### Long terme — à méditer

- [ ] Page "Palmarès" — mettre en valeur les élèves qui ont progressé dans le cursus
- [ ] Système de réservation en ligne (intégré à Supabase events ?)
- [ ] Espace membre pour suivre sa progression C1→C5
- [ ] Blog/actualités depuis le paddock (articles newsletter)
- [ ] Versions multilingues (anglais au minimum, pour attirer les clients internationaux)
- [ ] Optimisation SEO par ville/circuit (landing pages dédiées type "Stage pilotage Paul Ricard")

### Réflexions ouvertes — pas encore tranché

- **Identité visuelle** — est-ce que la charte actuelle (bleu profond + or) est définitive, ou à retravailler ?
- **Signature JB** — est-ce que la phrase "Un pilote ne s'invente pas" est LA signature du site, ou une parmi plusieurs ?
- **Storytelling** — la narration "warrior" évoquée par le passé (guerrier solitaire en haut de montagne, garage, écurie) a-t-elle vocation à apparaître sur le site ? À quel niveau ?
- **Témoignages** — doit-on ajouter des témoignages d'élèves ? Sous quelle forme pour rester dans le ton sobre du site ?
- **Vidéos JB** — utiliser davantage la présence de Jean-Baptiste en vidéo (présentations, debriefs, témoignages) pour humaniser ?

---

## 10. GLOSSAIRE MÉTIER

### Karting

- **C1 à C5** — grille d'évaluation interne JB EMERIC. C1 = débutant (position, trajectoires de base), C5 = niveau compétiteur (prêt pour sélection Challenge). Les passages de niveau sont validés par JB sur critères objectifs (chronos, technique).
- **Trail braking** — technique de freinage dégressif, on continue à freiner légèrement en entrée de virage pour transférer du poids sur l'avant. Technique avancée, niveau C4-C5.

### Compétition automobile

- **HTCC** — Historic Touring Car Cup. Championnat de voitures de tourisme historiques. La BMW 325i du Challenge JB EMERIC court dans cette catégorie.
- **FFSA** — Fédération Française du Sport Automobile. Organisme officiel, délivre les licences nécessaires pour courir.
- **BPJEPS** — Brevet Professionnel de la Jeunesse, de l'Éducation Populaire et du Sport. Diplôme d'État obligatoire pour enseigner le sport auto. JB en est titulaire.
- **Mitjet** — discipline monotype à budget maîtrisé, voiture sportive avec châssis tubulaire, moteur 1.6. Très populaire pour l'entrée en compétition.
- **Clio Cup** — monotype Renault, voiture de série préparée. Une des disciplines d'entrée classiques en tourisme.
- **Formule Renault** — monoplace école, tremplin vers les formules plus avancées.

### Types d'offres du site

- **Stage** — journée unique, souvent à but loisir/découverte, voiture fournie
- **Track-day** — journée libre sur circuit, le client vient avec sa propre voiture
- **Coaching** — accompagnement personnalisé, souvent sur la voiture du client
- **Cursus** (ancien mot, à éviter) — remplacé par "Formation" dans le nouveau wording
- **Formation** — parcours structuré avec progression, contrairement au stage unique
- **Challenge** — sélection compétitive avec dotation (BMW 325i HTCC)

### Vocabulaire JB EMERIC

- **"Sur un circuit, on ne peut pas tricher"** — phrase récurrente, philosophie de l'école
- **"Pilote vs pilote de loisir"** — distinction importante dans le ton du site
- **"Un pilote ne s'invente pas"** — citation finale de la page Académie

---

## 11. ANTI-PATTERNS — CE QU'ON NE FAIT PAS

### Éditorial

- ❌ **Ne pas mentionner "PACA" automatiquement** dans SEO, alt-texts, descriptions. L'école n'opère plus uniquement dans cette région.
- ❌ **Ne pas utiliser de langage promotionnel** : "révolutionnaire", "unique", "exceptionnel", "le meilleur"
- ❌ **Ne pas créer de fausse urgence** : "places limitées", "offre exclusive", "dernière chance"
- ❌ **Ne pas faire de promesses intenables** : "devenez pilote en X jours", "garantie satisfaction"
- ❌ **Ne pas survendre le Challenge** : il est une voie parmi d'autres, pas LA voie
- ❌ **Ne pas hiérarchiser artificiellement les voies** d'accès à la compétition
- ❌ **Ne pas réécrire le texte saisi par l'utilisateur** dans le live-editor (casse, ponctuation, etc.)

### Technique

- ❌ **Ne pas automatiser l'extraction de CSS commun** — a produit trop de conflits. Mutualisation manuelle uniquement.
- ❌ **Ne pas utiliser `circuits(nom)` dans les requêtes Supabase** — la table circuits n'est pas exposée via REST, retourne 400
- ❌ **Ne pas redéfinir nav/footer/burger en dehors de `nav.css`** — autorité unique
- ❌ **Ne pas passer `live-editor.js` en ES6+** — doit rester en ES5 strict
- ❌ **Ne pas oublier le rescan après injection dynamique** — événement `jbe-mirror-loaded`

### Architecture

- ❌ **Ne pas créer de pages redondantes** — si 2 pages racontent presque la même chose, fusionner
- ❌ **Ne pas mélanger les audiences sur une page** — chaque page = un profil dominant
- ❌ **Ne pas présenter un parcours linéaire unique** — la vision du site est multi-voies

---

## 12. RÉFÉRENCES ET INSPIRATIONS

### Écoles concurrentes analysées

- **RKC Karting Paris** — approche classique, toutes cibles, discours institutionnel
- **Karting Center Tours** — très FFSA, très institutionnel, peu de différenciation
- **Karting Manosque** — volants bronze/argent/or, modèle traditionnel
- **Karting ACO Le Mans** — distinction loisir/compétition claire, peu d'identité forte
- **KHUB Arras** — focus enfant, académie en année scolaire
- **Karting Oberlin** — mentionne Tom Montagne comme alumnus, capitalise sur les réussites

### Ce que ces écoles font en commun et qu'on refuse de faire

- Discours promotionnel généraliste
- Pas de vraie philosophie pédagogique
- Aucune verticale complète (personne ne va jusqu'à la course)
- Peu d'identité éditoriale distincte

### Ce que JB EMERIC fait différemment

- Une voix éditoriale mature et sobre
- Un champion qui enseigne personnellement
- Une verticale complète du karting à la course
- Une honnêteté sur les limites et les parcours possibles
- Une logique multi-voies et non pas un parcours unique rigide

### Inspirations visuelles

À compléter par Yoan — quelles références visuelles t'inspirent ? Magazines sportifs ? Sites de constructeurs auto premium ? Presse motorsport ? Autre ?

---

## 13. BUGS CONNUS ET CONTOURNEMENTS

### Supabase — jointure `circuits(nom)` non exposée

**Symptôme** : requête `events?select=...,circuits(nom)` retourne 400 Bad Request.

**Cause** : la table `circuits` n'est pas exposée via l'API REST de Supabase.

**Contournement** : faire une requête séparée si nécessaire, ou stocker le nom du circuit directement dans une colonne de `events`.

### Live-editor — images dynamiques non sauvegardées

**Symptôme** : les images injectées par `sync-mirror.js` (portes académie, panels coaching) peuvent être modifiées visuellement mais ne sont pas persistées dans Supabase.

**Cause** : `scanImages()` est appelé au `DOMContentLoaded` et `window.load`, mais les injections async arrivent après.

**Contournement** : `sync-mirror.js` dispatche un événement custom `jbe-mirror-loaded` après chaque injection. `live-editor.js` écoute cet événement et rescane les images.

**Code associé** :
```js
// Dans sync-mirror.js, après chaque injection réussie :
document.dispatchEvent(new CustomEvent('jbe-mirror-loaded'))

// Dans live-editor.js :
document.addEventListener('jbe-mirror-loaded', function () {
  scanImages()
  applyImages()
  // bind nouvelles images...
})
```

### CSS — automatisation d'extraction problématique

**Symptôme** : tentatives passées d'extraire automatiquement les règles CSS communes ont produit des conflits et un rendu dégradé.

**Cause** : les règles qui *semblent* identiques sélecteur par sélecteur ont souvent des contextes différents (media queries, specificité, ordre d'apparition).

**Contournement** : mutualisation manuelle uniquement, règle par règle, avec vérification visuelle après chaque extraction.

### Nav — gap entre tabs et sous-menu

**Symptôme** (historique) : le hover sur un tab de nav coupait le survol quand la souris descendait vers le sous-menu.

**Cause** : gap physique entre les éléments.

**Correctif appliqué** : pseudo-élément `::before` invisible qui fait le pont entre le tab et le sous-menu, permettant au hover de continuer.

---

## 14. HISTORIQUE DES VERSIONS

Cette section retrace les gros changements du projet pour éviter de refaire les mêmes choix ou les mêmes erreurs.

### v1 — Version initiale

- Structure : academie.html + 3 sous-pages (karting, adulte, challenge)
- Parcours linéaire 5 étapes karting → BMW HTCC
- PACA omniprésent dans le SEO
- Pages avec CSS et JS inline dans les HTML

### v2-v5 — Nettoyages techniques

- Extraction progressive du CSS inline vers fichiers dédiés
- Extraction du JS inline vers fichiers dédiés
- HTML réduit drastiquement (815 KB → 250 KB)
- Nav unifiée via nav.js

### v6-v10 — Tentatives d'architecture index

- Expériences successives sur la section sections du hub index
- Scroll snap ajouté
- Plusieurs bugs de CSS dus à l'automatisation
- Leçon : arrêter l'extraction automatique du CSS

### v11-v16 — Live-editor et features

- Support vidéo dans le live-editor
- Renommage SEO contextuel (pas de PACA auto)
- Casse du texte corrigée (plus de lowercase forcé)
- Rescan après mirror-loaded

### v17 — Refonte Académie (version actuelle)

- 3 pages au lieu de 3+ avec redondance
- 4 voies parallèles au lieu de 5 étapes linéaires
- Fusion karting enfant + adulte
- Nouvelle page compétition
- Hub modifié (section cursus + 2 portes)

---

## 15. NOTES PERSONNELLES ET MATIÈRE BRUTE

*Cette section est libre. Yoan peut y mettre des idées, des phrases, des liens, des trucs à ne pas oublier. Elle n'a pas à être propre.*

### Idées narratives évoquées

- Métaphore du **guerrier solitaire** au sommet d'une montagne, devant un garage et une écurie. Validée en version épique/métaphorique, à refiner si on veut l'intégrer au site.
- Citation finale academie : *"Un pilote ne s'invente pas. Il se construit — session après session, virage après virage, debrief après debrief."*

### Liens externes

- Site actuel : `www.jbemeric.com` (contient notamment l'affiche du Challenge à récupérer)
- Site Netlify : `https://jbemeric.netlify.app`
- Chaîne YouTube : `@jbemeric` (~10 000 abonnés)

### À ne pas oublier

- La vidéo `Stage de pilotage Karting pour enfants.mp4` est dans `assets/images/` (oui dans images, pas dans un dossier vidéos)
- L'image `Jb emeric enfant breafing.png` sert de poster vidéo
- L'image `bmw-325i-htcc.jpg` est utilisée en hero de la page Compétition

### Matière brute venant de Yoan

*Tout ce que Yoan veut préserver sans structure particulière*

- "Plus c'est simple mieux ça marche en général" — guide de design
- "Je ne suis pas informaticien" — rappel de contexte, Yoan pilote les décisions mais n'implémente pas techniquement
- Métier réel : Diesel Fitter (mining) + mécanicien motorsport
- Préférence : écriture sobre, rigoureuse, humaine, exploratoire

---

## Fin du document

**Rappel** : ce fichier doit évoluer. Si une décision est prise, elle doit être actée ici. Si une section devient obsolète, elle doit être corrigée. Ce fichier vaut par sa fraîcheur autant que par son contenu.
