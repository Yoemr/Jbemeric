# Design system

**Chargé par** : rôle `jbe-design`.
**Relevé le** : 1er août 2026, directement dans `assets/css/`. Les valeurs ci-dessous sont celles du code, pas celles d'une intention.

---

## 1. Couleurs

Définies dans `assets/css/theme.css`, bloc `:root`. **Toujours passer par la variable, jamais par la valeur en dur.**

### Les deux couleurs historiques

Décision de Yoan : ce sont les couleurs de JB, elles se conservent quoi qu'il arrive.

| Variable | Valeur | Rôle |
|---|---|---|
| `--Y` | `#FFCF00` | Le jaune du logo |
| `--B1` | `#0a1a4a` | Le bleu nuit du menu |

### Palette complète

**Jaunes**
`--Y` `#FFCF00` · `--Yd` `#C8A000` · `--Ya` `#a88f00` (survol profond)

**Bleus**
`--B1` `#0a1a4a` bleu nuit · `--B2` `#0A3D91` bleu moyen · `--B3` `#0D2F6E` marine foncé · `--B4` `#1252C0` bleu vif · `--BN` `#040a1e` quasi-noir, fonds sombres

**Or**
`--OR` `#C8A000`

> Le commentaire du code dit « doré Challenge ». Le Challenge n'existe plus. La couleur reste utilisable, le commentaire est à corriger.

**Neutres**
`--WH` `#ffffff` · `--BG` `#F3F2EF` beige de l'accueil · `--NK` `#08080f` noir nav et bandeau CTA · `--INK` `#0d0d0d`

**Séparateurs**
`--sep-blue` · `--sep-night` · `--sep-gold` · `--sep-dark`

---

## 2. Typographie

### Ce qui sert réellement

Comptage des occurrences dans `assets/css/` :

| Police | Occurrences | Usage |
|---|---|---|
| **DM Mono** | 507 | Surtitres, libellés, données, mentions techniques |
| **Bebas Neue** | 279 | Titres |
| **Outfit** | 42 | Corps de texte, citations |

### Ce qui est chargé pour rien

| Police | Occurrences | Constat |
|---|---|---|
| **Russo One** | **0** | Chargée depuis Google Fonts, utilisée nulle part. Requête HTTP pure perte. |
| **Cormorant Garamond** | 1 | Une seule utilisation. À supprimer ou à assumer. |

**À traiter** : retirer Russo One des `<link>` Google Fonts. Décider du sort de Cormorant.

### Règle

**Bebas Neue n'a pas de variante italique.** Ne jamais l'utiliser pour une citation. Les citations sont en Outfit.

---

## 3. Architecture CSS

### Le principe

**Scalable.** Ce qui sert à plusieurs pages vit dans le CSS commun. Un fichier par page uniquement pour les exceptions. Écrire deux fois la même règle est une faute.

### Autorité unique

`assets/css/nav.css` est le seul endroit où la nav, le footer et le menu burger sont définis. Rien d'autre ne les redéfinit, jamais.

### État réel des fichiers

16 fichiers CSS. Les plus lourds, après le nettoyage du 7 août :

| Fichier | Poids | Avant | Remarque |
|---|---|---|---|
| `palmares.css` | 40 Ko | 53 Ko | Page rendue en JS. Ne se vérifie pas au pixel, voir `docs/03` 6bis. |
| `index.css` | 28 Ko | 43 Ko | Reçoit du balisage aspiré depuis l'Académie et le Coaching. |
| `academie.css` | 27 Ko | 29 Ko | |
| `paddock.css` | 24 Ko | 46 Ko | Sert aussi `articles.html` et `article.html` |
| `coaching.css` | 20 Ko | 29 Ko | |
| `track.css` | 19 Ko | 24 Ko | |
| `karting.css` | 17 Ko | | Sert `karting-adulte.html` et `karting-enfant.html` |
| `competition.css` | 14 Ko | | |
| `nav.css` | 11 Ko | | Autorité unique de la nav et du pied de page |

`pages.css` et `challenge.css`, décrits ici comme morts, ont été supprimés. Il ne reste aucun orphelin : l'audit signale en faute toute feuille que plus aucune page ne charge.

> `pages.css` était décrit dans l'ancien MEMOIRE comme le pilier de l'architecture CSS, « les règles communes à plusieurs pages ». La convention documentée n'a jamais été appliquée. C'est le meilleur exemple de l'écart entre la documentation d'avril et le code réel.

**Aucune suppression de fichier sans validation individuelle de Yoan.** Retirer une règle morte à l'intérieur d'un fichier ne relève pas de cette règle. L'audit signale les sélecteurs morts, le retrait se fait à la main.

---

## 4. Conventions

**`clamp()` systématique** pour toute taille qui doit s'adapter. Pas de tailles fixes en pixels sur du texte ou des espacements structurants.

**Media queries par composant**, écrites juste après le composant concerné. Jamais regroupées en fin de fichier : on ne retrouve plus rien.

**Pas d'extraction automatique de CSS commun.** Les tentatives passées ont produit des conflits. Toute mutualisation se fait à la main, règle par règle, avec vérification visuelle après chaque extraction.

---

## 5. Patterns

### Citation sur fond sombre

Texte entièrement blanc, italique prononcé, sur fond sombre.

```html
<div class="citation-finale">
  <div class="cf-text">Texte avec <em>emphase</em> possible.</div>
  <div class="cf-source">Auteur · Titre · Année</div>
</div>
```

```css
.cf-text {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(22px, 3.2vw, 42px);
  font-weight: 300;
  font-style: oblique 16deg;
  color: #fff;
  line-height: 1.35;
  max-width: 780px;
}
.cf-text em {
  font-style: oblique 16deg;
  color: #fff;
  display: inline;   /* obligatoire */
}
.cf-source {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,.45);
}
```

**Règle critique** : `em { display: inline }` dans une citation. Un `display: block` sur un `em` provoque des sauts de ligne parasites.

Le pattern inverse, `em { display: block }`, est volontaire sur les titres `.pc-title em` et `.ac-title em` pour l'effet bicolore multi-lignes. Il est interdit dans les citations.

**Guillemets** : `\00AB` pour «, `\00BB` pour », `\00A0` pour l'espace insécable.

---

## 6. Médias vidéo

**Statut : décision reportée au chantier de refonte du design.**

### Ce qui existe

Sept fichiers `.mp4` dans `assets/images/`, 129 Mo au total.

| Fichier | Poids | Format | Durée |
|---|---|---|---|
| Presentation Jbemeric | 43,4 Mo | 1280x720 | 2 min 41 |
| Stage de pilotage Karting pour enfants | 25,3 Mo | **720x1280 portrait** | 1 min 08 |
| Coaching Jbemeric | 21,4 Mo | 640x360 | 4 min 18 |
| Jean Baptiste EMERIC Stages de pilotage | 13,6 Mo | | |
| Les bases du pilotage | 11,0 Mo | | |
| Journee de Stage | 10,2 Mo | | |
| Conseille Karting Jbemeric | 4,5 Mo | | |

Ce sont des vidéos complètes, pas des boucles de fond.

### Le problème actuel

`academie/karting.html` lance en automatique une vidéo de **25,3 Mo au format portrait** comme fond de hero. Lourde sur mobile, et mal cadrée sur écran large. C'est en production aujourd'hui.

### Ce qui a été mesuré

Un extrait de 12 secondes, piste audio retirée, résolution inchangée :

- Presentation : 43,4 Mo devient **1,59 Mo**
- Coaching : 21,4 Mo devient **0,47 Mo**

Le gain vient de la durée, pas de la compression. Un hero n'a pas besoin de deux minutes.

### La direction retenue par Yoan

**Pas de compression uniforme. Une version distincte pour mobile**, la qualité pleine restant sur grand écran.

**Piège technique à connaître** : l'attribut `media` sur les balises `<source>` d'un élément `<video>` n'est pas fiable selon les navigateurs. Il faut sélectionner la source en JavaScript, via `matchMedia`, ou ne servir la vidéo qu'au-dessus d'une largeur donnée et laisser le `poster` seul en dessous.

### Où vivent les vidéos aujourd'hui

Sauf sur `academie/karting.html`, elles ne sont **pas** dans le HTML. Elles sont stockées dans Supabase et injectées au chargement par `live-editor.js`, qui remplace une `<img>` par une `<video>`. Vérifié dans le cache de `academie.html` : `academie__img-1` pointe vers un `.mp4`.

**Conséquence** : si Supabase ne répond pas, les pages sans cache local n'affichent que l'image de secours. `index.html`, `coaching.html`, `track.html` et `paddock.html` ont **zéro entrée** en cache.

---

## 7. Questions ouvertes

1. **Les effets miroir de l'accueil.** Yoan était parti sur des aperçus de chaque page avec effet miroir. Il n'en est plus certain et pense s'être obstiné pour rien. À trancher avec les rôles éditorial et SEO, pas seul.
2. **`palmares.css`, 53 Ko** pour une page rendue en JavaScript. Vérifier ce que ce fichier contient réellement.
3. **Cinq polices chargées, trois utilisées.** Décider du sort de Russo One et Cormorant Garamond.
