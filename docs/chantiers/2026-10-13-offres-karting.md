# Trois offres karting : entreprises, colonies, courses

**Ouvert le** : 13 octobre 2026
**Statut** : à valider par Yoan. Aucune page n'est construite avant.

---

## 1. La demande

Yoan, 13 octobre 2026 : « Le karting n'est pas fini. Il propose des comités d'entreprise, aucune page n'y figure. Il organise des événements karting comme des courses. Il fait des stages pour des colonies de vacances aussi. Plusieurs offres manquantes. »

Choix de Yoan le même jour : **trois pages, une par offre**, chacune avec sa propre adresse.

## 2. Ce que le projet sait déjà

- **Les colonies n'entrent pas dans l'Académie** (chantier du 6 août) : l'Académie s'adresse à un particulier qui achète pour lui ou son enfant. Une colonie est un organisme qui achète une prestation de groupe : autre acheteur, autres preuves (diplôme, assurance, capacité, références), autre action (un devis, pas une réservation). Le même raisonnement vaut pour une entreprise.
- **« Ce qui mérite une adresse doit en avoir une »** (chantier du 7 août, décision de Yoan) : un directeur de centre qui cherche « stage karting colonie » doit tomber sur une page qui en parle.
- **Les courses de karting remplacent le Challenge** (même chantier), que la vision demandait d'effacer sans dire par quoi.
- **La chaîne YouTube en montre déjà** : « Course de karting » au circuit d'Hyères, « Soirée karting annuelle », « Challenge karting ».
- **Rien sur les comités d'entreprise**, ni dans le dépôt, ni dans l'empreinte web relevée en août.

## 3. L'arbre proposé

```
Accueil
Académie ▾        Karting enfant · Karting adulte
Groupes ▾         Entreprises et CE · Colonies et centres de loisirs      NOUVEAU
Courses           une page                                                NOUVEAU
Palmarès
```

| Page | Adresse | Raccourci à diffuser |
|---|---|---|
| Entreprises et CE | `/groupes/karting-entreprise.html` | `/entreprises`, `/ce` |
| Colonies et centres de loisirs | `/groupes/karting-colonie.html` | `/colonies` |
| Courses de karting | `/courses-karting.html` | `/courses` |

Le mot « karting » est dans chaque adresse et chaque titre : c'est ce que tapent les gens (« karting entreprise », « karting CE », « stage karting colonie », « course de karting »), à côté des noms des circuits (`docs/04`, la géographie passe par les circuits).

**« Groupes » n'a pas de page à lui.** L'entrée ouvre son sous-menu ; un clic sur ordinateur mène à la première page. Si Yoan préfère deux entrées séparées (Entreprises, Colonies), le menu passe à six entrées, ce qui serre sur un ordinateur portable.

## 4. Ce que contient chaque page

Les trois pages suivent le gabarit de Karting enfant et Karting adulte, qui a fait ses preuves : mêmes composants, même éditeur pour JB, rien de neuf à apprendre pour lui.

1. **Le hero** : une phrase qui dit l'offre, une photo ou une vidéo de JB avec un groupe.
2. **Ce qu'on propose** : les formats (demi-journée, journée, soirée, grand prix, endurance par équipes...), chacun avec durée, taille de groupe et ce qui est inclus.
3. **Comment se passe la journée** : le déroulé heure par heure, comme sur Karting enfant.
4. **Encadrement et sécurité** : JB, son diplôme, l'assurance, le matériel fourni. C'est la preuve qu'un directeur de colonie ou un CE doit trouver avant d'appeler.
5. **Les circuits** : les cinq circuits partenaires, nommés.
6. **Prix** : un prix indicatif si JB en donne un, sinon « sur devis ».
7. **Questions fréquentes** : la FAQ commune, avec un tag par page (`entreprise`, `colonie`, `course`), éditable par Yoan.
8. **Demander un devis** : le formulaire de contact, sujet déjà choisi.

**Courses de karting, en plus** : les prochaines dates, tirées de la table `events` (type « Course de karting »), avec le composant de la page Événements. JB les ajoute depuis son tableau de bord. Si Yoan préfère une page sans dates pour commencer, la section s'ajoute plus tard sans rien casser.

## 5. Ce que Yoan verra quand ce sera fini

- Deux nouvelles entrées dans le menu, Groupes et Courses, sur toutes les pages, téléphone compris.
- Trois pages au style de Karting enfant, avec photos, déroulé, prix ou devis, FAQ, et un bouton de devis qui ouvre le formulaire avec le bon sujet.
- Dans le pied de page, une colonne Groupes.
- Dans Google, trois adresses de plus au sitemap.

## 6. Ce qu'il faut à JB avant d'écrire les textes

Les questions sont dans le questionnaire « Questions pour JB, Académie et karting », section « Entreprises, colonies, courses ». Sans réponse, une page peut être construite avec sa structure et ses photos, mais un prix, un âge, une taille de groupe ou un nom de client ne s'invente pas (`docs/07` 2.8).

## 7. À trancher par Yoan

1. **Le menu** : Groupes ▾ (Entreprises et CE, Colonies) et Courses, comme ci-dessus ?
2. **Les dates des courses** : dès le départ, ou une page de présentation d'abord ?
3. **L'ordre** : construire les trois pages maintenant avec la structure et les textes sûrs, puis compléter avec les réponses de JB ; ou attendre ses réponses ?
4. **Le devis** : le formulaire ouvre aujourd'hui la messagerie du visiteur (D-082). Pour un devis d'entreprise, Netlify Forms enverrait la demande sans messagerie (déjà noté dans `docs/08`).
