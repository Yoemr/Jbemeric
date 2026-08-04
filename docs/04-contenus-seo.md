# Contenus et référencement

**Chargé par** : rôle `jbe-editorial`.
**Établi le** : 1er août 2026.

---

## 1. Les deux interdits absolus

1. **Jamais de tiret cadratin.** Le caractère `—` est proscrit. Virgule, deux points, parenthèse ou point.
2. **Jamais de ton IA.** Pas de phrasé lisse et symétrique. Pas de « ce n'est pas X, c'est Y ». Pas de tricolons décoratifs. Pas de conclusion grandiloquente qui résume ce qui vient d'être dit.

Ces deux règles priment sur toute considération de style. Relire et supprimer avant de rendre.

Le reste de l'écriture est libre.

---

## 2. Ce qu'on vend

**Un homme et sa méthode.** Le parc de voitures n'existe plus, il ne peut plus servir d'argument.

Jean-Baptiste Emeric, 37 ans d'enseignement, a accompagné de nombreux pilotes jusqu'à la compétition. C'est l'expérience qui est le produit.

### Mort, ne plus jamais mentionner

- Le **Challenge JB EMERIC** et sa dotation BMW 325i HTCC
- Le **parc de 18 voitures**
- Le positionnement **« école qui possède son matériel »**
- Le **parcours linéaire en 5 niveaux** vers la compétition

> La `<meta description>` de `academie.html` vend encore « De karting enfant à la compétition BMW HTCC. 5 niveaux progressifs ». À corriger.

---

## 3. Référencement

### Le local vise les circuits, pas le domicile

Personne ne se rend à l'adresse de l'entreprise, l'activité se déroule sur des circuits. Les clients cherchent « stage de pilotage Paul Ricard », « track day Lédenon », « circuit du Luc », pas « école de pilotage Aubagne ».

**Circuits recensés sur l'ancien site pour 2026** : Alès, Le Luc, Grand Sambuc, Paul Ricard au Castellet, Ventabren, Lédenon, Dijon, Nogaro, Barcelone, Spa-Francorchamps, Monza.

Onze lieux, dont trois à l'étranger. C'est un gisement de référencement que le nouveau site n'exploite pas.

**Karting** : Aubagne, Cuges-les-Pins, Trets, Hyères, La Penne-sur-Huveaune.

### La géographie s'exprime par les circuits, jamais par une région

**Règle.** Un circuit est un mot-clé, une région est une limite. On nomme les circuits, y compris les étrangers quand la page s'y prête. On n'annonce pas de région.

Une région ne se mentionne que lorsqu'elle répond à une question réelle du lecteur. Exemple retenu : la FAQ de `coaching.html`, à la question « le coaching se fait sur quel circuit ? », énumère les cinq partenaires karting et situe l'ensemble. La mention y est un service, pas une étiquette.

**Pourquoi, au-delà de la préférence.** Personne ne tape « stage de pilotage PACA ». Les requêtes portent des noms de circuits. Ces requêtes sont plus précises, plus recherchées, et JB y est légitime là où peu de monde peut opposer trente-sept ans de présence.

**Le palmarès du site le prouve déjà.** Comptage des mentions de circuits dans `assets/js/site-data.js`, sur les quarante années de 1986 à 2026 :

| Hors région | | En région | |
|---|---|---|---|
| Pau | 62 | Paul Ricard | 46 |
| Nogaro | 25 | Aubagne | 13 |
| Dijon | 20 | Le Luc | 10 |
| Spa | 18 | Grand Sambuc | 4 |
| Magny-Cours | 17 | Castellet, Alès, Trets | 5 |
| Val de Vienne | 11 | | |
| Charade, Le Mans, Mugello, Jarama, Monza, Barcelone, Albi, Croix-en-Ternois | 17 | | |

Ce sont des occurrences de texte et non un décompte d'épreuves, donc un ordre de grandeur. L'écart reste sans ambiguïté : Pau est le circuit le plus cité de tout le site, devant Paul Ricard, et les lieux hors région dominent largement. La page palmarès affirmait donc une carrière nationale et internationale pendant que les balises `title` annonçaient une école régionale.

**La région reste une réalité pratique, pas une promesse.** JB vit dans le Sud, il y aura donc naturellement plus d'activité là. C'est une conséquence, on ne l'écrit pas. Un lecteur de Lyon ne doit jamais conclure d'une balise que ce n'est pas pour lui.

Voir D-020 pour le raisonnement complet, notamment le lien avec l'absence de parc.

### Règles de balisage

- **Une canonique désigne l'URL finale**, jamais une URL qui redirige. Neuf pages sont en faute, voir `docs/05-etat-des-lieux.md`.
- **Un `<h1>` par page.** Jamais zéro, jamais deux. Manquant sur `paddock.html`, `admin/login.html`, `admin/signup.html`, `admin/dashboard.html`.
- **Les balises alt décrivent l'image réelle** et son contexte. Pas de motif générique appliqué mécaniquement.
- **`paddock/article.html` n'a ni titre, ni description, ni canonique.** Les 29 articles importés n'ont aucun contenu indexable, tout est rendu en JavaScript.

### Anomalie prioritaire

`admin/legal/contact.html` déclare comme canonique la page d'accueil. Cela indique à Google que la page contact est un doublon de l'accueil, ce qui conduit à sa désindexation.

---

## 4. Ce qu'on ne touche pas

**Le texte saisi par l'utilisateur dans le live-editor.** Ni le contenu, ni la casse, ni la ponctuation. Ce que JB écrit lui appartient.

---

## 5. Glossaire métier

Conservé de la documentation d'avril 2026. Le vocabulaire technique reste valable, les références au Challenge sont supprimées.

### Karting

- **C1 à C5** : grille d'évaluation interne. C1 débutant (position, trajectoires de base), C5 niveau compétiteur. Passages de niveau validés par JB sur critères objectifs, chronos et technique.
- **Trail braking** : freinage dégressif, on continue à freiner légèrement en entrée de virage pour transférer le poids sur l'avant. Technique avancée, niveau C4 à C5.

### Compétition automobile

- **HTCC** : Historic Touring Car Cup, championnat de voitures de tourisme historiques.
- **FFSA** : Fédération Française du Sport Automobile. Délivre les licences nécessaires pour courir.
- **BPJEPS** : diplôme d'État obligatoire pour enseigner le sport automobile. JB en est titulaire.
- **Mitjet** : discipline monotype à budget maîtrisé, châssis tubulaire, moteur 1.6. Très populaire pour entrer en compétition.
- **Clio Cup** : monotype Renault, voiture de série préparée. Porte d'entrée classique en tourisme.
- **Formule Renault** : monoplace école, tremplin vers les formules plus avancées.

### Types d'offres

- **Stage** : journée unique, à but découverte ou loisir. Voiture fournie.
- **Track-day** : journée libre sur circuit, le client vient avec sa propre voiture.
- **Coaching** : accompagnement personnalisé, souvent sur la voiture du client.
- **Formation** : parcours structuré avec progression, par opposition au stage unique.
- **Cursus** : mot à éviter, remplacé par « Formation ».
- **Challenge** : **mort.** Ne plus employer.

### Vocabulaire propre à JB

- « Sur un circuit, on ne peut pas tricher »
- La distinction entre **pilote** et **pilote de loisir**
- « Un pilote ne s'invente pas »

---

## 6. Empreinte web

Voir `docs/audit-plateformes.md` pour l'inventaire complet des quatorze présences.

Points qui concernent l'éditorial :

- **Deux pages Facebook** existent. Toute publication doit viser une seule d'entre elles.
- **La page Challenge est encore en ligne** sur `jbemeric.com/challenge-jb-emeric/` et indexée.
- **Des tarifs circulent chez un revendeur** : karting à 89 €, stage 3x6 tours à 207 €. Ils entreront en concurrence avec ceux du nouveau site.
- **Dix avis TripAdvisor pour 37 ans d'activité**, à 84 % positifs. La preuve sociale est très sous-exploitée alors que tout le positionnement repose sur la réputation d'un homme.
- **Aucune fiche Google Business Profile trouvée.** Pour une activité locale, c'est le support le plus important. Si elle est créée, elle doit l'être en zone de service, sans adresse visible.

---

## 7. Coordonnées

- **06 60 18 87 87**, mobile, confirmé actif. C'est le numéro sûr.
- **04 42 32 87 87**, fixe, statut incertain. C'est pourtant le seul affiché sur les supports externes.
- Siège administratif : 475 Chemin du Bon Civet, 13400 Aubagne. SIRET 38095916300037.
- École créée en **1989**. JB a commencé la compétition en **1986**.

**Attention aux chiffres.** « 40 ans de compétition » compte depuis 1986, « 37 ans à former des pilotes » depuis 1989. Les deux sont justes et ne se contredisent pas. Ne pas « corriger » l'un vers l'autre.
