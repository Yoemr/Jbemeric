# Dashboard karting : formules et dates

7 novembre 2026. Demande de Yoan après un appel avec JB : « il doit pouvoir créer des formules, les modifier, et les supprimer. Pareil pour les dates et les prochains events. On s'occupe uniquement du karting. » Ordre choisi par Yoan : le dashboard d'abord, puis la protection d'écriture, la réservation avec paiement (195 € payés en entier, journées par date et bons cadeaux), les emails.

## Ce que JB verra

`admin/gestion.html`, ouverte par le bouton « Dashboard » de la barre d'édition, deux onglets karting en tête :

- **Formules** : la liste de ce que JB vend. Créer, modifier, supprimer. Nom, prix, unité, places par date, ce qui est compris, case « vendable en bon cadeau ».
- **Dates karting** : une formule, une date, un circuit ; prix et places repris de la formule quand ils sont laissés vides. « Afficher sur le site » la fait apparaître dans la section Dates de l'accueil et de l'Académie (dates.js).

Veille et Track-days sortent de la barre tant que le site reste karting (balises script en commentaire, fichiers conservés). FAQ et Avis restent.

## Base

`outil-dev/migrations/2026-11-07-formules-karting.sql`, appliquée le 7 novembre : natures `karting` et `groupe`, colonnes `description`, `places_defaut`, `bon_cadeau`, lecture publique des formules actives, `events.formule_id`, quatre formules de départ d'après les réponses de JB.

## Code

`gestion.js` : options génériques `restreindre` et `completer`. Onglets `gestion-formules.js` et `gestion-dates-karting.js`.

## Hors de ce chantier

Réservation, paiement, bons cadeaux, emails : fiches suivantes.
