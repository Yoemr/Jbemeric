# JB EMERIC, école de pilotage

Point d'entrée. Chargé automatiquement à chaque session. Court par construction.

**Interlocuteur** : Yoan, fils de Jean-Baptiste Emeric. Il décide de tout.
**Langue de travail** : français.

---

## 1. Le projet en trois phrases

Jean-Baptiste Emeric, 65 ans, 37 ans d'enseignement du pilotage. L'entreprise a fait faillite vers 2014 et n'a presque plus de matériel. Le projet consiste à monétiser son expérience sans parc de voitures et sans charge de maintenance.

**Le site ne vend plus un parc. Il vend un homme et sa méthode.**

Détail complet dans `docs/00-vision.md`. À lire avant toute décision éditoriale ou stratégique.

---

## 2. Écriture, deux interdits absolus

1. **Jamais de tiret cadratin.** Le caractère `—` est proscrit partout, dans le site comme dans les réponses en conversation. Utiliser une virgule, deux points, une parenthèse ou un point.
2. **Jamais de ton IA.** Pas de phrasé lisse et symétrique, pas de « ce n'est pas X, c'est Y », pas de tricolons décoratifs, pas de conclusions grandiloquentes.

Le reste de l'écriture est libre.

---

## 3. Gouvernance

- Travail **en local**. Modifications de fichiers et commits sur branche de travail : autorisés.
- **Jamais de push. Jamais de déploiement.** Yoan pousse lui-même, environ une fois par jour.
- **Aucune page, aucune entrée de menu, aucune section n'est créée sans accord explicite de Yoan.** Des pages ont été créées sans autorisation par le passé, c'est une cause directe du désordre actuel.
- **Aucune suppression de fichier sans validation individuelle.**
- `docs/00` à `04` : modification sur validation. `docs/05` et `06` : écriture libre, avec résumé en fin de chantier.

---

## 4. Méthode

1. **Cadrer avant de construire.** Un chantier qui touche plus d'une page ou modifie une structure commence par une discussion, puis une fiche courte dans `docs/chantiers/` validée par Yoan. Une retouche ponctuelle se fait directement.
2. **Règle des 95 %.** Aucune modification de code si la solution n'est pas sûre à 95 %. Dans le doute, poser une question précise.
3. **Deux tentatives maximum sur un bug.** Au-delà, arrêt et changement d'approche. Aucun retour arrière sans énoncer la cause racine.
4. **Vérifier, pas affirmer.** Une anomalie se prouve par un test, pas par une lecture de code. **Commencer par `node outil-dev/audit/audit.js`**, jamais par une exploration à la main : l'état du site est calculé, pas rédigé. Ne pas se fier à `docs/05` pour ce qui est mesurable.
5. **Le périmètre avant tout le reste.** Huit pages comptent : index, académie, karting, compétition, coaching, track, paddock, palmarès. Un défaut ailleurs se signale, il ne se corrige pas sans demander.
6. **Fin de chantier** : mise à jour de `docs/05-etat-des-lieux.md` et `docs/06-decisions.md`, puis résumé court.

---

## 5. Code

Deux principes, formulés par Yoan comme « scalable et universel ».

**Scalable.** Ce qui est commun est écrit une seule fois et intégré par les pages. La nav est codée dans `assets/js/nav.js` et rien d'autre ne la redéfinit. Idem pour le footer. Idem pour le CSS : un fichier principal pour ce qui s'applique partout, des fichiers spécifiques pour les exceptions seulement.

**Universel.** Sauf cas exceptionnel, une fonction n'est pas écrite pour résoudre un cas particulier. Elle doit être générale et fonctionner dans toutes les situations.

**Contrainte « papa proof ».** JB, 65 ans, casse les structures sans s'en rendre compte. Toute interface qu'il touche doit résister à ça.

Conventions détaillées dans `docs/03-technique.md`.

---

## 6. Structure de la documentation

| Fichier | Contenu | Qui le charge |
|---|---|---|
| `docs/00-vision.md` | Identité, positionnement, rôle de chaque page | Tout le monde |
| `docs/01-architecture.md` | L'arbre des pages, ressources transversales, statuts | Rôle cohérence |
| `docs/02-design-system.md` | Couleurs, typos, composants, patterns CSS | Rôle design |
| `docs/03-technique.md` | Stack, conventions, bugs connus | Rôle technique |
| `docs/04-contenus-seo.md` | Règles éditoriales, mots-clés, metas, glossaire | Rôle éditorial |
| `docs/05-etat-des-lieux.md` | Inventaire vérifié du site | Tout le monde |
| `docs/06-decisions.md` | Journal des décisions | Sur demande |
| `docs/audit-plateformes.md` | Empreinte web complète de JB | Rôles éditorial et SEO |
| `docs/99-matiere-brute.md` | Notes libres de Yoan | Sur demande |
| `docs/chantiers/` | Une fiche par chantier, datée | Sur demande |

**Modèle de numérotation.** Niveau 0 le projet, niveaux 1 à n les pages maîtresses avec cahier des charges propre, sous-niveaux qui héritent de leur parent. Les numéros servent à parler entre nous. Ils n'apparaissent jamais dans un nom de fichier, une URL ou un menu.

---

## 7. Périmé, ne plus utiliser

`old/MEMOIRE-avril-2026.md` décrit l'entreprise d'avant la remise à plat. Sa stratégie commerciale est fausse : le Challenge BMW n'existe plus, le parc de voitures non plus. Conservé comme archive uniquement.

---

## 8. Les rôles

Quatre agents spécialisés dans `.claude/agents/`. Ils sont appelés depuis la conversation principale, jamais entre eux.

- `jbe-design` : identité visuelle, mise en page, CSS
- `jbe-editorial` : textes, ton, SEO, métadonnées
- `jbe-technique` : HTML, JS, Supabase, live-editor, performance
- `jbe-coherence` : navigation, parcours, audit transversal. **Lecture seule.**

Il n'y a pas d'agent chef de projet. C'est Yoan, et la conversation principale.
