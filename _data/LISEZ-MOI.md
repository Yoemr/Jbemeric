# JB EMERIC — Guide de mise en production

## Arborescence cible (à créer sur ton PC)

```
jbemeric-site/
│
├── index.html
├── academie.html
├── academie-karting.html
├── academie-adulte.html
├── academie-challenge.html
├── coaching.html
├── track.html
├── paddock.html
├── login.html
├── signup.html
├── coming-soon.html
│
├── assets/
│   ├── css/
│   │   ├── theme.css
│   │   └── nav.css
│   └── js/
│       ├── supabase.js      ← client Supabase + tous les helpers
│       ├── auth.js          ← login / signup (remplace login.php)
│       ├── track-sessions.js← votes + inscriptions (remplace vote.php)
│       └── main.js          ← dynamisation index (3 prochaines sessions)
│
└── database.sql             ← schéma à importer dans Supabase
```

⚠️ **Pour l'instant les JS sont à la racine** (même niveau que les HTML).
Quand tu réorganises, mets à jour les chemins `src="supabase.js"` → `src="assets/js/supabase.js"`.

---

## Fichiers à SUPPRIMER de ton dossier

Ces fichiers sont des brouillons / prototypes / backend PHP inutiles sur Netlify :

```
❌ admin-dashboard.php
❌ config.php
❌ login.php
❌ scraper.php
❌ track.php
❌ vote.php
❌ coaching-affiches-image.html
❌ coaching-affiches-preview.html
❌ coaching-flyer.html
❌ jbemeric-fixed.html
❌ jbemeric-hub.html
❌ jbemeric-landing.html
❌ jbemeric-v2.html
❌ jbemeric-v5.html
❌ jbemeric-webapp.html
❌ logo-creative.html
❌ logo-gt.html
❌ logo-test-v2.html
❌ logo-test.html
❌ logo-voiture.html
❌ logo_test.html
❌ palette-test.html
❌ proto_academie.html
❌ proto_sections.html
❌ shared.css          ← doublon de nav.css
❌ *.zip               ← tous les fichiers zip
```

---

## Configuration Supabase (à faire une fois)

### 1. Créer le projet
- Va sur supabase.com → New project
- Nom : `jbemeric` — choisir région Europe (Frankfurt)

### 2. Importer le schéma
Dans Supabase → SQL Editor → coller le contenu de `database.sql` → Run

### 3. Créer les fonctions RPC
Dans Supabase → SQL Editor, exécuter :

```sql
-- Incrémenter les votes
CREATE OR REPLACE FUNCTION increment_votes(event_id INT)
RETURNS void AS $$
  UPDATE events SET nb_votes = nb_votes + 1 WHERE id = event_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Incrémenter les inscrits
CREATE OR REPLACE FUNCTION increment_inscrits(event_id INT)
RETURNS void AS $$
  UPDATE events
  SET nb_inscrits = nb_inscrits + 1,
      status = CASE WHEN nb_inscrits + 1 >= nb_places THEN 'Full' ELSE status END
  WHERE id = event_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### 4. Configurer les clés dans supabase.js
```js
const SUPABASE_URL  = 'https://XXXXX.supabase.co'   // Settings → API → Project URL
const SUPABASE_ANON = 'eyJhXXXXXX...'               // Settings → API → anon public key
```

### 5. Activer l'Auth Email dans Supabase
Supabase → Authentication → Providers → Email → Enable

---

## Intégrer les scripts dans les pages

### login.html et signup.html
Ajouter avant `</body>` :
```html
<script type="module" src="auth.js"></script>
```

### track.html
Ajouter avant `</body>` :
```html
<script type="module" src="track-sessions.js"></script>
```

### index.html
Ajouter un conteneur dans la section sessions :
```html
<div id="next-sessions"></div>
```
Et avant `</body>` :
```html
<script type="module" src="main.js"></script>
```

---

## Liens morts → coming-soon.html

Pour rediriger un bouton vers une page pas encore créée :
```html
<!-- Au lieu de href="voitures.html" -->
<a href="coming-soon.html?from=voitures">Nos voitures</a>
```

Pages disponibles dans coming-soon.html :
`voitures` · `circuits` · `stages` · `palmares` · `contact` · `boutique` · `resultats` · `media`

---

## Workflow quotidien GitHub → Netlify

```bash
# Dans ton dossier jbemeric-site
git add .
git commit -m "description de ta modification"
git push
# → Netlify redéploie automatiquement en ~30 secondes
```
