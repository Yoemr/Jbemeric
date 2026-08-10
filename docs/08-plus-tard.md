# Plus tard

**Le seul endroit où vont les détails.** Demande de Yoan, 9 août 2026 : « on s'occupe du focus ensemble, et tu notes quelque part les détails qu'on devra s'occuper plus tard ».

Rien de ce qui est ici ne se traite sans qu'il le demande. Rien de ce qui est ici ne se mentionne dans une réponse, sauf s'il pose la question ou si ça casse le sujet en cours.

Trois niveaux, et un seul critère pour les départager : est-ce que ça empêche le site de fonctionner ?

---

## A. Bloque le fonctionnement

Ce qui empêche quelqu'un de faire ce que le site propose.

| Quoi | Où | État |
|---|---|---|
| Le dashboard de JB ne permet ni d'ajouter, ni de modifier, ni de publier un événement | `admin/dashboard.html`, `assets/js/admin.js` | chantier complet, dit par Yoan |
| Le bouton « nouveau sujet » du forum cherche un élément absent de la page, et accuse le visiteur de ne pas être connecté | `paddock.html`, `paddock-modules.js` | D-094 |
| La connexion et la sauvegarde d'un texte par JB n'ont jamais été testées | `auth.js`, `live-editor.js` | demande un poste connecté |

---

## B. Données fausses, corrigeables en cinq minutes

Yoan, 9 août : « on s'en fout des événements passés, des voitures qui n'existent plus. Quand toute la partie technique fonctionnera on pourra en 5 min mettre à jour les événements. »

**Ne rien corriger ici avant que la technique tourne.**

| Quoi | Combien |
|---|---|
| Événements plaçant une voiture au Circuit de Brignoles, qui est une piste de karting | 5 lignes de `events`, dont 2 dates publiques à venir |
| Événements passés encore marqués `Open` et visibles en base | 7 lignes |
| `track.html`, descriptions pour Google : Spa, Barcelone, « votre voiture ou location », Brignoles cité comme circuit automobile | 3 balises |
| `paddock.html`, lignes d'événements écrites en dur, dont quatre placent une Caterham à Brignoles | 6 lignes |
| FAQ de `track.html` promettant Caterham, 206 S16 et Lotus Elise à la location | 1 question |
| L'avis de Montaner parle du Circuit du Luc et son contexte annonce Paul Ricard | 1 ligne d'`avis` |

---

## B bis. Chantier suivant, déjà cadré

- **Aller chercher ce que la source ne publie pas.** Décision de Yoan du 10 août : « pour toutes les informations qu'on n'a pas mais dont on a besoin, il faut qu'on trouve l'information d'une manière ou d'une autre. Ça peut être un script chargé seulement quand nécessaire, ça peut aussi être par IA, mais attention aux coûts et à la véracité. » Concerne le prix, la description et l'état complet, tous les trois absents du Circuit du Var. À faire à la demande, ligne par ligne, jamais en masse.
- **Les autres circuits.** Deux sources branchées, le Circuit du Var et Lédenon. Restent au moins le Paul Ricard, dont l'adresse d'agenda est à retrouver, et le Grand Sambuc. `calendrier-piste.fr` est écarté : il ne recense que la moto. Chaque source demande de regarder la forme de sa page et d'écrire son parseur dans `veille_extraire` ; une source de même forme qu'une existante est une simple ligne dans `veille_sources`, sans code.
- **Un onglet par fonction restante** dans `admin/gestion.html` : inscriptions, circuits, documents, forum, utilisateurs. Un fichier chacun, sur le modèle de `gestion-faq.js`.
- **Le référencement des pages d'événement.** `build-cache.js` doit pré-générer un fichier par date, avec titre, description, texte dans le HTML, `schema.org/Event` et sitemap. Aujourd'hui un robot lit « Chargement » sur toutes les dates. Chantier suivant, D-108.
- **`track-render.js` porte encore son ancien nom.** La fiche en est sortie le 9 août, il ne reste que la grille et ses filtres. Le renommer en `evenements-grille.js` est maintenant sans risque, mais sans urgence non plus.
- **Les trois événements de travail** portent `source_veille = 'PROTOTYPE'`. À effacer le jour où de vraies dates les remplacent : `delete from events where source_veille = 'PROTOTYPE';`

---

## C. Décisions en attente de Yoan

Aucune ne se prend sans lui.

**Sur les événements**

- Le bouton « je viens », sous la forme allégée « dites-moi si vous venez ». Le vote a été retiré, rien n'a été mis à la place.
- La forme de la page : pages filles, onglets, ou page unique avec filtres. Contrainte déjà actée : ce qui mérite une adresse doit en avoir une.
- Où placer le compteur « X dates, Y inscriptions ouvertes », dont le code a été retiré faute d'endroit où l'afficher.

**Sur le modèle économique**

Mot de Yoan, 11 août 2026 : « reste à réfléchir à la partie business plan, comment on facture ça. Mais pour l'instant je sais pas. » Rien ne se construit là-dessus tant qu'il n'a pas tranché.

- Le champ `mode` d'`events` porte déjà cinq façons de facturer une date : `entier` (JB loue le circuit et vend la journée, il porte le risque), `box` (le client paie le circuit pour rouler et JB pour être suivi), `greffe` (frais partagés), `coaching` (JB ne vend que ses heures), `moniteur` (une autre école le loue). La question n'est pas d'inventer un modèle, c'est de choisir lequel on pousse et à quel tarif.
- Les six dates en ligne au 11 août sont toutes en `greffe`, le mode sans risque.
- La colonne `cout` d'`events` existe et **rien ne l'écrit ni ne la lit**. Elle a été prévue pour poser le coût de la journée en face du prix de vente. Le jour où il faudra savoir ce que rapporte une date, la base est prête.
- Question qui décide du reste : JB vend-il une journée ou vend-il ses heures. Avancer de l'argent oblige au remplissage, vendre ses heures ne risque rien mais plafonne au temps disponible.

**Sur la conversion**

- Le bouton or du menu, présent sur les neuf pages, mène à la création d'un compte. Devient-il un appel à joindre JB ?
- Aucune page de l'Académie ne propose de téléphone ni d'adresse dans son corps.

**Sur la base**

- Table `messages` écrite et non appliquée, `outil-dev/migrations/2026-08-08-table-messages.sql`. Elle attend une section Messages dans le dashboard, sans laquelle les messages arriveraient là où personne ne regarde.
- Colonne `nb_votes`, tables `votes` et `track_days` : mortes, plus rien ne les écrit. Les supprimer est irréversible.

**Sur le code**

- **Deux feuilles au-dessus du seuil de sélecteurs morts.** `theme.css` à 44 %, `track.css` à 41 %. Les deux sont du code mort qui vient de franchir un seuil parce que le fichier a maigri, pas un défaut nouveau. Un oui les nettoie ensemble.
- **Le bloc « page suivante » de `theme.css` est mort en entier** : 7 règles `.next-link` et `.nl-*`, 25 variables `--next-*` qui n'alimentent qu'elles, et trois entrées dans la liste des sélecteurs modifiables de `live-editor.js`. Aucune page ne porte ce balisage. C'est ce qui fait passer l'audit à 1 faute depuis que `theme.css` a maigri de 96 lignes. La suppression est bornée et prouvable, elle attend un oui.
- **48 sélecteurs morts dans `track.css`** : `.sec`, `.sec-w`, `.kick` et leurs voisines, les règles de l'ancienne mise en page de `track.html`, restées quand le balisage a été refait en `evenements.html`. Suppression bornée, elles ne servent nulle part.
- La page d'une date, `evenement.html`, n'a ni bloc d'avis ni FAQ. Les deux composants sont prêts, il suffit de poser `data-avis` et `data-faq` dessus. Sa structure n'a pas été décidée.

**Sur le contenu**

- **Où la FAQ mérite d'être, et où elle ne sert à rien.** Mot de Yoan, 9 août : « faudrait aussi réfléchir à la pertinence de la FAQ, elle est peut-être à des endroits pas forcément essentiels, mais pour l'instant pas grave. Une fois que le système marche c'est très facile d'ajouter ou supprimer une section sur une page. » Elle est aujourd'hui sur six pages, par héritage et non par choix. À reprendre page par page quand le site tournera. Le bloc d'avis pose la même question.
- La page JB, validée dans le principe, avec le palmarès dedans. Entrée de menu à décider.
- La page « nos voitures », sujet séparé. Idées de Yoan dans `docs/99` : louer aux équipes, s'appuyer sur les clients qui en possèdent, reconstruire un parc avec des investisseurs rémunérés.
- Photos et vidéos, reprise complète avec JB. Beaucoup sont provisoires.

---

## D. Propre mais sans conséquence

À ne traiter que si un jour il n'y a plus rien d'autre à faire.

- 7 sélecteurs CSS morts dans le périmètre, tous dans des `@media`.
- 5 photos identiques au bit près sous deux noms, 19 jamais employées.
- `admin.js` : `togglePin` et `toggleThreadVisible` ne sont appelés par personne, `deleteThread` est défini deux fois.
- `robots.txt` bloque quatre anciennes URL qui n'existent plus, et ne couvre pas les vraies sous `admin/`.
- `admin/login.html` et `admin/signup.html` embarquent un pied de page recopié en dur, tronqué au milieu d'un mot sur l'un des deux.
- Automatisation des réseaux sociaux depuis le dashboard, idée de Yoan dans `docs/99`.
