# Chantier, l'Académie à trois voies

**Date d'ouverture** : 6 août 2026
**Demandé par** : Yoan
**État** : validé par Yoan, structure livrée. Reste les avis TripAdvisor et les vidéos YouTube du hub.

---

> **Chantier terminé le 7 août.** La page enfant, la page adulte assumée, le renommage symétrique, le menu à trois entrées, le pied de page, le hub à trois voies, les avis sur le hub, le tirage aléatoire des vidéos.
>
> **Réserve sur les avis, 7 août.** Le bloc est en place et partagé avec `coaching.html`, mais le site ne détient que trois avis verbatim, tous sur du track-day ou du coaching en voiture personnelle. Aucun avis de parent. TripAdvisor refuse la lecture automatisée : ces avis se collectent à la main, c'est un travail pour Yoan ou JB, pas pour le code.

## 1. La structure retenue

```
index.html                          aiguillage, inchange

academie.html                       hub de la formation
  academie/karting-enfant.html      NOUVELLE, le parent achete
  academie/karting.html             DEVIENT la page adulte
  academie/competition.html         existe deja

colonies.html                       B2B, plus tard, hors de ce chantier
```

**Pourquoi les colonies ne sont pas sous l'Académie.** Les trois voies s'adressent à un particulier qui achète pour lui ou pour son enfant. Une colonie est un organisme qui achète une prestation de groupe. Acheteur différent, preuve différente (BPJEPS, agrément, assurances, capacité par jour, références), action différente (un devis, pas une réservation). Un directeur de colonie ne se promène pas dans un cursus C1 à C5. Chantier séparé, à ouvrir quand Yoan le décidera.

## 2. Le nom de fichier de la page adulte n'est pas un choix

> **Annulé le 6 août, voir D-025.** Yoan a demandé le renommage symétrique et la mise à jour des bases. La page s'appelle `academie/karting-adulte.html`. La contrainte décrite ci-dessous est réelle, elle est contournée par une table d'alias dans `live-editor.js` et `build-cache.js`, pas par le nom du fichier. Le raisonnement reste ici parce qu'il explique pourquoi cette table existe.

`academie/karting.html` **garde son nom**. Ce n'est pas une préférence, c'est une contrainte technique vérifiée.

`live-editor.js` construit ses clés Supabase sous la forme `PAGE__identifiant`, où `PAGE` dérive du nom de fichier. Le fichier le dit lui-même : « PAGE ne doit pas changer, la modifier orphelinerait tout le contenu déjà enregistré ». Or le cache de cette page contient **21 entrées** préfixées `karting__`, donc 21 textes ou images que JB a lui-même saisis.

Renommer en `karting-adulte.html` les perdrait tous, sans aucun message d'erreur.

**Conséquence assumée** : le nommage est asymétrique, `karting.html` pour l'adulte et `karting-enfant.html` pour l'enfant. C'est laid et c'est le bon choix. À consigner, sinon quelqu'un « corrigera » l'asymétrie un jour et cassera le contenu de JB.

Le raccourci `/karting` de `_redirects` continue de pointer sur la page adulte, sans changement.

## 3. Ce que chaque page doit faire

### `academie.html`, le hub

Existe déjà et porte l'essentiel : hero, voies, palmarès, une section YouTube de 408 mots, une FAQ. Deux modifications :

- La page annonce **« Deux entrées vers la course »**. Elle doit en annoncer trois : enfant, adulte, compétition.
- Ajouter les avis TripAdvisor, aujourd'hui absents alors qu'ils sont la preuve sociale la plus forte du dossier, dix avis à 84 % positifs.

### `academie/karting-enfant.html`, nouvelle

**L'acheteur est le parent, pas l'enfant.** C'est le point qui manque totalement aujourd'hui : le mot « parent » n'apparaît pas une seule fois dans la page karting actuelle.

Ce qu'un parent veut savoir avant de payer : est-ce que mon enfant sera encadré, est-ce que c'est dangereux, à partir de quel âge, combien de temps il roule vraiment, est-ce que je reste sur place, est-ce qu'il va aimer.

Ce qui rassure ici : le BPJEPS, le fait que JB encadre lui-même, les avis d'autres parents, la vidéo. Pas le chrono.

### `academie/karting.html`, la page adulte

Elle est déjà à 90 % une page adulte : cursus C1 à C5, grille d'évaluation, pont vers la compétition. Le travail consiste à retirer les demi-mentions à l'enfant, aujourd'hui tièdes, et à assumer l'angle.

**Un défaut à corriger au passage.** Le hero promet « et pour les meilleurs, **une voiture de course à la clé** ». La section « Et ensuite ? » dit « selon le profil **et le budget** ». La promesse d'accroche annonce une dotation, c'est le vocabulaire du Challenge que D-008 a déclaré mort, et la page se contredit trente lignes plus bas.

## 4. Les vidéos YouTube

Yoan veut des extraits de la chaîne sur le hub. Contrainte : afficher des vidéos réellement aléatoires demande une clé API YouTube, donc un compte développeur et un appel serveur. Hors de la contrainte zéro euro et de la stack.

**Solution retenue** : une liste d'identifiants de vidéos dans `site-data.js`, tirée au sort à l'affichage. Effet identique, aucun coût. Le jour où la chaîne aura ses playlists, on remplace la liste sans toucher aux pages.

## 5. Le menu

`nav.js` porte un sous-menu Académie à deux entrées, « Formation Karting » et « Vers la Compétition ». Il en faudra trois. **Une entrée de menu ne se crée pas sans l'accord de Yoan**, D-011.

Libellés proposés, à valider : « Karting enfant », « Karting adulte », « Vers la Compétition ».

## 6. Hors de ce chantier

- **La boutique.** Non fonctionnelle, encore en chantier, décision de Yoan de ne pas s'en occuper.
- **Les tarifs et les offres.** Pas assez travaillés, et modifiables à tout moment. Ils ne conditionnent pas la structure.
- **Les colonies de vacances.** Voir section 1.
- **La réorganisation de la chaîne YouTube** en playlists, et les réseaux sociaux. Après le site.

## 7. Ce qui a été tranché par Yoan

1. **Fiche validée**, page enfant créée, entrée de menu créée.
2. **Libellés du menu retenus** : « Karting enfant », « Karting adulte », « Vers la Compétition ».
3. **Pages distinctes, aucun lien entre elles**, sauf vers la Compétition. Mot de Yoan : « que ce soit enfants ou adultes, s'ils veulent progresser, l'étape d'après c'est la compétition ». Les demi-mentions à l'enfant ont donc été retirées du cursus adulte sans passerelle en retour.

## 8. Une mise en garde à retenir

Mot de Yoan : les enfants sont aujourd'hui la plus grosse part de marché, **mais c'est aussi ce que JB promeut le plus**. On ne peut pas déduire la demande de l'offre. On structure donc pour bien servir ce marché, sans en conclure qu'il doit prendre le premier rôle sur le site.
