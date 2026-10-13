# Le site se limite au karting

**Date** : 9 octobre 2026.
**Demande de Yoan** : « Je voudrais qu'on se focus uniquement sur tout ce qui concerne le karting et rien d'autre pour l'instant. On va cacher le reste. C'est-à-dire que ça existe et ne le supprime pas, mais on ne le fait plus apparaître nulle part sur le site. Pour une raison simple : c'est qu'on va pas tarder à le déployer. »

---

## Ce qui reste visible

| Page | Rôle |
|---|---|
| `index.html` | Le hero et l'Académie, rien d'autre |
| `academie.html` | Le hub, deux voies : karting enfant, karting adulte |
| `academie/karting-enfant.html` | La journée enfant |
| `academie/karting-adulte.html` | Le cursus C1 à C5 |
| `admin/legal/contact.html` | La réservation passe par ici |
| `admin/login.html` | L'accès de JB au live-editor |
| Pages légales | Obligatoires pour la mise en ligne |

Le périmètre de l'audit suit cette liste, dans `outil-dev/audit/perimetre.js`.

## Ce qui est masqué

Compétition, Coaching, Événements (et la page d'une date), Paddock, Palmarès, Bibliothèque, la création de compte.

Aucun fichier n'est supprimé. Chaque page reste servie à qui connaît son adresse, mais rien n'y mène et les moteurs de recherche ne l'indexent plus.

## Le mécanisme

**Un réglage pour tout ce qui se voit** : la section 5 de `assets/css/theme.css`. Tout élément qui mène à une page porte `data-route="<clé>"`, la clé étant celle de `assets/js/routes.js`. Une clé listée dans la règle disparaît partout d'un coup :

- les entrées du menu, posées par `nav.js` ;
- les liens du pied de page, posés par `footer.js` ;
- les sections, boutons et liens écrits dans les pages ;
- le miroir de l'Académie sur l'accueil, qui recopie le `data-route` de chaque voie.

Ce qui dépend d'une partie masquée sans être un lien porte aussi sa clé : les trois avis de journées voiture sur l'Académie (`evenements`), les avantages « tableau de bord, tribune, réservations » de la page de connexion.

**Pourquoi un attribut et pas une classe.** Le live-editor calcule l'adresse des textes de JB à partir des classes de chaque élément. Ajouter une classe aurait détaché ses textes. Pour la même raison, un élément masqué reste dans la page : le retirer décalerait la numérotation des anciens contenus.

**Pourquoi pas JavaScript.** La plupart des pages chargent leurs scripts en fin de page : une liste en JS aurait laissé apparaître les sections masquées une fraction de seconde. La règle CSS s'applique avant le premier affichage.

## Ce qui n'a pas pu passer par le réglage

| Où | Quoi | Pour réafficher |
|---|---|---|
| `netlify.toml` | En-tête `X-Robots-Tag: noindex` par page masquée | Retirer le bloc de la page |
| `sitemap.xml` | Pages masquées retirées, listées en commentaire | Remettre le bloc `<url>` |
| `admin/legal/contact.html` | Sujets stage, track-day, coaching, compétition retirés du menu déroulant, listés en commentaire | Remettre les `<option>` |
| Table `faq` | Deux réponses passées à `visible = false` : « Faut-il avoir fait le karting avant d'attaquer la voiture ? » et « Quel budget prévoir ? » (206 S16, Clio Cup). La contrainte `faq_tags_connus` refuse toute étiquette hors `academie`, `coaching`, `evenements`. | `update faq set visible = true where id in ('99eb3655-b614-427d-b21a-5f3a51ae00e4', '61a9b714-b9cc-4c4f-af6c-3524ce78317e');` |
| `academie.html` | Titre de la frise : « Deux âges, une seule méthode » au lieu de « Trois entrées vers la course » | Réécrire si la Compétition revient |

## Ce qui a été corrigé en route, parce que ça cassait le site karting

- **L'Académie de l'accueil était vide depuis le 14 août.** `sync-mirror.js` cherchait la section `#portes`, retirée ce jour-là d'`academie.html`. Il lit maintenant la frise des voies, et chaque voie porte sa photo (`data-photo`) et sa couleur (`data-porte`).
- **Trois textes de base s'affichaient sur le mauvais élément**, dont « 01 de compétition » dans le titre du palmarès. Voir le commit du live-editor du même jour.

## Décisions laissées à Yoan

- **Les avis.** Les trois avis en base parlent de journées voiture. Ils sont masqués sur l'Académie, la page n'a donc plus de preuve sociale. Des avis karting sont à récupérer, la question est dans le questionnaire pour JB.
- **Le palmarès de JB reste affiché sur l'Académie.** Ce sont ses titres en voiture, mais c'est ce qui vend l'homme. Seul le lien vers la page Palmarès est masqué.
- **Le bouton « Se connecter » reste dans le menu**, JB en a besoin pour modifier le site. La page de connexion n'annonce plus rien de ce qui est masqué.
