# Retenir une date, et la chiffrer

**11 août 2026. Fiche de cadrage, en attente du oui de Yoan. Rien n'est construit.**

Demande de Yoan : « il faut qu'on crée l'interface pour l'étape d'après. Je te balance l'idée brute pour la compréhension mais 100 % de l'idée et de la technique est questionnable. »

---

## 1. Ce qui existe déjà, à ne pas refaire

**Créer un événement à la main existe.** Onglet Track-days, bouton « + Nouveau ». Le formulaire porte déjà date, circuit, type, mode, prix, `cout`, places, statut, visibilité, photo, résumé, description et adresse de page. C'est ce dont JB a besoin quand il appelle un circuit et réserve lui-même.

Ce qui lui manque, c'est le calcul. Il saisit un prix, il ne sait pas d'où il sort.

**Retenir depuis la Veille existe aussi.** Le bouton ouvre un formulaire prérempli avec ce que la source publie, et appelle `veille_creer_evenement`. C'est cette fenêtre-là qui doit grandir.

---

## 2. Le principe proposé : des lignes, pas des cas

Mot de Yoan du 10 août : « on est typiquement dans l'exemple où on commence à gérer du cas par cas, ça ne me plaît pas comme approche, car il y a toujours des exceptions qui échappent aux règles. »

Modéliser cinq modes avec cinq calculs différents, c'est exactement ça. Et sa remarque du 11 août le confirme : « ça peut être multi-choix, tu peux à la fois te greffer à quelqu'un et en plus faire du coaching. »

**Donc on ne modélise pas des modes. On modélise deux sortes de lignes.**

### Ce que JB avance

Ce qu'il sort de sa poche pour que la journée existe, que quelqu'un s'inscrive ou non.

| Exemple | Montant |
|---|---|
| Location du box | à saisir |
| Location du circuit entier | à saisir |
| Frais personnels (route, repas, hôtel) | prérempli, valeur par défaut réglable |

### Ce que JB vend

Ce qu'un client peut acheter ce jour-là. Chaque ligne porte un prix, et le coût unitaire qu'elle consomme.

| Exemple | Prix | Coût unitaire |
|---|---|---|
| Coaching journée | à saisir | 0, c'est du temps |
| Coaching demi-journée | à saisir | 0 |
| Coaching à la session | à saisir | 0 |
| Place dans le box | à saisir | box ÷ nombre de places |
| Roulage revendu | à saisir | ce que le circuit facture à JB |

**Les modes deviennent des préremplissages, pas des catégories.** Choisir « greffe » pose la ligne de frais personnels. Choisir « box partagé » pose la dépense du box et l'offre « place dans le box ». Choisir les deux pose les trois lignes. Le multi-choix marche tout seul, parce qu'il n'y a rien à combiner : ce sont des lignes qui s'ajoutent.

**Le prérempli intelligent que Yoan demande** tombe alors naturellement : une date dont la source est le circuit lui-même ne peut pas être organisée par JB. `entier` est retiré des propositions, `greffe` et `coaching` sont proposés d'office. La règle est déjà en base, c'est `veille_sources.circuit_id`.

---

## 3. Les trois cas de figure de Yoan, vérifiés contre le modèle

| Son cas | Ce que ça donne en lignes |
|---|---|
| Le client a déjà payé sa journée à l'organisateur et prend juste du coaching | Une offre « coaching », pas de dépense sauf les frais personnels |
| Le client passe par JB, qui a eu un tarif préférentiel et prend une marge | Une dépense « roulage » au tarif JB, une offre « roulage » au tarif client. La marge est la différence |
| Box partagé, un client seul paierait le box entier | Une dépense « box », une offre « place dans le box » dont le coût unitaire est le box divisé par le nombre de places. Plus il y a de pilotes, moins chacun paie, et la marge de JB monte |

Les trois passent sans une ligne de code spécifique. C'est le test que je voulais faire avant de proposer quoi que ce soit.

---

## 4. Ce que JB verra à l'écran

Une fenêtre en deux colonnes. À gauche il saisit, à droite le calcul suit à chaque frappe.

```
  RETENIR LA DATE DU 13 SEPTEMBRE, CIRCUIT DU LUC

  Ce que je fais ce jour-là          Ce que ça donne
  [x] Je me greffe                   J'avance          380 €
  [x] Je fais du coaching            Il me faut         2 clients pour rentrer
  [ ] Je loue un box                 dans mes frais
  [ ] Je loue le circuit
                                     Le client paie
  Ce que j'avance                    de 190 € à 440 €
  Frais personnels     [ 200 ] €
  Roulage (tarif JB)   [ 180 ] €     Si 4 clients prennent
                                     la journée
  Ce que je vends                    je gagne          380 €
  Coaching journée     [ 380 ] €
  Coaching demi-j.     [ 190 ] €
  Roulage revendu      [ 220 ] €

  Marge visée  [ 60 ] %   [appliquer]

  Description  [ reprise de ce que le circuit publie ]

  [ Annuler ]            [ Créer, sans publier ]  [ Créer et publier ]
```

Les chiffres de l'exemple sont inventés pour montrer la forme. Aucun ne sera écrit dans le code.

---

## 5. Les deux points où je ne veux pas trancher seul

### 5.1 « Marge de 60 % », deux lectures

Yoan : « un bouton marge de bénéfice, avec une suggestion de 60 %. J'avais entendu ça dans un podcast, je sais pas si c'est vrai. »

Sur un coût de 500 € :

| Lecture | Formule | Prix | Ce que JB garde |
|---|---|---|---|
| Marge commerciale, la définition comptable | prix = coût ÷ (1 − 0,60) | 1 250 € | 750 €, soit 60 % du prix |
| Coefficient, la lecture courante | prix = coût × 1,60 | 800 € | 300 €, soit 37,5 % du prix |

Le podcast disait probablement la première, c'est la définition d'une marge. C'est aussi la plus agressive.

**Ce que je propose** : le champ dit « marge » et applique la première, et l'écran affiche à côté « soit un prix multiplié par 2,5 ». Le chiffre parle de lui-même, et JB descend le pourcentage s'il le trouve haut. Un mot de Yoan suffit pour basculer.

### 5.2 Le roulage revendu, qui encaisse

Quand un client passe par JB pour sa journée de piste, est-ce que JB encaisse la totalité et paie le circuit, ou est-ce que le client paie le circuit et JB ne prend que sa part ?

Ça ne change pas l'affichage, ça change qui porte le risque si personne ne vient. Le modèle sait faire les deux, il faut juste savoir lequel est vrai.

---

## 6. Ce que ça demande en base

Trois tables, aucune colonne existante détruite.

```
formules                le catalogue, écrit une fois, réutilisé partout
  id, cle, libelle, nature, unite, prix_conseille, actif, ordre

event_depenses          ce que JB avance sur cette date
  id, event_id, libelle, montant, quantite

event_offres            ce qu'un client peut acheter ce jour-là
  id, event_id, formule_id, libelle, prix, cout_unitaire, places, ordre
```

`events.prix` et `events.cout` restent, calculés à partir des lignes : `prix` devient l'offre la moins chère, `cout` le total avancé. Rien de ce qui lit ces deux colonnes aujourd'hui ne casse.

`mode` reste, comme étiquette et comme préremplissage. Il devient multi-valeur.

Le catalogue `formules` est ce qui évite de retaper « coaching journée » à chaque date. C'est aussi ce qui permettra un jour de changer un tarif partout d'un coup.

---

## 7. Ce qui n'est pas dans ce chantier

- **La publication automatique sur les réseaux sociaux.** Demandée par Yoan pour plus tard, explicitement non fonctionnelle pour l'instant. Elle est déjà notée dans `docs/08` section D.
- **La description semi-automatique.** Elle reprendra ce que la source publie, ce que la veille sait déjà faire. Les gabarits et l'éventuelle IA sont un chantier suivant, et Yoan a déjà posé la réserve : « attention aux coûts et à la véracité ».
- **La page publique.** Ce chantier ne touche que le dashboard. Ce que le visiteur voit changera quand les prix seront justes, pas avant.

---

## 8. Ordre proposé

1. Les trois tables et le catalogue de formules, vides.
2. Le calcul, en base, pour qu'il soit le même partout et testable sans navigateur.
3. La fenêtre de « Retenir », avec le panneau de droite qui suit la frappe.
4. Le même panneau branché sur « + Nouveau » de l'onglet Track-days, pour la date que JB réserve lui-même au téléphone.
5. Les parcours, dont un par cas de figure de la section 3.

Chaque étape est publiable seule. La 4 est ce qui répond à « parfois mon père appelle les circuits et réserve une date, et c'est lui qui remplit ».
