# Technique

**Chargé par** : rôle `jbe-technique`.
**Relevé le** : 1er août 2026, vérifié dans le dépôt et par test HTTP.

---

## 1. Stack

HTML statique, CSS et JavaScript vanilla. **Aucun framework.**

- **Base de données et authentification** : Supabase, projet `fyaybxamuabawerqzuud`
- **Hébergement** : Netlify, `jbemeric.netlify.app`, cible finale `www.jbemeric.com`
- **Serveur local** : `outil-dev/dev-server.js`, port 3000

**Lancer le serveur** : `preview_start` avec la configuration « JBE Dev Server (Node custom) ». Jamais par Bash.

---

## 2. Les trois autorités uniques

Le principe « scalable » de Yoan repose sur trois fichiers. Rien d'autre ne doit redéfinir ce qu'ils contiennent.

| Fichier | Rôle |
|---|---|
| `assets/js/routes.js` | Source unique de toutes les URLs. Modifier un chemin se fait ici et nulle part ailleurs. |
| `assets/js/nav.js` | La navigation, injectée dans chaque page. |
| `assets/js/footer.js` | Le pied de page, injecté dans chaque page. |

`routes.js` expose `window.ROUTES`, un helper `matchCurrent()`, déclare la favicon, et corrige le comportement des ancres sous `<base href="/">`.

**Les 18 pages ont `<base href="/">`.** Sans exception. Les chemins relatifs se résolvent donc depuis la racine du site.

---

## 3. Contraintes dures

### `live-editor.js` reste en ES5

Pas de template string, pas d'arrow function, pas de classe ES6. Le fichier est chargé en module et importe le client Supabase depuis un CDN, mais son corps reste en ES5. C'est écrit en tête du fichier.

### Ne jamais changer la variable `PAGE`

```js
var PAGE = (location.pathname.split('/').pop().replace('.html','')) || 'index'
```

`PAGE` sert de préfixe aux clés Supabase de la table `site_content`, sous la forme `PAGE + '__' + id`. La modifier rendrait inaccessible tout le contenu déjà enregistré pour les pages en sous-dossier.

Pour le chemin de fichier, `PAGE_PATH` existe depuis le 1er août 2026 :

```js
var PAGE_PATH = location.pathname.replace(/^\/+/, '').replace(/\.html$/, '') || 'index'
```

**Risque latent** : `PAGE` étant dérivé du seul nom de fichier, deux pages homonymes dans des dossiers différents partageraient leurs clés. Aucun cas actuel.

### Le routing des articles passe par le hash

`paddock/article.html#mon-slug`, jamais `?slug=`. Les redirections d'URL propres suppriment les chaînes de requête. Le hash n'est jamais envoyé au serveur, il est donc immunisé.

### PostgREST et les valeurs nulles

`slug=not.is.null` ne fonctionne pas, il renvoie zéro résultat. Filtrer côté JavaScript avec `.filter(d => d.slug)`. En revanche `order=colonne.desc.nullslast` fonctionne.

### Rescan après injection dynamique

`sync-mirror.js` émet l'événement `jbe-mirror-loaded` après chaque injection. `live-editor.js` doit y réagir, sinon les éléments injectés ne sont pas éditables.

### Contrainte « papa proof »

JB, 65 ans, casse les structures sans s'en rendre compte. Toute interface qu'il manipule doit valider ses entrées, résister aux mauvaises manipulations, et ne jamais dépendre d'un geste précis.

---

## 4. Base de données

Tables interrogées, relevé du 1er août 2026 :

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

**`circuits` n'est pas exposée via l'API REST.** Toute requête la concernant renvoie 400. `admin.js` l'interroge quand même. Statut du tableau de bord admin sur ce point : **non vérifié**.

**Table `docs`** : 51 lignes, dont 29 avec un `slug`, qui sont les articles importés de WordPress en avril 2026. Les 22 autres sont d'anciens éléments sans slug, à ne pas supprimer sans confirmation.

**`import-wp.js`** à la racine est un script à usage unique, déjà exécuté. Ne pas relancer sans validation. L'upsert sur `slug` le rend idempotent, donc pas de doublon en cas d'accident.

---

## 5. Correctifs du 1er août 2026

### `dev-server.js` lit désormais `_redirects`

**Le problème.** Le serveur local n'interprétait aucune redirection. Les liens relatifs vers d'anciens chemins fonctionnaient en production, via les 301 de Netlify, et tombaient en 404 en local.

Vérifié par requête avant correctif : `/contact.html`, `/articles.html`, `/academie-competition.html`, `/login.html` renvoyaient tous 404 en local.

**Conséquence** : une partie des bugs traqués par le passé n'existaient qu'en local. Le site n'était pas cassé, l'outillage l'était.

**Le correctif.** `_redirects` est chargé au démarrage. Sémantique Netlify respectée : un fichier existant l'emporte sur une règle de redirection. Le serveur affiche le nombre de règles chargées au lancement. Si ce compteur tombe à zéro, les liens casseront.

### `/save-html` accepte un chemin complet

**Le problème.** L'endpoint reconstruisait le chemin depuis le seul nom de page, donc échouait sur les 13 pages en sous-dossier.

**Le correctif.** Il accepte `payload.path`, avec repli sur `payload.page` pour l'ancien format. Le chemin est validé par une liste blanche `^[a-z0-9/_-]+$` qui exclut le point, donc pas de remontée de répertoire. Deux tentatives de traversée testées, refusées en 400.

---

## 6. Anomalies connues, non corrigées

**Aucune ne doit être corrigée sans validation de Yoan.**

| Anomalie | Détail |
|---|---|
| `track.html#voiture-perso` | Entrée du menu principal, l'ancre n'existe pas dans la page |
| `paddock.html#lib` | Lié depuis `index.html` et depuis `paddock.html`, l'ancre réelle est `#blog` |
| `assets/images/jb-emeric-portrait.jpg` | Référencée par `academie/karting.html`, absente du disque |
| Entrée de menu « Boutique 4x sans frais » | Pointe vers `pilotage-jbemeric-marseille.fr`, domaine en **404** |
**Les fichiers morts ont été déplacés dans `old/` le 1er août 2026**, sur décision de Yoan : déplacer plutôt que supprimer. Liste et vérification dans `docs/05-etat-des-lieux.md`.

**Piège de détection à connaître.** Chercher les orphelins par balise `<script src>` seule est faux : les modules ES sont importés depuis des scripts inline. `auth.js` avait été signalé mort alors qu'il porte toute l'authentification. Toujours chercher le nom de fichier dans l'intégralité du dépôt, imports compris.

---

## 6bis. Prendre une capture d'écran fiable

Chromium sans interface est dans `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Il sert à prouver un rendu, mais **il ment de trois façons**, toutes rencontrées le 7 août 2026 en essayant de démontrer qu'une suppression de CSS ne changeait rien.

```
chrome --headless --no-sandbox --disable-gpu --hide-scrollbars \
       --no-proxy-server --window-size=1300,900 \
       --virtual-time-budget=6000 --screenshot=sortie.png URL
```

**`--no-proxy-server` est obligatoire.** Sans lui, `localhost` part dans le proxy sortant et la page revient d'un cache.

**Une hauteur de fenêtre énorme donne une image morte.** À `--window-size=1300,7000`, le PNG est identique quoi qu'on change dans le CSS, y compris un `outline` magenta de six pixels. Rester sur une hauteur d'écran normale.

**Une URL avec ancre n'est pas reproductible.** Trois exécutions de suite sur `#voiture`, sans aucune modification, ont donné trois empreintes différentes. La position de défilement varie. Seule la capture en haut de page est comparable d'une fois sur l'autre.

**D'où la règle : tout contrôle négatif d'abord.** Avant de conclure « identique », introduire une différence visible volontaire et vérifier que l'empreinte change. Une comparaison qui ne sait pas voir une différence dira toujours « identique ».

**Et souvent, mieux vaut ne pas passer par le pixel.** Pour prouver qu'une règle CSS est morte, chercher ses classes dans le HTML et le JavaScript des pages qui chargent la feuille est déterministe, instantané, et ne dépend d'aucun navigateur. Le pixel ne sert qu'à corroborer.

---

## 7. Méthode

**Vérifier, pas affirmer.** Une anomalie se prouve par une requête HTTP, un appel d'API ou une sortie de console. Lire le code et en déduire un comportement ne suffit pas. Cette règle a évité deux fausses alertes le 1er août : le `06 00 00 00 00` de `contact.html` est un placeholder de formulaire, et la plupart des liens signalés « cassés » par une analyse statique fonctionnent grâce à `<base href="/">` plus `_redirects`.

**Règle des 95 %.** Aucune modification si la solution n'est pas sûre à 95 %.

**Deux tentatives maximum sur un bug.** Au-delà, changement d'approche, après avoir énoncé la cause racine.

**Vérifier `git status` avant d'éditer.** Yoan peut avoir du travail non commité dans le fichier. C'est le cas de `live-editor.js` au 1er août 2026, qui contient un système d'identifiants stables en cours.

**Jamais de push. Jamais de déploiement.**
