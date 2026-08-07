# Audit du site

`node outil-dev/audit/audit.js`

Calcule l'état du site au lieu de le consigner à la main. Aucune dépendance, Node pur, trois secondes.

```
node outil-dev/audit/audit.js            rapport complet
node outil-dev/audit/audit.js --court    une ligne par règle
node outil-dev/audit/audit.js --json     sortie machine
node outil-dev/audit/audit.js liens css  seulement ces règles
```

Le code de sortie vaut 1 s'il reste une faute, 0 sinon.

---

## Pourquoi cet outil existe

`docs/05-etat-des-lieux.md` était un relevé écrit à la main. Un document périme dès qu'on ferme la session, donc chaque session recommençait l'archéologie : recompter les tirets, revérifier les canoniques, rechercher les images manquantes. Le 4 août 2026, deux affirmations de ce relevé se sont révélées fausses.

Pire, à chaque vérification un script jetable était fabriqué sur le moment, et c'est presque toujours l'instrument qui était faux, pas le site : un `grep` qui incluait `old/`, un banc d'essai qui oubliait un conteneur, une capture prise serveur éteint.

D'où la règle : **ce qui est mesurable est mesuré par cet outil, une fois pour toutes. Le jugement reste aux humains, dans `docs/06-decisions.md` et les fiches de chantier.**

## Le périmètre

`perimetre.js` déclare les pages qui comptent, sur décision de Yoan du 4 août 2026 : « je veux un focus sur index, académie, karting adulte et enfant, compétition, coaching, track et paddock. Les autres pages honnêtement je m'en fous un peu. »

Un défaut sur une de ces pages est une faute qui fait échouer. Un défaut ailleurs est relevé, rangé à part, sans conséquence sur le code de sortie, et masqué par défaut. Il ne disparaît pas, il cesse d'occuper la place.

```
node outil-dev/audit/audit.js --tout   voir aussi le hors perimetre
```

Une feuille de style ou un script suit ses pages : chargé par au moins une page du périmètre, il est dans le périmètre.

Effet mesuré à la mise en place : 7 fautes deviennent 2, et ces deux-là sont sur des pages que Yoan travaille vraiment.

## Les trois niveaux

| Niveau | Sens | Fait échouer |
|---|---|---|
| `FAUTE` | Contredit une décision actée, ou casse quelque chose | oui |
| `tache` | À nettoyer, sans conséquence visible | non |
| `signal` | Demande un jugement humain | non |

Un `signal` n'est pas un défaut. « Six mentions de région dans le corps de `track.html` » est une information, pas un reproche : la décision D-020 autorise la région quand elle répond à une question du lecteur.

## Ajouter une règle

Un fichier dans `regles/`, exportant trois champs.

```js
module.exports = {
  id: 'monsujet',
  titre: 'Ce que la regle verifie',
  reference: 'D-0xx, ou la section de doc qui la justifie',
  executer(ctx) {
    return { anomalies: [{ niveau: 'faute', ou: 'chemin', quoi: 'description' }], resume: 'une ligne' }
  },
}
```

Il est chargé automatiquement, l'ordre alphabétique du nom de fichier fixe l'ordre d'affichage.

## Le contexte

`contexte.js` lit le site **une seule fois** et passe le résultat à toutes les règles. Une règle ne relit jamais le disque.

| Champ | Contenu |
|---|---|
| `ctx.pages[]` | `chemin`, `html` brut, `utile` sans le cache live-editor, `visible` sans les commentaires, `sansScripts`, `classes`, `ids`, `balises`, `feuilles` |
| `ctx.css[]`, `ctx.js[]` | `chemin`, `source`, `code` sans commentaires |
| `ctx.classesJs` | les noms de classes que les scripts savent fabriquer |
| `ctx.routes` | les chemins déclarés par `routes.js` |

## Cinq pièges, tous rencontrés pour de vrai

**Le contenu construit en JavaScript.** Les classes du calendrier de `track.html` n'existent dans aucun fichier HTML, elles sont fabriquées par `track-render.js`. Une règle qui ne regarde que le HTML les déclare mortes et conseille de supprimer un style indispensable. D'où `ctx.classesJs`.

**Le texte saisi par JB.** Le bloc `jbe-content-cache` contient ce qu'il a écrit dans le live-editor. Aucune règle ne doit le juger, ce n'est pas notre écriture. `ctx.pages[].utile` l'a déjà retiré.

**L'outil qui se signale lui-même.** La règle des tirets cadratins contenait le caractère qu'elle traque, la règle de référencement contient le mot « PACA ». Écrire le motif par son code Unicode, ou exclure `outil-dev/audit/`.

**Le nom de fichier trouvé dans un commentaire.** Chercher `sync-mirror.js` dans tout le HTML tombe sur `<!-- Chargé par sync-mirror.js -->` et signale un faux désordre de chargement. Lire les balises `<script src>`, pas le texte.

**La propriété CSS cherchée sans son sélecteur.** La règle `defilement` cherchait `scroll-snap-type` n'importe où. `palmares.css` le déclare sur un carrousel interne et passe avant `snap.css` dans l'ordre alphabétique : la règle a donc inspecté `palmares.html` et annoncé « aucune faute » sur des pages qu'elle n'avait jamais lues. Vérifier sur quel sélecteur la propriété est posée, et passer par `ctx.pages[].feuilles` pour savoir qui charge quoi.

> **Une règle qui ne dit jamais rien est indiscernable d'une règle correcte.** Avant de la garder, fabriquer un témoin qui porte le défaut, vérifier qu'elle le signale, puis supprimer le témoin. C'est ce qui a démasqué le piège ci-dessus.

## Ce que l'outil ne sait pas faire

Il ne rend rien à l'écran. Il ne dira jamais qu'un filet est invisible sur fond sombre, ni qu'un texte est illisible : ce sont des questions de cascade et de contraste qui demandent un navigateur.

Il ne voit pas la base Supabase.

Il ne juge pas la qualité d'un texte. C'est le travail du rôle éditorial.
