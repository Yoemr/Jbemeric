// build-cache.js
// Lance ce script avant chaque push GitHub Desktop :
//   node build-cache.js
//
// Ce qu'il fait :
//   1. Lit tout le contenu de la table site_content dans Supabase
//   2. Pour chaque fichier HTML, remplace la balise jbe-content-cache
//      avec les contenus correspondants à cette page
//   3. Les fichiers HTML locaux sont mis à jour — prêts à être pushés

var https  = require('https')
var fs     = require('fs')
var path   = require('path')

var SUPABASE_URL  = 'https://fyaybxamuabawerqzuud.supabase.co'
var SUPABASE_ANON = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

// Fichiers HTML à ignorer (backups, etc.)
var SKIP = ['academie_backup_pre_refonte.html']

// ── Fetch Supabase ────────────────────────────────────────────────────────────
function fetchSupabase(cb) {
  var url = SUPABASE_URL + '/rest/v1/site_content?select=id,content'
  var opts = {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON
    }
  }
  https.get(url, opts, function (res) {
    var data = ''
    res.on('data', function (chunk) { data += chunk })
    res.on('end', function () {
      try {
        var rows = JSON.parse(data)
        if (!Array.isArray(rows)) throw new Error('Réponse inattendue : ' + data.substring(0, 200))
        cb(null, rows)
      } catch (e) { cb(e) }
    })
  }).on('error', cb)
}

// ── Mise à jour d'un fichier HTML ─────────────────────────────────────────────
function updateHtml(file, entriesForPage) {
  var html = fs.readFileSync(file, 'utf8')
  var cacheJson = JSON.stringify(entriesForPage)
  var cacheTag  = '<script id="jbe-content-cache" type="application/json">' + cacheJson + '</script>'

  var newHtml
  if (html.indexOf('<script id="jbe-content-cache"') !== -1) {
    newHtml = html.replace(/<script id="jbe-content-cache"[^>]*>[\s\S]*?<\/script>/, cacheTag)
  } else {
    newHtml = html.replace('</body>', cacheTag + '\n</body>')
  }

  if (newHtml === html) return false
  fs.writeFileSync(file, newHtml, 'utf8')
  return true
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('Lecture Supabase...')

fetchSupabase(function (err, rows) {
  if (err) { console.error('Erreur Supabase :', err.message); process.exit(1) }
  console.log(rows.length + ' entrées récupérées')

  // Grouper par page : { "index": { "index__txt-1": "...", ... }, ... }
  var byPage = {}
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i]
    if (!row.id || !row.content) continue
    var parts = row.id.split('__')
    if (parts.length < 2) continue
    var page = parts[0]
    if (!byPage[page]) byPage[page] = {}
    byPage[page][row.id] = row.content
  }

  // Parcourir les fichiers HTML du projet
  var dir   = __dirname
  var files = fs.readdirSync(dir).filter(function (f) {
    return f.endsWith('.html') && SKIP.indexOf(f) === -1
  })

  var updated = 0
  for (var j = 0; j < files.length; j++) {
    var filename = files[j]
    var pageName = filename.replace('.html', '')
    var entries  = byPage[pageName] || {}
    var changed  = updateHtml(path.join(dir, filename), entries)
    if (changed) { console.log('  ✓ ' + filename); updated++ }
    else         { console.log('  - ' + filename + ' (inchangé)') }
  }

  console.log('\nTerminé — ' + updated + ' fichier(s) mis à jour.')
  console.log('Tu peux maintenant pousser via GitHub Desktop.')
})
