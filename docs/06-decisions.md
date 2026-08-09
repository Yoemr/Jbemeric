# Journal des décisions

Du plus récent au plus ancien. Une décision par entrée, avec sa raison.

Écriture libre par Claude, sans validation préalable. Résumé à Yoan en fin de chantier.

---

## 9 août 2026, les notifications vers le téléphone de Yoan

### D-127, Trois par 24 heures, et un compteur au démarrage

Mot de Yoan : « tu recommences à envoyer sur Notify sans me demander, sauf que ça coûte cher. Alors tu as le droit, mais maximum 3 fois par tranche de 24 h pour ne pas dépasser les 300. M'afficher un compteur mensuel pourrait être cool. »

**Ce qui envoyait réellement.** Aucun envoi volontaire n'a eu lieu : le dépôt ne contient pas une ligne de code de notification, et je n'ai appelé aucun outil d'envoi. Ce qui est parti sur son téléphone, ce sont les avis automatiques de l'outillage. Trois tâches sont passées en arrière-plan le 9 août, à 08:50, 10:52 et 22:08, parce que les commandes dépassaient le délai de deux minutes et étaient basculées pour ne pas bloquer. Chaque fin de tâche déclenche un avis. S'y ajoutent les agents lancés depuis son téléphone, qui en déclenchent un en se terminant.

La distinction compte, sinon la règle ne corrige rien.

### D-128, Les deux sortes se traitent différemment

**Les envois volontaires se comptent.** `node outil-dev/notify.js --envoi "la raison"` enregistre avant de partir. La commande refuse au-delà de trois dans les 24 heures et annonce l'heure à laquelle la suivante sera possible. Ce n'est pas une note dans un document, c'est une porte : la règle tient même si je l'oublie.

**Les avis automatiques ne se comptent pas, ils s'évitent.** Une commande longue reçoit un délai explicite pour finir au premier plan. `parcours.js` et `fumee.js` dépassent les deux minutes par défaut, il leur faut 300 000 ms. C'est la seule chose qui supprime la cause.

`CLAUDE.md` porte la règle en section 3 bis, avant la méthode : elle s'applique à chaque session, pas à un chantier.

### D-129, Le compteur s'affiche là où Yoan regarde déjà

Sous l'audit, à chaque ouverture de session, par le hook `SessionStart` :

```
  NOTIFICATIONS   0 / 3 dans les 24 h   0 en août 2026   300 restantes sur 300
```

L'audit garde sa sortie et sa logique intactes : le hook enchaîne deux commandes plutôt que d'ajouter au premier outil une préoccupation qui n'est pas la sienne. Le `; true` final préserve le code de sortie du hook, que l'audit met à 1 dès qu'une faute existe.

Le registre vit dans `outil-dev/notifications.json`, versionné : le conteneur est jetable, le dépôt non.

**Le compteur dit ce qu'il sait et rien de plus.** Il ne voit pas les avis automatiques, et son texte le dit en toutes lettres. Un compteur qui prétendrait tout voir donnerait un faux calme.

**Contrôles**, quatre, tous concluants : trois enregistrements passent, le quatrième est refusé avec l'heure de déblocage et sort en code 1, un envoi sans raison est refusé en code 2, et le hook sort en 0 même quand l'audit compte des fautes.

---

## 9 août 2026, la fiche d'inscription devient un composant

### D-123, Une seconde version de sept fonctions dormait dans `track-render.js`

Le fichier définissait `openModal`, `closeModal`, `closeModalOutside`, `confirmInscription`, `filterCards`, `selectVeh`, `toggleCoaching` et `toggleCheck` **deux fois**. La première série dans l'IIFE du haut, la seconde en bas du fichier, hors de toute portée.

Le fichier est chargé en module. Les déclarations du bas ne deviennent donc pas des globales : c'est la série du haut qui sert, et le site fonctionnait. La série du bas était morte, et fausse : elle cherchait `insc-nom` et `insc-email`, deux champs absents de la page, et envoyait un `mailto` au lieu d'écrire dans Supabase.

Même famille que `admin.js` le 8 août, `docs/07` section 2.10. Un fichier qui compile ne dit pas quel code s'exécute.

### D-124, La touche Échap laissait un écran noir et vide

La dernière ligne du fichier écoutait Échap et appelait `closeModal`. Elle était **sous** la seconde série, donc elle appelait la version morte, qui ne fermait que la boîte et laissait le voile en place.

Résultat pour un visiteur : ouvrir la fiche d'inscription, appuyer sur Échap, se retrouver devant un écran sombre et vide, sans rien à cliquer, avec le défilement de la page rétabli derrière.

**Prouvé** par un parcours écrit avant la correction, qui a nommé le défaut : « Échap laisse le voile affiché : display flex, opacity 1 ». L'écoute vit maintenant à côté de la fonction qu'elle appelle.

### D-125, La fiche écrit son propre balisage

Troisième composant de la même famille, après la FAQ et les avis, et le seul qui débloque une page.

140 lignes de balisage vivaient dans `evenements.html`, les gestionnaires dans `track-render.js` mêlés au calendrier. La page d'une date ne pouvait pas ouvrir la fiche : son bouton « Réserver JB » renvoyait vers la liste, et le visiteur qui venait de lire SA date repartait au début.

| Fichier | Ce qu'il tient |
|---|---|
| `assets/js/inscription.js` | le balisage et les gestionnaires |
| `assets/css/inscription.css` | la forme, sortie de `track.css` |

Une page charge les deux et appelle `openModal(titre, prix, circuit, id)`. `evenements.html` perd 140 lignes, `track.css` en perd 187, `track-render.js` 155. Ce dernier ne s'occupe plus que de la grille et de ses filtres.

**Le balisage est posé en fin de `<body>`, à la première ouverture.** Deux conséquences assumées. Il sort de `.sessions-root`, qui portait les couleurs `--sr-*` : la fiche les déclare donc elle-même, condition pour qu'elle s'ouvre sur une page sans calendrier. Et le visiteur qui n'ouvre jamais la fiche ne paie pas sa construction.

Les noms globaux sont gardés tels quels. Les renommer aurait cassé le balisage construit, `evenement.js` et trois parcours, sans rien apporter.

### D-126, Ce que les parcours protègent

Deux nouveaux. « Échap ferme vraiment la fiche », écrit avant la correction pour prouver le défaut. Et « la fiche d'inscription s'ouvre vraiment » sur la page d'une date, qui est le point d'arrivée du chantier.

Le second vérifie quatre choses d'un coup : la fiche se pose, elle est habillée (la variable `--sr-Y` n'existe que dans `inscription.css`), sa boîte a bien un fond, et elle affiche le prix de **cette** date et non les 195 € par défaut.

**Contrôles négatifs**, trois, tous concluants : retirer `inscription.css` est nommé tel quel, retirer `inscription.js` donne « la fiche ne s'est pas posée », figer le prix donne « la fiche affiche le prix par défaut ».

---

## 9 août 2026, TripAdvisor devient un composant

### D-118, Le bloc d'avis suit exactement le régime de la FAQ

Mot de Yoan : « header, menu, body, trip advisor, faq, footer. Hormis le texte du header rien n'a besoin d'être codé. Le fonctionnement est le même partout donc un seul code suffit, mais le contenu varie et s'adapte en fonction de la page. Parfois la couleur de fond varie pour bien se marier avec la page. »

Les avis vivaient en dur dans deux pages, `academie.html` et `coaching.html`. Les mêmes trois avis, déjà divergents : l'ordre n'était pas le même d'une page à l'autre. C'est la duplication au premier stade, avant qu'elle ne devienne du contenu différent.

Quatre pièces, une par nature de problème :

| Pièce | Ce qu'elle tient |
|---|---|
| `assets/css/avis.css` | la forme, sortie de `theme.css` |
| `assets/js/avis.js` | le tri par page et le rendu |
| table `avis` | le contenu |
| `assets/js/gestion-avis.js` | l'onglet où JB le modifie |

Sept variables portent tout ce qui varie. Le fond sombre est le cas courant, une page claire pose `data-avis-fond="clair"`. Une seule exception à la règle des couleurs : le jaune du site est illisible sur blanc, le lien TripAdvisor prend donc l'encre du titre en variante claire.

### D-119, Un avis sans tag s'affiche partout, une question sans tag nulle part

C'est la seule divergence entre les deux composants, et elle est voulue.

Une question de FAQ porte toujours sur quelque chose : sans page, elle n'a pas de raison d'être. Un avis parle de JB neuf fois sur dix : le ranger sous une page le cacherait des huit autres. Les trois avis existants n'ont donc aucun tag, et JB n'a rien à cocher pour qu'ils s'affichent.

Cocher une page réserve l'avis à celle-là. C'est la seule chose que l'onglet demande de comprendre.

### D-120, Le HTML garde ses avis, pour une raison de plus que la FAQ

`theme.css` portait déjà l'argument, et il reste vrai : « un avis rendu en JavaScript disparaîtrait de ce que lit un moteur de recherche, et c'est justement la preuve sociale qu'on veut faire lire. »

Le filet est donc double. Si Supabase ne répond pas, le visiteur lit les avis d'avant. Et un robot qui n'exécute pas de JavaScript lit toujours les trois avis dans le HTML. La base ne fait que rafraîchir ce qui est déjà là.

### D-121, Ce que les parcours protègent

Deux, plus un contrôle glissé dans le second.

Le premier tient la règle inverse de la FAQ : deux avis sans tag doivent sortir, un avis tagué `evenements` ne doit pas apparaître sur Coaching, une note de 4 doit rendre quatre étoiles, et un avis sans contexte ne doit pas laisser un séparateur orphelin derrière le nom.

Le second coupe la base et vérifie que le filet HTML tient. Il mesure en plus la variable `--avis-fond` : elle n'existe que dans `avis.css`, donc une page qui aurait oublié la balise `<link>` se ferait nommer au lieu de s'afficher nue.

**Contrôles négatifs**, quatre, tous concluants : filtrer comme la FAQ fait disparaître les avis généraux, retirer la garde sur le contexte laisse le séparateur, vider le bloc HTML fait tomber le filet, retirer le `<link>` est nommé tel quel.

### D-122, Le bloc arrive sur la page Événements

Yoan a décrit la structure de cette page : « header, menu, body, trip advisor, faq, footer ». Le bloc y est donc ajouté, entre le corps et la FAQ, avec le tag `evenements`.

La page d'une date, `evenement.html`, ne le reçoit pas. Yoan n'a pas décrit sa structure, et une section ne se crée pas sans son accord.

---

## 9 août 2026, le vocabulaire des tags de FAQ

### D-117, Un tag par page qui porte une FAQ, et rien de plus

Mot de Yoan : « on crée le tag sur la page où on insère la FAQ. Je ne pense pas nécessaire de le faire pour les sous-pages. Par exemple un tag académie oui mais un tag karting non, pour une raison simple : ça va être les mêmes questions donc inutile. Et dans le dashboard mon père peut décider quel tag il met pour chaque question, c'est lui qui gère le contenu. »

Le vocabulaire posé la veille comptait dix valeurs. Il en compte trois :

| Tag | Pages qui l'affichent |
|---|---|
| `academie` | `academie.html`, `academie/karting-enfant.html`, `academie/karting-adulte.html`, `academie/competition.html` |
| `coaching` | `coaching.html` |
| `evenements` | `evenements.html` |

Quatre valeurs sont supprimées parce qu'aucune page ne porte de bloc FAQ : `index`, `evenement`, `paddock`, `palmares`. Aucune ligne ne les employait. Trois valeurs sont fondues dans `academie` : `karting-enfant`, `karting-adulte`, `competition`.

**Aucune question n'est perdue.** Les 16 questions des trois sous-pages passent sous le tag du parent et sont renumérotées derrière les 5 de l'Académie, dans leur ordre d'origine : Académie 10 à 50, karting enfant 60 à 120, karting adulte 130 à 160, compétition 170 à 210. Le groupe `academie` compte donc 21 questions, `coaching` 5, `evenements` 4, pour 29 lignes en base, une question étant partagée entre Coaching et Événements.

**Conséquence à connaître** : les quatre pages de l'Académie affichent maintenant la même liste de 21 questions, celle de la compétition comprise sur la page du karting enfant. C'est exactement ce que la règle produit. C'est à JB de trancher dans le dashboard, question par question, puisque c'est lui qui gère le contenu.

**La contrainte suit le code.** `faq_tags_connus` n'accepte plus que les trois valeurs, et `PAGES` dans `assets/js/gestion-faq.js` porte la même liste. Les deux doivent se compléter ensemble le jour où une page reçoit une FAQ, sans quoi JB verrait un enregistrement refusé sans explication.

**Contrôle négatif** : à l'insertion, `karting-enfant`, `competition` et `palmares` sont refusés, `academie`, `coaching` et `evenements` acceptés. L'instrument voit donc les deux sens.

Un parcours garde la décision : `FAQ, une sous-page de l'Académie reçoit les questions du parent`. Rendre son tag à `academie/karting-enfant.html` le fait échouer en nommant le tag fautif.

---

## 9 août 2026, le CSS de la FAQ, et la fenêtre de gestion

### D-113, Une seule feuille pour la FAQ, deux jeux de couleurs

Mot de Yoan : « globalement c'est toujours le même. Y a un seul truc qui peut changer, c'est les couleurs de fond et de texte. »

Trois implémentations quasi identiques cohabitaient : `.jbe-faq` dans `theme.css`, `.faq-section` dans `competition.css`, et la même dans `karting.css`. Elles divergeaient en silence, et `competition.css` portait un commentaire expliquant comment il luttait contre les bordures de `theme.css`. C'est le symptôme classique de la duplication : on n'ajoute plus des règles, on écrit des contre-règles.

`assets/css/faq.css` les remplace. **Sept variables portent tout ce qui varie.** Une page claire ne déclare rien, une page sombre pose un attribut :

```html
<section class="jbe-faq" data-faq="competition" data-faq-fond="sombre">
```

Le balisage est unifié sur les six pages, chacune gardant son kicker et son titre. `academie.css` posait en plus son propre fond et sa propre largeur, ce qui rendait la page différente des cinq autres sans raison.

**Vérifié** sur trois pages : la claire rend blanc sur texte sombre, la sombre rend `#0b1120` sur texte blanc, l'accordéon ouvre partout.

### D-114, Une fenêtre à onglets, et la coquille ne connaît aucun onglet

Demande de Yoan : « cette page sera un peu comme un logiciel au bout du compte. À la limite tu peux faire juste une fenêtre avec plein d'onglets. Pour l'instant on crée un onglet pour chaque truc qu'on manage, pour chaque fonction. Plus tard on aura uniquement à bouger les onglets comme on veut. »

`admin/gestion.html`, séparée du dashboard qui reste un chantier.

**La règle qui rend ça tenable** : la coquille sait ouvrir, fermer, retenir l'onglet courant, et rien de plus. Un onglet s'enregistre lui-même en déclarant une table, des colonnes et des champs :

```js
JBE.onglet({ cle:'faq', titre:'FAQ', table:'faq', colonnes:[…], champs:[…] })
```

Ajouter une fonction se fait donc **en ajoutant un fichier**, sans toucher à la coquille. Les déplacer se fait en changeant l'ordre des balises `<script>`, exactement ce que Yoan demandait.

Deux onglets pour l'instant : Track-days et FAQ.

### D-115, Le formulaire se déclare, il ne s'écrit pas

Chaque onglet gère une table : lister, créer, modifier, supprimer. Écrire ce code une fois par onglet donnerait quatre versions du même qui divergeraient, ce que ce projet vient de payer trois fois avec la FAQ.

La coquille fabrique donc le tableau et le formulaire à partir de la déclaration. Ajouter une colonne à `events` revient à ajouter une ligne dans `gestion-evenements.js`, sans écrire une balise ni un gestionnaire de clic.

**Deux choses héritées des fautes précédentes.** Aucun identifiant ne s'écrit dans un attribut `onclick`, c'est ce qui avait tué les boutons du dashboard le 8 août. Et les tags s'affichent avec leur nom lisible : `karting-enfant` est une clé technique que JB ne devrait jamais avoir à déchiffrer.

### D-116, Ce que les parcours protègent, sans jamais écrire en base

Deux parcours sur `admin/gestion.html`. Les lectures rendent un jeu fixe, les écritures sont capturées au lieu de partir. La page écrit pourtant dans la base de production : le parcours reste donc jouable partout, y compris chez Yoan.

Le second vérifie la chaîne entière : ouvrir l'onglet FAQ, ouvrir une question, cocher une page de plus, enregistrer, et contrôler le corps envoyé. **Contrôles négatifs** : perdre les tags déjà cochés, et laisser la fenêtre ouverte après enregistrement. Les deux font échouer le parcours en nommant le défaut.

---

## 9 août 2026, la FAQ devient une table à tags

### D-109, Une question s'écrit une fois et porte les tags des pages où elle sert

Demande de Yoan : « un système de tableau avec des tags attachés à chaque question. Le tableau entier est affiché dans le dashboard, c'est là qu'on met à jour, qu'on modifie ou qu'on crée une question. Et ensuite les pages affichent la FAQ avec le tag de la page. »

C'est le principe commun/spécifique appliqué au texte, et il paye tout de suite : **« Puis-je venir avec ma propre voiture ? » était déjà recopiée sur Coaching et sur Événements.** Les deux copies pouvaient diverger sans que rien ne le signale. Elle est maintenant une seule ligne portant deux tags.

Table `faq` : `question`, `reponse`, `tags` (tableau), `ordre`, `visible`. Index GIN sur les tags, sans quoi chaque page relirait la table entière.

**Contrainte papa proof** : un tag hors de la liste connue est refusé. Un tag mal tapé ferait disparaître la question de toutes les pages sans que rien ne le dise.

**Les 29 questions des six pages sont en base**, extraites de leur HTML sans perte.

### D-110, Le contrat est l'attribut, pas la classe

Le site portait deux noms de conteneur de FAQ, `jbe-faq` et `faq-section`, et un troisième serait arrivé le jour où quelqu'un aurait recopié une page. Le composant se branche donc sur `[data-faq]`.

```html
<div class="jbe-faq" data-faq="coaching">
```

Le fond, les titres et la couleur restent à la page : c'est ce qui varie, et le script n'a rien à en dire. C'est exactement la frontière que Yoan demandait de tracer.

**L'accordéon est posé sur le conteneur**, pas sur chaque question. Les questions arrivent après la base, et un écouteur par question ne verrait jamais celles-là.

### D-111, Le HTML des pages reste, et sert de filet

Les questions écrites en dur ne sont pas supprimées. Si Supabase ne répond pas, le visiteur lit la FAQ d'avant plutôt qu'un trou. Le script ne remplace la liste que lorsqu'il a vraiment reçu quelque chose.

Le jour où JB modifiera une question, le HTML deviendra périmé sans rien casser : la base gagne quand elle répond.

### D-112, Un banc d'essai qui filtrait à la place du code ne prouvait rien

Le premier contrôle négatif n'a rien vu. J'ai retiré le filtre par tag de `faq.js`, et le parcours est resté vert.

La cause : mon banc filtrait déjà les questions selon la requête, donc il testait son propre filtre. Il rend désormais **tout**, sans filtrer, et c'est bien la page qui doit trier. Le contrôle négatif échoue alors correctement, en nommant la question intruse.

C'est une variante de la règle du contrôle négatif de `docs/07` : un instrument qui fait le travail à la place du code ne mesure que lui-même.

**Reste à faire** : la section FAQ du dashboard, où JB créera les questions et cochera les pages. Elle attend, comme le reste du dashboard.

---

## 9 août 2026, track.html devient la page Événements

### D-104, Le nom ne voulait plus rien dire

Question de Yoan : « c'est quoi au final track.html ? Ça devrait ne plus exister non ? »

Il avait raison. La page était un hybride de six blocs, dont un seul relevait de la nouvelle architecture.

| Bloc | Sort |
|---|---|
| Hero « Track-Days & Stages » | texte réécrit |
| Section « Track-days voiture personnelle » | retiré |
| Section « Nos voitures » | retiré, sujet séparé |
| Les cartes d'événements | **conservé, c'est la section track-days** |
| La fiche d'inscription | conservée en attendant d'en faire un composant |
| FAQ | conservée, contenu à filtrer plus tard |

227 lignes retirées. `track.html` devient `evenements.html`.

### D-105, Une seule famille d'adresses

**Décision de Yoan** entre trois propositions : `/evenements` pour la liste, `/evenements/<slug>` pour une date.

La liste est le parent de chaque date, ce qu'un moteur de recherche comprend. Et `/evenements/colonies` reste possible le jour venu.

`_redirects` sert les trois cas, dans cet ordre parce qu'il compte : `/evenements` exact, puis le joker. `track.html` redirige en 301, le référencement acquis n'est pas perdu.

**Un seul contenu du live-editor était en jeu**, la vidéo du hero sous la clé `track__img-1`. `PAGE_ALIASES` la reprend, dans `live-editor.js` **et** dans `build-cache.js`.

**La règle `renommages` a fait son travail** : elle a signalé que j'avais mis à jour une table et pas sa jumelle. C'est exactement le défaut qu'elle a été écrite pour attraper.

### D-106, Le serveur local ne reflétait pas la production

`/evenements/<slug>` répondait 404 en local alors que la règle était juste. Deux défauts dans `dev-server.js`, et j'ai bien failli accuser la règle.

1. Le joker n'était lu que pour les règles forcées par un point d'exclamation. Une règle en `/*` ordinaire ne s'appliquait jamais.
2. Un code 200 est une **réécriture** : Netlify sert le fichier cible sans changer l'adresse. Le serveur renvoyait un `Location`, ce qui transforme la réécriture en redirection et ferait disparaître l'URL de l'événement de la barre.

Les deux sont corrigés. Un outil qui ne reflète pas la production fait tester autre chose que le site.

### D-107, Le menu perd trois entrées mortes

`Stages voiture`, `Track-Days` et `Nos voitures` visaient des sections retirées. L'entrée devient un simple lien vers **Événements**, et portera une entrée par section d'événements à mesure qu'elles arrivent.

### D-108, Le référencement des pages d'événement, constat et remède

**Prouvé** : un robot reçoit aujourd'hui le même titre pour toutes les dates, et `<h1>Chargement</h1>`. Tout le contenu arrive par JavaScript, après.

```
<title>Journée circuit · JB EMERIC</title>
<h1>Chargement</h1>
```

Demande de Yoan : « des gens vont faire des recherches pour la date en question, ce serait bien qu'ils tombent sur la page de mon père ».

**Remède, à faire au chantier suivant** : `build-cache.js` tourne déjà à chaque publication et parle déjà à Supabase. Il écrira un vrai fichier par événement, avec le bon titre, la bonne description, le texte dans le HTML, un bloc `schema.org/Event`, et régénérera `sitemap.xml`. Le JavaScript continuera de rafraîchir derrière.

`sitemap.xml` est nettoyé en attendant : il pointe sur `/evenements` et ne réclame plus la page voitures archivée.

---

## 9 août 2026, LA page d'événement

Architecture posée par Yoan. Trois idées, dans son ordre.

### D-099, Ce qui est commun s'écrit une fois, ce qui varie vit dans la base

Mot de Yoan : « le fonctionnement est le même partout donc un seul code suffit, mais le contenu varie et s'adapte en fonction de la page. Faut bien comprendre la différence technique entre ce qui est commun et ce qui est spécifique afin d'avoir un code intelligent et léger. »

C'est le principe que la page d'événement applique. Il reste à l'appliquer à la FAQ et à TripAdvisor, chantier suivant.

### D-100, Une seule page pour tous les événements

`evenement.html` est un patron, pas une page. Elle ne contient aucun texte d'événement.

L'adresse réelle est `/evenement/<slug>`, servie par une **réécriture** et non une redirection : `_redirects` rend `evenement.html` sous le code 200, donc l'URL affichée reste celle de l'événement. Chaque date a son adresse, sans qu'aucun fichier n'existe pour elle.

**Ajouter une ligne dans la base créera donc une page**, sans écrire de fichier ni redéployer. C'est ce que le dashboard pilotera.

Quatre colonnes ajoutées pour ça : `slug`, `photo`, `resume`, `description`.

- `slug` est unique et contraint à des minuscules, chiffres et tirets. **Vérifié** : un slug propre passe, un slug accentué est refusé, un slug en double est refusé. Sans l'unicité, la page servirait un événement au hasard.
- `description` est du texte libre. Les lignes vides séparent les paragraphes, et rien n'y est interprété comme du HTML : ce que JB écrit reste du texte.

### D-101, La carte ne décide plus rien

Demande de Yoan : « pour chaque track-day tu crées une card. Bien jolie. Qui importe la photo de l'événement, la date, un bref résumé, et avec un seul bouton en savoir plus. »

La carte porte donc une photo, une date, deux phrases, un bouton. Le prix, le mode et la manière de s'inscrire ont quitté la grille pour la page de l'événement.

**Conséquence technique** : le choix de l'action selon le mode, écrit le matin même dans `track-render.js`, a déménagé dans `evenement.js`. Deux endroits qui décident la même chose finissent par ne plus dire la même chose. `track-render.js` perd 60 lignes.

La carte entière est cliquable, pas seulement son bouton : viser une petite cible est le geste le plus raté d'une grille sur téléphone.

### D-102, Trois événements de travail en base

Autorisés par Yoan : « pour travailler tu peux faire des événements prototypes ».

Ils portent `source_veille = 'PROTOTYPE'`. Une seule commande les efface tous :

```sql
delete from events where source_veille = 'PROTOTYPE';
```

Les trois circuits choisis sont automobiles, pour ne pas rejouer la confusion avec Brignoles : Lédenon en box partagé, Grand Sambuc en journée organisée par JB, Le Luc en journée greffée.

### D-103, Ce qui manque encore sur la page d'événement

**La fiche d'inscription n'y est pas.** Le bouton « Réserver JB » renvoie pour l'instant vers `track.html`, où vit la fiche. C'est la même question que la FAQ : un bloc commun employé par plusieurs pages, qui doit sortir de `track.html` pour devenir un composant.

Trois parcours protègent l'ensemble, tous jouables sans écrire en base. Le jeu de données de travail est écrit une seule fois et partagé par les trois.

**Piège payé au passage** : dans un gabarit de chaîne JavaScript, le `\/` d'une expression régulière est avalé à l'écriture, et le navigateur reçoit une division. Le parcours échouait sur une faute de syntaxe qui n'existait pas dans le fichier.

---

## 9 août 2026, le moteur des événements

### D-095, Le dashboard attend que les pages soient faites

Décision de Yoan : « le dashboard est tellement complexe qu'il faut attendre d'avoir fini toutes les pages du site. C'est notre plus gros chantier, mais le commencer maintenant alors que tant de pages ne sont même pas faites, c'est une perte de temps. »

Acté. Rien ne se fait sur `admin/` tant que les pages publiques ne sont pas terminées.

### D-096, Nettoyage, quatre fichiers supprimés

Sur demande. `outil-dev/nettoyer-css.js`, dont le travail était fait une fois pour toutes, `outil-dev/prototype/evenements.html`, qui avait servi à décider, et les deux migrations déjà appliquées, dont l'effet est dans la base et l'histoire dans ce journal.

**Règle qui en découle** : `outil-dev/migrations/` ne garde que ce qui n'est pas encore appliqué.

### D-097, Les quatre colonnes de `events` sont ajoutées

`mode`, `organisateur`, `lien_organisateur`, `cout`. Toutes nullables : rien de ce qui existe ne casse, et JB remplit au fur et à mesure.

`mode` porte une contrainte : `box`, `coaching`, `greffe`, `entier`, `moniteur`. Sans elle, la colonne finirait par contenir « boxe », « Box partagé » et « BOX » pour la même chose. **Vérifié** : un mode connu est accepté, un mode inventé est refusé.

Chaque colonne porte un commentaire en base, pour que le sens ne dépende pas de ce journal.

### D-098, Le mode décide de ce que le site propose

C'est le cœur du basculement, et c'est désormais du code.

JB ne loue plus le circuit à la journée. La plupart du temps il se greffe sur l'événement d'un autre, et le pilote doit alors faire deux choses : s'inscrire chez l'organisateur pour rouler, et payer JB pour le coaching. **Le site ne peut encaisser que lorsque JB est le vendeur.**

| Mode | Ce que la carte propose |
|---|---|
| vide, ou `entier` | « S'inscrire », le site encaisse |
| `box`, `coaching`, `greffe` | un lien vers l'organisateur, puis « Réserver JB » |
| `moniteur` | rien à réserver, une phrase d'information |

**Deux garde-fous dans le code.** Sans adresse d'organisateur, aucun lien n'est fabriqué : une phrase dit quoi faire, plutôt qu'un lien mort. Et une date sans mode se comporte exactement comme avant, donc aucune des onze dates existantes ne change tant que JB n'a rien rempli.

**Un parcours protège l'ensemble**, en remplaçant la réponse de Supabase avant que la page ne charge ses scripts. Aucune écriture, jouable partout. Deux contrôles négatifs : remettre le même bouton partout, et fabriquer un lien mort sans adresse. Les deux font échouer le parcours en nommant le défaut.

`parcours.js` gagne un champ `prelude` pour ça, seul moment où l'on peut remplacer `fetch` avant que le calendrier ne lance sa requête.

---

## 9 août 2026, recadrage

### D-093, La règle sur les circuits est retirée

Reproche de Yoan, mot pour mot : « le site n'est pas fonctionnel et n'est pas en ligne, tu te prends la tête sur des détails non techniques qui servent à rien, tu pars dans tous les sens, c'est chiant. On s'en fout des événements passés. Des voitures qui n'existent plus. Quand toute la partie technique fonctionnera on pourra en 5 min mettre à jour les événements. »

Il a raison. La règle `circuits` faisait remonter sept fautes dans le périmètre pour des données qu'il dit lui-même sans importance, et qui seront corrigées en cinq minutes le jour venu. Elle ajoutait du bruit à un audit qui doit rester un instrument de décision.

Le constat reste écrit dans `docs/05` section 9. La règle est supprimée.

**Ce qui est acté, et qui vaut pour la suite** : tant que le site n'est pas en ligne et fonctionnel, la justesse des données passe après la technique. Les événements se mettent à jour en cinq minutes, et seront automatisés plus tard.

### D-094, Le bouton « nouveau sujet » du forum ne peut pas fonctionner

`paddock-modules.js` cherche `new-thread-modal`, absent de `paddock.html`. Le bouton tombe dans la branche de repli et affiche « Connectez-vous pour poster un sujet », donc il **accuse le visiteur d'un défaut qui n'est pas le sien**. Un visiteur déjà connecté verra le même message.

Même famille que le filtre du dashboard et le formulaire de contact : du code qui parle à un élément absent de la page.

Non corrigé, faute de savoir si le forum compte à ce stade.

---

## 9 août 2026, karting et automobile

### D-090, Cinq événements placent une voiture sur une piste de karting

Correction de Yoan : « Fais attention de pas confondre circuit de karting (Brignoles) avec circuit de voiture, le Luc par exemple. Pas la même chose. »

Il a raison, et le défaut ne venait pas seulement de mon prototype.

**Dans la base** : cinq événements de la table `events` placent une Caterham ou une voiture personnelle au Circuit de Brignoles. Quatre « Caterham · Voiture perso » et un « Caterham · Fin de saison ». **Deux d'entre eux sont parmi les trois seules dates que le public voit aujourd'hui**, le 16 octobre et le 12 décembre.

**Dans les fichiers**, sept occurrences relevées par la nouvelle règle :

| Fichier | Ce qu'on y lit |
|---|---|
| `paddock.html`, 4 fois | « Roulage circuit · Caterham & voiture perso, Circuit de Brignoles » écrit en dur |
| `track.html`, 3 fois | Brignoles cité parmi les circuits automobiles dans les trois descriptions pour Google |

**Ce que le site dit par ailleurs** : Brignoles figure parmi les cinq partenaires karting sur `index.html`, `academie/karting-adulte.html`, `academie/karting-enfant.html` et `coaching.html`, aux côtés de Trets, Hyères, La Penne et Cuges.

**Ce que les sources techniques disent** : `site-data.js` et la table `circuits` déclarent toutes les deux `kart + auto` pour Brignoles. Elles sont d'accord entre elles et en désaccord avec Yoan.

**Rien n'est corrigé.** Je ne sais pas où ces cinq journées ont réellement lieu. Le Luc est l'exemple donné par Yoan, pas nécessairement la réponse. Une phrase de JB débloque les cinq lignes de base et les sept occurrences de fichier d'un coup.

### D-091, Le prototype de la page Événements est corrigé

Mes deux premières cartes décrivaient une voiture personnelle au Circuit de Brignoles. Remplacées par les deux seules dates dont l'accord entre le véhicule et la piste ne fait aucun doute : le 15 novembre au Grand Sambuc avec la 206, et le 29 août à Lédenon en box partagé.

Une troisième carte, en pointillés, dit pourquoi les dates de Brignoles ne sont pas montrées. **Montrer le trou plutôt que le combler avec une supposition.**

### D-092, Une règle d'audit, resserrée après un premier essai raté

`outil-dev/audit/regles/circuits.js`.

**Premier essai** : tout mot de voiture près d'une piste de karting, et l'inverse. Vingt-cinq fautes, presque toutes fausses. Une page qui présente l'offre entière cite forcément les deux mondes : l'accueil nomme le Grand Sambuc à trois lignes du mot karting sans rien confondre.

**Ce qui a été compris** : le défaut n'est pas que les deux mots se croisent, il est qu'un **véhicule nommé** soit attaché à une piste de karting. C'est le seul cas qui envoie quelqu'un au mauvais endroit avec sa voiture.

La règle ne cherche donc plus que ça, dans une fenêtre de soixante-dix caractères. Le sens inverse est abandonné : une piste automobile citée sur une page de karting est presque toujours le palmarès ou le chemin vers la compétition.

Sept fautes, toutes vraies. **Contrôle négatif** : une confusion introduite volontairement sur `academie.html` fait monter le compte à huit, et le retrait la fait redescendre à sept.

---

## 9 août 2026, la page Événements repart de zéro

### D-086, Feuille blanche plutôt que correction

Décision de Yoan : « plutôt que de corriger la page c'est peut-être mieux de repartir d'une feuille blanche ».

La page actuelle promet encore un parc de voitures, la location de trois véhicules, Spa et Barcelone dans sa description pour Google, et « votre voiture ou celle de l'école ». Corriger ces phrases une par une reviendrait à repeindre une façade sur une maison dont on vient de changer le plan.

Proposition dessinée dans `outil-dev/prototype/evenements-page.html`, hors du site, non branchée sur la base. Six choix y sont signalés en jaune pour que Yoan puisse les défaire un par un.

### D-087, Ce que la nouvelle page raconte

**Le titre devient « Où sera JB ».** La page arrête de vendre un catalogue de journées et dit où trouver l'homme. C'est la phrase de `docs/00-vision.md`, appliquée.

**Chaque date porte son adresse**, `#date-16-octobre`. Partageable, et transformable en vraie page plus tard si le référencement le justifie. La contrainte de la fiche section 4.1 est donc respectée sans trancher entre onglets et pages filles.

**Le bouton change selon qui vend.** Sur une journée organisée par un tiers il y en a deux, parce que le pilote doit s'inscrire chez l'organisateur **et** réserver JB. C'est ce que la vision appelait la difficulté de la marge, et qui est en réalité une question de qui vend. La page l'explique au lieu de la cacher.

**Trois situations côté client**, et non cinq modes côté JB. Le pilote se moque de savoir qui loue la piste : il veut savoir dans quelle voiture il roule et qui il paie.

**Un bloc pour joindre JB dans la page.** Aucune page de l'Académie n'en a un aujourd'hui, D-083.

### D-088, La page ne promet aucun véhicule

Yoan, 9 août : « On a encore quelques voitures. De sûr et certain la 206. Mais parfois il fait des partenariats avec des gens et loue la voiture. »

La page nomme donc la 206 S16, seul véhicule certain, et dit que le reste dépend de la date. Elle ne promet ni parc, ni catalogue de location.

**Les voitures sont un sujet séparé**, mot de Yoan. Ses idées sont rangées dans `docs/99-matiere-brute.md` : louer aux équipes qui en possèdent, s'appuyer sur les clients qui en ont une au garage, reconstruire un parc avec des investisseurs rémunérés. Aucune n'est engagée, aucune ne se code. Une page « nos voitures » viendra plus tard.

### D-089, Deux endroits où j'ai refusé d'inventer

**La politique en cas de pluie.** La FAQ pose la question et répond qu'elle est à écrire avec JB. Inventer une règle d'annulation sur un site qui prend de l'argent serait la pire chose à faire.

**La limite de dix pilotes par journée.** Elle vient de la colonne `nb_places` de la base, pas de la bouche de JB. Signalée comme à confirmer.

---

## 8 août 2026, les chemins de conversion

### D-082, Le formulaire de contact perdait tous les messages

Il n'avait ni `action`, ni gestionnaire, ni le moindre script pour l'écouter. Un `<form>` sans `action` se renvoie sur sa propre URL en GET. Vérifié dans un navigateur :

```
contact.html?prenom=Jean&nom=Dupont&email=jean%40exemple.fr&message=Bonjour%2C+je...
```

La page se rechargeait, le formulaire revenait vide, **aucune requête ne partait nulle part**, et rien n'indiquait au visiteur que son message venait de disparaître. Au passage, le message finissait dans l'historique du navigateur et dans les journaux du serveur.

Un `<div id="contact-alert">` attendait déjà dans le balisage : quelqu'un avait prévu un gestionnaire qui n'a jamais été écrit.

**Pourquoi c'est traité alors que la page est hors périmètre.** C'est le seul moyen de contact proposé par le pied de page des neuf pages qui comptent, et le seul que possèdent les pages de l'Académie. Il casse donc le périmètre, cas prévu par la règle 7 de `CLAUDE.md`.

Corrigé par `assets/js/contact-form.js`, qui se branche sur tout formulaire portant `data-contact`. Le message reste à l'écran, un bouton ouvre la messagerie du visiteur avec le texte déjà écrit, et le téléphone de JB sert de repli. **Aucune infrastructure nouvelle**, parce que ce choix revient à Yoan.

**Contrôle négatif** : en retirant l'attribut `data-contact`, le parcours retrouve l'ancien comportement et échoue en le nommant.

### D-083, Les pages de l'Académie n'offrent aucun moyen de joindre JB

Relevé, non corrigé, parce que c'est une décision éditoriale.

| Page | Téléphone | Courriel | Formulaire |
|---|---|---|---|
| `index.html` | aucun | aucun | aucun |
| `academie.html` | aucun | aucun | aucun |
| `academie/karting-adulte.html` | aucun | aucun | aucun |
| `academie/competition.html` | aucun | aucun | aucun |
| `academie/karting-enfant.html` | 1 | aucun | aucun |
| `coaching.html` | aucun | 5 | aucun |
| `track.html` | aucun | 3 | l'inscription |

Un visiteur qui lit la page Compétition et veut appeler doit descendre jusqu'au pied de page. Le seul appel à l'action visible en haut de toutes les pages est le bouton or du menu, qui mène à la **création d'un compte**, pas à une prise de contact.

**À trancher par Yoan** : le bouton or du menu reste-t-il sur la création de compte, ou devient-il un appel à joindre JB ?

### D-084, Une table pour les messages, écrite et non appliquée

Le repli par messagerie ne marche pas pour qui lit son courrier dans un navigateur sans logiciel configuré. `outil-dev/migrations/2026-08-08-table-messages.sql` ferme ce trou.

**Elle n'est pas appliquée**, et pas seulement par prudence : appliquée seule, elle ferait arriver les messages dans une table que personne ne regarde. Il faut d'abord une section Messages dans le dashboard, qui est un chantier.

### D-085, Un banc d'essai qui gardait son profil m'a fait croire que la correction ne marchait pas

Trois essais de suite ont montré l'ancien comportement après la correction. Le script se chargeait pourtant, le formulaire était trouvé. C'était le profil Chromium réutilisé d'un essai à l'autre, qui servait la page d'avant.

Les outils de `outil-dev/` n'avaient pas ce défaut, ils créent un profil neuf à chaque exécution. `parcours.js` coupe désormais le cache en plus, parce qu'un parcours qui recharge la page en cours de route pourrait relire un fichier d'avant la correction qu'il teste.

---

## 8 août 2026, la chaîne d'inscription entière

### D-078, La clé étrangère est corrigée, le site peut enfin prendre une inscription

Yoan a répondu « continue » après avoir lu D-075. Migration appliquée.

Vérifié après coup, rôle `anon`, transaction annulée :

| Essai | Résultat |
|---|---|
| la contrainte vise | `events` |
| le corps exact que le site envoie | **accepté** |
| un identifiant qui n'existe nulle part | refusé, la contrainte protège toujours |
| relecture par un anonyme | 0 ligne |
| relecture par JB | 1 ligne |

Le troisième essai est le contrôle qui compte : repointer la contrainte ne l'a pas désarmée.

`track_days` n'est pas supprimée.

### D-079, Le formulaire vérifié de bout en bout, dans le navigateur

Rempli et envoyé pour de vrai depuis Chromium. Le corps construit par la page :

```
{"user_name":"Jean Dupont","prenom":"Jean","nom":"Dupont",
 "email":"jean.dupont@exemple.fr","telephone":"0612345678",
 "coaching_requested":false,"avec_vehicule":false,"avec_coaching":false,
 "event_id":"4f6bdf5a-...","statut":"en_attente"}
```

C'est exactement le corps que la base accepte. Les deux moitiés de la chaîne sont vérifiées séparément et se rejoignent au caractère près. Ce qui reste non vérifié est les deux moitiés tournant ensemble sur le réseau, faute d'accès depuis ce poste.

Le chemin d'échec a été éprouvé au passage, Supabase étant injoignable ici : le formulaire reste à l'écran avec ses valeurs, aucune confirmation n'apparaît, et le message donne le 06 60 18 87 87.

### D-080, Deux parcours d'inscription qui n'écrivent jamais en base

`fetch` est remplacé le temps du clic. La requête est capturée au lieu de partir, la réponse est simulée. Les deux parcours sont donc jouables partout, y compris chez Yoan, sans semer une ligne de test dans la base de JB.

Le premier fige le contrat entre ce que la page envoie et ce que la base attend, c'est-à-dire exactement ce qui a manqué pendant des mois. Le second interdit qu'un échec se déguise en confirmation.

**Contrôles négatifs** : en supprimant l'email du corps, le premier échoue en le nommant. En rebranchant la confirmation sur le `catch`, le second échoue en le disant. Les deux savent donc dire non.

### D-081, Deux identifiants manquants dans track.html

`confirm-email` et `sessions-count` étaient écrits par le script et absents de la page. Aucun ne plantait, tous deux étaient protégés par un `if`, et rien ne s'affichait.

`confirm-email` est ajouté dans l'écran de confirmation. Il rappelle l'adresse saisie, pour qu'une faute de frappe se voie : sans cela JB ne peut jamais joindre le pilote, et le pilote croit sa place réservée.

`sessions-count` devait afficher « X dates, Y inscriptions ouvertes ». Le code est retiré plutôt que de lui inventer une place dans la page. **Où le mettre est une décision de Yoan.**

---

## 8 août 2026, la racine, suite

### D-075, Le formulaire d'inscription n'a jamais pu écrire une seule ligne

**La clé étrangère `inscriptions.event_id` pointe vers `track_days`, pas vers `events`.** Le site envoie l'identifiant tel qu'il vient de `events`. La base refuse donc chaque inscription.

Vérifié en base, rôle `anon`, dans une transaction annulée :

| Essai | Résultat |
|---|---|
| identifiant venu de `events`, ce que le site envoie | **refusé** |
| sans identifiant du tout | accepté |
| identifiant venu de `track_days` | accepté |

Les deux derniers sont les contrôles : ils montrent que l'insertion fonctionne et que seule la cible de la contrainte fait échouer le premier.

**C'est la vraie raison des zéro inscriptions**, et non les droits ni le formulaire. Le mensonge de la confirmation, corrigé le 7 août par D-052, affichait donc « inscription enregistrée » sur un refus de la base.

`track_days` est morte : une ligne créée le 24 mars 2026, pour une date du 15 juin déjà passée, avec une colonne `votes_count` héritée du vote retiré. **Aucun fichier du dépôt ne la nomme.**

Migration écrite dans `outil-dev/migrations/2026-08-08-inscriptions-vers-events.sql`, avec un garde-fou qui interrompt si des inscriptions orphelines existaient, et son retour arrière. **Non appliquée**, en attente de Yoan. `track_days` n'est pas supprimée : supprimer une table est irréversible.

### D-076, La migration des droits est appliquée

Yoan a répondu « applique la migration » le 8 août. Faite.

Vérifié après coup, en transaction annulée, sur une écriture réelle dans `events` :

| Qui | Lignes modifiables |
|---|---|
| admin connecté | 1 |
| client connecté | 0 |
| visiteur anonyme | 0 |

Et sur `inscriptions` : un anonyme peut écrire, ne peut rien relire, JB relit tout. Le formulaire public n'a rien perdu.

Plus aucune policy n'interroge le claim de haut niveau.

### D-077, Le prototype gagne les cinq modes et le seuil de rentabilité

Choix de Yoan face à trois propositions. `outil-dev/prototype/evenements.html` permet désormais de choisir un mode et de voir ce qu'il change : ce que JB engage, le risque, qui vend, et surtout **ce que le site peut faire**. Sur un événement organisé par un tiers, le bouton devient « voir chez l'organisateur » au lieu de « s'inscrire ».

Une simulation compare les cinq modes à coût égal. Aucun chiffre n'est inventé : le coût part de zéro et attend d'être saisi, le prix vient de ce que la base facture.

**La ligne qui compte est le seuil**, le nombre de pilotes nécessaire pour couvrir les frais avancés. Dans les modes sans frais avancés il vaut un, ce qui donne raison à la phrase de Yoan : « même un seul client génère des bénéfices ». Avec un circuit loué en entier à 1 800 € et 195 € par pilote, il en faut dix.

**Réserve honnête** : un box et un circuit entier ne coûtent pas la même chose. Les cinq colonnes se lisent à coût égal, pour voir la mécanique de chaque mode, pas pour les départager. C'est écrit sur la page.

---

## 8 août 2026, la racine

### D-073, Le rôle admin n'est pas là où les policies le cherchent

**C'est la cause première de « rien ne fonctionne dans le dashboard ».**

Sept policies sur huit cherchent le rôle applicatif dans `auth.jwt() ->> 'role'`. Supabase met toujours `authenticated` dans ce claim pour un utilisateur connecté, jamais `admin`. Le rôle vit dans `user_metadata`, et c'est bien là que `admin.js` va le chercher.

Vérifié en base avec un jeton d'admin simulé :

| | valeur |
|---|---|
| `auth.jwt() ->> 'role'` | `authenticated` |
| `auth.jwt() -> 'user_metadata' ->> 'role'` | `admin` |
| policy actuelle | **false** |
| policy corrigée | true |

**Contrôle négatif** : avec `user_metadata.role = 'client'`, la policy corrigée rend `false`. Elle sait dire non, elle n'ouvre pas à tout le monde.

Une seule policy emploie le bon chemin, `content_admin_write` sur `site_content`. C'est exactement pourquoi le live-editor est la seule fonction d'administration qui ait jamais marché.

**Ce que ça empêche** : JB ne peut ni ouvrir une date, ni la masquer, ni la supprimer, ni en créer une. Il ne peut pas lire les inscriptions, donc si un client s'inscrivait demain il ne le verrait jamais. Ni ajouter un circuit, ni publier un document, ni voir la liste des utilisateurs, ni modérer un fil dont il n'est pas l'auteur.

**Conséquence sur les corrections du 8 août** : les boutons du dashboard réparés dans D-061 et D-062 enverront désormais une requête correcte, que la base refusera. Le code était faux et les droits aussi. Corriger l'un sans l'autre ne donne rien de visible.

La migration est écrite dans `outil-dev/migrations/2026-08-08-role-admin-dans-les-policies.sql`, avec sa vérification et son retour arrière. **Elle n'est pas appliquée.** Changer le contrôle d'accès d'une base de production est une décision de Yoan, d'autant qu'il a dit ne pas avoir besoin d'un dashboard fonctionnel à ce stade.

**Ce que la migration n'ouvre pas** : rien de public ne change. Les lectures publiques et l'insertion publique dans `inscriptions` ne sont pas touchées. Un visiteur anonyme n'a pas de `user_metadata.role`, donc aucune policy corrigée ne lui répond oui.

### D-074, Zéro inscription depuis toujours, et l'explication

La table `inscriptions` compte zéro ligne. La policy d'insertion publique est pourtant correcte, `with check (true)` : le formulaire du site **peut** écrire.

Deux raisons possibles subsistent, et elles ne s'excluent pas. Personne ne s'est jamais inscrit. Ou quelqu'un l'a fait et JB ne l'a jamais su, faute de pouvoir lire la table, D-073. Le formulaire mentait par ailleurs sur sa confirmation jusqu'au 7 août, D-052.

La table `users` publique est vide elle aussi, alors qu'un compte existe dans `auth.users`. Relevé, non traité.

---

## 8 août 2026, les événements réels

### D-067, La page Événements proposait six dates déjà passées

La requête de `track-render.js` n'avait aucun filtre de date. Le 8 août, la page affichait neuf dates dont six révolues, du 3 avril au 5 juillet, toutes avec le badge « Inscriptions ouvertes » et un bouton « S'inscrire ».

Filtre `date_event=gte.aujourd'hui` ajouté. Le calcul se fait côté navigateur pour que le jour même d'un événement reste affiché jusqu'à son terme.

**Ce que ça change à l'écran** : la page passe de neuf cartes à trois.

### D-068, Deux blocs de `track-render.js` auraient ouvert la mauvaise date

Le fichier rechargeait les mêmes événements dans deux blocs supplémentaires et rattachait les boutons d'inscription **par position** : le premier bouton recevait le premier événement de leur requête.

Les listes n'ont jamais eu la même définition, l'une filtrant sur `status=eq.Open` et l'autre non. Avec le filtre de date de D-067 elles n'ont même plus la même longueur. Vérifié sur les données réelles : les trois boutons affichés auraient ouvert la fiche d'une journée du 3 avril, du 17 avril et du 9 mai. Un visiteur se serait inscrit à une date révolue en croyant réserver celle qu'il venait de lire.

Les deux blocs sont supprimés. La grille porte déjà l'identifiant de chaque événement dans un attribut `data-` et le lit au clic.

**Retiré au passage** : trois appels à `renderDots` avec des chiffres inventés, « Brignoles 8/12 », « Cuges 4/10 », « Ricard complet », qui visaient des identifiants absents de `track.html` et ne faisaient rien.

### D-069, Un prototype de suivi plutôt qu'un dashboard fonctionnel

Demande de Yoan : « j'ai pas besoin que le dashboard soit fonctionnel à ce stade, tu pourrais faire juste des prototypes en attendant, tu traques les 5 prochains événements et tu les mets, qu'on ait du concret ».

`outil-dev/prototype/evenements.html` s'ouvre dans un navigateur, hors du site, et n'écrit rien. Il montre les dates réelles de la base et affiche en rouge les quatre informations que la table ne sait pas stocker.

**Ce qu'il rend visible** : il reste quatre dates sur l'année 2026, dont une qui n'est pas publique. C'est le chiffre qui compte.

### D-070, Aucune date extérieure n'a été saisie, faute de source vérifiable

La recherche a nommé sept sources de veille : `trackdays.fr`, `calendrier-piste.fr`, `europatrackdays.com`, `circuitduvar.com`, `sambucdrivingacademy.fr`, `circuitpaulricard.com` et l'ancien site `jbemeric.com/calendrier`.

**Aucune n'a pu être ouverte.** Le poste de travail bloque tout accès à ces domaines. La recherche rend un résumé qu'il est impossible de confronter à la source.

Rien n'a donc été écrit dans `events`. Recopier des dates non vérifiées serait la faute de D-065 en plus grave : un client se déplacerait.

### D-071, `robots.txt` écarte l'atelier, la documentation et les archives

`netlify.toml` publie la racine entière. `outil-dev/`, `docs/` et `old/` partent en ligne avec le site depuis toujours. Rien n'y renvoie, mais autant le dire aux robots.

### D-072, Les pages HTML de l'atelier ne sont pas auditées comme des pages du site

Le prototype ajoutait trois relevés hors périmètre, sur l'absence de canonique et de description. Un prototype ouvert en local n'a pas à en avoir. `outil-dev/` est écarté de la liste des pages dans `contexte.js`, ses scripts restant dans le contexte pour que la règle de syntaxe continue de les lire.

---

## 8 août 2026, le dashboard des événements

### D-060, Le vote disparaît, du site et du dashboard

Décision de Yoan, mot pour mot : « y a plus besoin de vote car même un seul client génère des bénéfices ».

Retiré : l'onglet « Vote en cours » de la page Événements, la phrase d'accroche qui promettait l'ouverture à cinq pilotes, la question de FAQ qui décrivait le mécanisme, les deux fonctions `vote` de `track-render.js`, la section « Votes Potential » du dashboard, sa fonction `loadVotes`, son entrée de menu, son indicateur, et le CSS devenu mort dans `admin.css` et `track.css`.

**Raison** : le seuil de cinq pilotes venait du modèle où JB louait la piste entière et devait la remplir pour ne pas perdre d'argent. Il loue désormais un box, ou se greffe sur l'événement d'un autre. Il sort gagnant dès le premier inscrit. Le vote ne protégeait plus rien.

**Ce que le vote faisait vraiment** : rien. Le compteur vivait dans une variable du navigateur et disparaissait au rechargement. Le visiteur lisait « Votre vote est enregistré » alors qu'aucune requête ne partait. Retirer ce mécanisme supprime aussi ce mensonge.

**Conservé** : la colonne `nb_votes` et la table `votes` en base. Supprimer des colonnes est irréversible et demande la validation de Yoan. Le code n'écrit plus dedans.

**Le statut `Potential` survit au vote.** Il désigne maintenant une date que JB prépare et n'a pas encore ouverte. Il se gère dans la table Événements, avec les autres, par le bouton « → Open ». L'indicateur du dashboard s'appelle désormais « En préparation ».

### D-061, Une seule fonction `loadEvents`, et le filtre du dashboard remarche

`assets/js/admin.js` contenait **deux** fonctions `loadEvents` concurrentes. La déclaration lue au chargement rendait dans `#v-sessions table tbody`. L'affectation sur `window`, celle que le HTML appelle par `onchange="loadEvents()"`, écrivait dans `#events-tbody`, un identifiant **absent du HTML**.

**Ce que ça donnait chez JB** : la liste s'affichait au chargement, puis le filtre Statut et la case Rechercher ne répondaient plus. Une exception partait dans la console, invisible.

Corrigé : le `tbody` porte l'identifiant `events-tbody`, la version morte est supprimée, il reste une seule fonction.

**Défaut trouvé dans la version vivante au passage** : son bouton de publication passait `${!vis}` où `vis` contenait déjà du HTML. La négation d'une chaîne non vide vaut toujours faux, donc « Publier » envoyait `visible_site = false`. Le bouton ne publiait jamais rien.

### D-062, Aucun identifiant ne s'écrit plus dans un attribut `onclick`

Sept boutons du dashboard construisaient leur gestionnaire ainsi :

```
onclick="setStatus(53713c81-583c-43b6-a6c9-0b108ae18b48,'Open',this)"
```

Les clés de toutes les tables sauf `circuits` sont des UUID. Ce texte n'est pas du JavaScript : le navigateur lève une `SyntaxError` au moment du clic, sans rien afficher. Un banc d'essai monté pour l'occasion montre que l'ancienne écriture échoue sur un identifiant réel **et** exécute du code venu de la base si l'identifiant en contient.

Ces sept boutons dormaient dans la version morte de `loadEvents` et dans la table du forum. Ils auraient mordu le jour où quelqu'un aurait réparé l'identifiant du `tbody`, c'est-à-dire aujourd'hui.

Remplacé par une mécanique unique : l'action, la clé et l'argument passent par des attributs `data-`, relus par un seul écouteur posé sur le document. Plus aucune valeur venue de la base n'est interprétée comme du code, quel que soit le type de la clé.

**Universel au sens de `CLAUDE.md` section 5** : la correction ne vaut pas pour les événements, elle vaut pour tout tableau du dashboard, présent et futur.

### D-063, Tous les événements sur le dashboard, pas seulement les futurs

Le dashboard filtrait sur `date_event >= aujourd'hui`. Sept des onze dates de la table, d'avril à juillet 2026, étaient invisibles pour JB. Il ne pouvait ni consulter une session qu'il venait de faire tourner, ni corriger une erreur de saisie dessus.

Demande de Yoan : « tous les event doivent être sur le dashboard de mon père ».

Le filtre de date par défaut est retiré. Un sélecteur Période (Tous, À venir, Passés) reste offert : c'est un choix que JB fait, pas une amputation qu'il subit. L'encart « Prochaines dates » du tableau de bord continue de montrer les cinq prochaines, calculées et non découpées en tête de liste.

### D-064, La page Événements ne laisse plus personne devant « Chargement du calendrier… »

La grille des dates ne contient qu'un mot d'attente que `track-render.js` remplace. Son `catch` disait « garder le contenu statique si Supabase échoue », or il n'y a aucun contenu statique. Une panne de la base, un téléphone qui perd le réseau ou une simple lenteur laissaient le visiteur devant ce mot, indéfiniment, sans un numéro à appeler.

Deux messages de repli s'affichent désormais, avec le téléphone et le courriel de JB : un quand la base ne répond pas, un quand elle répond mais qu'aucune date n'est ouverte.

### D-065, Une règle d'audit sur les coordonnées de JB

En écrivant le message de repli ci-dessus, j'ai **inventé un numéro de téléphone**. Le 06 08 33 10 76 n'appartient à personne dans ce projet. Il a passé l'audit, la fumée et les parcours : c'est un lien `tel:` parfaitement valide vers un numéro parfaitement syntaxique. Seule une lecture manuelle l'a attrapé.

`outil-dev/audit/regles/contacts.js` déclare les coordonnées légitimes et refuse toute autre. Elle vérifie aussi que le texte affiché correspond au numéro composé, le piège classique du copier-coller.

**Raison** : sur un site dont le principal appel à l'action est « appelez JB », un numéro faux coûte un client par visiteur qui le compose. C'est le défaut le plus cher du site pour le moins de code.

Trois numéros cohabitent aujourd'hui, tous déclarés : le portable 06 60 18 87 87 (partout), le fixe 04 42 32 87 87 (mentions légales). **Un `06 00 00 00 00` traîne quelque part hors périmètre, laissé tel quel.**

### D-066, Les parcours distinguent une page cassée d'un réseau coupé

Deux parcours ajoutés sur la page Événements ont échoué en annonçant « aucune date affichée ». Le site n'y était pour rien : le poste ne joignait plus Supabase ni le CDN.

Un outil qui ne sait pas faire cette différence ment dans les deux sens, et c'est le sens favorable qu'on croit. Les parcours marqués `besoinBase` sont désormais déclarés non concluants quand la base est injoignable, au lieu d'être comptés en échec.

---

## 8 août 2026, l'archivage

### D-057, La page voitures part aux archives

**Demande de Yoan** : « Mets voiture dans archives. »

`paddock/nos-voitures.html` et `assets/css/nos-voitures.css` sont déplacés dans `old/pages-archivees/`. Déplacés, pas supprimés, comme les fichiers morts du 1er août.

**Elle était déjà morte.** Sa ligne 10 portait `<meta http-equiv="refresh" content="0;url=track.html#voitures">` : elle se sabordait au chargement et personne ne la voyait, ni visiteur, ni moteur de recherche. Rien ne la citait sauf `routes.js`.

Retirés avec elle : l'entrée `voitures` de `routes.js`, ses raccourcis dans `_redirects`, et l'entrée de menu « Votre voiture » qui pointait sur `track.html#voiture-perso`, ancre inexistante. Cela règle la faute laissée ouverte en D-056.

**Vérifié après coup** : zéro faute à l'audit, les dix-neuf pages se chargent sans erreur, les neuf parcours passent.

### D-058, Une seule page était réellement en chantier

**Demande de Yoan** : « fais de même avec les pages en chantier. »

Vérification faite avant d'archiver quoi que ce soit d'autre. Les seules candidates étaient `paddock/articles.html` et `paddock/article.html`, marquées en chantier dans le relevé parce que leur contenu est rendu en JavaScript.

**Elles portent du vrai contenu** : 51 documents, 29 sujets de forum et 25 réponses en base. Les archiver supprimerait de la matière. Elles restent.

Les pages `admin/` sont l'outil de travail de JB et les pages `legal/` sont obligatoires. Il ne restait donc que la page voitures.

### D-059, On ne parle plus des pages hors périmètre

Reproche de Yoan : « tu m'as gonflé à toujours me parler de pages qu'on a jamais travaillé, et ça me gonfle ».

Il a raison, et le défaut était dans mes réponses, pas dans l'outil : l'audit range déjà le hors périmètre à part et le masque par défaut. C'est moi qui les remontais quand même.

Nouvelle règle, `CLAUDE.md` section 4 point 8 : ne jamais mentionner une page hors périmètre à Yoan, ni pour signaler, ni pour proposer, ni en passant. Sauf si elle casse quelque chose du périmètre, et alors en disant en quoi.

---

## 8 août 2026, le hero qui débordait

### D-054, L'audit ne voyait pas les liens construits en JavaScript

La règle `liens` lisait `p.sansScripts`, c'est-à-dire le HTML **privé de ses balises script**. Une ancre écrite dans du code lui était donc invisible. Elle annonçait zéro ancre cassée alors qu'il y en avait cinq.

**Deux familles ajoutées.**

Les ancres construites en JavaScript, résolues via `routes.js` : `R.track + '#voiture-perso'` devient `/track.html#voiture-perso`, vérifiable.

Les ancres qui visent une autre page. `href="coaching.html#amateur"` était accepté sans jamais regarder si `coaching.html` porte cet identifiant.

**Précaution** : les identifiants fabriqués par un script comptent comme présents, `ctx.pages[].idsJs`. Sans ça, toute ancre vers `palmares.html`, rendue entièrement en JavaScript, passerait pour cassée.

### D-055, Deux ancres manquantes envoyaient les visiteurs de l'accueil au mauvais endroit

`sync-mirror.js` aspire les deux offres de `coaching.html` dans l'accueil et les lie à `coaching.html#amateur` et `#competition`. **Aucune des deux ancres n'existait.** Un visiteur qui cliquait sur « Coaching compétition » depuis l'accueil atterrissait en haut de la page de coaching, à lui de retrouver l'offre.

Corrigé en donnant leur identifiant aux deux cartes d'offre. Aucune section créée, aucun texte touché : les liens existaient déjà, il leur manquait leur cible.

**Sans risque pour le live-editor** : il ignore les éléments qui contiennent un lien ou un champ, et ces deux cartes en contiennent. Leur donner un `id` ne décale aucune clé.

Un parcours de `parcours.js` clique désormais cette carte depuis l'accueil et vérifie l'arrivée.

### D-056, Une entrée de menu mène nulle part, décision à Yoan

« Stages & Track-Days » puis « Votre voiture » pointe sur `track.html#voiture-perso`. Cette ancre n'existe pas et n'a jamais existé. Le sujet est traité dans la page, à l'intérieur de la section `#trackdays`, sans bloc propre.

**Non corrigé volontairement.** Les deux issues touchent le menu, et D-011 le réserve à Yoan. Soit l'entrée disparaît, soit elle pointe sur `#trackdays`, ce qui ferait deux entrées vers la même ancre. La page Événements étant destinée à être refondue, la question se reposera de toute façon.

Signalé dans `docs/05` depuis le 1er août, jamais tranché.

### D-052, La confirmation d'inscription ne ment plus

`track-render.js` envoyait l'inscription puis affichait l'écran de confirmation **sans attendre la réponse**, avec un `.catch(function(){})` vide qui avalait toute erreur. Un visiteur pouvait repartir persuadé d'avoir sa place alors que rien n'était enregistré. Invisible côté client, invisible côté JB.

Désormais la confirmation n'apparaît que si l'écriture a réussi. En cas d'échec, le formulaire reste à l'écran avec ses valeurs, et un message donne le téléphone et l'email de JB. Le message est créé en JavaScript plutôt qu'écrit dans `track.html` : aucun balisage à maintenir, et il survivra à la refonte de la page.

**Vérifié dans les deux sens**, en profitant de ce que le réseau de cette machine bloque Supabase. Ancienne version : confirmation affichée malgré l'échec. Version corrigée : confirmation absente, message présent.

**Retiré au passage** : `car_model: tel`, qui écrivait le numéro de téléphone dans la colonne du modèle de voiture. Il n'existe aucun champ voiture dans la page, c'était un copier-coller. La colonne `telephone` portait déjà la valeur.

### D-053, Un tiret cadratin vivait dans la table des événements

Cinq événements portaient « Caterham — Voiture perso » ou « Caterham — Fin de saison » dans leur colonne `type`, affichée sur les cartes de `track.html`. L'interdit numéro un, servi aux visiteurs.

Remplacé par le point médian, convention D-015 pour des libellés coordonnés de même rang.

**Ce que ça apprend.** `base.js`, écrit le matin même, ne regardait que `site_content`. Une table de données peut porter de la rédaction. Il lit maintenant aussi `events.type`, et un type d'événement y apparaît comme une ligne ordinaire sous une clé qui dit où le corriger.

C'est la troisième fois qu'un outil de vérification se révèle incomplet le jour de son écriture. Le contrôle négatif dit si un outil voit ce qu'il regarde, il ne dit pas s'il regarde au bon endroit.

### D-051, Deux feuilles oubliaient de soustraire la hauteur de la nav

`competition.css` et `karting.css` déclaraient `.hero { min-height: 100svh }`. La nav fait 56 pixels et occupe le flux au-dessus. Le hero commençait donc à 56 et s'étendait sur une hauteur d'écran entière, débordant de 56 pixels exactement, sur toute hauteur d'écran.

Onze autres déclarations du site écrivent `calc(100svh - 56px)`, dont `academie.css`, `coaching.css`, `index.css`, `track.css` et `snap.css`. Ces deux-là étaient les seules à l'oublier.

**Trois pages du périmètre concernées** : `academie/competition.html`, `academie/karting-adulte.html`, `academie/karting-enfant.html`.

**Mesuré, pas estimé.** Avant : la barre de statistiques finissait 56 pixels sous le bas de l'écran, en 800, 900 et 1000 pixels de haut. Après : zéro débordement en 900 et 1000. En 800 il reste 35 pixels, mais là le contenu ne tient réellement pas et `min-height` joue son rôle.

**Correction d'une affirmation fausse que j'avais faite le 7 août.** J'avais écrit en 6.14bis du relevé que les deux boutons d'entrée tombaient sous la ligne de flottaison, et j'avais attribué la cause au padding et à la taille du titre. La mesure dit l'inverse : les boutons étaient visibles, c'est la barre de statistiques qui débordait, et la cause n'a rien à voir avec la typographie. J'avais estimé au lieu de mesurer, et j'avais laissé le défaut en attente d'une décision de direction artistique qui n'avait pas lieu d'être. C'était un bug, pas un choix.

**Vérifié sans régression.** `karting.css` porte `overflow:hidden` sur son hero, donc réduire la hauteur pouvait couper du contenu. Contrôle fait : 4 pixels de dépassement, identiques avant et après la correction, donc un arrondi préexistant et sans rapport.

---

## 7 août 2026, l'écriture et la page JB

### D-046, L'antithèse est nommée, illustrée, et comptée

**Demande de Yoan** : « sur le site il y a plein de phrases du type "blablabla" pas un "blablabla", c'est typiquement le genre de phrase IA que je déteste et qu'un être humain détecte. »

L'interdit existait depuis le 1er août, en une ligne : « pas de ce n'est pas X, c'est Y ». Il n'a pas pris. Trois raisons, et la troisième est la plus gênante.

1. **Il était abstrait.** Aucun exemple, donc rien à reconnaître.
2. **Il ne nommait qu'une variante sur cinq.** La forme dominante sur le site est « affirmation, virgule, négation d'un contre-exemple », qui n'était pas décrite.
3. **Les fichiers de consignes employaient eux-mêmes la tournure en l'interdisant.** Six occurrences dans `docs/04-contenus-seo.md` et `.claude/agents/jbe-editorial.md`. La consigne enseignait par l'exemple le contraire de ce qu'elle demandait.

**Ce qui change.** `docs/04` section 1.1 décrit la forme, donne cinq exemples pris sur le site, explique pourquoi un humain la détecte, et donne la réparation. Le contre-exemple est toujours un homme de paille : personne n'a jamais prétendu que JB formait des promeneurs. La seconde moitié n'apporte rien, elle sert à faire sonner la première. La réparation tient en trois mots : dire et s'arrêter.

Les six occurrences dans les consignes sont corrigées.

### D-047, Une règle d'audit compte les tournures

`outil-dev/audit/regles/ton-ia.js`. Six tournures dans le périmètre au 7 août, sur l'accueil, l'Académie, le Coaching et la Compétition.

**Toujours un signal, jamais une faute.** Le français emploie « pas » à longueur de phrase pour de bonnes raisons. Seul un humain sait si le contre-exemple est un homme de paille ou une précision utile.

**Elle surveille aussi les consignes**, puisque c'est là que le défaut s'était installé. Avec une exception : un exemple cité entre guillemets pour montrer le défaut n'est pas le défaut, sinon la règle signale la documentation qui la décrit.

**Les textes du site ont été corrigés le lendemain**, sur autorisation de Yoan. Voir D-049.

### D-050, La base de données contredisait trois décisions, et l'audit ne le voyait pas

Demande de Yoan, 8 août : « il faut que tu mettes aussi à jour Supabase. »

Le live-editor sert la base avant le HTML. Corriger un fichier ne change donc rien pour un visiteur si un texte existe en base sous la même clé. Onze lignes ont été supprimées, toutes en violation d'une décision déjà prise.

**D-008, l'offre morte.** Cinq lignes vendaient encore le Challenge et sa dotation. La pire : « Le vainqueur du Challenge prend le volant d'une BMW 325i HTCC, voiture, mécanique, licence FFSA, inscriptions. Zéro frais. » Une autre promettait « pour les meilleurs une voiture de course à la clé », retirée du HTML le 6 août et toujours servie depuis la base.

**D-007, l'interdit absolu.** `karting__jbe-u-23` contenait un tiret cadratin, « pièges — avant que vous ne démarriez ». L'audit annonçait zéro tiret sur tout le site.

**D-015, l'antithèse.** Cinq lignes, dont « L'Académie n'est pas une journée isolée. C'est un chemin », « Un pilote ne s'invente pas. Il se construit », « Certaines écoles vendent un parcours type. Ici on part de votre situation », et « On ne vend pas une journée isolée, on construit votre progression ».

**Supprimées plutôt que réécrites.** Le HTML corrigé reprend la main, et il ne peut plus diverger d'une copie en base.

**Ce que ça dit de l'outillage, et c'est le point important.** L'audit lit les fichiers. Il ne voit pas la base. Pendant trois jours il a annoncé zéro tiret cadratin, zéro offre morte et zéro antithèse pendant que la base servait les trois aux visiteurs. Toutes les vérifications de cette période ont ce trou.

La clé publique Supabase est déjà dans le code du site, donc un outil peut lire la table sans secret et lui appliquer les mêmes règles. À construire, sur accord de Yoan.

**Non corrigé, signalé.** La table contient encore des fautes de frappe et des chiffres périmés issus des tests de Yoan : « tet la dernière », « 40 ANs d'experience », « Jb  emeric », un « Merci » resté en fin de phrase sur le coaching, « 39 ans de compétition. Une seul école » et « quatre façons de progresser » alors que le site en annonce trois. Ce sont ses données, pas des violations de décision.

### D-049, Les six tournures du périmètre sont réécrites, base de données comprise

Autorisation de Yoan, 7 août : modifier le texte de l'accueil, de l'Académie, du karting adulte et enfant, du Coaching et de la Compétition.

| Page | Avant | Après |
|---|---|---|
| `index.html` | JB EMERIC encadre, **pas des volontaires diplômés la veille** | C'est Jean-Baptiste Emeric qui encadre, du briefing au dernier tour |
| `academie.html` | **Pas de pilote automatique, pas de talent supposé** | Le chrono dit ce que vous savez faire aujourd'hui |
| `academie.html` | Je l'ai vécu en compétition. **Pas dans un manuel.** | Je l'ai vécu en compétition. Sur la piste, sous pression |
| `coaching.html` | Vous avez des chronos, **pas les résultats que vous méritez** | Vous tournez vite et vous finissez quand même derrière |
| `coaching.html` | Il sait ce qu'on ressent dedans, **pas juste ce qu'il faut faire** | Il sait ce qu'on ressent quand l'arrière décroche |
| `competition.html` | forme des pilotes qui courent en championnat, **pas des clients qui se promènent** | forme des pilotes qui prennent le départ en championnat |

`karting-enfant.html` et `karting-adulte.html` n'en portaient aucune.

**Le point qui aurait fait rater la correction.** Deux de ces textes existaient aussi dans Supabase, `academie__jb-quote-formateur` et `academie__txt-3`, saisis en avril. Le live-editor sert la base avant le HTML, donc corriger le fichier seul n'aurait rien changé pour un visiteur. Les deux lignes ont été mises à jour, et le cache local de la page synchronisé.

**Un piège de vérification à connaître.** Sur cette machine, `cdn.jsdelivr.net` est bloqué, donc `live-editor.js` ne se charge jamais et la page affiche toujours son HTML. Un rendu local ne prouve donc rien sur ce que voit un visiteur dès qu'un texte existe en base. Il faut interroger Supabase.

**Reste à trancher.** Ces deux lignes recopiées en base écraseront toute future modification du HTML sur ces deux éléments. Les supprimer rendrait la main au fichier, ce qui vaudrait mieux pendant une phase de restructuration. Décision de Yoan.

### D-048, JB aura sa page, et le palmarès ira dedans

**Décision de Yoan** : « on peut faire une page JB et on pourrait y mettre le palmarès dedans ».

**Ce qui l'a motivée.** Son histoire est aujourd'hui racontée six fois : trente-huit mentions de 1988, du titre de Champion de France ou des quarante ans, réparties sur l'accueil, l'Académie, le Coaching, le karting adulte, Paddock et le palmarès. C'est le principe scalable violé sur le contenu.

**Reste ouvert** : est-ce que cette page occupe une entrée de menu, ou est-elle seulement atteignable depuis l'accueil, le pied de page et les endroits où la crédibilité de JB est l'argument ? Le menu dit ce qu'on vend, et lui n'est pas un produit, il est la raison d'acheter.

---

## 7 août 2026, est-ce que le site fonctionne

### D-044, Un outil dit si les pages tournent, pas seulement si elles sont bien écrites

`outil-dev/fumee.js`. Il ouvre chaque page dans un vrai navigateur et rapporte les exceptions JavaScript, les messages d'erreur de la console et les requêtes en échec. Sans dépendance : Chromium est déjà là, et Node 22 fournit un client WebSocket, donc le protocole DevTools suffit.

```
node outil-dev/fumee.js            les 9 pages du périmètre
node outil-dev/fumee.js --tout     tout le site
```

**Pourquoi il fallait ça.** L'audit lit des fichiers. Il ne saura jamais dire qu'une page plante. Personne n'avait jamais vérifié que les pages se chargent sans erreur, et la première exécution en a trouvé une vraie.

**Deux précautions apprises en le construisant.** Les hôtes extérieurs, Google Fonts, jsDelivr, Supabase, YouTube, sont comptés à part : leur échec depuis un bac à sable ne dit rien sur le site, et les mélanger rend le rapport illisible. Et chaque page s'ouvre dans un **onglet neuf** : réutiliser le même onglet paraissait économique et accusait la mauvaise page, un script lent se déclenchant après la navigation suivante. Deux pages ont ainsi été accusées d'une erreur qui ne se reproduisait pas seule.

### D-045, Un script chargé en module se vérifie en tant que module

`assets/js/admin.js` portait **sept chaînes cassées** : `font-family:'DM Mono'` à l'intérieur de chaînes à guillemets simples, des apostrophes françaises non échappées, un en-tête CSV et un `join` coupés par un vrai retour à la ligne. Le fichier étant chargé en `type="module"`, le module entier était rejeté : le tableau de bord admin ne fonctionnait pas du tout.

**Le plus gênant est que la règle d'audit lançait déjà `node --check` dessus, et qu'il répondait « valide ».** Les mêmes octets, copiés dans un fichier `.mjs`, échouent immédiatement. Vérifié et reproduit à partir de la version en dépôt.

La règle détermine désormais le mode de chargement en lisant les pages, et vérifie en tant que module tout script chargé ainsi. Un script classique reste vérifié en script, sinon le mode strict des modules produirait de fausses alertes. Contrôlée sur témoin : la version cassée est signalée avec sa ligne, la version corrigée passe.

**C'est le deuxième défaut de ce type.** Le 4 août, `track-render.js` ne s'évaluait pas non plus, pour la même raison, et le calendrier de `track.html` n'existait tout simplement pas. La leçon n'avait été qu'à moitié tirée.

---

## 7 août 2026, les images

### D-038, Une règle compare les empreintes des images, pas leurs noms

`outil-dev/audit/regles/images.js`. Elle trouve cinq paires de fichiers identiques au bit près sous des noms différents, dont trois qui se contredisent franchement. Détail et gravité en 6.14ter du relevé.

**Toujours un signal, jamais une faute.** L'audit ne sait pas ce qu'il y a sur une photo : deux noms peuvent décrire le même podium sans que personne ne mente, et c'est le cas de `1994-podium-ricard.jpg`. Crier à la faute sur les cas légitimes ferait ignorer les autres.

**Le champ « où » désigne une page, pas le fichier image.** C'est lui qui range l'anomalie dans le périmètre ou dehors. Pointer l'image classait le défaut hors périmètre, donc masqué par défaut, alors qu'il touche l'accueil et l'Académie. C'est la deuxième fois que ce piège se referme, après `renommages`.

### D-043, Un emplacement que JB doit remplir garde sa balise `<img>`

`live-editor.js` repère les médias par `document.querySelectorAll('img, video')`. Il ne voit que ce qui existe déjà. Retirer une balise `<img>`, même vide de contenu utile, retire donc à JB la possibilité d'y mettre une photo lui-même.

**Rappel de Yoan, 7 août** : « beaucoup de trucs doivent être repris par mon père, il doit faire un travail de recherche sur son disque dur pour trouver les bonnes photos, c'est d'ailleurs pour ça qu'on avait codé une fonction pour qu'il puisse le changer de lui-même. »

Conséquence pratique : quand une photo manque, on laisse la balise avec une image d'attente, pas un cadre vide. L'image d'attente est un SVG en `data:`, donc sans fichier à gérer et sans risque de 404.

**Corollaire pour le travail éditorial** : ne pas s'acharner sur le choix des images. C'est JB qui les fournira.

### D-040, Les droits des photos sont acquis, le sujet est clos

Décision de Yoan, 7 août : « On la garde, JB a les droits. » La photo de la 206 au Paul Ricard reste en place malgré son filigrane. Consigné pour qu'aucune session ne rouvre la question.

### D-041, Un nom de fichier image dit ce que l'image montre

Demande de Yoan le 7 août, « renommer selon le contenu réel ». Les trois noms qui mentaient ne sont plus employés : `lotus-circuit-du-luc.jpg`, `porsche-gt3-circuit-albi.jpg` et `jb-emeric-pilote.jpg` sont remplacés partout par le nom qui décrit la photo. Les fichiers restent sur le disque, orphelins, en attente d'une validation de suppression.

**Conséquence assumée** : deux cartes de `paddock/nos-voitures.html` n'ont plus de photo, la Lotus Elise Cup S et la Porsche 911 GT3 RS. Il n'existe aucune photo de ces voitures, seulement des fichiers qui portaient leur nom. Un cadre vide vaut mieux qu'une voiture qui n'est pas celle annoncée.

### D-042, Un script ne cite que des images qui existent

`track-render.js` réclamait trois fichiers absents, dont **l'image de repli**, celle que renvoie tout type d'événement non reconnu. Toute date de track-day sortant des mots-clés prévus affichait donc une image cassée. Invisible en naviguant : il faut une date du bon type, et les dates viennent de Supabase.

La branche Caterham pointait en plus sur le fichier « Lotus » qui est une Peugeot, soit trois voitures différentes pour une seule image. Les branches Caterham et Porsche sont retirées faute de photo, elles tombent dans le repli.

**La règle `images` vérifie désormais** que tout chemin `assets/images/...` cité dans du JavaScript existe. La règle `liens` ne regardait que le HTML.

### D-039, Le nombre de circuits partenaires est 5, y compris sur l'accueil

Le hero de `index.html` annonçait « 15 circuits partenaires », contredit dix lignes plus bas par sa propre barre de statistiques, « 5 circuits partenaires, Brignoles, Trets, Hyères, La Penne, Cuges », et par toutes les autres pages du site. Corrigé à 5.

---

## 7 août 2026, le CSS mort

### D-035, 856 lignes de CSS mort retirées, et l'outil qui l'a fait

Sept feuilles allégées : `palmares.css` de 53 à 40 Ko, `index.css` de 43 à 28, `paddock.css` de 46 à 24, `coaching.css` de 29 à 20, plus `academie.css`, `karting.css`, `nav.css` et les onze media queries vides.

**L'outil est versionné**, `outil-dev/nettoyer-css.js`. Sans `--ecrire` il ne touche à rien.

**Ce qu'il refuse de faire, volontairement.** Il ne retire qu'une règle de premier niveau dont **tous** les sélecteurs sont morts. Jamais une règle mixte, jamais quoi que ce soit dans un `@media`. Le but est une transformation dont l'innocuité se démontre, pas un nettoyage maximal. Ce qui survit à cette prudence, une cinquantaine de sélecteurs, reste signalé par l'audit et se traitera à la main.

### D-036, Le critère « ce sélecteur est-il vivant » n'est écrit qu'une fois

`outil-dev/audit/vocabulaire.js`. La règle d'audit et l'outil de nettoyage s'en servent tous les deux.

**Raison, et elle n'est pas théorique.** J'avais d'abord écrit le critère deux fois. Deux copies finissent par diverger, et le jour où elles divergent, l'outil supprime ce que la règle croit vivant. Le projet connaît déjà cette panne exacte : c'est pour ça que la règle `renommages` existe, elle vérifie que deux tables d'alias restent identiques.

### D-037, Une page rendue en JavaScript ne se vérifie pas au pixel

`palmares.html` a donné **trois empreintes différentes en trois exécutions sans aucune modification**. Toute comparaison d'images y est sans valeur.

La preuve utilisée à la place est déterministe : chercher chaque classe des règles retirées dans le HTML de la page et dans tous les scripts qu'elle charge. Zéro occurrence sur 51 classes, donc aucun élément ne peut les porter, donc la suppression ne peut rien changer.

**Un piège dans ma propre vérification, à retenir.** Ma première extraction des scripts s'écrivait `src="([^"?]+)"`, pour couper le `?v=21`. Couper la query dans la classe de caractères fait rater la balise entière : `palmares.js` et cinq autres fichiers n'étaient pas lus, et la vérification a répondu « aucune classe présente » sans avoir ouvert le fichier qui les contient toutes. La query se coupe **après** la capture. Corrigé aussi dans l'audit, où le même motif dormait.

---

## 7 août 2026, nettoyage et instruments

### D-033, Le bloc Challenge de `competition.css` est supprimé

52 lignes, 14 noms de classe, tous préfixés `chall-` ou nommés `.challenge`. Le Challenge JB EMERIC est mort depuis avril, D-008, et sa section HTML avait déjà disparu de la page. Le style, lui, était resté.

**La preuve, et pourquoi elle n'est pas au pixel.** `competition.css` n'est chargée que par `academie/competition.html`. Les quatorze classes ont été cherchées dans tout le HTML et tout le JavaScript vivants du site : zéro occurrence. Aucun élément ne peut porter ces classes, donc la suppression ne peut rien changer. C'est déterministe, contrairement à une comparaison d'images.

La capture en haut de page, identique en 1300, 900 et 420 pixels, ne sert que de confirmation.

### D-034, Trois façons dont une capture d'écran ment

Consigné en 6bis de `docs/03-technique.md`, après trois faux résultats d'affilée le même jour.

1. Sans `--no-proxy-server`, `localhost` part dans le proxy sortant et la page revient d'un cache.
2. À `--window-size=1300,7000`, le PNG est identique quoi qu'on change dans le CSS, y compris un `outline` magenta de six pixels.
3. Une URL avec ancre n'est pas reproductible : trois exécutions sans modification, trois empreintes différentes.

**La règle qui en sort** : avant de conclure « identique », introduire une différence visible volontaire et vérifier que l'empreinte change. Une comparaison qui ne sait pas voir une différence dira toujours « identique ». C'est la troisième fois qu'un instrument fabriqué sur le moment se révèle faux avant le site.

---

## 7 août 2026, la page où tout converge

### D-032, Le hero de la Compétition montre une machine qui existe

`academie/competition.html` s'ouvrait sur `bmw-325i-htcc.jpg`. Deux défauts cumulés : c'est la voiture que D-008 déclare morte, et le fichier ne fait que 769 pixels de large, étiré sur toute la largeur d'un hero. D'où l'image sombre et floue.

Remplacée par `peugeot-206-s16-ricard.jpg`, 2560 pixels, machine réellement proposée par la page, et déjà l'image de la porte « Vers la Compétition » du hub : le visiteur retrouve à l'arrivée ce sur quoi il a cliqué.

**Deux comptes faux corrigés au passage.** Le hero annonçait « Deux machines » et la barre de statistiques « 2 · Machines de formation », alors que la page en nomme trois : kart 125cc à boîte, 206 S16, Formule Renault. Le hero dit maintenant « Deux voies », ce qui correspond à ses deux boutons et à ses deux offres, et le compte des machines passe à trois.

---

## 7 août 2026, les vidéos et les offres mortes

### D-029, Les vidéos YouTube sont tirées au sort dans une liste

Huit intégrations YouTube étaient écrites en dur dans `academie.html`. Elles vivent maintenant dans `site-data.js`, et `assets/js/videos.js` en tire quatre au hasard à chaque chargement.

**Pourquoi le tirage.** Demande de Yoan : « d'abord on fait la structure du site et on affiche des vidéos YouTube aléatoires ». Les vidéos sont provisoires, elles seront refaites par des spécialistes du montage. Figer huit choix dans une page n'avait pas de sens.

**Rien sur téléphone.** Même règle et même seuil que `hero-video.js`, 700 pixels : huit intégrations, c'est huit connexions à un tiers pour un décor. Le script ne construit rien en dessous, donc aucune requête n'est émise, et `academie.css` masque la section pour qu'on ne voie pas un cadre vide sous son titre. Les deux sont nécessaires : masquer sans s'abstenir de construire ferait quand même payer le téléchargement. Mesuré : zéro `iframe` à 390 pixels, quatre à 1300.

**Ce que ça coûte.** Le titre des vidéos sort du HTML livré, donc un moteur de recherche ne le lit plus. Assumé pour ce bloc et pour lui seul : un titre de vidéo YouTube ne porte aucun mot-clé qu'on cherche à défendre. La règle inverse vaut toujours pour la FAQ et les avis.

**Ajouter une vidéo est désormais une ligne** dans `site-data.js`. Un conteneur peut aussi filtrer par thème, `data-videos="trajectoires"`, et limiter le nombre, `data-videos-n`.

### D-030, Une règle d'audit pour les offres mortes

D-008 déclare le Challenge JB EMERIC et la BMW 325i HTCC morts depuis avril. Rien ne le vérifiait, et trois titres de vidéos de l'Académie nommaient encore le Challenge le 7 août.

`outil-dev/audit/regles/offres-mortes.js` distingue quatre endroits, parce qu'ils ne coûtent pas la même chose : la prose lue par le visiteur est une faute, un commentaire de code est une tâche, un nom de classe aussi, un `alt` ou un nom de fichier est un signal à juger.

**Une leçon de méthode au passage.** La première version traitait `alt="BMW 325i HTCC"` comme une promesse et annonçait six fautes, dont quatre n'en étaient pas. Une photo d'archive décrite fidèlement ne vend rien. La règle retire donc toutes les valeurs d'attributs avant de juger : ce qui reste est ce que le visiteur lit vraiment.

**Une seule vraie faute trouvée dans le périmètre**, et elle comptait : la FAQ de `track.html` proposait encore la BMW 325i HTCC à la location. Retirée. **Le reste de cette liste de voitures reste à vérifier avec JB**, je ne sais pas quel matériel existe réellement aujourd'hui.

### D-031, Le miroir de l'accueil suit les classes de l'Académie

`sync-mirror.js` recopie la classe de chaque porte telle quelle depuis `academie.html`. Renommer `.porte.challenge` en `.porte.competition` sur l'Académie, le 6 août, a donc silencieusement dépouillé la troisième porte de la page d'accueil : `index.css` stylait encore l'ancien nom. Renommé à son tour, rendu vérifié.

**À retenir** : toute classe portée par un élément aspiré par le miroir existe en double, dans `academie.css` et dans `index.css`. Les renommer ensemble, toujours.

---

## 7 août 2026, les avis

### D-027, Les avis sont un composant unique, leur texte reste en HTML

Le bloc d'avis existait sur `coaching.html`, écrit entièrement en styles en ligne. Il est maintenant un composant : `.jbe-avis` dans `assets/css/theme.css`, à côté de `.jbe-faq` qui suit déjà exactement ce régime. `coaching.html` et `academie.html` s'en servent, aucune des deux ne redéfinit quoi que ce soit.

**Le texte des avis reste écrit en HTML dans chaque page**, il n'est pas injecté par JavaScript. Raison démontrée dans la fiche du 4 août sur la FAQ : un contenu rendu en JavaScript sort de ce que lit un moteur de recherche, et échappe au scan du live-editor. Or la preuve sociale est précisément ce qu'on veut faire lire.

**Ce qui manque, et qui n'est pas un problème de code.** Le site ne détient que trois avis verbatim, tous sur du track-day ou du coaching en voiture personnelle. Aucun avis de parent, alors que l'enfant est la plus grosse part de marché. TripAdvisor refuse la lecture automatisée, donc ces avis se collectent à la main. `docs/04` le disait déjà : dix avis pour 37 ans, il y a un gisement là.

### D-028, Un bloc posé entre deux points d'ancrage n'existe pas

`snap.css` déclare `scroll-snap-type: y mandatory` sur `html` et `body`. Le navigateur s'arrête alors obligatoirement sur un élément aimanté. Un bloc de premier niveau posé entre deux `snap-section` n'est jamais un point d'arrêt : il est traversé d'un coup, et sur une page dont chaque section fait la hauteur de l'écran, cela revient à ne jamais le montrer.

**Constaté le 7 août.** Le bloc d'avis ajouté à `academie.html` n'apparaissait pas. Le HTML était correct, le CSS aussi, chacun lu séparément ne montrait rien. Seule une capture l'a révélé. Remède : ranger le bloc dans `.snap-fin`, qui défile en interne.

**Consigné en règle d'audit**, `outil-dev/audit/regles/defilement.js`, parce que c'est un défaut qu'on ne trouve jamais en naviguant : la page a l'air normale, il manque juste quelque chose qu'on ne sait pas chercher.

---

## 6 août 2026, l'Académie à trois voies

### D-026, Le hub de l'Académie annonce trois voies, pas deux

`academie.html` annonçait « Deux entrées vers la course », un parcours en deux étapes et deux portes. Il en porte désormais trois : Karting enfant, Karting adulte, Vers la Compétition.

**Raison** : la page adulte et la page enfant sont séparées depuis ce chantier. Un hub qui n'en annonce que deux renvoie le parent vers une page écrite pour un adulte, ce qui est exactement le défaut qu'on venait de corriger.

**Ce qui a débloqué le chantier.** La troisième porte insère des éléments éditables au milieu de la page, ce qui décale 21 clés positionnelles sur 22, voir `docs/05` section 6.13. C'était le motif de refus. Précision de Yoan le 6 août : les 73 contenus enregistrés sont ses propres tests, pas le travail de JB. « Tu peux repartir de pages blanches si nécessaire. »

**Détail technique.** La troisième porte était déjà dessinée en CSS et jamais écrite en HTML : `.porte.adulte` existait sans emploi. La classe `.porte.challenge` devient `.porte.competition`, D-008. Et `.portes-citation-wrap .portes` imposait deux colonnes avec une spécificité (0,2,0) qui écrasait silencieusement toutes les requêtes de média : la déclaration est retirée, la grille responsive reprend la main.

### D-025, Le nommage des pages de l'Académie est symétrique

`academie/karting.html` devient `academie/karting-adulte.html`, à côté de `academie/karting-enfant.html`.

**Ce que ça annule.** La fiche de chantier avait tranché l'inverse, au motif que le renommage orphelinerait les 21 entrées Supabase préfixées `karting__`. Demande de Yoan : « Il faut renommer karting, et du coup mettre à jour les bases de données. »

**Comment le contenu est préservé sans toucher à la base.** Une table `PAGE_ALIASES` déclare `karting-adulte` comme successeur de `karting`. `live-editor.js` lit l'ancienne clé quand la nouvelle est vide, et `outil-dev/build-cache.js` fait de même au build. Les deux tables doivent rester identiques, sinon le site marche et le filet de secours tombe sans rien dire : la règle d'audit `renommages` vérifie cette égalité à chaque session.

---

## 4 août 2026, méthode de travail

### D-024, Ce qui est mesurable est mesuré, pas rédigé

Un outil d'audit versionné, `outil-dev/audit/`, calcule l'état du site. Il est lancé automatiquement au démarrage de chaque session par un hook déclaré dans `.claude/settings.json`. Sans dépendance, 770 millisecondes.

**Le problème qu'il résout, constaté par Yoan** : « tellement de tokens dépensés pour vérifier des trucs déjà vérifiés dans d'autres sessions, c'est pas efficace ».

`docs/05-etat-des-lieux.md` était un relevé écrit à la main. Un document périme dès qu'on ferme la session, donc chaque session recommençait l'archéologie. Deux de ses affirmations se sont révélées fausses le 4 août.

**La cause profonde, plus gênante.** À chaque vérification, un script jetable était fabriqué sur le moment. Sur la seule journée du 4 août, quatre erreurs sont venues de l'instrument et non du site : un `grep` incluant `old/` a produit une fausse alerte sur les canoniques, un banc d'essai oubliant un conteneur a fait croire que des titres étaient invisibles, trois captures ont été prises serveur éteint, et un drapeau avalé comme chemin a fait annoncer « identique au pixel » sur un fichier non modifié.

Un outil relu une fois vaut mieux qu'un script réécrit vingt fois.

**Partage des rôles.** L'outil mesure, il ne juge pas. Trois niveaux : `FAUTE` contredit une décision actée ou casse quelque chose, `tache` est sans conséquence visible, `signal` demande un avis humain. Le jugement reste dans ce journal et dans les fiches de chantier.

**Ce qu'il ne saura jamais faire** : rendre une page. Aucune règle ne dira qu'un filet est invisible sur fond sombre ou qu'un contraste est insuffisant. Ces questions demandent un navigateur et restent à la charge du rôle design.

**Validation à sa première exécution** : il s'est signalé lui-même quatre fois, la règle des tirets contenant le caractère qu'elle traque. Ces faux positifs sont corrigés et documentés dans `outil-dev/audit/LISEZMOI.md`, section « quatre pièges ». Il a aussi trouvé un vrai défaut inconnu : sur `admin/legal/contact.html`, `sync-mirror.js` était chargé avant `routes.js`, donc lisait un objet vide et retombait sur ses URLs de secours.

---

## 4 août 2026, suite de D-020

### D-023, La colonne Contact du pied de page ne porte pas de géographie

La ligne « Région · Provence · Alpes · Côte d'Azur » est supprimée de `footer.js`. Décision arbitrée par le rôle éditorial, sur délégation de Yoan.

Elle avait été conservée lors de D-020 au motif qu'un bloc de coordonnées dit « où il est basé ». **L'argument ne tenait pas** : le libellé « Région » annonce un périmètre, et le bloc ne contient aucune adresse dont cette ligne serait le complément. Elle répondait donc seule à la question « il travaille où », et se lisait comme une zone d'intervention.

Le critère de D-020 départage : une région ne subsiste que si elle répond à une question du lecteur. La FAQ de `coaching.html` répond à « le coaching se fait sur quel circuit ? ». Un pied de page n'interroge rien, il étiquette, et celui-ci est répété sur 18 pages.

**Aucune mention de déplacement ne la remplace.** Écrire « France et Europe » serait une promesse commerciale sur le national, or ce point attend la discussion prévue par la fiche `2026-08-04-evenements-nationaux.md`. L'adresse légale reste dans `admin/legal/mentions-legales.html`, où le droit l'exige, donc la conformité est préservée.

Restent Email, Téléphone et le formulaire de contact, soit trois façons de joindre JB.

**Complément.** Les accroches de marque de `admin/legal/contact.html` et `admin/signup.html` portaient encore « École de Pilotage PACA », alors que leurs trois pages sœurs avaient été corrigées. Alignées.

**Encore présent, hors périmètre de travail** : le corps de `track.html` (6 occurrences), `paddock/nos-voitures.html` (4), et la FAQ de `coaching.html` (1, conservée volontairement).

---

## 4 août 2026, portée réelle de `routes.js`

### D-021, Deux régimes de liens, selon qui les écrit

`routes.js` se déclarait « source unique de vérité pour toutes les URLs du site ». La promesse était intenable : un lien écrit dans une page HTML ne peut pas consulter un objet JavaScript. La règle devient explicite.

| Qui écrit le lien | Ce qu'il utilise |
|---|---|
| Du JavaScript (`nav.js`, `footer.js`, `sync-mirror.js`) | **Obligatoirement `ROUTES`** |
| Une page HTML | Le chemin absolu final, jamais un ancien chemin rattrapé par `_redirects` |

**Pourquoi ne pas tout faire passer par le JS** : un lien statique reste suivi par un moteur de recherche même si le script ne s'exécute pas. Confier la navigation entière à `routes.js` fragiliserait le référencement pour un gain de cohérence illusoire.

**Ce que le contrôle a trouvé.** Sept liens de réseaux sociaux étaient écrits en dur dans `nav.js` et `footer.js` alors que `ROUTES` les déclarait. `nav.js` faisait les deux dans le même fichier : `ROUTES` pour la barre du haut, URLs en dur pour le menu mobile. Une seule modification d'URL et les deux menus divergeaient sans que rien ne le signale.

### D-022, La page courante s'identifie par son chemin, pas par son nom de fichier

`ROUTES.matchCurrent` comparait le seul nom de fichier. Deux pages homonymes dans des dossiers différents auraient partagé la même clé, et un chemin en `/dossier/` renvoyait à tort la clé `index`. La comparaison porte désormais sur le chemin complet, avec repli sur le nom de fichier seulement si le chemin exact échoue.

**Même famille de défaut que 2.2 du relevé** : le live-editor dérivait lui aussi son identifiant du seul nom de fichier. Quand une convention est fausse, elle est rarement fausse à un seul endroit.

---

## 4 août 2026, positionnement géographique

### D-020, La géographie s'exprime par les circuits, jamais par une région

« PACA » disparaît des métadonnées et du pied de page. Les circuits sont nommés à la place, y compris les étrangers. Une région ne subsiste que là où elle répond à une question du lecteur.

**Origine de la mention, précisée par Yoan** : elle est héritée du site d'origine de son père. Elle n'a jamais décrit le périmètre réel de l'activité. L'ancien site annonce lui-même onze circuits, dont Barcelone, Spa et Monza.

**Ce que dit le palmarès du site.** Pau est le circuit le plus cité de tout le dépôt, devant Paul Ricard. Nogaro, Dijon, Spa, Magny-Cours et Val de Vienne dépassent chacun tous les circuits régionaux hors Paul Ricard. Le site se contredisait : la page palmarès affirmait une carrière nationale et internationale pendant que les balises annonçaient une école régionale, et c'est la partie fausse qui était en vitrine. Comptage détaillé dans `docs/04`.

**Le lien avec D-009, qui est le vrai argument.** La disparition du parc a été actée comme une contrainte. C'est aussi ce qui libère la géographie. Une école qui possède dix-huit voitures est clouée au rayon d'action d'un camion, avec le transport, l'assurance et l'immobilisation que cela suppose. Un homme qui vend sa méthode prend un train. **L'absence de matériel, qui se lit comme une perte, est ce qui rend le national possible sans investissement.** C'est un argument commercial, pas seulement un constat.

**Nuance posée par Yoan** : « naturellement y aura plus en PACA car il vit là ». La concentration régionale reste vraie dans les faits. Elle est une conséquence pratique, pas une promesse, et elle ne s'écrit pas.

**Non tranché ici** : les événements à l'échelle nationale, que JB pratique déjà ponctuellement. C'est une question d'offre et non de balisage. Fiche de cadrage dans `docs/chantiers/2026-08-04-evenements-nationaux.md`, à discuter avant toute ligne de code.

**Appliqué** : métadonnées de `index.html`, `coaching.html`, `track.html`, `admin/legal/contact.html`, corps de `coaching.html` et `paddock.html`, pied de page des 18 pages via `footer.js`, et l'exemple de saisie du live-editor qui enseignait « circuit PACA » à JB. Conservé : le champ `region` des circuits dans `admin.js`, qui est une donnée structurée et non de la rédaction.

---

## 4 août 2026, correction de `track-render.js`

### D-018, Pas de handler écrit dans une chaîne HTML

Quand du HTML est construit en JavaScript, les valeurs dynamiques passent par des attributs `data-`, échappés, et le comportement est branché après injection. Jamais par un `onclick` assemblé dans la chaîne.

**Raison** : un `onclick` en chaîne impose trois niveaux de quotes imbriqués, guillemets de l'attribut, quotes de l'appel, quotes de la chaîne JS. C'est ce qui avait cassé `track-render.js`. Et même une fois la syntaxe rétablie, la moindre apostrophe dans une donnée venue de Supabase aurait recassé le bouton en silence. `circuits.nom` vaut par exemple « Circuit d'Hyères ».

**Portée** : règle générale, pas un correctif ponctuel. Elle vaut pour tout rendu dynamique du site.

### D-019, Un bloc immédiatement invoqué commence par un point-virgule

Tout `(function(){})()` ou `(async function(){})()` s'écrit `;(function(){})()`.

**Raison** : sans séparateur, JavaScript rattache le bloc à l'expression précédente et lit un appel de fonction sur son résultat. Le fichier appliquait déjà la règle à un endroit sur quatre, ce qui a suffi à masquer le problème.

---

## 4 août 2026, application de D-007 au site

### D-017, Le tiret décoratif d'intertitre appartient au CSS

Les quatre kickers qui commençaient par un tiret écrit en dur ont perdu ce caractère. Le trait est désormais dessiné par une règle `::before`.

**Constat qui a motivé la décision** : trois des quatre kickers (`fmt-kicker`, `pc-kicker`, `nv-kicker`) portaient **déjà** un `::before` et un `::after` traçant un trait de chaque côté. Le tiret du HTML faisait donc doublon avec un trait déjà présent, sur toute la durée de vie de la page. Seul `dc-kicker` avait un vrai rôle visuel, il a reçu sa règle CSS.

**Portée générale** : ce qui relève du dessin se code en CSS, jamais en caractère dans le HTML. Un caractère décoratif est lu par les lecteurs d'écran et survit aux copier-coller.

### D-016, Une valeur vide s'écrit en points de suspension

Les 43 emplacements qui affichaient un tiret en attendant leurs données (compteurs du dashboard, pastilles, cellules sans valeur) affichent `…`.

**Raison, mot de Yoan** : un tiret « peut se lire comme zéro ou aucun », ce qui est faux quand la donnée n'est pas encore chargée.

**Réserve à lever** : la distinction n'a pas été faite entre l'attente de chargement et la donnée réellement absente. `duree: '…'` du sponsor Leroy Merlin dans `site-data.js` relève du second cas. À revoir si l'ambiguïté gêne.

### D-015, Conventions de remplacement du tiret cadratin

D-007 interdit le caractère depuis avril. Il n'avait jamais été appliqué aux fichiers : le dépôt en comptait **517**. Conventions retenues, arbitrées par le rôle éditorial.

| Contexte | Remplacement |
|---|---|
| Métadonnées (`title`, `og:`, `twitter:`) | Point médian, séparateur unique |
| Apposition ou rectification | Virgule |
| Deux segments autonomes | Point |
| Le second segment explicite le premier | Deux points |
| Libellés coordonnés de même rang | Point médian |
| Attributs `alt`, légendes d'images | Virgule, jamais le point médian |
| Incise encadrée par deux tirets | Parenthèses |
| Commentaires de code | Deux points, ou virgule si la ligne en portait déjà un |

**Pourquoi le point médian dans les métadonnées** : le site l'employait déjà dans huit titres, parfois dans le même titre qu'un cadratin. Il occupe moins de place dans le budget d'affichage d'un résultat de recherche.

**Pourquoi la virgule seule dans les `alt`** : un lecteur d'écran rend une virgule par une pause et le point médian par un mot.

**Hors de portée d'une modification de fichier** : le contenu saisi par JB dans le live-editor, stocké dans la table `site_content`. Un cadratin subsiste dans le cache de `academie/karting.html` à ce titre. La base n'a pas été traitée.

---

## 1er août 2026, remise à plat complète

### D-014, Numérotation par niveaux pour parler du projet

Niveau 0 le projet, niveaux 1 à n les pages maîtresses avec cahier des charges propre, sous-niveaux qui héritent de leur parent.

**Les numéros ne figurent jamais dans un nom de fichier, une URL ou un menu.** Ils servent uniquement à la conversation.

**Raison, formulée par Yoan** : une seule façon de ranger, valable pour la documentation, le menu du site et l'arborescence des dossiers.

### D-013, Ressources transversales à source unique

Certains contenus sont consommés par plusieurs branches de l'arbre, le palmarès en premier. Règle : **une seule source de vérité, tous les autres emplacements n'en sont que des vues**, via `sync-mirror.js`.

**Raison** : le jour où le palmarès existe en trois exemplaires indépendants, les trois divergent. C'est la cause des conflits permanents que Yoan veut éliminer.

### D-012, Statut honnête sur chaque page

Chaque page porte une mention : *défini*, *en chantier*, ou *non défini*.

**Raison** : une documentation qui dit « je ne sais pas » est utilisable, une qui prétend savoir ne l'est pas. Empêche de bâtir sur du spéculatif.

### D-011, Aucune création sans accord explicite

Aucune page, aucune entrée de menu, aucune section n'est créée sans l'accord de Yoan.

**Raison, constat de Yoan** : « Beaucoup de sous-pages de menu n'ont jamais vraiment été travaillées, parfois même créées sans mon autorisation. » C'est une cause directe du désordre actuel.

### D-010, Le référencement local vise les circuits

Pas le domicile de l'entreprise.

**Raison, précision de Yoan** : « L'adresse n'a pas vraiment d'importance, rien ne se fait sur place. » Les clients cherchent un circuit, pas une ville. Cette décision annule une analyse antérieure de Claude qui plaçait la correction d'adresse en priorité haute.

### D-009, Le site vend un homme, plus un parc

Positionnement central du projet.

**Raison** : l'entreprise a fait faillite vers 2014 et n'a presque plus de matériel. JB ne veut plus assumer entretien, préparation, assurance, réparation ni transport. Ce qui reste et qui vaut, ce sont 35 ans d'expérience.

**Conséquence** : ce n'est pas une refonte visuelle, c'est un changement d'argument commercial qui touche chaque page.

### D-008, Le Challenge JB EMERIC est mort

Supprimé du site et de tout le vocabulaire. La dotation BMW 325i HTCC également.

**Reste à traiter** : la page `jbemeric.com/challenge-jb-emeric/` est toujours en ligne et indexée. `challenge.css`, 24 Ko, est orphelin dans le dépôt.

### D-007, Deux interdits d'écriture absolus

Le tiret cadratin `—` et le ton IA. Valables partout, site comme conversation.

**Raison, mot de Yoan** : « "—" ça c'est strictement interdit. Je déteste ça » et « Pas de ton IA ça m'insupporte ». Le reste de l'écriture est libre.

### D-006, Correctifs du serveur local

`dev-server.js` lit désormais `_redirects`, et `/save-html` accepte un chemin complet.

**Raison** : les liens relatifs vers d'anciens chemins tombaient en 404 en local alors qu'ils fonctionnent en production. Une partie des « vieux bugs » traqués par le passé n'existait donc qu'en local. La sauvegarde du live-editor échouait sur 13 pages sur 18.

**Vérifié** : 7 redirections suivies jusqu'au 200, 5 URLs directes sans régression, écriture en sous-dossier confirmée, 2 tentatives de traversée de répertoire refusées.

### D-005, `CLAUDE.md` remonte à la racine

**Raison, cause racine de la perte de contexte** : le fichier vivait dans `claude/`, emplacement que Claude Code ne lit jamais. La vision et les règles n'étaient donc jamais chargées. Le document était bon, il était invisible.

### D-004, Quatre agents spécialisés, dont un en lecture seule

`jbe-design`, `jbe-editorial`, `jbe-technique`, et `jbe-coherence` sans outil d'écriture.

**Raison** : un rôle transversal doté du droit d'écriture piétinerait le travail des rôles spécialisés. Il diagnostique, la conversation principale distribue les corrections.

**Pas d'agent chef de projet** : chaque agent démarre sans historique. Un agent qui en pilote d'autres ajoute un relais, et chaque relais perd de l'information.

### D-003, Le MEMOIRE d'avril est archivé, pas rangé

`claude/MEMOIRE.md` devient `old/MEMOIRE-avril-2026.md`. Sa stratégie commerciale est fausse.

**Raison** : le ranger proprement aurait produit une documentation impeccable et fausse, pire que pas de documentation, parce qu'on lui aurait fait confiance. Preuves de son obsolescence : `pages.css` décrit comme pilier de l'architecture CSS et chargé par zéro page, arborescence périmée, page « Stages » présentée comme existante alors que c'est une ancre.

### D-002, Le plugin superpowers est désactivé

Passé à `false` dans `~/.claude/settings.json`. Cache conservé, réactivation possible.

**Raison** : procédures conçues pour du développement logiciel en équipe, sans objet sur un site statique travaillé en solo. Bloc de consignes injecté à chaque session dans tous les projets. Ce qui est utile a été réécrit en quatre règles dans `CLAUDE.md`, en français.

**Cohérence** : prolonge la décision d'avril sur la GStack, écartée pour la même raison.

### D-001, Gouvernance révisée

Travail en local, modifications et commits sur branche autorisés. **Jamais de push, jamais de déploiement.**

**Raison** : l'ancienne règle, livraison exclusive par zip, ne correspondait plus à la pratique réelle. Chaque push déclenche un build Netlify, le palier gratuit est de 300 minutes par mois, un push quotidien reste loin de la limite. Contrainte de Yoan : le projet doit coûter zéro euro.

---

## Avant août 2026

Les décisions antérieures figurent dans `old/MEMOIRE-avril-2026.md`, section 8. **Elles portent sur une entreprise qui n'existe plus sous cette forme.** À consulter comme archive, pas comme référence.
