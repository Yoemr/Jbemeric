# Audit des plateformes JB EMERIC

**Première passe** : 1er août 2026.
**Objectif** : recenser tout ce qui existe au nom de JB EMERIC sur internet, évaluer l'état de chaque support, et décider quoi en faire dans la logique de plateforme unique.

> Statut du document : incomplet. Les plateformes sociales sont derrière des murs de connexion, je n'ai pas pu mesurer leur activité réelle ni leurs audiences. Les points marqués **à vérifier par Yoan** demandent un accès connecté.

---

## 1. Vue d'ensemble

**Quatorze présences identifiées à ce jour.** Cinq sites ou boutiques, cinq réseaux sociaux, quatre présences subies (annuaires et avis, non contrôlées).

Le constat central : il n'existe aucune hiérarchie entre ces supports. Aucun ne renvoie systématiquement vers un autre. Un client qui trouve JB par TripAdvisor, par une carte cadeau ou par Facebook n'atterrit pas au même endroit et ne voit pas la même offre.

---

## 2. Sites et boutiques

| Support | URL | État | Décision proposée |
|---|---|---|---|
| Site principal actuel | `jbemeric.com` | **200, actif** | Cible finale. À remplacer par le nouveau site. |
| Nouveau site en développement | `jbemeric.netlify.app` | **200, actif** | Bascule vers `jbemeric.com` à prévoir. |
| Boutique séparée | `pilotage-jbemeric-marseille.fr` | **404, MORTE** | Supprimer le lien du site. |
| Ancien blog | `emericjb.unblog.fr` | **200, actif** | À évaluer, probablement à fermer. |
| Revendeur carte cadeau | `macarteprestige.com/collections/jb-emeric` | Actif, avec une erreur | Décider si on garde ce canal. |

### 2.1 `jbemeric.com`, le site actuel

WordPress, thème CreativeThemes, avec **WooCommerce** : panier, tunnel de commande, suivi de commandes, comptes clients, politique de remboursement. Google Analytics via ExactMetrics.

Menu actuel : Accueil, Blog (avec « Conseils de pilotage » et « Le sport auto pour tous »), Calendrier, Coaching vidéo, Contact, Liens, Livre d'Or, Nos circuits, Nos partenaires, Nos voitures, Nos vidéos, Palmarès.

Douze entrées de menu. Le nouveau site en a cinq.

**Voitures annoncées** : Porsche GT3 RS, Ferrari F8 Tributo, Lotus Elise S Cup, Peugeot 206 S16, karting enfant dès 4 ans.

**Point critique** : ces voitures sont présentées comme l'offre. Si le parc n'existe plus, le site vend aujourd'hui des véhicules que l'entreprise ne possède pas. **À vérifier par Yoan** : lesquelles sont encore accessibles, et à quel titre.

**Autre point critique** : la page `jbemeric.com/challenge-jb-emeric/` est toujours en ligne et indexée par les moteurs, alors que le Challenge n'existe plus.

**Circuits annoncés pour 2026** : Alès, Le Luc, Grand Sambuc, Paul Ricard au Castellet, Ventabren, Lédenon, Dijon, Nogaro, Barcelone, Spa-Francorchamps, Monza.

C'est une liste bien plus large que celle du nouveau site. Elle a de la valeur pour le référencement local, et pour la stratégie track-days de se greffer sur des événements existants.

**Articles de blog** datés de 2021 à 2026, donc le contenu est vivant. Les 29 articles importés dans Supabase viennent de là.

### 2.2 `pilotage-jbemeric-marseille.fr`, morte

Le domaine répond **404** en HTTPS avec et sans `www`. Le HTTP redirige vers le HTTPS qui échoue.

Or `assets/js/routes.js` la déclare comme `boutique` et `nav.js` l'affiche dans le menu principal sous le libellé **« Boutique 4x sans frais »**.

**Conséquence immédiate** : une entrée du menu du nouveau site envoie tous les visiteurs sur une page morte. C'est à corriger avant toute mise en ligne.

### 2.3 `macarteprestige.com`, revendeur

Anciennement `guideprestige.com`, redirige en 301.

Deux offres en vente :
- Karting, 89 € ramené à 75,65 €, sur les circuits d'Aubagne, Cuges-les-Pins et Hyères.
- Stage de pilotage 3x6 tours, 207 €, en formule un acheté un offert, soit 514 € ramenés à 257 €.

La page affiche un message « Access Denied » lié à un verrouillage de compte client, donc le tunnel d'achat est probablement cassé.

Téléphone affiché : 04 79 26 46 60. **Ce n'est pas le numéro de JB** (04 42 32 87 87). C'est celui de la plateforme.

**À décider** : ce canal rapporte-t-il quelque chose, et à quelle marge ? Il diffuse des tarifs qui deviendront incohérents avec ceux du nouveau site.

---

## 3. Réseaux sociaux

| Réseau | Compte | État | Remarque |
|---|---|---|---|
| Facebook | `facebook.com/JBEmeric` | 200 | **Doublon** |
| Facebook | `facebook.com/JBEMERIC.Since1989` | 200 | **Doublon**, seul référencé dans `routes.js` |
| Instagram | `instagram.com/jbemeric.ecoledepilotage` | 200 | |
| TikTok | `tiktok.com/@stagepilotagejbemeric` | 200 | |
| YouTube | `youtube.com/channel/UCMTQjYff8llakx2twVNH2SA` | 200 | Environ 10 000 abonnés selon le MEMOIRE d'avril, **à revérifier** |
| LinkedIn | `linkedin.com/in/jbemeric` | 999 | Profil personnel, intitulé « PROMOTION AUTO, Chef d'entreprise, JB EMERIC école de pilotage » |

**Le problème principal : deux pages Facebook.** L'une s'appelle « Stage pilotage JB Emeric | Gémenos ». Le site n'en référence qu'une. L'audience est donc coupée en deux, et le travail de publication probablement dupliqué ou dispersé.

**À vérifier par Yoan**, ces informations demandent un accès connecté :
- Nombre d'abonnés réel de chaque compte
- Date de la dernière publication sur chacun
- Laquelle des deux pages Facebook a le plus d'audience et d'ancienneté
- Si le compte LinkedIn est un profil personnel ou une page entreprise
- S'il existe une fiche **Google Business Profile**, qui n'est pas apparue dans mes recherches mais qui est le support le plus important pour une activité locale

**Non trouvé, à confirmer comme inexistant** : Google Business Profile, X, Pinterest, Strava, WhatsApp Business, Doctolib-like ou plateforme de réservation tierce.

---

## 4. Présences subies

Non contrôlées par JB, mais visibles par les clients.

**TripAdvisor, une seule fiche mais rattachée à la mauvaise ville.**

L'établissement porte l'identifiant `d12031338`. Il est accessible via deux pages géographiques, Gémenos (`g488288`) et Aubagne (`g644128`), mais c'est bien **une seule fiche**, pas un doublon. J'avais annoncé deux fiches lors de la première passe, c'était faux.

Le problème réel est ailleurs : la fiche est ancrée sur **Gémenos**, l'ancienne implantation. Voir la section 5 sur le déménagement.

84 % d'avis positifs sur 10 avis. Les avis lus sont bons : ambiance, organisation professionnelle, pertinence des conseils techniques, qualité du coaching. Un avis porte spécifiquement sur un trackday avec voiture personnelle, un autre sur un stage Megane RS au circuit du Luc.

Dix avis, c'est très peu pour 37 ans d'activité. Il y a un gisement là.

**pilotedudimanche.net** héberge une page « Club JB EMERIC ».

**macarteprestige.com**, déjà traité en 2.3.

---

## 5. Le déménagement, et pourquoi il compte

**Adresse actuelle, confirmée par Yoan et par les mentions légales du nouveau site :**

> 475 Chemin du Bon Civet, 13400 **Aubagne**
> SIRET 38095916300037

**Ancienne adresse, valable pendant environ vingt ans :**

> 265 avenue du Col de l'Ange, **Gémenos**

**Téléphones relevés** : 04 42 32 87 87 (fixe) et 06 60 18 87 87 (mobile). **À vérifier par Yoan** : le fixe de Gémenos est-il encore actif après le déménagement ?

**Création de l'école** : 1989.
**Argument récurrent sur les supports externes** : première école à proposer du sport automobile sur le circuit du Grand-Sambuc.

### Le problème

Le nouveau site est le **seul** support qui indique Aubagne. Tout le reste de l'empreinte web pointe encore sur Gémenos :

- `jbemeric.com`, le site principal actuel
- La fiche TripAdvisor, ancrée sur la page géographique de Gémenos
- Les annuaires et pages de revendeurs
- `assets/js/site-data.js` du nouveau site, qui pointe encore vers l'URL TripAdvisor version Gémenos

Pour une activité locale, l'adresse est le premier signal de référencement. Un client qui cherche « stage de pilotage Aubagne » ou « stage de pilotage Marseille » tombe sur des fiches qui annoncent une ville où l'entreprise n'est plus.

**À traiter** : mise à jour de l'adresse sur chaque support externe, un par un. C'est fastidieux et sans intérêt intellectuel, mais c'est probablement l'action au meilleur rapport effort/résultat de tout le projet.

**Nuance à conserver** : Gémenos reste un lieu de l'histoire de JB, la ville apparaît d'ailleurs dans son palmarès et parmi ses sponsors historiques. On corrige l'adresse commerciale, on n'efface pas le passé.

---

## 6. Ce que l'audit change pour le projet

**Un lien mort dans le menu.** `pilotage-jbemeric-marseille.fr` est en 404 et figure dans le menu principal du nouveau site. À traiter en priorité.

**Deux pages Facebook à fusionner ou à choisir.** Toute automatisation de publication doit viser une seule page. Publier sur les deux double le travail sans doubler l'audience.

**Le Challenge est encore en ligne et indexé** sur `jbemeric.com`. Sa suppression fait partie de la bascule.

**Les tarifs circulent en dehors du site.** 89 € pour du karting, 207 € pour un stage 3x6 tours chez un revendeur. Le nouveau site devra soit s'aligner, soit couper ce canal.

**La liste des circuits du vieux site est plus riche que celle du nouveau.** Onze circuits, dont trois à l'étranger. C'est du contenu à récupérer, pas à jeter.

**Dix avis TripAdvisor pour 37 ans d'activité.** La preuve sociale est sous-exploitée alors que le positionnement repose sur la réputation de l'homme.

**Toute l'empreinte externe annonce la mauvaise ville.** JB est à Aubagne, le web dit Gémenos. Voir section 5. Correction à faire support par support, y compris dans `assets/js/site-data.js` qui pointe encore sur l'URL TripAdvisor de Gémenos.

---

## 7. Sources

- [jbemeric.com](https://jbemeric.com/)
- [Palmarès sur l'ancien site](https://jbemeric.com/palmares/)
- [Page Challenge encore en ligne](https://jbemeric.com/challenge-jb-emeric/)
- [Calendrier de l'ancien site](https://jbemeric.com/calendrier/)
- [Ancien blog Unblog](http://emericjb.unblog.fr/presentation/)
- [Club JB EMERIC sur Pilote du Dimanche](https://www.pilotedudimanche.net/club-jb-emeric.html)
- [Fiche revendeur Ma Carte Prestige](https://macarteprestige.com/collections/jb-emeric)
- [Facebook, page 1](https://www.facebook.com/JBEmeric/)
- [Facebook, page 2](https://www.facebook.com/JBEMERIC.Since1989)
- [LinkedIn](https://www.linkedin.com/in/jbemeric/)
- [TripAdvisor, fiche Gémenos](https://www.tripadvisor.fr/ShowUserReviews-g488288-d12031338-r487394078-JB_EMERIC-Gemenos_Bouches_du_Rhone_Provence_Alpes_Cote_d_Azur.html)
- [TripAdvisor, fiche Aubagne](https://www.tripadvisor.com/Attraction_Review-g644128-d12031338-Reviews-Jb_Emeric-Aubagne_Bouches_du_Rhone_Provence_Alpes_Cote_d_Azur.html)
