# Journal des décisions

Du plus récent au plus ancien. Une décision par entrée, avec sa raison.

Écriture libre par Claude, sans validation préalable. Résumé à Yoan en fin de chantier.

---

## 1er août 2026, remise à plat complète

### D-014, Numérotation par niveaux pour parler du projet

Niveau 0 le projet, niveaux 1 à n les pages maîtresses avec cahier des charges propre, sous-niveaux qui héritent de leur parent.

**Les numéros ne figurent jamais dans un nom de fichier, une URL ou un menu.** Ils servent uniquement à la conversation.

**Raison, formulée par Yoan** : une seule façon de ranger, valable pour la documentation, le menu du site et l'arborescence des dossiers.

### D-013, Ressources transversales à source unique

Certains contenus sont consommés par plusieurs branches de l'arbre, le palmarès en premier. Règle : **une seule source de vérité, tous les autres emplacements n'en sont que des vues**, via `sync-mirror.js`.

**Raison** : le jour où le palmarès existe en trois exemplaires indépendants, les trois divergent. C'est la cause des conflits permanents que Yoan veut éliminer.

### D-012, Statut honnête sur chaque page

Chaque page porte une mention : *défini*, *en chantier*, ou *non défini*.

**Raison** : une documentation qui dit « je ne sais pas » est utilisable, une qui prétend savoir ne l'est pas. Empêche de bâtir sur du spéculatif.

### D-011, Aucune création sans accord explicite

Aucune page, aucune entrée de menu, aucune section n'est créée sans l'accord de Yoan.

**Raison, constat de Yoan** : « Beaucoup de sous-pages de menu n'ont jamais vraiment été travaillées, parfois même créées sans mon autorisation. » C'est une cause directe du désordre actuel.

### D-010, Le référencement local vise les circuits

Pas le domicile de l'entreprise.

**Raison, précision de Yoan** : « L'adresse n'a pas vraiment d'importance, rien ne se fait sur place. » Les clients cherchent un circuit, pas une ville. Cette décision annule une analyse antérieure de Claude qui plaçait la correction d'adresse en priorité haute.

### D-009, Le site vend un homme, plus un parc

Positionnement central du projet.

**Raison** : l'entreprise a fait faillite vers 2014 et n'a presque plus de matériel. JB ne veut plus assumer entretien, préparation, assurance, réparation ni transport. Ce qui reste et qui vaut, ce sont 35 ans d'expérience.

**Conséquence** : ce n'est pas une refonte visuelle, c'est un changement d'argument commercial qui touche chaque page.

### D-008, Le Challenge JB EMERIC est mort

Supprimé du site et de tout le vocabulaire. La dotation BMW 325i HTCC également.

**Reste à traiter** : la page `jbemeric.com/challenge-jb-emeric/` est toujours en ligne et indexée. `challenge.css`, 24 Ko, est orphelin dans le dépôt.

### D-007, Deux interdits d'écriture absolus

Le tiret cadratin `—` et le ton IA. Valables partout, site comme conversation.

**Raison, mot de Yoan** : « "—" ça c'est strictement interdit. Je déteste ça » et « Pas de ton IA ça m'insupporte ». Le reste de l'écriture est libre.

### D-006, Correctifs du serveur local

`dev-server.js` lit désormais `_redirects`, et `/save-html` accepte un chemin complet.

**Raison** : les liens relatifs vers d'anciens chemins tombaient en 404 en local alors qu'ils fonctionnent en production. Une partie des « vieux bugs » traqués par le passé n'existait donc qu'en local. La sauvegarde du live-editor échouait sur 13 pages sur 18.

**Vérifié** : 7 redirections suivies jusqu'au 200, 5 URLs directes sans régression, écriture en sous-dossier confirmée, 2 tentatives de traversée de répertoire refusées.

### D-005, `CLAUDE.md` remonte à la racine

**Raison, cause racine de la perte de contexte** : le fichier vivait dans `claude/`, emplacement que Claude Code ne lit jamais. La vision et les règles n'étaient donc jamais chargées. Le document était bon, il était invisible.

### D-004, Quatre agents spécialisés, dont un en lecture seule

`jbe-design`, `jbe-editorial`, `jbe-technique`, et `jbe-coherence` sans outil d'écriture.

**Raison** : un rôle transversal doté du droit d'écriture piétinerait le travail des rôles spécialisés. Il diagnostique, la conversation principale distribue les corrections.

**Pas d'agent chef de projet** : chaque agent démarre sans historique. Un agent qui en pilote d'autres ajoute un relais, et chaque relais perd de l'information.

### D-003, Le MEMOIRE d'avril est archivé, pas rangé

`claude/MEMOIRE.md` devient `old/MEMOIRE-avril-2026.md`. Sa stratégie commerciale est fausse.

**Raison** : le ranger proprement aurait produit une documentation impeccable et fausse, pire que pas de documentation, parce qu'on lui aurait fait confiance. Preuves de son obsolescence : `pages.css` décrit comme pilier de l'architecture CSS et chargé par zéro page, arborescence périmée, page « Stages » présentée comme existante alors que c'est une ancre.

### D-002, Le plugin superpowers est désactivé

Passé à `false` dans `~/.claude/settings.json`. Cache conservé, réactivation possible.

**Raison** : procédures conçues pour du développement logiciel en équipe, sans objet sur un site statique travaillé en solo. Bloc de consignes injecté à chaque session dans tous les projets. Ce qui est utile a été réécrit en quatre règles dans `CLAUDE.md`, en français.

**Cohérence** : prolonge la décision d'avril sur la GStack, écartée pour la même raison.

### D-001, Gouvernance révisée

Travail en local, modifications et commits sur branche autorisés. **Jamais de push, jamais de déploiement.**

**Raison** : l'ancienne règle, livraison exclusive par zip, ne correspondait plus à la pratique réelle. Chaque push déclenche un build Netlify, le palier gratuit est de 300 minutes par mois, un push quotidien reste loin de la limite. Contrainte de Yoan : le projet doit coûter zéro euro.

---

## Avant août 2026

Les décisions antérieures figurent dans `old/MEMOIRE-avril-2026.md`, section 8. **Elles portent sur une entreprise qui n'existe plus sous cette forme.** À consulter comme archive, pas comme référence.
