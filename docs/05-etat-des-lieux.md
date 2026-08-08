# État des lieux, inventaire du réel

**Relevé le** : 1er août 2026
**Périmètre** : 18 pages HTML, 21 CSS, 18 JS, `_redirects`, `routes.js`, `dev-server.js`
**Méthode** : extraction mécanique (titres, metas, ancres, liens, images, requêtes Supabase), puis vérification empirique des points suspects par requêtes HTTP sur le serveur local.

> Ce document constate. Il ne juge pas et ne propose rien. Chaque affirmation ci-dessous a été vérifiée dans les fichiers ou par test. Ce qui n'a pas été vérifié est signalé comme tel.

> **Depuis le 4 août 2026, ne plus se fier à ce document pour ce qui est mesurable.** Lancer `node outil-dev/audit/audit.js`. Tirets cadratins, images manquantes, ancres et liens cassés, canoniques, `h1`, sélecteurs CSS morts, syntaxe JavaScript, unicité du pied de page et du menu : tout cela est désormais calculé en moins d'une seconde, et donc toujours à jour. Deux affirmations de ce relevé s'étaient révélées fausses faute d'être recalculées. Voir D-024.
>
> Ce que le document garde d'utile : l'historique daté, les causes racines, et tout ce qui relève du jugement plutôt que de la mesure.

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

### 2.1 Le serveur local ne lit pas `_redirects`

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

### 2.2 La sauvegarde locale du live-editor est cassée sur toutes les pages en sous-dossier

**Constat.** `live-editor.js` ligne 12 :

```js
var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'
```

Pour `/academie/karting.html`, `PAGE` vaut `karting`. `dev-server.js` reconstruit ensuite le chemin par `path.join(ROOT, page + '.html')`, soit `/karting.html`, qui n'existe pas.

**Vérification par POST sur `/save-html`** :

- `{"page":"karting"}` → `{"error":"Fichier introuvable : karting.html"}`
- `{"page":"index"}` → `200`

**Portée.** La sauvegarde locale ne fonctionne que pour les cinq pages restées à la racine : `index`, `academie`, `coaching`, `track`, `paddock`. Elle échoue sur les treize autres : les deux pages Académie, les quatre pages Paddock, et les sept pages utilitaires.

**Non vérifié.** L'impact sur la persistance Supabase, `PAGE` sert aussi de préfixe aux clés `site_content`. La sauvegarde distante peut fonctionner alors que le cache HTML local échoue. À confirmer.

**Risque latent.** `PAGE` étant dérivé du seul nom de fichier, deux pages homonymes dans des dossiers différents partageraient leurs clés de contenu. Aucun cas actuel.

### 2.3 Liens et ressources cassés

| Élément | Détail |
|---|---|
| `track.html#voiture-perso` | Entrée du menu principal. Aucun élément ne porte cet `id`. |
| `paddock.html#lib` | Lié depuis `index.html` **et** depuis `paddock.html`. L'ancre réelle est `#blog`. |
| `assets/images/jb-emeric-portrait.jpg` | Référencée par `academie/karting.html`. Absente du disque. Confirmée 404. |

### 2.4 Fichiers morts

> **Correction du 1er août 2026.** Une première détection ne cherchait que les balises `<script src>` et `<link rel=stylesheet>`. Elle ratait les imports de modules ES et produisait des faux positifs, dont un grave : `auth.js` avait été signalé comme mort alors qu'il porte toute l'authentification du site. Le relevé ci-dessous cherche chaque nom de fichier dans l'intégralité du dépôt.

**`auth.js` n'est PAS orphelin.** Il est importé comme module depuis un script inline :

```js
import { signIn, consumeReturnUrl, humanError } from '/assets/js/auth.js'
```

Utilisé par `admin/login.html`, `admin/signup.html` et `admin/mot-de-passe-oublie.html`.

### Fichiers réellement morts, déplacés dans `old/` le 1er août 2026

Sur décision de Yoan, ils sont déplacés et non supprimés.

| Fichier | Poids |
|---|---|
| `pages.css` | 31 Ko |
| `challenge.css` | 24 Ko |
| `adulte.css` | 23 Ko |
| `track-sessions.js` | 17 Ko |
| `section-contact.js` | 8 Ko |
| `sections-contact.css` | 4 Ko |
| `section-avis.js` | 4 Ko |
| `coming-soon.css` | 4 Ko |
| `sync-mirror.js.bak` | sauvegarde |

`pages.css` méritait une note : l'ancien MEMOIRE le décrivait comme le pilier de l'architecture CSS, « les règles communes à plusieurs pages ». Aucune page ne le chargeait. `adulte.css` et `challenge.css` apparaissaient dans `academie.css`, mais uniquement dans des commentaires citant l'origine des couleurs.

`track-sessions.js` interrogeait la table `events`, comme `track-render.js` qui, lui, est bien chargé par `track.html`.

**Vérifié après déplacement** : les 12 pages testées répondent toujours 200, et les 5 CSS déplacés renvoient bien 404 sans que rien ne les demande.

### 2.5 SEO

**Canonique pointant vers l'accueil.** `admin/legal/contact.html` déclare `<link rel="canonical" href="https://jbemeric.netlify.app/">`. Cette balise indique à Google que la page contact est un doublon de l'accueil. C'est l'anomalie SEO la plus sérieuse relevée : elle conduit à la désindexation de la page contact.

**Canoniques pointant vers d'anciennes URLs.** Neuf pages déclarent une canonique vers un chemin qui n'existe plus et n'est joignable que par redirection 301 : `academie/karting.html` → `/academie-karting.html`, `paddock/palmares.html` → `/palmares.html`, `paddock/nos-voitures.html` → `/nos-voitures.html`, et les six pages `admin/`. La redirection fonctionne, mais une canonique doit désigner l'URL finale.

**Canonique absente.** `paddock/articles.html`.

**Métadonnées absentes.** `paddock/article.html` n'a ni `<title>`, ni `<meta description>`, ni canonique. Son `<h1>` est une concaténation JavaScript. La page est intégralement rendue côté client : 7 mots de contenu statique. Les 29 articles importés de WordPress n'ont donc aucun contenu indexable.

**`<h1>` absent** : `paddock.html`, `admin/login.html`, `admin/signup.html`, `admin/dashboard.html`.

### 2.6 Contradictions entre les décisions actées et le site

> **Ce paragraphe est daté.** Il décrit l'état d'avant le 5 août. L'audit mesure ces deux points à chaque session, règle `referencement` : s'y fier plutôt qu'à ce qui suit.

**« PACA » dans les métadonnées : traité, D-020.** Plus une seule mention dans un `<title>`, une `<meta description>` ou une balise Open Graph des neuf pages du périmètre. Reste `paddock/nos-voitures.html`, hors périmètre, signalée sans être corrigée.

**Dans le corps des pages, il en reste.** Sept mentions au total, six dans `track.html` et une dans `coaching.html`, deux pages du périmètre qui n'ont pas encore été retravaillées. L'audit les classe en « à juger » et non en faute : une phrase de corps peut légitimement nommer une région, ce que D-020 interdit c'est d'en faire le positionnement. À trancher quand ces deux pages passeront sur l'établi.

**Parcours linéaire : traité.** La description de `academie.html` ne mentionne plus le Challenge. Le corps de la page annonce désormais trois entrées, D-026.

**Page « Stages » inexistante.** Le tableau des cinq offres du `MEMOIRE.md` la présente comme une page. C'est l'ancre `track.html#stages`.

### 2.7 Base de données

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

`circuits` est documentée dans `MEMOIRE.md` comme non exposée via l'API REST, toute requête la concernant renvoie 400. `admin.js` l'interroge néanmoins. **Non vérifié** : le tableau de bord admin est-il fonctionnel sur ce point.

---

## 3. Incohérences de dates, à documenter, pas à corriger

Le site emploie quatre repères temporels qui semblent se contredire mais ne se contredisent pas :

- **1986** : début en karting (`paddock/palmares.html` : « 1986-2026 »)
- **1988** : Champion de France de karting (`MEMOIRE.md`)
- **1989** : création de l'école (`index.html` : « Depuis 1989 », URL Facebook `JBEMERIC.Since1989`)
- **« 40 ans de compétition »** (`academie.html`, `paddock/palmares.html`), 2026 − 1986
- **« 37 ans à former des pilotes »** (`academie/karting.html`), 2026 − 1989

L'ensemble est cohérent : quarante ans de carrière de pilote, trente-sept ans d'enseignement. Mais la distinction n'est écrite nulle part, ce qui expose à une « correction » qui casserait la justesse actuelle. À consigner dans le document éditorial.

---

## 4. Ce qui fonctionne bien

À préserver lors du nettoyage.

- **`routes.js`** : source centrale des chemins, commentée, avec un helper de page courante et un correctif pour les ancres sous `<base href="/">`. Bien conçu.
- **`_redirects`** : couverture complète des anciennes URLs, plus des raccourcis lisibles (`/karting`, `/palmares`, `/contact`).
- **`<base href="/">`** : présent sur les 18 pages, sans exception.
- **`sync-mirror.js`** : le mécanisme de ressource transversale existe déjà : il aspire `academie.html#portes`, `coaching.html#formules` et `track.html#sr-grid` pour les injecter dans l'accueil, et notifie le live-editor par `jbe-mirror-loaded`. C'est la base sur laquelle brancher le palmarès.
- **`nav.js` / `footer.js`** : autorité unique, injection dynamique, sous-menus cohérents avec l'arborescence.
- **Arborescence** : `academie/` et `paddock/` respectent déjà la hiérarchie voulue.
- **Métadonnées** : hors les cas listés en 2.5, les pages principales ont des `<title>` et descriptions rédigés, pas générés.

---

## 5. Questions ouvertes

À trancher par Yoan, hors de ce chantier.

1. **« Nos voitures »** : l'ancre `track.html#voitures` ou la page `paddock/nos-voitures.html` ? Les deux existent, la seconde est invisible.
2. **`track.html`** : reste une page longue à ancres, ou éclate en sous-pages ?
3. **`auth.js`** : code mort à supprimer, ou fonctionnalité jamais branchée à rétablir ?
4. **`paddock/article.html`** : le rendu 100 % client est-il assumé, ou faut-il rendre les 29 articles indexables ?
5. **Pages publiques dans `admin/`** : `contact`, `mentions-legales`, `confidentialite` en sortent-elles ?

---

## 6. Mise à jour du 4 août 2026

### 6.1 Résolu depuis le relevé du 1er août

- **2.1** et **2.2**, serveur local et sauvegarde du live-editor : corrigés (D-006).
- **2.5**, canoniques : les 15 pages qui en déclarent une pointent toutes vers l'URL finale. Vérifié fichier par fichier.
- **D-007**, tiret cadratin : appliqué au dépôt. 517 occurrences supprimées sur les 18 pages, 16 CSS et 16 JS. Conventions en D-015.

### 6.2 Encore ouvert, hérité du relevé précédent

- **2.3**, `track.html#voiture-perso` : l'entrée de menu existe toujours dans `nav.js`, `track.html` et `nos-voitures.html`, aucun élément ne porte cet `id`.
- ~~**2.3**, `assets/images/jb-emeric-portrait.jpg`~~ : corrigé le 4 août, voir 6.6.
- **2.5**, `<h1>` absent : `paddock.html`, `admin/login.html`, `admin/signup.html`, `admin/dashboard.html`.
- **2.5**, canonique absente : `admin/dashboard.html`, `paddock/articles.html`, `paddock/article.html`.

> **Rectification du 4 août 2026.** Le relevé du 1er août affirmait en 2.5 que `paddock/article.html` n'a « ni `<title>`, ni `<meta description>`, ni canonique ». C'est faux pour les deux premiers. La page porte `<title id="page-title">Article · JB EMERIC</title>` et `<meta name="description" id="page-desc">`, deux valeurs de repli que le JS écrase au chargement avec le contenu réel de l'article. Seule la canonique manque vraiment. Le fond du problème demeure : les 29 articles ne sont pas indexables, parce que le contenu est rendu côté client. Mais la cause n'est pas l'absence de balises.
- **2.6**, « PACA » : subsiste dans les `<title>` de `index.html`, `coaching.html`, `track.html` et `admin/legal/contact.html`, ainsi que dans le pied de trois pages `admin/`.

### 6.3 `track-render.js` ne s'exécutait jamais. Corrigé le 4 août 2026

**Constat.** `assets/js/track-render.js` ligne 250 contient une erreur de syntaxe. Les apostrophes de la chaîne ne sont pas échappées :

```js
? '<button class="sr-btn-inscr" onclick="openModal('' + (ev.type||'Stage') + '',…)">S'inscrire →</button>'
```

**Vérification.** `node --check` rejette le fichier. L'erreur est présente à l'identique dans `HEAD` et dans `origin/main`, elle est donc antérieure et n'a pas été introduite par un chantier récent.

**Portée.** `track.html` ligne 506 charge le fichier avec `type="module"`. Une erreur de syntaxe empêche l'évaluation du module entier, donc rien de ce qu'il définit n'existe au moment où la page vit :

| Perdu | Rôle |
|---|---|
| rendu des sessions | Le calendrier des track-days ne s'affiche pas |
| `window.vote` | Le vote pour ouvrir une session ne fonctionne pas |
| `window.openModal` / `closeModal` | La fenêtre d'inscription ne s'ouvre pas |
| `window.filterCards` | Les onglets de filtre sont inertes |

Autrement dit, toute la partie dynamique de `track.html` est morte, et l'était déjà avant la remise à plat. La page est marquée « en chantier », ce qui a probablement masqué le défaut.

**Correction du 4 août 2026.** Le défaut n'était pas seul. Comme le fichier ne parvenait jamais à s'évaluer, aucun des suivants n'avait pu se manifester. Ils sont apparus l'un après l'autre à mesure que le précédent tombait.

| # | Défaut | Nature |
|---|---|---|
| 1 | ligne 250 | Apostrophes non échappées dans le `onclick` généré |
| 2 | ligne 448 | `font-family:'DM Mono'` dans une chaîne à quotes simples |
| 3 | ligne 355 | Insertion automatique de point-virgule |

Le troisième est le plus instructif. Le bloc précédent se termine par `})()` sans point-virgule et le suivant commence par `(`, donc JavaScript lisait un appel de fonction sur le résultat du bloc précédent. Le fichier connaissait déjà le remède : la ligne 300 commence par `;(`. Sur les quatre blocs immédiatement invoqués du fichier, un seul n'était pas protégé.

**Ce qui a été changé sur le fond.** Le bouton d'inscription ne porte plus de `onclick` écrit dans la chaîne HTML. Les valeurs passent par des attributs `data-`, échappés par un helper `escAttr`, et le handler est branché après injection. Motif : un simple échappement aurait rétabli la syntaxe mais laissé le défaut vivant, puisque `circuits.nom` vaut par exemple « Circuit d'Hyères ». Voir D-018.

**Vérifié.** `node --check` passe sur les 17 JS du dépôt. Page chargée dans Chromium : plus aucune erreur non interceptée, seuls subsistent les trois `Failed to fetch` vers Supabase, attendus hors ligne et traités par les `try/catch`. Banc d'essai avec données simulées : la carte se construit, le bouton existe, l'apostrophe du nom de circuit survit à l'aller-retour, et le clic appelle `openModal` avec les quatre arguments attendus.

### 6.4 Deux anomalies mineures, préexistantes

- `admin/legal/contact.html` ligne 11 : la balise `<meta name="description">` se termine par `">>`. Le chevron surnuméraire injecte un `>` littéral dans le `<head>`.
- `paddock/nos-voitures.html` : la page porte un `<meta http-equiv="refresh" content="0;url=track.html#voitures">` tout en déclarant une canonique vers elle-même, et un `og:url` (`/nos-voitures.html`) qui ne correspond pas à cette canonique (`/paddock/nos-voitures.html`). C'est le cas que `docs/04` interdit, une canonique désignant une URL qui redirige. À relier à la question ouverte 1 de la section 5.

### 6.6 Le portrait manquant, et ce qu'il a révélé sur le serveur local

**Le symptôme.** `academie/karting.html` appelait `assets/images/jb-emeric-portrait.jpg`, absente du disque. C'était la seule image manquante du site, vérifié en croisant les 18 pages avec le contenu de `assets/images/`.

**Le remplacement.** `assets/images/Jean Baptiste EMERIC.png`, seul vrai portrait de JB dans le dépôt et jusqu'ici inutilisé. Le candidat au nom trompeur, `jb-emeric-pilote.jpg`, est en réalité une photo de la BMW 325i HTCC en piste, donc précisément la voiture que D-008 déclare morte.

**Le défaut de fond.** Le portrait ne se servait toujours pas après correction. `dev-server.js` ne décodait jamais l'URL demandée : `new URL(...).pathname` rend un chemin encodé, et il était passé tel quel à `path.join`. Conséquence, **tout média dont le nom contient un espace était en 404 en local**, alors qu'il fonctionne en production. Cela concernait aussi la photo de briefing enfant et les vidéos karting, déjà utilisées par le site.

C'est le même genre de piège que 2.1 : un défaut qui n'existe qu'en développement et qui fait conclure à tort qu'une ressource est cassée.

**Précaution.** Le décodage est placé avant la garde anti-traversée, sinon un `%2e%2e` serait passé au travers. Une URL mal encodée renvoie 400 au lieu de faire tomber le serveur.

**Vérifié.** Les trois médias à espaces passent de 404 à 200. Aucune régression sur un fichier normal, une page en sous-dossier ni une règle de `_redirects`. Six motifs de traversée testés contre une cible réelle hors racine, aucun ne renvoie son contenu, les échappements donnent 403. Portrait chargé dans Chromium : 344×330 rendu en 140×170, cadrage du visage correct.

### 6.8 Ressources transversales, un seul footer et un seul menu

**Le footer.** Constat de Yoan : le site est censé n'avoir qu'un pied de page pour toutes les pages. `admin/login.html` et `admin/signup.html` en affichaient trois. Un `auth-footer` compact, un pied de site complet recopié en dur et tronqué en plein mot sur `© 2026 JB EMERIC · Tous dr`, puis le vrai injecté par `footer.js`.

Conséquence, et c'est ce qui a rendu le défaut visible : la correction de `footer.js` du 4 août n'atteignait pas ces deux pages, qui continuaient d'afficher « Région PACA » depuis leur copie figée. Le bloc en dur portait aussi des liens vers les anciennes URLs à plat.

68 lignes retirées dans chaque fichier. Vérifié au rendu : une seule accroche par page, formulaires intacts.

**Le menu.** Contrôle équivalent : 17 pages sur 18 injectent la navigation par `nav-root` et `nav.js`, aucune ne porte de `<nav>` en dur. Vérifié au rendu à cinq profondeurs différentes, de la racine à `admin/legal/` : 14 onglets, un burger, un menu mobile, partout identique.

L'exception apparente est `admin/dashboard.html`, dont le `<nav class="sb-nav">` n'est pas le menu du site mais la barre latérale de l'interface d'administration. Rôle différent, présence légitime. Cette page n'a en revanche aucun pied de page, elle est la seule dans ce cas.

**Les liens en dur vers d'anciennes URLs.** Le relevé du 1er août signalait en 2.1 que la navigation dépendait de `_redirects` plutôt que de `routes.js`. 29 liens dans 9 pages pointaient encore vers les chemins à plat (`contact.html`, `academie-competition.html`, `login.html`, `articles.html`), rattrapés par une redirection 301 à chaque clic. Tous réécrits vers l'URL finale, que `routes.js` déclarait déjà.

**Vérifié** : les 15 liens internes distincts du site répondent 200 en direct, aucun ne passe plus par une redirection. Séquence des balises inchangée sur les 18 pages, seuls des attributs `href` ont bougé.

### 6.9 Le premier item de FAQ avait un filet invisible sur les deux pages sombres

**Constat.** Diagnostiqué par le rôle design par lecture de la cascade, puis confirmé au navigateur. Sur `academie/karting.html` et `academie/competition.html`, fond `rgb(4,10,30)`, le premier item de la FAQ portait un filet noir à 8%, donc invisible, alors que tous les suivants avaient le filet clair.

**Cause.** Deux définitions du même composant se superposent. `theme.css` pose `border-bottom` noir sur tout `.fq` et `border-top` noir sur `.fq:first-child`. Cette dernière règle a une spécificité de (0,2,0), supérieure au `.fq` simple de (0,1,0) des feuilles de page, donc elle gagne quel que soit l'ordre de chargement. Les deux pages sombres déclaraient bien un filet clair, mais seulement sur `.fq`, jamais sur `.fq:first-child`.

**Correction.** Les deux feuilles déclarent désormais leurs trois bordures explicitement, `border-top` sur `.fq`, `border-bottom:0` sur `.fq`, puis `:first-child` et `:last-child`. Elles ne dépendent plus de ce que `theme.css` leur impose. `theme.css` n'a pas été touché, donc aucune page à fond clair ne bouge.

**Vérifié au navigateur**, feuilles réelles chargées dans l'ordre réel, avec le bon `data-theme` :

| | avant | après |
|---|---|---|
| premier item, filet haut | noir 8%, invisible | blanc 8%, visible |
| items suivants, filet haut | blanc 8% | blanc 8% |
| filet bas, sauf dernier | 1px noir invisible | 0px |
| dernier item, filet bas | 1px | 1px |

Contrôlé identique sur les deux thèmes. Contrôlé inchangé sur `academie`, `coaching` et `track`, qui restent sur le comportement de `theme.css`.

**Effet de bord assumé** : chaque item non terminal perd le pixel de bordure invisible qu'il portait, soit environ 4 pixels sur une FAQ de cinq questions.

**Ce qui n'est pas corrigé ici.** Deux autres héritages de `theme.css` traversent toujours sur ces pages, le `?` jaune de `.fq-q::before` et le `padding-left:32px` de `.fq-a`. Ils sont visibles et cohérents, donc laissés en l'état. La consolidation de fond, qui ferait de `theme.css` la seule définition du composant avec des variables par thème, relève du chantier CSS non ouvert.

### 6.10 Le double `:root` de `paddock.css`, un piège dormant et non un bug

**Constat.** `paddock.css` portait deux blocs `:root`, lignes 205 et 276, déclarant des valeurs contradictoires. Le premier, recopié de `coaching.css` avec son en-tête « COACHING : DARK MODE PERFORMANCE », déclarait `--ink` en blanc. Le second le déclare en `#0d0d0d`.

Deux `:root` ont la même spécificité : **le dernier du fichier gagne pour tout le document**, y compris pour les règles écrites entre les deux. Le premier bloc n'appliquait donc aucune de ses valeurs.

**Ce que la vérification a corrigé dans le diagnostic initial.** Un premier test semblait montrer que les titres de vidéos du Paddock étaient invisibles, texte `rgb(13,13,13)` sur fond `rgb(7,16,31)`. C'était **faux**, et l'erreur venait du banc d'essai, qui omettait le conteneur `.yt-card`. Dans le balisage réel, ce conteneur a un fond blanc, donc le texte sombre y est correct et parfaitement lisible. Vérifié au navigateur avec la structure exacte.

Le défaut était donc dormant, pas actif : le bloc mort donnait seulement l'illusion qu'un thème sombre régnait sur cette partie du fichier. Le jour où quelqu'un ajoutait un élément en comptant sur `--ink` blanc, il obtenait du texte noir sans comprendre pourquoi.

**Correction.** Un seul `:root`. Vérifié avant suppression : `--night3`, `--ink-s` et `--ink-xs` n'avaient aucun consommateur dans tout le dépôt. `--sep` n'était lu sans valeur de repli que par `.hud-bar` et `.hud-item`, absents des trois pages qui chargent cette feuille, et dont les deux pages porteuses (`coaching.html`, `paddock/nos-voitures.html`) ne chargent pas `paddock.css`. Il a été rapatrié par précaution.

**Vérifié.** Relevé des 17 variables calculées avant et après, dans un navigateur : seules les trois sans consommateur ont disparu, toutes les autres valeurs sont identiques au caractère près, `--ink`, `--sep` et `--hero-overlay` compris. Capture de `paddock.html` après correction, page intacte.

### 6.11 `contact.css` et `legal.css` étaient des copies de l'accueil

**Constat.** Le rôle design avait relevé que ces deux feuilles partagent 136 lignes identiques, soit 98% de la plus petite. La bonne opération n'était pas de mutualiser ces lignes mais de les supprimer des deux côtés : ce sont des copies du CSS de l'ancienne page d'accueil, systèmes `.ov-sec`, `.btn`, `.cta-band` et `.palmares` compris, dont aucune des quatre pages concernées n'utilise quoi que ce soit.

**Méthode de vérification.** Pour chaque page, le DOM a été récupéré **après exécution du JavaScript**, donc avec la navigation et le pied de page injectés. Chaque sélecteur de la feuille a ensuite été confronté aux classes et identifiants réellement présents. Les sélecteurs à état (`:hover`, `.open`) ont été inspectés à part, pour éviter de déclarer mort un style qui n'apparaît qu'au clic : aucun faux positif, ils portaient tous sur des classes absentes.

| Feuille | Sélecteurs | Morts | Lignes avant | Après |
|---|---|---|---|---|
| `contact.css` | 142 | 131 | 184 | 30, commentaire compris |
| `legal.css` | 154 | 131 | 252 | 97 |

**Le cas `contact.css` est extrême.** `admin/legal/contact.html` n'utilise **aucune classe CSS**, tout son habillage passe par des attributs `style`. La feuille se réduit au reset, à trois règles d'élément et à une media query sur `#contact-grid`.

**Supprimés en connaissance de cause** : le bloc `:root` des deux fichiers, onze variables chacun. Dans `contact.css` aucun style en ligne de la page n'appelle `var()`. Dans `legal.css`, les deux seules variables consommées par les règles conservées, `--Y` et `--BN`, sont déjà déclarées par `theme.css`, chargée avant, avec les mêmes valeurs. L'animation `@keyframes pulse` de `contact.css` partait aussi : son unique usage était dans une règle elle-même morte.

**Vérifié.** Capture avant et après pour les quatre pages, comparaison octet par octet des images décompressées. **Identique au pixel sur les quatre**, soit 5,2 millions d'octets sans un écart pour `contact.html`.

### 6.12 Suite du nettoyage, `auth.css` et `track.css`

Même méthode que 6.11, avec une précaution supplémentaire indispensable ici.

**Le piège du contenu construit en JavaScript.** Sur `track.html`, le calendrier des sessions est fabriqué par `track-render.js`, donc ses classes n'existent dans aucun fichier HTML. Et dans ce bac à sable, Supabase est injoignable, donc elles n'apparaissent pas non plus dans le DOM rendu. Les déclarer mortes aurait cassé la page en production.

Parade retenue : recenser les **230 noms de classes que les scripts du site savent fabriquer**, plus les onze classes d'état ajoutées au clic (`open`, `active`, `selected`…), et les compter comme présentes. L'analyse ne supprime donc que ce qui n'apparaît ni dans le HTML, ni dans le DOM rendu, ni dans le JavaScript.

| Feuille | Règles retirées | Lignes avant | Après |
|---|---|---|---|
| `auth.css` | 132 | 403 | 222 |
| `track.css` | 58 | 572 | 445 |

`auth.css` portait le système « band » au complet plus un bloc de styles de FAQ, alors que les deux pages d'authentification n'ont ni l'un ni l'autre. `track.css` portait **un troisième nommage de FAQ**, `.faq-item` / `.faq-q` / `.faq-a`, alors que `track.html` emploie `.fq` comme le reste du site.

**Vérifié.** Capture avant et après des trois pages, comparaison octet par octet des images décompressées, puis une seconde passe après ajout des commentaires d'en-tête. **Identique au pixel à chaque fois.**

**Bilan des quatre feuilles allégées** : 1411 lignes avant, 794 après, aucune différence visible sur les sept pages concernées.

### 6.13 Les contenus du live-editor sont indexés par position, pas par identité

> **Rectification du 6 août 2026, précision de Yoan.** Cette section a d'abord été écrite comme un blocage majeur, au motif qu'elle mettait en péril le travail de JB. C'est faux : les 73 contenus enregistrés sont des **données de test saisies par Yoan** pour éprouver le compte, pas du contenu de production. « Tu peux repartir de pages blanches si nécessaire. »
>
> Le mécanisme décrit ci-dessous reste exact et vaut d'être connu, mais il ne bloque rien aujourd'hui. Il deviendra une vraie contrainte le jour où JB éditera pour de bon.

**Le mécanisme, qui reste vrai.**

**Le mécanisme.** `live-editor.js` attribue à chaque élément éditable une clé de repli calculée par un compteur, dans l'ordre du document : `txt-1`, `txt-2`, `img-1`. Un élément qui porte déjà un attribut `id` échappe à ce compteur et garde son identité.

**La conséquence.** Insérer ou retirer un seul élément éditable décale la numérotation de **tout ce qui suit dans la page**. La clé `txt-12` ne désigne alors plus le même paragraphe.

Un garde-fou existe, `_legacyTextSanity` : il compare le contenu enregistré au texte d'origine de l'élément, par longueur et par recouvrement de mots. En cas de désaccord, il refuse d'appliquer. C'est une bonne protection contre l'affichage d'un texte sur le mauvais élément, mais elle a un prix : **le contenu saisi par JB disparaît de l'écran**, remplacé par le texte du HTML, sans message.

Rien n'est perdu en base. Tout est perdu à l'affichage.

**L'ampleur, mesurée.**

| Page | Contenus | Positionnels | Stables |
|---|---|---|---|
| `academie.html` | 22 | 21 | 1 |
| `academie/karting-adulte.html` | 21 | 16 | 5 |
| `index.html` | 10 | 10 | 0 |
| `coaching.html` | 8 | 8 | 0 |
| `paddock/palmares.html` | 7 | 6 | 1 |
| `academie/competition.html` | 4 | 3 | 1 |
| `track.html` | 1 | 1 | 0 |
| **Total** | **73** | **65** | **8** |

**89 % des contenus de JB sont indexés par position.** Toutes les pages du périmètre sont concernées.

**Ce que ça coûtera le jour venu.** Toute insertion d'un élément éditable au milieu d'une page décale les clés suivantes, et les contenus concernés cessent de s'afficher. Aujourd'hui sans conséquence, les données étant des tests.

**Les issues, pour ce jour-là.**

1. **Figer les identités.** Donner un attribut `id` explicite à chaque élément éditable, en reprenant sa clé positionnelle. Sa clé cesse de dépendre de sa position. Ne demande aucun accès externe.
2. **Migrer les clés en base** vers les identifiants stables que le live-editor sait déjà calculer. Demande un accès Supabase.

**Règle à retenir en attendant** : avant que JB commence à éditer pour de bon, il faut que les pages qu'il touchera portent des `id` explicites sur leurs éléments éditables. C'est peu de travail fait tôt, beaucoup fait tard.

### 6.14ter La bibliothèque d'images ment sur ce qu'elle montre

**Trouvé le 7 août en cherchant une photo pour un hero. C'est le point le plus sérieux de la journée, et il demande une décision de Yoan.**

**Trois paires de fichiers sont identiques au bit près, sous des noms qui se contredisent.**

| Fichier | Identique à | Ce qu'on voit réellement |
|---|---|---|
| `peugeot-206-s16-ricard.jpg` | `lotus-circuit-du-luc.jpg` | Une Peugeot 206 jaune au Paul Ricard. Pas une Lotus, pas au Luc. |
| `bmw-325i-htcc.jpg` | `jb-emeric-pilote.jpg` | Une BMW 325i noire. Pas un portrait de JB. |
| `bmw-325i-htcc-cote.jpg` | `porsche-gt3-circuit-albi.jpg` | La même BMW de profil. Pas une Porsche, pas à Albi. |

Autrement dit, la même photo est servie sous le nom que la page réclamait. Le nom de fichier finit dans le `alt` et dans la légende, donc `paddock/nos-voitures.html` présente un parc illustré par des voitures qui ne sont pas celles annoncées.

**Deux problèmes plus graves que le nommage.**

**Ces voitures ne sont pas celles de JB.** La 206 porte la livrée « TEAM-DIOT-RACING », les noms de Sébastien et Louis BELLONE, et l'adresse `garage-tdr-competition.fr`. Les deux photos de BMW montrent une voiture « ONE UP RACING » pilotée par **JF. VISSEAUX**, numéro 34.

**La photo de la 206 porte le filigrane d'un photographe professionnel** : « RENCONTRES PEUGEOT SPORT, CIRCUIT PAUL RICARD, 2015 » et « © Daniel DELIEN / WWW.PRO-PHOTOS-SPORT.COM ». Elle est aujourd'hui le hero de `academie/competition.html`, la porte « Vers la Compétition » de l'Académie, et par le miroir elle apparaît sur la page d'accueil.

**Question des droits : tranchée le 7 août par Yoan.** « On la garde, JB a les droits. » Le sujet est clos, aucune session n'a à le rouvrir.

**Nommage : traité le 7 août**, sur demande de Yoan. Les trois noms qui mentaient ne sont plus employés nulle part. Les fichiers restent sur le disque, orphelins, en attente d'une validation individuelle de suppression comme le veut `CLAUDE.md`.

Deux cartes de `paddock/nos-voitures.html` ont perdu leur photo : la Lotus Elise Cup S et la Porsche 911 GT3 RS. Il n'existe aucune photo de ces deux voitures dans la bibliothèque, seulement des fichiers qui portaient leur nom. Un cadre vide vaut mieux qu'une voiture qui n'est pas celle annoncée.

**`paddock/nos-voitures.html` est une page morte, et je m'étais trompé sur la cause.** J'ai d'abord écrit que son contenu venait de Supabase, parce que le navigateur affichait « TRACK-DAYS & STAGES » là où le fichier dit « NOS VOITURES ». C'est faux. La ligne 10 du fichier porte :

```html
<meta http-equiv="refresh" content="0;url=track.html#voitures">
```

La page se sabordé au chargement et renvoie sur `track.html#voitures`. Ce que j'observais était donc `track.html`, pas une base de données. `curl` recevait bien le vrai fichier, le navigateur non : c'est ce décalage qui m'a induit en erreur.

**Conséquences.** Personne ne voit cette page, ni un visiteur, ni un moteur de recherche. Les corrections d'images qui y ont été faites sont donc sans effet visible ; elles restent justes dans la source. C'est la seule page du site à porter un `meta refresh`, et rien n'y mène sauf l'entrée `voitures` de `routes.js`.

**À trancher par Yoan** : soit la page revit et le `meta refresh` saute, soit elle disparaît et l'entrée de `routes.js` avec elle. La laisser dans cet état garantit qu'on y repassera du temps pour rien, comme aujourd'hui.

**Ce qui vaut au-delà de cette page.** Le live-editor ne voit que les `<img>` et les `<video>` déjà présents dans la page, `document.querySelectorAll('img, video')`. Retirer une balise `<img>` retire donc à JB la possibilité d'y mettre une photo lui-même. Un emplacement qu'il doit pouvoir remplir garde sa balise, avec une image d'attente s'il le faut.

**Mesuré désormais à chaque session** par `outil-dev/audit/regles/images.js`, qui compare les empreintes et non les noms. Il signale aussi 14 fichiers jamais employés.

### 6.14bis Les deux boutons d'entrée de la Compétition tombent sous la ligne de flottaison

**Mesuré le 7 août, capture à 1300 × 900.** `academie/competition.html` est la page où convergent les trois voies. Ses deux boutons d'entrée, « Kart 125cc » et « Formation voiture », ainsi que la barre de statistiques, se trouvent environ 60 à 80 pixels sous le bas de l'écran sur un portable. Il faut faire défiler pour voir les deux actions de la page.

**La cause.** `.hero` est en `min-height:100svh` avec `justify-content:flex-end`, donc tant que le contenu tient dans un écran il est calé en bas et tout se voit. Ici il déborde, à cause de la combinaison d'un `padding-top` de 180 pixels et d'un titre de trois lignes en `clamp(52px,9vw,128px)`. Les pages sœurs `karting-enfant` et `karting-adulte`, elles, tiennent.

**Corrigé le 8 août, et mon diagnostic était faux.** La mesure montre que les boutons étaient visibles et que seule la barre de statistiques débordait, de 56 pixels exactement. La cause : `competition.css` et `karting.css` oubliaient de soustraire la hauteur de la nav dans `min-height`. Voir D-051. J'avais estimé au lieu de mesurer, et rangé un bug en décision de direction artistique.

### 6.14 La version téléphone est cassée sur les pages Académie

Constat visuel, non traité sur décision de Yoan : « la version téléphone sera faite à la toute fin quand on aura fini le site entier ».

Sur un écran de 390 pixels, le texte et les boutons du hero débordent et sont coupés à droite, sur `academie/karting-adulte.html` comme sur `academie/competition.html`. Le titre « Pas des touristes. » s'affiche « Pas des tourist ». `overflow-x:clip` masque le débordement au lieu de le rendre visible, donc il n'y a pas de barre de défilement pour le signaler, les mots sont simplement tronqués.

**Piste non vérifiée** : les grilles écrites `repeat(2, 1fr)` ne peuvent pas descendre sous la largeur de leur contenu. Une piste de correction serait `repeat(2, minmax(0, 1fr))`, à confirmer.

**Fausse alerte à ne pas reprendre** : le bouton de menu semblait absent sur téléphone. Analyse des pixels de la barre : il est présent au bon endroit, simplement discret. Aucun défaut de navigation.

### 6.7 Diagnostics posés mais non appliqués, périmètre écarté par Yoan

Le 4 août, Yoan a limité le travail aux pages qu'il a déclarées **[défini]** dans `docs/01-architecture.md`, soit `coaching.html` et `paddock.html`. Soigner les métadonnées d'une page destinée à être refondue est du travail à refaire. Les constats ci-dessous sont donc établis et vérifiés, mais volontairement non corrigés. Ils évitent de refaire le diagnostic quand ces chantiers s'ouvriront.

**`footer.js` ligne 17 écrit « École de Pilotage · Région PACA » dans le pied de toutes les pages du site.** C'est la mention la plus diffusée de la région, et elle ne figurait dans aucun relevé antérieur. Une seule ligne à changer, mais elle modifie le rendu des 18 pages, donc elle attend l'accord de Yoan.

**Les `Disallow` de `robots.txt` sont périmés depuis la réorganisation en sous-dossiers.** Le fichier bloque `/admin.html`, `/login.html`, `/signup.html` et `/mot-de-passe-oublie.html`, c'est-à-dire exactement les anciennes URLs que `_redirects` renvoie en 301. Les URLs réelles sous `admin/` ne sont couvertes par aucune règle. La protection est nulle. À noter qu'un `Disallow` empêche le crawl mais pas l'indexation de l'URL nue.

Remède proposé, quand `admin/` passera en chantier :

| Page | Balise |
|---|---|
| `admin/dashboard.html` | `noindex,nofollow`, sans canonique |
| `admin/login.html`, `admin/signup.html` | `noindex,follow`, elles sont liées depuis la navigation publique |
| `admin/mot-de-passe-oublie.html` | `noindex,nofollow` |

Et dans `robots.txt`, remplacer les quatre règles obsolètes par `Disallow: /admin/` suivi de `Allow: /admin/legal/`, faute de quoi on bloquerait `contact`, `mentions-legales` et `confidentialite`, dont deux figurent dans `sitemap.xml`. Ce point tombe si les pages légales sortent de `admin/`, question ouverte 5.

**Footers statiques en double.** `admin/login.html` et `admin/signup.html` embarquent un pied de page recopié en dur, en plus du `<div id="footer-root">` alimenté par `footer.js`. Sur `login.html` il est tronqué au milieu d'un mot ligne 173 : `© 2026 JB EMERIC · Tous dr`, suivi directement des balises de script. Contraire au principe scalable, à supprimer au profit du seul `footer-root`.

**Le Challenge est encore nommé dans du texte visible.** `admin/legal/contact.html` ligne 39 propose des renseignements « sur nos stages, track-days, le Challenge ou le coaching vidéo ». Même chose dans `academie/karting.html` ligne 136 et dans un titre d'iframe de `academie.html` ligne 184. D-008 le déclare mort. Cas particulier des titres de vidéos YouTube : ce sont des intitulés de contenus qui existent réellement sur la chaîne.

**`paddock/nos-voitures.html`** cumule un `<meta http-equiv="refresh">` vers `track.html#voitures`, une canonique vers elle-même et un `og:url` vers une URL redirigée. Les trois se contredisent. Le remède dépend du sort de la page, question ouverte 1.

### 6.5 Hors de portée d'une modification de fichier

Le contenu saisi par JB dans le live-editor vit dans la table Supabase `site_content`. Il n'est pas dans le dépôt et n'a pas été traité par la passe D-007. Un cadratin subsiste dans le cache figé de `academie/karting.html` à ce titre, laissé volontairement. La base reste à passer en revue.

---

## 7. Mise à jour du 8 août 2026, le dashboard des événements

Décisions D-060 à D-066. Ce qui suit est l'état après correction.

### 7.1 Le dashboard admin, quatre défauts trouvés, quatre corrigés

Aucun ne se voyait dans l'audit : ils vivent tous à l'exécution, dans une page que l'outillage n'atteint pas.

| Défaut | Ce que JB constatait | État |
|---|---|---|
| Deux `loadEvents` concurrentes, la seconde écrivant dans `#events-tbody` absent du HTML | la liste s'affiche, puis le filtre Statut et la recherche ne répondent plus | corrigé, une seule fonction, le `tbody` porte l'identifiant |
| `${!vis}` sur une chaîne HTML, toujours faux | le bouton « Publier » ne publie jamais | corrigé, mécanique remplacée |
| UUID injectés sans guillemets dans sept `onclick` | erreur de syntaxe au clic, bouton inerte | corrigé, attributs `data-` et écouteur unique |
| Filtre `date_event >= aujourd'hui` | sept dates sur onze invisibles | corrigé, plus de filtre par défaut, sélecteur Période ajouté |

**Non vérifiable ici.** Le dashboard exige une session authentifiée et importe Supabase depuis jsdelivr, tous deux hors d'atteinte de cette machine. La nouvelle mécanique d'actions a été éprouvée sur un banc isolé : elle transmet un UUID réel intact et neutralise un identifiant hostile, là où l'ancienne échouait sur le premier et exécutait le second. Le reste attend un passage chez Yoan.

### 7.2 Doublons de fonctions restants dans `assets/js/admin.js`

Relevé, non corrigé, hors de la demande.

`window.togglePin` et `window.toggleThreadVisible` ne sont appelés par personne. `deleteThread` est défini deux fois : la seconde définition gagne, la première est morte. Sans conséquence aujourd'hui, mais c'est la même famille de piège que celle qui a coûté le filtre des événements.

### 7.3 Un numéro de téléphone de plus dans le site

Trois numéros y cohabitent, tous légitimes sauf un :

- **06 60 18 87 87**, le portable de JB, huit occurrences plus le pied de page.
- **04 42 32 87 87**, le fixe, mentions légales uniquement.
- **06 00 00 00 00**, un gabarit oublié, hors périmètre, laissé tel quel.

La règle `contacts` de l'audit refuse désormais tout numéro non déclaré et vérifie que le texte affiché correspond au numéro composé.

### 7.4 La page Événements sans sa base

La grille des dates ne contient qu'un mot d'attente que `track-render.js` remplace. Quand Supabase ne répond pas, le visiteur voit maintenant un message avec le téléphone et le courriel de JB, au lieu de « Chargement du calendrier… » indéfiniment. Deuxième message quand la base répond mais qu'aucune date n'est ouverte.

Vérifié à l'écran : le bloc de repli mesure 1051 × 350 px sur écran de 1300, le bouton est en or `#FFCF00` sur texte noir, et il compose bien le 06 60 18 87 87.

### 7.5 Ce qui reste ouvert sur les Événements

Aucun de ces points ne peut avancer sans Yoan.

- **Les quatre colonnes manquantes de `events`** : mode d'engagement, organisateur hôte, lien vers l'organisateur, coût. Proposées, non tranchées.
- **La forme de la page** : pages filles ou onglets, sachant que chaque type doit avoir son adresse.
- **Le bouton « je viens »**, sous sa forme allégée « dites-moi si vous venez ». Le vote a été retiré, rien n'a été mis à la place.
- **Le nombre de circuits et d'organisateurs qui comptent vraiment**, qui décide entre saisie manuelle et collecte automatisée.
- **La colonne `nb_votes` et la table `votes`**, plus écrites par personne. Les supprimer est irréversible.

---

## 8. Mise à jour du 8 août 2026, les événements réels

### 8.1 Ce que la page Événements montrait vraiment

Neuf dates à l'inscription, dont **six déjà passées** : 3 avril, 17 avril, 9 mai, 13 mai, 19 juin, 5 juillet. Toutes avec le badge « Inscriptions ouvertes ». La requête n'avait aucun filtre de date. Corrigé, D-067.

Trois boutons sur trois auraient par ailleurs ouvert la fiche d'une autre date que celle affichée, à cause d'un rattachement par position dans deux blocs concurrents. Corrigé, D-068.

### 8.2 L'état réel du calendrier de JB

Sur onze lignes dans `events`, au 8 août 2026 :

| | Nombre |
|---|---|
| Dates passées | 7 |
| Dates à venir | 4 |
| dont publiques | 3 |
| dont en préparation, invisibles | 1 |

Les quatre dates restantes : 29 août à Lédenon (en préparation, pas publique), 16 octobre à Brignoles, 15 novembre au Grand Sambuc, 12 décembre à Brignoles.

**Aucune inscription sur aucune date.** `nb_inscrits` vaut 0 partout, et la table `inscriptions` n'a jamais reçu de ligne depuis le site.

Trois circuits seulement sont employés sur les onze dates : Brignoles, Lédenon, Grand Sambuc. La table `circuits` en déclare quinze, dont Spa, Monza et Barcelone.

### 8.3 Le prototype de suivi

`outil-dev/prototype/evenements.html`. Hors du site, n'écrit rien, s'ouvre dans un navigateur. Montre les dates réelles et les quatre champs manquants. Voir D-069.

### 8.4 Les sources de veille repérées, non consultées

`trackdays.fr`, `calendrier-piste.fr`, `europatrackdays.com`, `circuitduvar.com`, `sambucdrivingacademy.fr`, `circuitpaulricard.com`, et l'ancien site `jbemeric.com/calendrier`.

**Aucune n'a pu être ouverte depuis ce poste.** Rien n'a été saisi dans la base à partir d'elles. Voir D-070.

### 8.5 Tout le dépôt est publié

`netlify.toml` déclare `publish = "."`. `outil-dev/`, `docs/` et `old/` sont donc en ligne. `robots.txt` les écarte désormais des robots, D-071. Ils restent accessibles à qui connaît l'adresse.

### 8.6 Les droits, cause première de « rien ne fonctionne »

Sept policies sur huit cherchent le rôle applicatif dans le mauvais claim du jeton. Elles sont fausses en toutes circonstances. Voir D-073.

| Table | Policy | Ce qui est refusé à JB |
|---|---|---|
| `events` | `events_admin_all` | ouvrir, masquer, supprimer, créer une date |
| `inscriptions` | `inscriptions_admin_read` | lire les inscriptions reçues |
| `circuits` | `circuits_admin_all` | ajouter un circuit |
| `docs` | `docs_admin_all` | publier un document |
| `users` | `users_admin_read` | voir la liste des utilisateurs |
| `forum_threads` | `threads_auth_update` | modérer un fil dont il n'est pas l'auteur |
| `forum_replies` | `replies_auth_update` | modérer une réponse dont il n'est pas l'auteur |

Seule `content_admin_write` sur `site_content` emploie le bon chemin, et le live-editor est la seule fonction d'administration qui ait jamais marché.

Migration écrite et non appliquée : `outil-dev/migrations/2026-08-08-role-admin-dans-les-policies.sql`.

### 8.7 Le formulaire d'inscription était refusé par la base

`inscriptions.event_id` porte une clé étrangère vers `track_days`, alors que le site envoie un identifiant de `events`. Chaque inscription est refusée. Voir D-075.

`track_days` est une table morte, une ligne de mars 2026, aucun fichier du dépôt ne la nomme.

Migration écrite, non appliquée : `outil-dev/migrations/2026-08-08-inscriptions-vers-events.sql`.

### 8.8 Les droits sont corrigés

Migration appliquée le 8 août, D-076. Vérifié après coup : un admin connecté peut écrire dans `events`, un client et un anonyme ne peuvent pas. Sur `inscriptions`, l'anonyme écrit sans pouvoir relire, JB relit tout.

**Le dashboard peut donc désormais fonctionner côté base.** Il reste un chantier côté interface, et Yoan a dit ne pas en avoir besoin à ce stade.
