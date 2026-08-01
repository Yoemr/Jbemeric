# Chantier — Refonte de l'espace de travail Claude

**Date** : 1er août 2026
**Branche** : `claude/redesign-competition-page-pNx0Y`
**Statut** : validé, prêt pour exécution

---

## 1. Pourquoi ce chantier

Le projet n'avait pas été repris depuis avril 2026. Quatre problèmes ont été identifiés par Yoan, et confirmés par l'inspection du dépôt :

1. **Perte de contexte entre sessions.** Chaque conversation repartait de zéro.
2. **Incohérence entre les pages.** Chacune travaillée dans son coin, sans vue d'ensemble.
3. **Pas de vision d'ensemble à jour.** Le `MEMOIRE.md` décrivait un état du site devenu partiellement faux.
4. **Trop d'allers-retours sur l'exécution.** Production non conforme, correction, re-correction.

**Cause racine identifiée.** Le fichier `claude/CLAUDE.md` n'était pas à un emplacement chargé automatiquement par Claude Code — qui ne lit que `CLAUDE.md` à la racine du projet ou dans `.claude/`. Résultat : la vision, les anti-patterns et les règles de gouvernance n'étaient jamais chargés, sauf intervention manuelle. Le `MEMOIRE.md` était bon ; il était simplement invisible.

Cause secondaire : un document unique de 700 lignes est un tout-ou-rien. Soit on le charge en entier et il occupe une part importante du contexte à chaque session, soit on ne le charge pas.

---

## 2. Objectifs

- Rendre la vision du projet chargée automatiquement, sans intervention.
- Découper le cahier des charges pour que chaque métier ne lise que ce qui le concerne.
- Créer des rôles spécialisés disposant chacun de son document de référence.
- Tenir un état des lieux vivant et un journal des décisions.
- Ne rien coûter : fichiers texte dans le dépôt, aucun service tiers.

---

## 3. Décisions actées

### 3.1 — Approche retenue : « le studio »

Trois approches ont été examinées :

- **A — Réparer le socle seul** : déplacer `CLAUDE.md`, garder le MEMOIRE tel quel. Rapide, mais ne règle que la douleur 1.
- **B — Le studio** : socle réparé + cahier des charges éclaté par métier + rôles spécialisés. **Retenue.**
- **C — L'agence complète** : B + workflows codifiés par type de chantier + audit initial complet. Écartée pour cette étape — risque de passer plus de temps à ranger l'atelier qu'à construire.

**Raison du choix de B** : un rôle sans document de référence propre n'est qu'un nom. Le découpage du cahier des charges est le vrai travail, et c'est lui qui règle l'incohérence entre pages. L'audit page par page prévu en C est conservé, mais comme **premier chantier après** la mise en place, confié au rôle Cohérence.

### 3.2 — Suppression du plugin superpowers

**Décision** : `superpowers@claude-plugins-official` passé à `false` dans `~/.claude/settings.json` (appliqué le 1er août 2026). Le cache du plugin est conservé sur disque — la réactivation est un simple changement de valeur.

**Raisons** :
- Procédures conçues pour du développement logiciel en équipe (tests automatisés, worktrees git, revues de code, exécution de plans multi-sessions). Sans objet sur un site statique travaillé en solo.
- Injection d'un bloc de consignes à chaque démarrage de session, dans tous les projets — coût de contexte permanent.
- Cérémonie disproportionnée sur des tâches simples.

**Ce qu'on garde de l'idée** : la discipline « cadrer, écrire la décision, planifier, exécuter » est reprise en quatre règles dans le `CLAUDE.md` racine (section 6), en français et dimensionnée pour ce projet.

**Cohérence avec l'historique** : cette décision prolonge celle d'avril 2026 sur la GStack — *« ajouter une couche de prompts pré-écrits apporterait plus d'overhead que de bénéfice »*.

**Non concerné** : les skills livrés avec l'application (`design:*`, `anthropic-skills:*`, `dataviz`, `simplify`…) ne sont pas des plugins installés, ne sont pas désinstallables, et ne coûtent qu'une ligne de description. Elles restent disponibles ; `design-critique`, `accessibility-review` et `ux-copy` sont pertinentes pour ce site.

### 3.3 — Gouvernance révisée

L'ancienne règle (« livraison exclusivement par zip, aucun droit git ») ne correspondait plus à la pratique réelle — l'historique montre des commits faits depuis Claude Code.

**Nouvelle règle** :
- Travail **en local**, 99 % du temps.
- Claude **peut** modifier les fichiers et **commiter** sur une branche de travail.
- Claude ne **pousse jamais** et ne déclenche **aucun déploiement**. Yoan pousse quand ça lui convient, environ une fois par jour.

**Raison** : chaque push déclenche un build Netlify. Le palier gratuit est de 300 minutes de build par mois ; un push quotidien reste très loin de la limite. Contrainte explicite de Yoan : *« le but c'est que tout ça ne coûte zéro € »*.

### 3.4 — Droits d'écriture sur la documentation

| Fichier | Modification par Claude |
|---|---|
| `CLAUDE.md`, `00` à `04` | **Sur validation de Yoan uniquement.** Proposition explicite : quoi, pourquoi, où. |
| `05-etat-des-lieux.md`, `06-decisions.md` | **Libre.** Mis à jour en fin de chantier, avec résumé à Yoan. |
| `99-matiere-brute.md` | Ajout libre, jamais de suppression ni de réécriture. |

**Raison de l'assouplissement sur 05 et 06** : exiger une validation pour chaque ligne de compte-rendu garantit l'abandon de la pratique en quelques semaines — c'est exactement ainsi que le `MEMOIRE.md` a dérivé.

### 3.5 — Pas d'agent chef de projet

Le pilotage reste dans la conversation principale, entre Yoan et Claude.

**Raison** : chaque agent démarre sans historique et ne reçoit que ce qu'on lui écrit. Un agent qui pilote d'autres agents ajoute un relais, et chaque relais perd de l'information.

### 3.6 — Le rôle Cohérence est en lecture seule

Il diagnostique et rend un rapport ; il ne corrige pas. Les corrections sont ensuite distribuées aux trois autres rôles depuis la conversation principale.

**Raison** : un rôle transversal doté du droit d'écriture piétinerait le travail des rôles spécialisés — soit précisément le désordre que ce chantier cherche à supprimer.

---

## 4. Architecture cible

```
CLAUDE.md                       RACINE — chargé automatiquement. ~60 lignes.

docs/
├── 00-vision.md                Identité, philosophie, ton éditorial, profils clients
├── 01-architecture.md          Carte du site, audience par page, parcours
├── 02-design-system.md         Couleurs, typos, composants, patterns CSS
├── 03-technique.md             Stack, conventions de code, bugs connus
├── 04-contenus-seo.md          Règles éditoriales, mots-clés, metas, glossaire métier
├── 05-etat-des-lieux.md        Fait / en cours / à faire — page par page
├── 06-decisions.md             Journal des décisions, du plus récent au plus ancien
├── 99-matiere-brute.md         Notes libres de Yoan, sans structure imposée
└── chantiers/                  Une fiche par chantier, datée

.claude/
├── agents/
│   ├── jbe-design.md
│   ├── jbe-editorial.md
│   ├── jbe-technique.md
│   └── jbe-coherence.md
├── launch.json                 (inchangé)
└── settings.local.json         (inchangé)

old/
└── MEMOIRE-avril-2026.md       Archive de l'original
```

**Chargé à chaque session** : `CLAUDE.md` uniquement, qui renvoie vers `00-vision.md`.
**Chargé à la demande** : tout le reste, par le rôle concerné.

---

## 5. Répartition du contenu de `claude/MEMOIRE.md`

Aucun contenu n'est perdu. Correspondance section par section :

| Section actuelle | Destination |
|---|---|
| 1 — Identité et philosophie | `00-vision.md` |
| 2 — Persona narratif et ton éditorial | `00-vision.md` |
| 3 — Audiences et profils clients | `00-vision.md` |
| 4 — Architecture du site | `01-architecture.md` |
| 5 — Stack technique | `03-technique.md` — sauf la palette couleurs → `02-design-system.md` |
| 6 — Conventions de code | `03-technique.md` — sauf les patterns visuels → `02-design-system.md` |
| 7 — État actuel du projet | `05-etat-des-lieux.md` |
| 8 — Historique des décisions | `06-decisions.md` |
| 9 — Tâches restantes | `05-etat-des-lieux.md` |
| 10 — Glossaire métier | `04-contenus-seo.md` |
| 11 — Anti-patterns : gouvernance | `CLAUDE.md` |
| 11 — Anti-patterns : éditorial | `04-contenus-seo.md` |
| 11 — Anti-patterns : technique | `03-technique.md` |
| 11 — Anti-patterns : architecture | `01-architecture.md` |
| 12 — Références : inspirations visuelles | `02-design-system.md` |
| 12 — Références : concurrence, positionnement | `04-contenus-seo.md` |
| 13 — Bugs connus et contournements | `03-technique.md` |
| 14 — Historique des versions | `06-decisions.md` |
| 15 — Notes personnelles et matière brute | `99-matiere-brute.md` |

`claude/Autres regles.md` (règle des 95 %, gestion d'échec) → `CLAUDE.md` section 6.

**Apports depuis la mémoire automatique de Claude** (`~/.claude/projects/.../memory/`, avril 2026) :
- Routing par hash obligatoire, contournement PostgREST `not.is.null` → `03-technique.md`
- Import WordPress, 29 articles en base, schéma de la table `docs` → `03-technique.md` et `05-etat-des-lieux.md`
- Pattern CSS de citation sur fond sombre (règle `em { display: inline }`) → `02-design-system.md`

**À vérifier avant transcription** : les mémoires d'avril ont 109 jours. Les affirmations sur l'état du code doivent être confrontées aux fichiers actuels avant d'être écrites comme vraies. La structure du dépôt a notamment changé — les pages sont désormais réparties dans `academie/`, `paddock/`, `admin/`, `outil-dev/` et `old/`, ce que le `MEMOIRE.md` ne reflète pas.

---

## 6. Les quatre rôles

| Rôle | Fichier | Mission | Documents chargés | Écriture |
|---|---|---|---|---|
| **Design** | `jbe-design.md` | Identité visuelle, mise en page, CSS, hiérarchie, responsive | `02-design-system.md` | Oui |
| **Éditorial** | `jbe-editorial.md` | Textes, ton, titres, metas, alt, mots-clés, structure Hn | `04-contenus-seo.md` | Oui |
| **Technique** | `jbe-technique.md` | HTML/CSS/JS, Supabase, live-editor, performance, bugs | `03-technique.md` | Oui |
| **Cohérence** | `jbe-coherence.md` | Navigation, parcours, liens, doublons, audit transversal | `01-architecture.md`, `05-etat-des-lieux.md` | **Non** |

Tous héritent du socle (`CLAUDE.md` + `00-vision.md`).

**Outils par rôle** :
- Design — lecture, édition, navigateur de prévisualisation
- Éditorial — lecture, édition, recherche web
- Technique — lecture, édition, shell, navigateur, MCP Supabase
- Cohérence — lecture et navigateur uniquement, aucun outil d'écriture

**Modèle** : aucun `model` déclaré au départ ; les agents héritent de celui de la session. À ajuster plus tard si un rôle se révèle mécanique au point de justifier un modèle plus léger.

**Règle de circulation** : les agents ne s'appellent jamais entre eux. Tout repasse par la conversation principale, seul endroit où quelqu'un voit l'ensemble.

---

## 7. Méthode de travail (dans `CLAUDE.md`)

1. **Cadrer avant de construire.** Un chantier touchant plus d'une page ou modifiant une structure commence par une discussion, puis une fiche courte dans `docs/chantiers/` (objectif, ce qu'on change, ce qu'on ne change pas), validée par Yoan. Une retouche ponctuelle se fait directement, sans cérémonie.
2. **Règle des 95 %.** Aucune modification de code si la solution n'est pas sûre à 95 %. Dans le doute : une question précise, pas une supposition.
3. **Deux tentatives maximum sur un bug.** Au-delà, arrêt et changement d'approche. Aucun retour arrière sans avoir énoncé la cause racine de l'échec.
4. **Fin de chantier.** Mise à jour de `05-etat-des-lieux.md` et `06-decisions.md`, puis résumé court à Yoan.

---

## 8. Hors périmètre

Ce chantier ne touche à **rien** du site lui-même. Explicitement exclus :

- Toute modification de page HTML, CSS ou JS du site
- L'audit page par page (ce sera le chantier suivant, confié au rôle Cohérence)
- Toute opération sur Supabase
- Tout push git ou déploiement Netlify
- Le fichier `assets/js/live-editor.js`, actuellement modifié et non commité — laissé en l'état
- Le dossier `assets/images/Autres/`, non suivi — laissé en l'état

---

## 9. Étapes d'exécution

1. Créer `docs/00-vision.md` à `docs/06-decisions.md` et `docs/99-matiere-brute.md`, en répartissant le contenu selon la section 5 et en vérifiant chaque affirmation technique contre le dépôt actuel.
2. Créer `CLAUDE.md` à la racine.
3. Créer les quatre agents dans `.claude/agents/`.
4. Déplacer `claude/MEMOIRE.md` vers `old/MEMOIRE-avril-2026.md`, puis supprimer le dossier `claude/`.
5. Déplacer `docs/superpowers/specs/2026-04-26-karting-academie-redesign-design.md` vers `docs/chantiers/`, supprimer `docs/superpowers/`.
6. Mettre à jour la mémoire automatique de Claude pour qu'elle pointe vers la nouvelle structure au lieu de dupliquer son contenu.
7. Commit local sur la branche courante. Aucun push.

---

## 10. Critères de réussite

- Une session ouverte à froid connaît la vision, le ton et les règles de gouvernance sans que Yoan ait à les rappeler.
- Chaque section du `MEMOIRE.md` d'origine est retrouvable dans la nouvelle structure — vérification section par section contre le tableau de la partie 5.
- Chacun des quatre agents répond en s'appuyant sur son document, pas sur des généralités.
- `05-etat-des-lieux.md` décrit le site réel, vérifié contre les fichiers, et non l'état supposé d'avril 2026.
- Aucun fichier du site modifié, aucun push effectué.
