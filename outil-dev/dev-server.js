// dev-server.js : Serveur local JB EMERIC
// Remplace "npx serve" : même fonction + met à jour les HTML à chaque sauvegarde
//
// Lancement : node dev-server.js
// Puis ouvrir : http://localhost:3000

var http = require('http')
var fs   = require('fs')
var path = require('path')

var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
var ROOT = path.resolve(__dirname, '..')  // racine projet (outil-dev/ est un sous-dossier)

var MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.mp4':   'video/mp4',
  '.webm':  'video/webm',
  '.webp':  'image/webp'
}

// ── Redirections (_redirects, format Netlify) ─────────────────────────────────
// Lues au démarrage. Sans ça, les liens relatifs vers d'anciens chemins
// (contact.html, articles.html, login.html…) tombent en 404 en local alors
// qu'ils fonctionnent en production : et on croit à un bug du site.
// Sémantique Netlify : un fichier existant l'emporte sur une règle de redirection.
var REDIRECTS = {}

function loadRedirects() {
  var file = path.join(ROOT, '_redirects')
  if (!fs.existsSync(file)) return
  var lines = fs.readFileSync(file, 'utf8').split('\n')
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line || line.charAt(0) === '#') continue
    var parts = line.split(/\s+/)
    if (parts.length < 2 || parts[0].charAt(0) !== '/') continue
    REDIRECTS[parts[0]] = { to: parts[1], code: parseInt(parts[2], 10) || 301 }
  }
}
loadRedirects()

http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // ── POST /save-html ─────────────────────────────────────────────────────────
  // Appelé par le bouton "Sauvegarder" du live-editor
  // Reçoit { page: "index", entries: { "index__txt-1": "texte...", ... } }
  // Écrit le cache JSON dans le fichier HTML correspondant
  if (req.method === 'POST' && req.url === '/save-html') {
    var body = ''
    req.on('data', function (chunk) { body += chunk })
    req.on('end', function () {
      try {
        var payload  = JSON.parse(body)
        var entries  = payload.entries || {}

        // payload.path = chemin complet depuis la racine ('academie/karting').
        // payload.page = ancien format, nom de fichier seul : conservé en repli.
        // Sans le chemin, toute page en sous-dossier échouait : 'karting' était
        // cherché à la racine du projet, où il n'existe pas.
        var rel = (typeof payload.path === 'string' && payload.path)
                  ? payload.path
                  : (payload.page || '')
        rel = rel.replace(/\\/g, '/').replace(/^\/+/, '')

        // Le point est exclu du jeu autorisé : pas de '..', donc pas de remontée.
        if (!rel || !/^[a-z0-9/_-]+$/i.test(rel)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Chemin de page invalide : ' + rel }))
          return
        }

        var filename = rel + '.html'
        var filePath = path.join(ROOT, filename)

        if (filePath.indexOf(ROOT) !== 0) {
          res.writeHead(403, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Chemin hors du projet' }))
          return
        }

        if (!fs.existsSync(filePath)) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Fichier introuvable : ' + filename }))
          return
        }

        var html      = fs.readFileSync(filePath, 'utf8')
        var cacheJson = JSON.stringify(entries)
        var cacheTag  = '<script id="jbe-content-cache" type="application/json">' + cacheJson + '</script>'
        var newHtml

        if (html.indexOf('<script id="jbe-content-cache"') !== -1) {
          newHtml = html.replace(/<script id="jbe-content-cache"[^>]*>[\s\S]*?<\/script>/, cacheTag)
        } else {
          newHtml = html.replace('</body>', cacheTag + '\n</body>')
        }

        fs.writeFileSync(filePath, newHtml, 'utf8')
        console.log('[save-html] ' + filename + ' mis à jour (' + Object.keys(entries).length + ' entrées)')
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        console.error('[save-html] Erreur :', e.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  // ── Fichiers statiques ───────────────────────────────────────────────────────
  var pathname = new URL(req.url, 'http://localhost').pathname
  /* Plusieurs medias de JB portent un espace dans leur nom de fichier. Le
     navigateur les demande encodes, et sans decodage ils sont introuvables en
     local alors qu'ils fonctionnent en production. Le decodage precede la garde
     anti-traversee, sinon un %2e%2e passerait au travers. */
  try { pathname = decodeURIComponent(pathname) }
  catch (e) { res.writeHead(400); res.end('400 : URL mal encodee'); return }
  if (pathname === '/') pathname = '/index.html'

  var filePath = path.join(ROOT, pathname)

  // Sécurité : interdire la sortie du dossier racine
  if (filePath.indexOf(ROOT) !== 0) { res.writeHead(403); res.end('Forbidden'); return }

  // Résolution du fichier (chemin exact → + .html → index.html dans dossier)
  var resolved = null
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    resolved = filePath
  } else if (fs.existsSync(filePath + '.html')) {
    resolved = filePath + '.html'
  } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
    resolved = path.join(filePath, 'index.html')
  }

  // Aucun fichier : on tente les règles de _redirects, comme le ferait Netlify
  if (!resolved) {
    var rule = REDIRECTS[pathname]
    if (rule) {
      res.writeHead(rule.code, { 'Location': rule.to })
      res.end()
      return
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404 : ' + pathname)
    return
  }

  var ext  = path.extname(resolved)
  var mime = MIME[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime })
  fs.createReadStream(resolved).pipe(res)

}).listen(PORT, function () {
  var addr = this.address()
  var finalPort = addr && addr.port ? addr.port : PORT
  console.log('─────────────────────────────────────────')
  console.log('  Serveur JBE : http://localhost:' + finalPort)
  console.log('  /save-html  : actif (màj HTML auto, sous-dossiers OK)')
  console.log('  _redirects  : ' + Object.keys(REDIRECTS).length + ' règles chargées')
  console.log('─────────────────────────────────────────')
})
