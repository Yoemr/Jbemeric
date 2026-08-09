# L'atelier

Tout ce dossier sert à fabriquer le site. **Rien de ce qu'il contient n'est servi au public** : `_redirects` force `/outil-dev/*`, `/docs/*` et `/.claude/*` en 404.

Seul `build-cache.js` tourne en production, appelé par `netlify.toml` au moment de la publication.

---

## Les quatre questions, les quatre outils

| Commande | Répond à |
|---|---|
| `node outil-dev/audit/audit.js` | ce qui est écrit dans les fichiers est-il correct |
| `node outil-dev/base.js` | ce qui est enregistré dans Supabase est-il correct |
| `node outil-dev/fumee.js` | les pages tournent-elles sans erreur |
| `node outil-dev/parcours.js` | les boutons font-ils quelque chose |

Les deux derniers ont besoin du serveur local : `node outil-dev/dev-server.js`.

**Pourquoi quatre et pas un.** Chacun voit ce que les autres ne voient pas. L'audit a annoncé zéro faute pendant trois jours pendant que la base servait un tiret cadratin et une BMW en dotation. Un site correct dans son dépôt peut mentir à ses visiteurs.

---

## Le reste

| Fichier | Rôle |
|---|---|
| `dev-server.js` | serveur local, lit `_redirects`, port 3000 |
| `build-cache.js` | recuit le contenu Supabase dans les pages, lancé à la publication |
| `audit/vocabulaire.js` | le critère « ce sélecteur est-il vivant », employé par la règle des feuilles de style |

---

## Avant de fabriquer un outil de vérification

**Lire `docs/07-acquis.md` section 2.** Sur trois jours, presque toutes les fausses conclusions sont venues d'un instrument fabriqué sur le moment, jamais du site. Le piège que vous vous apprêtez à rencontrer y est probablement déjà décrit.

**Et faire le contrôle négatif.** Avant de croire un « aucune faute », introduire volontairement le défaut et vérifier que l'outil le voit. Chacun des quatre outils ci-dessus a été validé ainsi, dans les deux sens.

---

## Le prototype

`outil-dev/prototype/evenements-page.html` est la page Événements refaite de zéro, décision du 9 août 2026.

Elle s'ouvre dans un navigateur, elle n'est branchée sur rien, et elle ne vit pas dans le site. Des encarts jaunes signalent les choix faits, pour que Yoan les défasse un par un plutôt que de tout reprendre.

**Elle se supprime dès qu'il a tranché.** Un prototype qui survit devient une deuxième vérité, et le projet en a déjà payé le prix.

---

## Migrations

`outil-dev/migrations/` ne garde que ce qui n'est pas encore appliqué. Une migration appliquée n'a plus rien à faire ici : son effet est dans la base, et son histoire dans `docs/06-decisions.md`.
