# Chantier, événements à l'échelle nationale

**Date d'ouverture** : 4 août 2026
**Demandé par** : Yoan
**État** : cadrage, aucune décision prise, aucun code écrit

---

> **Ce document ne décide rien.** Il pose ce qu'on sait, ce qu'on ne sait pas, et les questions à trancher avant d'écrire quoi que ce soit. Aucune page, aucune section, aucune offre n'est créée tant que Yoan n'a pas validé. D-011.

## 1. D'où vient le sujet

Mot de Yoan, 4 août : « Je ne pense pas juste me limiter à la région. Surtout s'il n'y a pas de matériel à transporter. Naturellement il y aura plus en PACA car il vit là, mais faire quelques events à l'échelle nationale peut être une bonne idée. Il le fait déjà un peu. »

Le sujet est apparu en marge du retrait de « PACA » du site. Le retrait est fait et documenté en D-020. Ce chantier-ci porte sur autre chose : non plus la façon de décrire l'activité, mais l'activité elle-même.

## 2. Ce que le raisonnement a de solide

**L'absence de parc est ce qui rend le national possible.** D-009 acte la disparition du matériel comme une contrainte. C'est aussi une libération : une école qui possède des voitures est limitée par le transport, l'assurance et l'immobilisation. Un formateur qui vend sa méthode se déplace seul. Le coût marginal d'un événement à cinq cents kilomètres devient un billet de train et une nuit d'hôtel, plus le temps.

**La preuve existe déjà et elle est publiée.** Le palmarès du site, quarante années de 1986 à 2026, cite Pau plus que tout autre circuit, devant Paul Ricard, puis Nogaro, Dijon, Spa, Magny-Cours, Val de Vienne, avec Monza, Barcelone et Jarama. Un événement à Nogaro ou à Magny-Cours n'est pas une extension hasardeuse, c'est un retour sur des circuits que JB connaît et où son nom a un passé. Comptage dans `docs/04`.

## 3. Ce qu'on ne sait pas, questions à Yoan

Ces questions bloquent le chantier. Aucune n'a de réponse par défaut raisonnable.

1. **« Il le fait déjà un peu », c'est quoi exactement ?** Combien de fois par an, sur quels circuits, à la demande de qui, et sous quelle forme ? Un coaching individuel où le client paie le déplacement n'est pas la même chose qu'une journée organisée avec plusieurs inscrits. Sans cette réponse, on ne sait pas si le chantier consiste à créer une offre ou à rendre visible une offre existante.

2. **Qui organise et qui porte le risque ?** JB loue lui-même la piste et remplit la journée, ou il intervient sur un événement organisé par un tiers, club ou loueur, qui apporte les participants ? Les deux modèles n'ont ni le même risque, ni le même besoin de site.

3. **D'où vient la voiture ?** Le client vient avec la sienne, comme sur les track-days actuels, ou il faut un partenaire local qui fournit ? C'est la question qui décide si le national est vraiment sans logistique.

4. **Quel nombre minimum rend la journée viable ?** `track.html` porte déjà un mécanisme de vote pour ouvrir une session, et une logique de seuil dans `track-render.js`. C'est peut-être exactement l'outil qui convient, mais il faut le chiffre.

5. **Est-ce une offre distincte ou une extension du calendrier existant ?** Une ligne de plus dans les track-days, ou quelque chose qui a son propre nom et sa propre logique ?

## 4. Ce qui existe déjà et qu'il faudrait regarder avant de construire

À vérifier au moment du chantier, pas maintenant.

- **Le mécanisme de vote de `track.html`** permet aux visiteurs de demander l'ouverture d'une session sur un circuit. C'est déjà, dans son principe, un outil de test de demande géographique. Il pourrait dire où sont les clients avant d'engager quoi que ce soit. À noter qu'il ne fonctionnait pas jusqu'au 4 août, voir 6.3 de l'état des lieux.
- **La table `events`** porte un champ `circuit` et un `status`, et `admin.js` gère une liste de circuits avec un champ `region` incluant déjà Occitanie à côté de PACA. La structure de données ne s'oppose pas au national.
- **Aucune fiche Google Business Profile n'existe**, d'après `docs/audit-plateformes.md`. Pour une activité qui se déplace, l'articulation entre présence locale et portée nationale mérite d'être pensée avant de créer quoi que ce soit.

## 5. Risque à garder en tête

Le site vend un homme. Multiplier les lieux peut diluer ce que le positionnement a de dense, ou au contraire le renforcer en montrant que la méthode voyage. Ça dépend entièrement de la façon dont c'est écrit, et c'est une raison de plus pour ne rien publier avant d'avoir tranché les questions de la section 3.

## 6. Prochaine étape

Une discussion avec Yoan sur les cinq questions. Ensuite seulement, une fiche de chantier complète avec un périmètre, et le code s'il y a lieu.
