# État des lieux — inventaire du réel

**Relevé le** : 1er août 2026
**Périmètre** : 18 pages HTML, 21 CSS, 18 JS, `_redirects`, `routes.js`, `dev-server.js`
**Méthode** : extraction mécanique (titres, metas, ancres, liens, images, requêtes Supabase), puis vérification empirique des points suspects par requêtes HTTP sur le serveur local.

> Ce document constate. Il ne juge pas et ne propose rien. Chaque affirmation ci-dessous a été vérifiée dans les fichiers ou par test. Ce qui n'a pas été vérifié est signalé comme tel.

---

## 1. Les pages

```
Niveau 0   LE PROJET
           index.html                       11 Ko · 215 mots

Niveau 1   ACADÉMIE
           academie.html                    20 Ko · 772 mots
           ├ 1.1  academie/karting.html     16 Ko · 1031 mots
           └ 1.2  academie/competition.html 16 Ko · 912 mots

Niveau 2   COACHING
           coaching.html                    21 Ko · 953 mots

Niveau 3   STAGES & TRACK-DAYS                            [en chantier]
           track.html                       33 Ko · 1191 mots
           sections réelles : #stages · #trackdays · #voitures
           (#voiture-perso lié par le menu mais inexistant)

Niveau 4   PADDOCK
           paddock.html                     24 Ko · 402 mots
           sections réelles : #une · #blog · #forum · #media · #events
           ├ 4.1  paddock/articles.html      8 Ko · 40 mots (rendu JS)
           │      paddock/article.html       9 Ko · 7 mots  (gabarit JS)
           └ 4.5  paddock/palmares.html      8 Ko · 152 mots (rendu JS)

Hors menu  paddock/nos-voitures.html        19 Ko · 764 mots   [en chantier]
           Page complète, CSS dédié, absente de toute navigation.

Utilitaire admin/legal/contact.html         16 Ko · 107 mots
           admin/legal/mentions-legales.html  5 Ko
           admin/legal/confidentialite.html   4 Ko
           admin/login.html                 11 Ko
           admin/signup.html                13 Ko
           admin/mot-de-passe-oublie.html    4 Ko
           admin/dashboard.html             24 Ko
```

---

## 2. Anomalies vérifiées

### 2.1 — Le serveur local ne lit pas `_redirects`

**Constat.** `outil-dev/dev-server.js` ne contient aucune gestion de redirection. Or de nombreuses pages utilisent des liens relatifs vers d'anciens chemins (`contact.html`, `articles.html`, `academie-competition.html`, `login.html`…), qui, combinés au `<base href="/">` présent sur les 18 pages, se résolvent en URLs racine couvertes uniquement par `_redirects`.

**Vérification par requête HTTP sur `localhost:3000`** :

| URL | Local | Production |
|---|---|---|
| `/` | 200 | 200 |
| `/index.html` | 200 | 200 |
| `/academie/karting.html` | 200 | 200 |
| `/paddock/palmares.html` | 200 | 200 |
| `/contact.html` | **404** | 301 → OK |
| `/articles.html` | **404** | 301 → OK |
| `/academie-competition.html` | **404** | 301 → OK |
| `/login.html` | **404** | 301 → OK |

**Portée.** Le site fonctionne en production. Il est partiellement cassé en développement local. Toute vérification faite en local sur ces liens donne un faux négatif.

**Effet de bord en production.** Ces liens fonctionnent, mais chaque navigation interne concernée passe par un aller-retour 301 supplémentaire. La navigation dépend de `_redirects` plutôt que de `routes.js`, alors que `routes.js` se déclare « source unique de vérité pour toutes les URLs du site ».

### 2.2 — La sauvegarde locale du live-editor est cassée sur toutes les pages en sous-dossier

**Constat.** `live-editor.js` ligne 12 :

```js
var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'
```

Pour `/academie/karting.html`, `PAGE` vaut `karting`. `dev-server.js` reconstruit ensuite le chemin par `path.join(ROOT, page + '.html')`, soit `/karting.html` — qui n'existe pas.

**Vérification par POST sur `/save-html`** :

- `{"page":"karting"}` → `{"error":"Fichier introuvable : karting.html"}`
- `{"page":"index"}` → `200`

**Portée.** La sauvegarde locale ne fonctionne que pour les cinq pages restées à la racine : `index`, `academie`, `coaching`, `track`, `paddock`. Elle échoue sur les treize autres : les deux pages Académie, les quatre pages Paddock, et les sept pages utilitaires.

**Non vérifié.** L'impact sur la persistance Supabase — `PAGE` sert aussi de préfixe aux clés `site_content`. La sauvegarde distante peut fonctionner alors que le cache HTML local échoue. À confirmer.

**Risque latent.** `PAGE` étant dérivé du seul nom de fichier, deux pages homonymes dans des dossiers différents partageraient leurs clés de contenu. Aucun cas actuel.

### 2.3 — Liens et ressources cassés

| Élément | Détail |
|---|---|
| `track.html#voiture-perso` | Entrée du menu principal. Aucun élément ne porte cet `id`. |
| `paddock.html#lib` | Lié depuis `index.html` **et** depuis `paddock.html`. L'ancre réelle est `#blog`. |
| `assets/images/jb-emeric-portrait.jpg` | Référencée par `academie/karting.html`. Absente du disque. Confirmée 404. |

### 2.4 — Fichiers morts

**CSS chargés par aucune page** — `adulte.css`, `challenge.css`, `coming-soon.css`, `sections-contact.css`, et **`pages.css`**.

`pages.css` mérite attention : `claude/MEMOIRE.md` le décrit comme un pilier de l'architecture CSS, « les règles communes à plusieurs pages ». Aucune page ne le charge. La convention documentée n'est pas celle du code.

**JS chargés par aucune page** — `auth.js`, `section-avis.js`, `section-contact.js`, `sync-mirror.js.bak`, `track-sessions.js`.

Deux cas particuliers :

- **`auth.js`** n'est chargé nulle part, alors que `admin/login.html` et `admin/signup.html` chargent bien `auth.css`. Le mécanisme d'authentification est donc écrit en dur dans les pages, ou inopérant. **Non vérifié** — à examiner avant toute suppression.
- **`track-sessions.js`** interroge la table `events`, comme `track-render.js` qui, lui, est bien chargé par `track.html`. Doublon probable.

### 2.5 — SEO

**Canonique pointant vers l'accueil.** `admin/legal/contact.html` déclare `<link rel="canonical" href="https://jbemeric.netlify.app/">`. Cette balise indique à Google que la page contact est un doublon de l'accueil. C'est l'anomalie SEO la plus sérieuse relevée : elle conduit à la désindexation de la page contact.

**Canoniques pointant vers d'anciennes URLs.** Neuf pages déclarent une canonique vers un chemin qui n'existe plus et n'est joignable que par redirection 301 : `academie/karting.html` → `/academie-karting.html`, `paddock/palmares.html` → `/palmares.html`, `paddock/nos-voitures.html` → `/nos-voitures.html`, et les six pages `admin/`. La redirection fonctionne, mais une canonique doit désigner l'URL finale.

**Canonique absente.** `paddock/articles.html`.

**Métadonnées absentes.** `paddock/article.html` n'a ni `<title>`, ni `<meta description>`, ni canonique. Son `<h1>` est une concaténation JavaScript. La page est intégralement rendue côté client : 7 mots de contenu statique. Les 29 articles importés de WordPress n'ont donc aucun contenu indexable.

**`<h1>` absent** — `paddock.html`, `admin/login.html`, `admin/signup.html`, `admin/dashboard.html`.

### 2.6 — Contradictions entre les décisions actées et le site

**« PACA » supprimé du SEO — décision d'avril 2026, jamais appliquée.** La mention subsiste dans les `<title>` de `index.html`, `coaching.html`, `track.html` et `admin/legal/contact.html`, ainsi que dans plusieurs `<meta description>`.

**Parcours linéaire abandonné — décision d'avril 2026, subsiste dans les métadonnées.** La description de `academie.html` annonce : « De karting enfant à la compétition BMW HTCC. 5 niveaux progressifs ». C'est exactement le modèle linéaire remplacé par les quatre voies parallèles, et cela survend le Challenge que la décision demandait de ne pas mettre en vedette. Le corps de la page, lui, dit « Deux entrées vers la course ».

**Page « Stages » inexistante.** Le tableau des cinq offres du `MEMOIRE.md` la présente comme une page. C'est l'ancre `track.html#stages`.

### 2.7 — Base de données

Tables interrogées, par fichier :

| Table | Interrogée par |
|---|---|
| `site_content` | `live-editor.js` |
| `events` | `admin.js`, `sync-mirror.js`, `track-render.js`, `track-sessions.js` (mort) |
| `docs` | `admin.js`, `paddock-modules.js` |
| `forum_threads` | `admin.js`, `paddock-modules.js`, `sync-mirror.js` |
| `forum_replies` | `paddock-modules.js` |
| `inscriptions` | `admin.js`, `track-render.js` |
| `users` | `admin.js` |
| `circuits` | `admin.js` |

`circuits` est documentée dans `MEMOIRE.md` comme non exposée via l'API REST — toute requête la concernant renvoie 400. `admin.js` l'interroge néanmoins. **Non vérifié** : le tableau de bord admin est-il fonctionnel sur ce point.

---

## 3. Incohérences de dates — à documenter, pas à corriger

Le site emploie quatre repères temporels qui semblent se contredire mais ne se contredisent pas :

- **1986** — début en karting (`paddock/palmares.html` : « 1986-2026 »)
- **1988** — Champion de France de karting (`MEMOIRE.md`)
- **1989** — création de l'école (`index.html` : « Depuis 1989 », URL Facebook `JBEMERIC.Since1989`)
- **« 40 ans de compétition »** (`academie.html`, `paddock/palmares.html`) — 2026 − 1986
- **« 37 ans à former des pilotes »** (`academie/karting.html`) — 2026 − 1989

L'ensemble est cohérent : quarante ans de carrière de pilote, trente-sept ans d'enseignement. Mais la distinction n'est écrite nulle part, ce qui expose à une « correction » qui casserait la justesse actuelle. À consigner dans le document éditorial.

---

## 4. Ce qui fonctionne bien

À préserver lors du nettoyage.

- **`routes.js`** — source centrale des chemins, commentée, avec un helper de page courante et un correctif pour les ancres sous `<base href="/">`. Bien conçu.
- **`_redirects`** — couverture complète des anciennes URLs, plus des raccourcis lisibles (`/karting`, `/palmares`, `/contact`).
- **`<base href="/">`** — présent sur les 18 pages, sans exception.
- **`sync-mirror.js`** — le mécanisme de ressource transversale existe déjà : il aspire `academie.html#portes`, `coaching.html#formules` et `track.html#sr-grid` pour les injecter dans l'accueil, et notifie le live-editor par `jbe-mirror-loaded`. C'est la base sur laquelle brancher le palmarès.
- **`nav.js` / `footer.js`** — autorité unique, injection dynamique, sous-menus cohérents avec l'arborescence.
- **Arborescence** — `academie/` et `paddock/` respectent déjà la hiérarchie voulue.
- **Métadonnées** — hors les cas listés en 2.5, les pages principales ont des `<title>` et descriptions rédigés, pas générés.

---

## 5. Questions ouvertes

À trancher par Yoan, hors de ce chantier.

1. **« Nos voitures »** — l'ancre `track.html#voitures` ou la page `paddock/nos-voitures.html` ? Les deux existent, la seconde est invisible.
2. **`track.html`** — reste une page longue à ancres, ou éclate en sous-pages ?
3. **`auth.js`** — code mort à supprimer, ou fonctionnalité jamais branchée à rétablir ?
4. **`paddock/article.html`** — le rendu 100 % client est-il assumé, ou faut-il rendre les 29 articles indexables ?
5. **Pages publiques dans `admin/`** — `contact`, `mentions-legales`, `confidentialite` en sortent-elles ?
