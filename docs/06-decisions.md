# Journal des décisions

Du plus récent au plus ancien. Une décision par entrée, avec sa raison.

Écriture libre par Claude, sans validation préalable. Résumé à Yoan en fin de chantier.

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
