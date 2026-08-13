# Chantier, Refonte de l'espace de travail Claude

**Date** : 1er août 2026
**Branche** : `claude/redesign-competition-page-pNx0Y`
**Statut** : validé, prêt pour exécution

---

## 1. Pourquoi ce chantier

Le projet n'avait pas été repris depuis avril 2026. Quatre problèmes énoncés par Yoan, confirmés par l'inspection du dépôt :

1. **Perte de contexte entre sessions.** Chaque conversation repartait de zéro.
2. **Incohérence entre les pages.** Chacune travaillée dans son coin, sans vue d'ensemble.
3. **Pas de vision d'ensemble à jour.** Le `MEMOIRE.md` décrivait un site qui n'existe plus tout à fait.
4. **Trop d'allers-retours sur l'exécution.**

**Cause racine.** `claude/CLAUDE.md` n'était pas à un emplacement chargé automatiquement, Claude Code ne lit que `CLAUDE.md` à la racine du projet ou dans `.claude/`. La vision, les anti-patterns et les règles de gouvernance n'étaient donc jamais chargés. Le `MEMOIRE.md` était bon ; il était invisible.

**Cause aggravante, découverte en cours de cadrage.** Le `MEMOIRE.md` n'est plus fiable. Confronté au dépôt, il décrit une arborescence obsolète et des conventions qui ne sont pas appliquées. Preuves relevées le 1er août 2026 :

| Ce que dit le MEMOIRE | Ce que dit le dépôt |
|---|---|
| `pages.css` = « règles communes à plusieurs pages », pilier de l'architecture CSS | Chargé par **zéro** page sur 18 |
| Pages à la racine : `academie-karting.html`, `nos-voitures.html`, `coming-soon.html`… | Réparties dans `academie/`, `paddock/`, `admin/`, `old/` |
| « Stages » figure comme une page dans le tableau des cinq offres | N'a jamais existé, c'est l'ancre `track.html#stages` |

Autres anomalies relevées au même moment :

- **Cinq CSS orphelins** : `adulte.css`, `challenge.css`, `coming-soon.css`, `pages.css`, `sections-contact.css`
- **Cinq JS orphelins** : `auth.js`, `section-avis.js`, `section-contact.js`, `sync-mirror.js.bak`, `track-sessions.js`
- **`auth.js` n'est chargé par aucune page**, alors que `admin/login.html` charge bien `auth.css`, authentification en dur dans la page, ou cassée. À vérifier.
- **« Nos voitures » existe en double** : l'ancre `track.html#voitures` référencée par le menu, et la page `paddock/nos-voitures.html` (19 Ko, CSS dédié) absente de tout menu.
- **Pages publiques rangées dans `admin/`** : `contact.html`, `mentions-legales.html`, `confidentialite.html` vivent dans `admin/legal/`.
- **`track.html` porte quatre sujets** (stages, track-days, nos voitures, votre voiture), 33 Ko, la plus grosse page du site.

**Conséquence méthodologique.** Ranger proprement le `MEMOIRE.md` produirait une documentation impeccable et fausse, pire que pas de documentation, parce qu'on lui ferait confiance. Le chantier commence donc par un inventaire du réel, pas par une transcription.

---

## 2. Principe directeur

> **La vision se confirme, les faits se vérifient.**

Deux travaux de nature différente, jusqu'ici confondus :

- **La vision** : ton éditorial, profils clients, quatre voies vers la compétition, refus du langage promotionnel. C'est de la pensée, elle a coûté cher et ne périme pas. Elle est resservie à Yoan telle quelle ; il confirme ou corrige. Rapide.
- **Les faits** : architecture, technique, état d'avancement. Aucune ligne n'est écrite sans avoir été vérifiée dans les fichiers. Le `MEMOIRE.md` ne vaut que comme piste à contrôler.

---

## 3. Le modèle de structuration

Défini par Yoan, complété au cours du cadrage.

### 3.1 L'arbre

- **Niveau 0** : le projet entier. Vision, ton, audiences, règles transverses.
- **Niveaux 1 à n** : les pages maîtresses. Chacune a un cahier des charges propre et des objectifs spécifiques. Les ponts entre elles sont normaux : elles font partie du même projet.
- **Sous-niveaux (1.1, 1.2, 3.4…)** : héritent des règles de leur parent. Pas de cahier des charges autonome.

**Les numéros servent à parler.** Ils ne figurent ni dans les noms de fichiers, ni dans les URLs, ni dans le menu. Une URL `/academie/karting` se lit et se partage ; `/1-academie/1.1-karting.html` non. Le rangement s'exprime par les dossiers ; la hiérarchie se lit dans la documentation.

### 3.2 Les ressources transversales

Certains contenus sont consommés par plusieurs branches de l'arbre. Le palmarès en est le cas type : il vit dans le Paddock, mais ressort dans la page karting au moment de présenter la formation, en version courte intégrée, plus un lien vers la version complète.

**Règle : une seule source de vérité. Tous les autres emplacements n'en sont que des vues.**

C'est la règle qui supprime les conflits permanents à la racine. Le jour où le palmarès existe en trois exemplaires indépendants, les trois divergent.

**Le mécanisme existe déjà** : `assets/js/sync-mirror.js` aspire des sections de pages piliers et les injecte ailleurs (aujourd'hui `academie.html#portes`, `coaching.html#formules`, `track.html#sr-grid` vers `index.html`). Il suffira de l'étendre.

Candidats identifiés : palmarès, biographie de JB, circuits partenaires, témoignages.

### 3.3 Le statut

Chaque page porte une mention honnête :

- **défini** : cahier des charges établi et validé
- **en chantier** : travail commencé, cahier des charges non arrêté
- **non défini** : page existante mais jamais pensée

Actuellement **en chantier**, sur déclaration de Yoan : « Nos voitures » et « Stages ».

**Raison.** Une documentation qui dit « je ne sais pas » est utilisable ; une qui prétend savoir ne l'est pas. C'est cette mention qui empêche de bâtir sur du spéculatif.

### 3.4 Numérotation de travail (provisoire)

Établie d'après `assets/js/nav.js`, structure réelle du menu. À valider et amender.

```
Niveau 0   LE PROJET                      vitrine : index.html

Niveau 1   ACADÉMIE                       academie.html
           ├ 1.1  Formation Karting       academie/karting.html
           └ 1.2  Vers la Compétition     academie/competition.html

Niveau 2   COACHING                       coaching.html

Niveau 3   STAGES & TRACK-DAYS            track.html          [en chantier]
           ├ 3.1  Stages voiture          ancre               [en chantier]
           ├ 3.2  Track-Days              ancre
           ├ 3.3  Nos voitures            ancre + doublon     [en chantier]
           └ 3.4  Votre voiture           ancre

Niveau 4   PADDOCK                        paddock.html
           ├ 4.1  Bibliothèque technique  paddock/articles.html + article.html
           ├ 4.2  Forum pilotes           ancre
           ├ 4.3  Chaîne YouTube          ancre
           ├ 4.4  Calendrier              ancre
           └ 4.5  Palmarès                paddock/palmares.html + ressource transversale

Hors hiérarchie, utilitaire, pas de cahier des charges
           contact · mentions légales · confidentialité
           login · signup · mot de passe oublié · dashboard admin
```

**Conflit ouvert, non tranché** : « Nos voitures » existe en ancre (`track.html#voitures`, référencée par le menu) et en page (`paddock/nos-voitures.html`, invisible). À arbitrer lors du chantier « Stages & Track-Days », pas avant.

---

## 4. Décisions actées

### 4.1 Approche : « le studio »

Trois approches examinées :

- **A, Réparer le socle seul** : déplacer `CLAUDE.md`, garder le MEMOIRE. Ne règle que la douleur 1.
- **B, Le studio** : socle réparé + cahier des charges éclaté par métier + rôles spécialisés. **Retenue.**
- **C, L'agence complète** : B + workflows codifiés + audit initial complet. Écartée à l'origine, mais **l'audit de C a été réintégré en étape 0** après constat de l'obsolescence du MEMOIRE.

### 4.2 Suppression du plugin superpowers

**Fait le 1er août 2026** : `superpowers@claude-plugins-official` passé à `false` dans `~/.claude/settings.json`. Cache conservé sur disque, réactivation possible en changeant une valeur.

**Raisons** :
- Procédures conçues pour du développement logiciel en équipe (tests automatisés, worktrees git, revues de code). Sans objet sur un site statique travaillé en solo.
- Bloc de consignes injecté à chaque démarrage de session, dans tous les projets, coût de contexte permanent.
- Cérémonie disproportionnée sur des tâches simples.

**Ce qu'on garde** : la discipline « cadrer, écrire, planifier, exécuter », reprise en quatre règles dans le `CLAUDE.md` racine (section 7).

**Cohérence** : prolonge la décision d'avril 2026 sur la GStack, *« ajouter une couche de prompts pré-écrits apporterait plus d'overhead que de bénéfice »*.

**Non concerné** : les skills livrés avec l'application (`design:*`, `anthropic-skills:*`, `dataviz`…) ne sont pas des plugins installés et ne coûtent qu'une ligne de description. Conservées.

### 4.3 Gouvernance

L'ancienne règle (« livraison exclusivement par zip, aucun droit git ») ne correspondait plus à la pratique.

- Travail **en local**, 99 % du temps.
- Claude **peut** modifier les fichiers et **commiter** sur une branche de travail.
- Claude ne **pousse jamais**, ne déclenche **aucun déploiement**. Yoan pousse quand ça lui convient, environ une fois par jour.

**Raison** : chaque push déclenche un build Netlify ; le palier gratuit est de 300 minutes par mois. Contrainte explicite de Yoan : *« le but c'est que tout ça ne coûte zéro € »*.

### 4.4 Droits d'écriture sur la documentation

| Fichier | Modification par Claude |
|---|---|
| `CLAUDE.md`, `00` à `04` | **Sur validation de Yoan.** Proposition explicite : quoi, pourquoi, où. |
| `05-etat-des-lieux.md`, `06-decisions.md` | **Libre**, avec résumé à Yoan en fin de chantier. |
| `99-matiere-brute.md` | Ajout libre. Jamais de suppression ni de réécriture. |

**Raison de l'assouplissement** : exiger une validation pour chaque ligne de compte-rendu garantit l'abandon de la pratique en quelques semaines, c'est ainsi que le `MEMOIRE.md` a dérivé.

### 4.5 Pas d'agent chef de projet

Le pilotage reste dans la conversation principale. Chaque agent démarre sans historique et ne reçoit que ce qu'on lui écrit : un agent qui pilote d'autres agents ajoute un relais, et chaque relais perd de l'information.

### 4.6 Le rôle Cohérence est en lecture seule

Il diagnostique et rend un rapport ; il ne corrige pas. Les corrections sont distribuées aux autres rôles depuis la conversation principale. Un rôle transversal doté du droit d'écriture piétinerait le travail des rôles spécialisés.

---

## 5. Architecture cible

```
CLAUDE.md                       RACINE, chargé automatiquement. ~60 lignes.

docs/
├── 00-vision.md                Identité, philosophie, ton éditorial, profils clients
├── 01-architecture.md          L'arbre, une fiche par page maîtresse, ressources
│                               transversales, statuts
├── 02-design-system.md         Couleurs, typos, composants, patterns CSS
├── 03-technique.md             Stack, conventions réelles, bugs connus
├── 04-contenus-seo.md          Règles éditoriales, mots-clés, metas, glossaire métier
├── 05-etat-des-lieux.md        L'inventaire vérifié, fait / en chantier / à faire
├── 06-decisions.md             Journal des décisions, du plus récent au plus ancien
├── 99-matiere-brute.md         Notes libres de Yoan, sans structure imposée
└── chantiers/                  Une fiche par chantier, datée

.claude/agents/
├── jbe-design.md
├── jbe-editorial.md
├── jbe-technique.md
└── jbe-coherence.md

old/
└── MEMOIRE-avril-2026.md       Archive de l'original
```

**Chargé à chaque session** : `CLAUDE.md` seul, qui renvoie vers `00-vision.md`.
**Chargé à la demande** : le reste, par le rôle concerné.

---

## 6. Les quatre rôles

| Rôle | Fichier | Mission | Documents | Écriture |
|---|---|---|---|---|
| **Design** | `jbe-design.md` | Identité visuelle, mise en page, CSS, hiérarchie, responsive | `02` | Oui |
| **Éditorial** | `jbe-editorial.md` | Textes, ton, titres, metas, alt, mots-clés, structure Hn | `04` | Oui |
| **Technique** | `jbe-technique.md` | HTML/CSS/JS, Supabase, live-editor, performance, bugs | `03` | Oui |
| **Cohérence** | `jbe-coherence.md` | Navigation, parcours, liens, doublons, audit transversal | `01`, `05` | **Non** |

Tous héritent du socle (`CLAUDE.md` + `00-vision.md`).

**Outils** : Design : lecture, édition, navigateur. Éditorial : lecture, édition, recherche web. Technique : lecture, édition, shell, navigateur, MCP Supabase. Cohérence : lecture et navigateur seuls, aucun outil d'écriture.

**Modèle** : aucun `model` déclaré ; héritage de la session. À ajuster plus tard si besoin.

**Circulation** : les agents ne s'appellent jamais entre eux. Tout repasse par la conversation principale, seul endroit d'où l'on voit l'ensemble.

---

## 7. Méthode de travail (dans `CLAUDE.md`)

1. **Cadrer avant de construire.** Un chantier touchant plus d'une page ou modifiant une structure commence par une discussion, puis une fiche courte dans `docs/chantiers/` validée par Yoan. Une retouche ponctuelle se fait directement.
2. **Règle des 95 %.** Aucune modification de code si la solution n'est pas sûre à 95 %. Dans le doute : une question précise.
3. **Deux tentatives maximum sur un bug.** Au-delà, arrêt et changement d'approche. Aucun retour arrière sans énoncer la cause racine.
4. **Fin de chantier.** Mise à jour de `05` et `06`, puis résumé court à Yoan.

---

## 8. Étapes

**Étape 0, L'inventaire.** Lecture du site en entier. Constat factuel : contenu réel de chaque page, fichiers morts, doublons, incohérences, liens cassés. Aucune opinion, aucun « il faudrait ». Produit `05-etat-des-lieux.md`. Fait par Claude seul.

**Étape 1, Le cahier des charges général (niveau 0).** Avec Yoan, en partant de l'inventaire. La vision d'avril est resservie pour confirmation ; l'architecture est rebâtie sur les faits. Produit `00-vision.md` et `01-architecture.md`.

**Étape 2, Le socle Claude.** `CLAUDE.md` racine, `02`, `03`, `04`, `06`, `99`, les quatre agents. Archivage de `claude/MEMOIRE.md` vers `old/MEMOIRE-avril-2026.md`. Déplacement de `docs/superpowers/specs/` vers `docs/chantiers/`. Mise à jour de la mémoire automatique de Claude.

**Étape 3, Le grand nettoyage.** Suppression des fichiers morts confirmés par l'inventaire, sortie des pages publiques de `admin/`, redirections `_redirects` correspondantes. Chaque suppression validée par Yoan.

**Étape 4, Les cahiers des charges par page maîtresse.** Un par niveau, au moment d'attaquer la page. Pas tous d'avance.

Commit local à chaque étape. Aucun push.

---

## 9. Hors périmètre

Ce chantier ne touche à aucun contenu du site. Explicitement exclus :

- Toute modification éditoriale ou visuelle d'une page
- L'arbitrage du doublon « Nos voitures », reporté au chantier concerné
- La définition des offres « Stages » et « Nos voitures », en chantier côté Yoan
- Toute opération sur Supabase
- Tout push git ou déploiement Netlify
- `assets/js/live-editor.js`, modifié et non commité, laissé en l'état
- `assets/images/Autres/`, non suivi, laissé en l'état

Les suppressions de l'étape 3 sont la seule exception, et chacune est validée individuellement.

---

## 10. Critères de réussite

- Une session ouverte à froid connaît la vision, le ton et les règles de gouvernance sans rappel de Yoan.
- `05-etat-des-lieux.md` décrit le site réel, vérifié fichier par fichier, pas l'état supposé d'avril 2026.
- Chaque page porte un statut honnête ; aucune n'est présentée comme définie si elle ne l'est pas.
- Le palmarès a une source de vérité unique et documentée.
- Chacun des quatre agents répond en s'appuyant sur son document, pas sur des généralités.
- Aucun contenu de page modifié, aucun push effectué.
