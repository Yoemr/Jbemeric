# Chantier : page compétition

**Date** : 13 août 2026
**Page cible** : `academie/competition.html`
**Statut** : fiche validée, code à venir

---

## Contexte

JB a une expérience de compétition professionnelle (Champion de France Formule Ford 1988, F3, Sport Proto, GT, courses de côte). Il n'a plus de matériel propre. L'offre compétition repose entièrement sur son expertise et ses réseaux, pas sur ses machines.

Il a formé des pilotes qui ont ensuite gagné des championnats. Ces références sont un actif commercial fort, mais les données sont à collecter auprès de Yoan.

---

## Les quatre offres

### Offre 1 : JB coach dans l'écurie du client (principale)

Le client a son équipe et sa voiture. JB intervient en tant que coach sur les week-ends de course : lecture de course, debrief, stratégie. Rien à gérer matériellement pour JB.

C'est le modèle à mettre en avant en premier. Pas de tarif affiché. Formulaire de contact qualifié.

### Offre 2 : Compétitions via écuries partenaires (dashboard dynamique)

JB étudie le marché et noue des partenariats avec des écuries qui ont des places disponibles dans leurs programmes. Il publie ces opportunités sur le site comme des "offres" (même logique que le calendrier track days : contenu géré depuis Supabase par JB via le live-editor).

**Supabase** : nouvelle table `competition_offers` à créer.
Colonnes minimales : `id`, `titre`, `categorie`, `ecuries_partenaire`, `voiture`, `budget_par_manche`, `nb_places`, `statut` (disponible / complet / bientôt), `description`, `visible_site`, `date_debut_saison`.

Le rendu sur la page est une grille de cartes, similaire à la grille track days, avec un bouton de contact par offre.

### Offre 3 : Location voiture/kart via partenaires

Partenaires qui louent des véhicules (kart 125cc confirmé, autres à trouver). JB accompagne le client sur la location. L'offre est présentée comme une carte statique ou dynamique selon le nombre de partenaires.

Structure à définir une fois les partenaires identifiés.

### Offre 4 : Client avec sa propre voiture

Le client a sa voiture de course. JB intervient comme il le ferait dans l'offre 1, mais sans l'écurie intermédiaire. Coaching, setup si besoin, suivi.

---

## Structure de la page

1. **Hero** : sobre, fort. Le palmarès parle. Le texte ne se vante pas.

2. **Palmarès highlight** : même composant HTML que `academie.html` (classes `ac-pal-*`). Copie directe, pas de recode.

3. **Pilotes formés et accompagnés en compétition** : section narrative avec les résultats obtenus par les pilotes encadrés par JB. Texte + noms + championnats gagnés si possible. **Données à fournir par Yoan.**

4. **Les quatre offres** : présentées dans l'ordre ci-dessus. Offre 2 avec le dashboard dynamique.

5. **Formulaire de contact qualifié** : 3 à 4 questions (catégorie visée, situation actuelle, budget approximatif, disponibilités). JB répond avec une proposition.

---

## Ce qui dépend de Yoan

- Données sur les pilotes formés (noms, championnats, années)
- Identification des partenaires location (kart, voitures)
- Validation du modèle de la table `competition_offers` avant qu'on la crée en Supabase

---

## Ce qui n'est pas encore résolu

- Trouver les écuries partenaires (travail de recherche JB + Yoan, hors site)
- Offre 3 : contenu dépend des partenaires

---

## Ordre de construction

1. Refaire le hero et le texte de la page actuelle
2. Intégrer le bloc palmarès (copie depuis academie.html)
3. Créer la table Supabase `competition_offers`
4. Coder le dashboard offres partenaires (offre 2)
5. Ajouter les offres 3 et 4 en statique
6. Ajouter le formulaire de contact
7. Section pilotes formés (quand Yoan fournit les données)
