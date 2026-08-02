# Architecture

**Chargé par** : rôle `jbe-coherence`.
**Établi le** : 1er août 2026.

> **Document provisoire.** Il décrit la structure telle qu'elle existe, avec un statut honnête sur chaque page. Les cahiers des charges par page maîtresse restent à écrire, un par un, au moment d'attaquer chaque page.

---

## 1. Le modèle

**Niveau 0** : le projet entier. Vision, ton, règles transverses. Voir `docs/00-vision.md`.

**Niveaux 1 à n** : les pages maîtresses. Chacune a des objectifs propres et mérite son cahier des charges. Les ponts entre elles sont normaux, elles font partie du même projet.

**Sous-niveaux** : héritent des règles de leur parent. Pas de cahier des charges autonome. Yoan : « tout ce qui concerne les sous-menus, les sous-pages, c'est du standard, elles peuvent hériter de la page principale. »

**Les numéros servent à parler entre nous.** Jamais dans un nom de fichier, une URL ou un menu. Une URL `/academie/karting` se lit et se partage.

---

## 2. L'arbre actuel

Établi d'après `assets/js/nav.js`, qui fabrique le menu réel.

```
Niveau 0   LE PROJET                                        [à définir]
           index.html
           Doit faire comprendre immédiatement ce que fait JB.
           Moderne, simple, professionnel, prestigieux.

Niveau 1   ACADÉMIE                    academie.html        [à refondre]
           L'école. Parcours d'apprentissage du karting à la compétition.
           Enfants et adultes, plusieurs niveaux, plusieurs budgets.
           ├ 1.1  Formation Karting    academie/karting.html
           └ 1.2  Vers la Compétition  academie/competition.html

Niveau 2   COACHING                    coaching.html        [défini]
           Deux profils seulement :
           . l'amateur avec sa voiture qui veut progresser
           . le pilote confirmé qui vise un autre niveau, y compris en écurie

Niveau 3   STAGES & TRACK-DAYS         track.html           [en chantier]
           La page la plus complexe structurellement.
           ├ 3.1  Stages voiture       ancre #stages
           ├ 3.2  Track-Days           ancre #trackdays
           ├ 3.3  Nos voitures         ancre #voitures      [conflit ouvert]
           └ 3.4  Votre voiture        ancre MANQUANTE

Niveau 4   PADDOCK                     paddock.html         [défini]
           Le hub média de l'univers JB EMERIC.
           Une section en tête montre tout ce qui se passe dans l'entreprise.
           ├ 4.1  Bibliothèque tech.   paddock/articles.html + article.html
           ├ 4.2  Forum pilotes        ancre #forum
           ├ 4.3  Chaîne YouTube       ancre #media
           ├ 4.4  Calendrier           ancre #events
           └ 4.5  Palmarès             paddock/palmares.html

Niveau 5   ADMIN                       admin/dashboard.html [à définir]
           Page cachée mais centrale. JB entretient le site ici.
           Poste de commande de toute l'automatisation à venir.
           Contrainte « papa proof » absolue.
           ├ 5.1  Connexion            admin/login.html
           ├ 5.2  Inscription          admin/signup.html
           └ 5.3  Mot de passe oublié  admin/mot-de-passe-oublie.html

Hors arbre, utilitaire, pas de cahier des charges
           admin/legal/contact.html
           admin/legal/mentions-legales.html
           admin/legal/confidentialite.html

Hors menu, statut incertain
           paddock/nos-voitures.html   19 Ko                [jamais valide]
```

---

## 3. Statut de chaque page

| Page | Statut | Motif |
|---|---|---|
| `index.html` | **à définir** | Cahier des charges donné oralement, effets miroir en suspens |
| `academie.html` | **à refondre** | Le Challenge en était un pilier, il est mort |
| `academie/karting.html` | à refondre | Hérite du niveau 1 |
| `academie/competition.html` | à refondre | Contient une section `#challenge` devenue caduque |
| `coaching.html` | **défini** | Deux profils clairs, énoncés par Yoan |
| `track.html` | **en chantier** | Trois modèles économiques à arbitrer, voir section 5 |
| `paddock.html` | **défini** | Hub média, structure claire |
| `paddock/articles.html` | défini | Hérite du niveau 4 |
| `paddock/article.html` | défini | Gabarit, hérite de 4.1 |
| `paddock/palmares.html` | défini | Également ressource transversale |
| `paddock/nos-voitures.html` | **jamais validé** | Absente de tout menu, doublon d'une ancre |
| `admin/dashboard.html` | **à définir** | Le plus gros chantier à venir |
| Pages légales | utilitaire | Standard, pas de cahier des charges |

---

## 4. Ressources transversales

Contenus consommés par plusieurs branches. **Règle : une seule source de vérité, les autres emplacements n'en sont que des vues.**

Le mécanisme existe : `assets/js/sync-mirror.js` aspire des sections de pages piliers et les injecte ailleurs.

| Ressource | Source de vérité | Consommée par |
|---|---|---|
| Palmarès | `paddock/palmares.html` | Académie, karting, accueil |
| Portes d'entrée Académie | `academie.html#portes` | `index.html` (déjà en place) |
| Formules coaching | `coaching.html#formules` | `index.html` (déjà en place) |
| Sessions track | `track.html#sr-grid` | `index.html` (déjà en place) |
| Biographie de JB | à créer | Plusieurs pages |
| Circuits partenaires | à créer | Track-days, stages, référencement local |

**Pourquoi cette règle.** Le jour où le palmarès existe en trois exemplaires indépendants, les trois divergent. C'est la source des conflits permanents.

---

## 5. Le nœud du niveau 3

`track.html` porte quatre sujets et 1191 mots. C'est la plus grosse page du site.

Elle mélange deux publics opposés : le curieux qui veut s'offrir une journée avec une voiture fournie, et le propriétaire qui veut rouler libre avec la sienne.

Elle doit aussi accueillir **trois modèles économiques distincts**, décrits par Yoan :

1. **Moniteur loué** chez un concurrent, sur son événement.
2. **Apporteur d'affaires** : amener ses clients sur un événement concurrent, être leur moniteur, dans les voitures du concurrent. Difficulté principale, la marge.
3. **Location de voiture de course** et accompagnement du client sur l'événement. JB fournit la machine. **Axe prioritaire selon Yoan.**

Plus les **track-days** proprement dits, où JB loue le circuit ou se greffe sur un événement existant et vend le droit de rouler. Peu d'organisation, forte conversion vers le coaching, c'est le format qu'il préfère.

**Besoin fonctionnel identifié** : suivre les événements existants sur lesquels se greffer, y compris ceux occupés par des concurrents. C'est un problème de données, pas de mise en page.

**À arbitrer avec Yoan** : cette page reste-t-elle une page longue à ancres, ou éclate-t-elle en vraies sous-pages ?

---

## 6. Conflits ouverts

| Conflit | Détail | Quand trancher |
|---|---|---|
| « Nos voitures » en double | Ancre `track.html#voitures` référencée par le menu, et page `paddock/nos-voitures.html` invisible | Chantier niveau 3 |
| Ancre `#voiture-perso` | Le menu y renvoie, elle n'existe pas | Chantier niveau 3 |
| Entrée « Boutique 4x sans frais » | Pointe vers un domaine en 404 | Immédiat |
| Pages publiques dans `admin/` | `contact`, `mentions-legales`, `confidentialite` | Au nettoyage |
| `paddock.html#lib` | Lié deux fois, l'ancre réelle est `#blog` | Immédiat |

---

## 7. Ce qui reste à écrire

Un cahier des charges par page maîtresse, au moment d'attaquer la page. Pas tous d'avance.

Ordre suggéré, du plus urgent au moins urgent :

1. **Niveau 3, Stages & Track-Days.** C'est là que se trouve le modèle économique le plus prometteur, et c'est la page la plus cassée.
2. **Niveau 1, Académie.** Le Challenge en était un pilier, il faut le remplacer.
3. **Niveau 0, Accueil.** Dépend de ce que les autres pages racontent.
4. **Niveau 5, Admin.** Le plus gros chantier technique, mais il ne bloque pas les ventes.
