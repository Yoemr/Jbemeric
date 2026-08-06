// build-cache.js
// Recuit le contenu Supabase dans le filet de secours des pages HTML.
//
// Lancement manuel :  node outil-dev/build-cache.js
// Lancement Netlify : declare dans netlify.toml, avant chaque publication.
//
// ── Pourquoi ce script existe ────────────────────────────────────────────────
// Le live-editor ecrit dans Supabase, puis tente de recopier le contenu dans
// le HTML via POST /save-html. Cet appel n'existe que sur le serveur local.
// En production il echoue en silence, volontairement ignore. Le filet de
// secours (jbe-content-cache) reste donc vide, et le jour ou Supabase ne
// repond pas, le visiteur voit le texte d'origine au lieu de celui de JB.
//
// ── Bug corrige le 1er aout 2026 ─────────────────────────────────────────────
// Le script listait les fichiers HTML avec fs.readdirSync(__dirname), c'est a
// dire dans outil-dev/, qui n'en contient aucun. Ecrit du temps ou il vivait a
// la racine, il tournait dans le vide depuis son deplacement : il annoncait
// "73 entrees recuperees" puis "0 fichier mis a jour". Il parcourt desormais
// la racine du projet, recursivement.
//
// Corriges en meme temps :
//   - media_type est desormais recupere. Sans lui, une video repassait en
//     image quand le filet prenait le relais.
//   - le script ne sort plus en code 1 sur erreur reseau : un filet perime
//     vaut mieux qu'une publication bloquee.

var https = require('https')
var fs    = require('fs')
var path  = require('path')

var SUPABASE_URL  = process.env.SUPABASE_URL      || 'https://fyaybxamuabawerqzuud.supabase.co'
var SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

var ROOT   = path.resolve(__dirname, '..')
var IGNORE = ['old', 'node_modules', '.git', 'docs', '.claude', 'outil-dev', 'assets']

// ── Fetch Supabase ────────────────────────────────────────────────────────────
function fetchSupabase(cb) {
  var url = SUPABASE_URL + '/rest/v1/site_content?select=id,content,media_type'
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
        if (!Array.isArray(rows)) throw new Error('Reponse inattendue : ' + data.substring(0, 200))
        cb(null, rows)
      } catch (e) { cb(e) }
    })
  }).on('error', cb)
}

// ── Liste recursive des pages, depuis la racine du projet ─────────────────────
function listHtml(dir, rel, out) {
  var entries = fs.readdirSync(dir, { withFileTypes: true })
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    var child = rel ? rel + '/' + e.name : e.name
    if (e.isDirectory()) {
      if (IGNORE.indexOf(e.name) !== -1) continue
      listHtml(path.join(dir, e.name), child, out)
    } else if (e.name.slice(-5) === '.html') {
      out.push(child)
    }
  }
  return out
}

// ── Mise a jour d'un fichier HTML ─────────────────────────────────────────────
function updateHtml(rel, payload) {
  var file = path.join(ROOT, rel)
  var html = fs.readFileSync(file, 'utf8')
  var tag  = '<script id="jbe-content-cache" type="application/json">' + JSON.stringify(payload) + '</script>'

  var newHtml
  if (html.indexOf('<script id="jbe-content-cache"') !== -1) {
    newHtml = html.replace(/<script id="jbe-content-cache"[^>]*>[\s\S]*?<\/script>/, tag)
  } else if (html.indexOf('</body>') !== -1) {
    newHtml = html.replace('</body>', tag + '\n</body>')
  } else {
    return 'pas de </body>'
  }

  if (newHtml === html) return 'inchange'
  fs.writeFileSync(file, newHtml, 'utf8')
  return 'ecrit'
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('Lecture Supabase...')

fetchSupabase(function (err, rows) {
  if (err) {
    // Volontairement code 0 : ne jamais bloquer une publication pour ca.
    console.warn('Supabase injoignable : ' + err.message)
    console.warn('Les pages conservent leur filet actuel.')
    return
  }
  console.log(rows.length + ' entrees recuperees')

  // Regroupement par page. La cle de page est le nom de fichier sans .html,
  // meme regle que la variable PAGE de live-editor.js. Voir docs/03-technique.md.
  //
  // ATTENTION : cette table doit rester identique a PAGE_ALIASES de
  // live-editor.js. La regle d'audit « renommages » verifie cette egalite a
  // chaque execution, donc une divergence sera signalee.
  var PAGE_ALIASES = { 'karting-adulte': 'karting' }

  var byPage = {}
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i]
    if (!row.id || !row.content) continue
    var parts = row.id.split('__')
    if (parts.length < 2) continue
    var page = parts[0]
    if (!byPage[page]) byPage[page] = { v: 2, c: {}, m: {} }
    byPage[page].c[row.id] = row.content
    if (row.media_type) byPage[page].m[row.id] = row.media_type
  }

  var files   = listHtml(ROOT, '', [])
  var written = 0, empty = 0, seen = {}

  for (var j = 0; j < files.length; j++) {
    var rel     = files[j]
    var pageKey = path.basename(rel, '.html')
    seen[pageKey] = true

    // Page renommee : les lignes Supabase portent encore l'ancienne cle. Sans
    // ce repli, la page recevrait un cache vide et son contenu passerait pour
    // orphelin, donc le filet de secours tomberait exactement sur la page qui
    // vient d'etre renommee.
    var payload = byPage[pageKey]
    if (!payload && PAGE_ALIASES[pageKey]) {
      var ancien = PAGE_ALIASES[pageKey]
      payload = byPage[ancien]
      if (payload) { seen[ancien] = true; console.log('  ..  ' + rel + '  contenu repris de la cle « ' + ancien + ' »') }
    }
    if (!payload) { empty++; continue }

    var res = updateHtml(rel, payload)
    var nbC = Object.keys(payload.c).length
    var nbM = Object.keys(payload.m).length
    if (res === 'ecrit') {
      console.log('  ok  ' + rel + '  ' + nbC + ' contenu(s)' + (nbM ? ', ' + nbM + ' media(s)' : ''))
      written++
    } else if (res === 'inchange') {
      console.log('  =   ' + rel + '  deja a jour')
    } else {
      console.warn('  !   ' + rel + '  ignore : ' + res)
    }
  }

  var orphans = []
  for (var k in byPage) if (!seen[k]) orphans.push(k)

  console.log('')
  console.log(written + ' page(s) recuite(s), ' + empty + ' sans contenu Supabase.')
  if (orphans.length) {
    console.warn('Cles Supabase sans page correspondante : ' + orphans.join(', '))
  }
})
