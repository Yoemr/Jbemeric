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

---

## C. Décisions en attente de Yoan

Aucune ne se prend sans lui.

**Sur les événements**

- Les quatre colonnes manquantes de `events` : mode d'engagement, organisateur hôte, lien vers l'organisateur, coût pour JB. Sans elles, la page Événements refaite ne peut pas se fabriquer toute seule.
- Le bouton « je viens », sous la forme allégée « dites-moi si vous venez ». Le vote a été retiré, rien n'a été mis à la place.
- La forme de la page : pages filles, onglets, ou page unique avec filtres. Contrainte déjà actée : ce qui mérite une adresse doit en avoir une.
- Où placer le compteur « X dates, Y inscriptions ouvertes », dont le code a été retiré faute d'endroit où l'afficher.

**Sur la conversion**

- Le bouton or du menu, présent sur les neuf pages, mène à la création d'un compte. Devient-il un appel à joindre JB ?
- Aucune page de l'Académie ne propose de téléphone ni d'adresse dans son corps.

**Sur la base**

- Table `messages` écrite et non appliquée, `outil-dev/migrations/2026-08-08-table-messages.sql`. Elle attend une section Messages dans le dashboard, sans laquelle les messages arriveraient là où personne ne regarde.
- Colonne `nb_votes`, tables `votes` et `track_days` : mortes, plus rien ne les écrit. Les supprimer est irréversible.

**Sur le contenu**

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
