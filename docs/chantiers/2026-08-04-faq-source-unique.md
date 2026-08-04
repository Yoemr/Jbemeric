# Chantier, la FAQ à source unique

**Date d'ouverture** : 4 août 2026
**Demandé par** : Yoan
**État** : cadrage, aucune ligne de code écrite

---

> **Ce document ne décide rien.** Il vérifie la faisabilité de l'idée, expose la contrainte qu'elle doit absorber, et propose une conception. Rien n'est construit avant validation.

## 1. L'idée, dans les mots de Yoan

« Faudrait que tout le contenu et les questions soit stocké au même endroit. En revanche uniquement les questions pertinentes sont chargées sur les pages en question. L'idée est que si on modifie les questions elle s'update sur les pages où elle y est également. Le scaling. »

## 2. L'état réel de la FAQ

Cinq pages en portent une : `academie.html`, `academie/karting.html`, `academie/competition.html`, `coaching.html`, `track.html`. Cinq questions chacune, écrites en dur dans le HTML.

**Le comportement est déjà mutualisé.** `assets/js/faq.js` est un accordéon universel, sans contenu, chargé par les cinq pages. Il n'y a rien à faire de ce côté.

**Le contenu n'est presque pas dupliqué aujourd'hui.** Une seule question apparaît sur deux pages, « Puis-je venir avec ma propre voiture ? », sur `coaching.html` et `track.html`. Et les deux réponses diffèrent légitimement : le coaching parle d'adaptation à la machine, le track-day parle d'état de marche du véhicule.

**Conséquence à assumer** : le gain immédiat est proche de zéro. La valeur du chantier est structurelle. Elle apparaît le jour où la FAQ grossit, où une même question vit sur trois pages, ou où un tarif cité dans une réponse change.

## 3. La contrainte décisive, vérifiée

**JB peut déjà éditer la FAQ depuis le live-editor.** Les `.fq-q` et `.fq-a` sont des `div` sans enfant de bloc ni lien, donc ils passent tous les filtres du scan universel de `live-editor.js`. Ils sont indexés et modifiables.

Ses modifications partent dans la table Supabase `site_content`, sous une clé de la forme `PAGE__identifiant`. Vérifié dans le cache figé de `academie/karting.html`, qui porte des clés comme `karting__kart-fmt-kicker`.

**Deux conséquences.**

1. **La clé contient la page.** La même question sur deux pages produit deux lignes en base. Une modification de JB sur une page ne se propage pas à l'autre. Le mécanisme actuel est structurellement l'inverse de ce que demande l'idée.

2. **Un rendu par JavaScript détruirait deux choses.** Le texte de la FAQ disparaîtrait du HTML, donc de ce que lit un moteur de recherche : c'est exactement le défaut qui rend les 29 articles WordPress invisibles, documenté en 2.5 du relevé. Et l'indexation du live-editor a lieu au chargement, donc du contenu injecté après pourrait ne pas être vu par le scan.

## 4. Le mécanisme existe déjà dans le projet, sous une autre forme

`outil-dev/build-cache.js` lit Supabase et **recuit le contenu dans le HTML** avant publication. Il est déclaré dans `netlify.toml` comme commande de build. Le projet sait donc déjà faire « une source, un script, du HTML statique en sortie ».

C'est le modèle à reprendre, pas celui de l'injection au chargement.

## 5. Conception proposée

**Source unique** : un fichier de données, sur le modèle de `site-data.js`. Chaque question porte un identifiant stable, son texte, sa réponse, et la liste des pages où elle apparaît.

**Génération au build** : un script écrit le balisage de la FAQ dans chaque page concernée, entre deux marqueurs de commentaire. Le HTML livré reste statique, donc lisible par Google et indexable par le live-editor.

**Ce que ça donne** : modifier une question dans le fichier de données mettra à jour toutes les pages qui la portent, au prochain build. C'est exactement la demande.

## 6. La question qui reste ouverte, et qui est la vraie difficulté

**Que devient une modification faite par JB dans le live-editor ?**

Elle est stockée dans Supabase et elle gagne au moment de l'affichage, puisque le live-editor écrase le texte du HTML. Donc après ce chantier, la FAQ aurait toujours deux sources : le fichier de données pour nous, Supabase pour JB. Et celle de JB l'emporterait en silence.

Trois issues possibles, à trancher par Yoan :

1. **La FAQ sort du périmètre du live-editor.** Elle devient un contenu de rédaction, modifié dans le fichier de données uniquement. Simple et sans ambiguïté, mais retire à JB une capacité qu'il a aujourd'hui.
2. **Le live-editor écrit dans la source, pas seulement dans Supabase.** Cohérent avec l'idée, mais c'est un vrai chantier technique et ça touche le composant le plus délicat du site.
3. **On accepte les deux sources**, en posant que Supabase prime et que le fichier de données ne sert qu'au premier remplissage. C'est le moins de travail, et c'est aussi ce qui recrée exactement le problème qu'on veut supprimer.

Sans réponse à cette question, le chantier ne peut pas commencer : elle détermine sa taille, du simple script à la modification du live-editor.

## 7. Autres points à trancher

- **Une réponse peut-elle varier selon la page ?** Le cas « Puis-je venir avec ma propre voiture ? » dit que oui. Il faut donc soit autoriser une réponse par page pour une même question, soit accepter deux questions distinctes qui se ressemblent.
- **L'ordre des questions** est-il propre à chaque page, ou déduit de la source ?
- **Le rendu doit-il rester identique ?** Le balisage actuel diffère un peu d'une page à l'autre, et le CSS de la FAQ est éclaté dans sept fichiers. Voir la question posée au rôle design le 4 août.

## 8. Prochaine étape

Une décision de Yoan sur la section 6, puis une fiche complète avec périmètre et étapes.
