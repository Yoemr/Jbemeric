# Acquis et pièges

**Établi le** : 8 août 2026, à la demande de Yoan.
**À lire au début de chaque session, avant de vérifier quoi que ce soit.**

---

## 1. Pourquoi ce fichier existe

Mot de Yoan, 8 août :

> « On perd un temps fou à tout corriger et à faire des choses cachées. On fait 95 % de correction, 5 % de visible sur le site, c'est pas normal. Et le pire c'est qu'une nouvelle session te ferait sûrement re-re-revérifier des trucs inutiles. »

Il a raison sur les deux points. Ce fichier attaque le second, qui est le seul que la documentation puisse résoudre. Le premier est traité en section 6.

**Ce fichier ne contient que ce qu'un outil ne peut pas contenir.** Tout ce qui est mesurable est mesuré par `node outil-dev/audit/audit.js`, et ne doit jamais être recopié ici : un document se périme, un audit se recalcule. Voir D-024.

---

## 2. Les pièges d'instrument, tous payés comptant

**C'est la section la plus importante du fichier.** Sur trois jours, presque toutes les fausses conclusions sont venues d'un instrument fabriqué sur le moment, jamais du site. Chacun de ces pièges a coûté un aller-retour complet : une conclusion fausse, une correction inutile, puis la découverte de l'erreur.

### 2.1 La règle du contrôle négatif

**Avant de croire un « identique », un « aucune faute » ou un « zéro occurrence », introduire volontairement le défaut et vérifier que l'instrument le voit.**

Une comparaison qui ne sait pas voir une différence dira toujours « identique ». Une règle qui ne signale jamais rien est indiscernable d'une règle correcte. Cette vérification prend trente secondes et a démasqué quatre faux résultats le 7 août.

### 2.2 Les captures d'écran mentent de trois façons

Détail complet dans `docs/03-technique.md` section 6bis. En résumé :

| Piège | Effet |
|---|---|
| Sans `--no-proxy-server` | `localhost` part dans le proxy et la page revient d'un cache |
| Fenêtre très haute, `1300x7000` | le PNG est identique quoi qu'on change dans le CSS |
| URL avec ancre, `page.html#section` | trois exécutions donnent trois empreintes différentes |
| Page rendue en JavaScript | `palmares.html` n'est jamais reproductible, la comparaison est sans valeur |

**Corollaire** : pour prouver qu'une règle CSS est morte, chercher ses classes dans le HTML et le JS des pages qui chargent la feuille. C'est déterministe, instantané, et ne dépend d'aucun navigateur. Le pixel ne sert qu'à corroborer.

### 2.3 Les analyses statiques ratent tout ce qui est construit à l'exécution

Quatre fois le même piège, sous quatre habillages.

- **Le balisage venu d'une autre page.** `sync-mirror.js` injecte des sections d'`academie.html` et `coaching.html` dans `index.html`. Résultat avant correction : 114 sélecteurs d'`index.css` sur 286 déclarés morts, alors qu'ils habillent la page d'accueil.
- **La classe construite par concaténation.** `palmares.js` écrit `class="pal-year pal-year--heavy' + (isHL ? ' pal-year--highlight' : '')`. Lire le préfixe littéral seul ratait 107 sélecteurs sur 332.
- **Les balises fabriquées en JS.** `palmares.html` ne contient aucun `<a>` écrit à la main.
- **Les chemins d'images écrits dans du code.** `track-render.js` réclamait trois fichiers absents, dont l'image de repli. La règle des liens ne lisait que le HTML.

### 2.4 Le mode de parsing change le verdict

`node --check` sur un fichier `.js` **a validé** un `admin.js` qui contenait sept chaînes cassées. Les mêmes octets copiés dans un `.mjs` échouent immédiatement. Le fichier étant chargé en `type="module"`, le tableau de bord admin ne fonctionnait pas du tout.

**Règle** : un script chargé quelque part en `type="module"` se vérifie en tant que module. La règle d'audit le fait maintenant, en lisant le mode dans les pages.

### 2.5 L'outil qui se compte lui-même

La règle des tirets cadratins contenait le caractère qu'elle traque. La règle de référencement contient le mot « PACA ». La règle des images citait des noms de fichiers en commentaire et les déclarait donc employés. La règle du ton IA signalait la documentation qui la décrit.

**Règle** : écrire le motif par son code Unicode, ou exclure `outil-dev/audit/` du corpus, ou retirer les exemples cités entre guillemets.

### 2.6 Le champ « où » d'une anomalie doit être un chemin de page

C'est lui qui range l'anomalie dans le périmètre ou dehors. Un libellé libre ou un chemin d'image la classe hors périmètre, donc masquée par défaut, et la règle passe inaperçue au moment précis où elle sert. Rencontré deux fois, dans `renommages` puis dans `images`.

### 2.7 Les pièges de recherche textuelle

- `grep -w` traite le tiret comme une frontière : `prix-item` matche dans `oc-prix-item`. A produit une fausse alerte le 7 août.
- `src="([^"?]+)"` pour couper un `?v=21` fait rater la balise entière. `palmares.js` et cinq autres fichiers n'étaient pas lus, et une vérification a répondu « aucune classe présente » sans avoir ouvert le fichier qui les contient toutes.
- Chercher un nom de fichier dans tout le HTML tombe sur les commentaires. `<!-- Chargé par sync-mirror.js -->` signalait un faux désordre de chargement.
- Un `grep` qui inclut `old/` produit des alertes sur une archive assumée.

---

## 3. Ce qui est vérifié, ne pas revérifier

Établi entre le 4 et le 8 août 2026. Recalculable par l'audit sauf mention contraire.

- **Les 9 pages du périmètre se chargent sans une seule erreur locale.** Mesuré par `node outil-dev/fumee.js`, exceptions JavaScript, console et requêtes en échec.
- **Zéro tiret cadratin** dans le site et dans la base.
- **Zéro tournure antithétique** dans le périmètre.
- **Zéro offre morte** dans le texte visible du périmètre et dans la base.
- **Le footer et le menu sont uniques**, injectés par `footer.js` et `nav.js`.
- **Aucun lien cassé, aucune ancre morte, aucune image manquante** dans le périmètre.
- **Tous les scripts compilent**, y compris en mode module.
- **856 lignes de CSS mort ont été retirées** de sept feuilles. Ce qui reste est dans des `@media`, volontairement non traité.

---

## 4. Ce que l'outillage ne voit pas

**À connaître avant d'annoncer « zéro faute ».**

**L'audit ne voit pas la base de données.** Pendant trois jours il a annoncé zéro tiret cadratin, zéro offre morte et zéro antithèse pendant que Supabase servait les trois aux visiteurs. Onze lignes ont dû être supprimées le 8 août, dont une promesse de BMW 325i en dotation et un tiret cadratin.

> Le live-editor sert la base **avant** le HTML. Corriger un fichier ne change rien pour un visiteur si un texte existe en base sous la même clé. **Toute correction de texte doit être suivie d'une vérification en base.**

**L'audit ne voit pas le rendu.** Il ne dira jamais qu'un filet est invisible sur fond sombre, qu'un bloc est sauté par le scroll snap, ou qu'un bouton tombe sous la ligne de flottaison.

**L'audit ne voit pas l'exécution.** C'est le rôle de `fumee.js`, qui ne clique sur rien non plus : aucun formulaire, aucun vote, aucune connexion n'a jamais été testé de bout en bout.

**Sur cette machine, `cdn.jsdelivr.net` est bloqué**, donc `live-editor.js` ne se charge jamais et une page affiche toujours son HTML. Un rendu local ne prouve rien dès qu'un texte existe en base.

---

## 5. Les décisions qui reviennent sans cesse

Rappel des pièges de contenu qui ont coûté du temps plusieurs fois.

- **Le Challenge JB EMERIC et la BMW 325i HTCC sont morts**, D-008. Ils ressortent régulièrement : dans des titres de vidéos, dans des classes CSS, dans la base. Régle `offres-mortes`.
- **Le contenu du live-editor n'est jamais jugé ni réécrit** comme s'il était de nous, sauf demande explicite de Yoan. `ctx.pages[].utile` l'a déjà retiré.
- **Les avis clients sont des citations réelles.** Ils restent mot pour mot, maladresses comprises.
- **Un emplacement que JB doit remplir garde sa balise `<img>`.** Le live-editor ne voit que les `img` et `video` déjà présents. Un cadre vide lui est inaccessible.
- **Les photos ont leurs droits acquis**, D-040. Question tranchée, ne pas la rouvrir.

---

## 6. Le ratio 95 % de correction, 5 % de visible

La partie que la documentation ne résout pas, et qui demande un changement de méthode.

### 6.1 D'où vient réellement le temps

**Une dette accumulée qui se paie une fois.** Le site n'avait jamais été vérifié. Le tableau de bord admin ne fonctionnait pas, le calendrier de `track.html` n'existait pas, le vote était une animation décorative. Ce sont de vraies pannes, et les trouver a de la valeur même si ça ne se voit pas.

**Mais deux causes sont de mon fait.**

**La dérive.** Yoan demande une chose, je trouve un défaut en route, je le corrige, j'en trouve un autre. À la fin la demande initiale est faite, plus cinq réparations qu'il n'a pas demandées. Certaines étaient importantes. Le problème est que ses priorités cessent de conduire le travail.

**Les instruments faux.** Section 2. Chaque piège a coûté un aller-retour complet, parfois deux.

### 6.2 Ce qui change

1. **Un défaut trouvé hors de la demande se note, il ne se corrige pas.** Sauf s'il casse la chose demandée, ou s'il est dangereux. Sinon il va dans `docs/05` et Yoan décide.
2. **Avant de commencer, dire ce que Yoan verra à l'écran quand ce sera fini.** Si la réponse est « rien », le dire tout de suite et lui laisser le choix de continuer.
3. **Contrôle négatif obligatoire** avant toute conclusion favorable. Section 2.1.
4. **Un piège d'instrument rencontré s'écrit ici, dans la minute.** C'est ce qui rend la prochaine session moins chère.
5. **Le cadrage avant la construction.** Le 7 août, Yoan a dû arrêter le travail pour parler de structure. La fiche `docs/chantiers/2026-08-07-page-evenements.md` en est sortie en une conversation. Elle aurait évité plusieurs jours de corrections sur une structure jamais validée.

### 6.3 Ce qui reste à faire pour fermer le trou

- **Un outil qui vérifie la base**, sur le modèle de `fumee.js`. La clé publique Supabase est déjà dans le code du site, donc aucun secret n'est nécessaire. Sans lui, « zéro faute » restera une phrase fausse.
- **Un test qui clique.** Inscription, vote, connexion, sauvegarde d'un texte par JB. Rien de tout ça n'a jamais été essayé.

---

## 7. Comment se servir de ce fichier

**Au début d'une session** : lire les sections 3 et 4. Elles disent ce qui est acquis et ce qui ne l'est pas. Ne pas revérifier ce qui est en section 3.

**Avant de fabriquer un script de vérification** : lire la section 2. Le piège est probablement déjà décrit.

**Avant d'annoncer un résultat favorable** : contrôle négatif.

**En fin de session** : ajouter les pièges rencontrés en section 2, mettre à jour la section 3, et rien d'autre. Ce fichier doit rester court pour rester lu.
