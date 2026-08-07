# Journal des décisions

Du plus récent au plus ancien. Une décision par entrée, avec sa raison.

Écriture libre par Claude, sans validation préalable. Résumé à Yoan en fin de chantier.

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
