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
2. **Jamais de ton IA.** La faute la plus fréquente est l'antithèse : une affirmation, une virgule, puis la négation d'un contre-exemple que personne n'avait proposé. « JB forme des pilotes qui courent en championnat, pas des clients qui se promènent. » Le contre-exemple est un homme de paille, la seconde moitié n'apporte rien. Dire la chose et s'arrêter. Détail et variantes dans `docs/04` section 1.1, comptage à chaque audit par la règle `ton-ia`.

Le reste de l'écriture est libre.

---

## 3. Gouvernance

- Travail **en local**. Modifications de fichiers et commits sur branche de travail : autorisés.
- **Publier coûte.** 300 publications par mois, c'est le budget que Yoan paie. Regrouper beaucoup de commits en une seule publication. Détail et porte en section 3 bis.
- **Aucune page, aucune entrée de menu, aucune section n'est créée sans accord explicite de Yoan.** Des pages ont été créées sans autorisation par le passé, c'est une cause directe du désordre actuel.
- **Aucune suppression de fichier sans validation individuelle.**
- `docs/00` à `04` : modification sur validation. `docs/05` et `06` : écriture libre, avec résumé en fin de chantier.

---

## 3 bis. Publications, 300 par mois

Chaque push déclenche une construction Netlify. **Ce que Yoan paie, c'est 300 publications par mois.** C'est le seul vrai plafond.

Mot de Yoan, 10 août 2026 : « tu te démerdes pour en regrouper plein et en faire le moins possible par jour, pour qu'on puisse travailler tout le mois sans restriction. »

**Commiter n'est pas publier.** Un commit local ne coûte rien et ne déclenche rien. Vingt commits qui partent ensemble coûtent une publication, pas vingt. Travailler par petits commits et publier une fois est la bonne façon de faire.

Un garde-fou de **trois par jour calendaire**, heure de Gemenos, contre la journée du 9 août où seize pushes sont partis en vingt-deux heures. Il repart à zéro chaque matin.

Ce n'est pas une consigne, c'est une porte. Le crochet `outil-dev/hooks/pre-push` refuse au-delà. Le compteur s'affiche à chaque ouverture de session, sous l'audit, avec le nombre de commits en attente.

Le crochet demande une ligne, une seule fois par machine :

```
git config core.hooksPath outil-dev/hooks
```

Pour passer outre, quand Yoan le demande : `git push --no-verify`.

**Une fenêtre glissante de 24 heures a été essayée et retirée** : elle punissait la journée en cours pour les pushes de la veille au soir, et bloquait le travail alors que le budget du mois était largement disponible.

---

## 4. Méthode

> **À faire en premier, avant toute vérification : lire `docs/07-acquis.md`.**
> Il dit ce qui est déjà prouvé et qu'il ne faut pas revérifier, ce que les outils ne voient pas, et les pièges d'instrument déjà payés. Reproche de Yoan du 8 août : « une nouvelle session te ferait sûrement re-re-revérifier des trucs inutiles. » Ce fichier existe pour que ça n'arrive plus.

1. **Cadrer avant de construire.** Un chantier qui touche plus d'une page ou modifie une structure commence par une discussion, puis une fiche courte dans `docs/chantiers/` validée par Yoan. Une retouche ponctuelle se fait directement.
2. **Règle des 95 %.** Aucune modification de code si la solution n'est pas sûre à 95 %. Dans le doute, poser une question précise.
3. **Deux tentatives maximum sur un bug.** Au-delà, arrêt et changement d'approche. Aucun retour arrière sans énoncer la cause racine.
4. **Vérifier, pas affirmer.** Une anomalie se prouve par un test, pas par une lecture de code. **Commencer par `node outil-dev/audit/audit.js`**, jamais par une exploration à la main : l'état du site est calculé, pas rédigé. Ne pas se fier à `docs/05` pour ce qui est mesurable.
5. **Contrôle négatif avant toute conclusion favorable.** Avant de croire un « identique », un « aucune faute » ou un « zéro occurrence », introduire volontairement le défaut et vérifier que l'instrument le voit. Une comparaison qui ne sait pas voir une différence dira toujours « identique ». Quatre faux résultats démasqués par cette règle le 7 août.
6. **Le périmètre avant tout le reste.** Neuf pages comptent : index, académie, karting enfant et adulte, compétition, coaching, track, paddock, palmarès. Un défaut ailleurs se signale, il ne se corrige pas sans demander.
7. **Un défaut trouvé hors de la demande se note, il ne se corrige pas.** Sauf s'il casse la chose demandée. Sinon il va dans `docs/05` et Yoan décide. C'est la parade à la dérive qui produit 95 % de correction pour 5 % de visible.
8. **Ne jamais parler à Yoan d'une page hors périmètre.** Ni pour signaler, ni pour proposer, ni en passant. Reproche du 8 août : « tu m'as gonflé à toujours me parler de pages qu'on a jamais travaillé ». L'audit les range déjà à part et les masque : faire pareil dans les réponses. Si une de ces pages casse quelque chose du périmètre, alors seulement en parler, en disant en quoi elle le casse.
9. **Dire avant de commencer ce que Yoan verra à l'écran quand ce sera fini.** Si la réponse est « rien », le dire tout de suite et le laisser choisir.
10. **Toute correction de texte se vérifie aussi dans Supabase.** Le live-editor sert la base avant le HTML : corriger un fichier ne change rien pour un visiteur si un texte existe en base sous la même clé.
11. **Fin de chantier** : mise à jour de `docs/05-etat-des-lieux.md`, `docs/06-decisions.md`, et des pièges rencontrés dans `docs/07-acquis.md`, puis résumé court.
12. **Ultra focus sur la technique.** Demande de Yoan du 9 août : « le site n'est pas fonctionnel et n'est pas en ligne, tu te prends la tête sur des détails non techniques qui servent à rien, tu pars dans tous les sens ». Tant que le site ne tourne pas, la structure et la technique passent avant la justesse des données. Un événement faux se corrige en cinq minutes le jour venu, et sera automatisé plus tard.
13. **Un détail se note dans `docs/08-plus-tard.md`, et nulle part ailleurs.** Il ne se corrige pas, il ne se mentionne pas dans une réponse, sauf si Yoan pose la question ou si le détail casse le sujet en cours. C'est le seul fichier de ce genre, et il n'en sera pas créé d'autre.
14. **Aucun fichier annexe sans justification qui survive à la session.** Reproche de Yoan : « tu as tendance à créer énormément de fichiers annexes qui au final ne servent à rien et sont supprimés plus tard ». Avant d'écrire un fichier neuf, dire à quoi il servira dans un mois. Un outil de vérification se justifie s'il tourne à chaque session. Une note se range dans `docs/08`. Un prototype se supprime dès que Yoan a tranché.

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
| `docs/07-acquis.md` | **Ce qui est prouvé, ce que les outils ne voient pas, les pièges d'instrument** | **Tout le monde, en premier** |
| `docs/08-plus-tard.md` | **Les détails repoussés. Le seul endroit où ils vont** | Sur demande de Yoan uniquement |
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
