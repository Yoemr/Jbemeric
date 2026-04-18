// dev-server.js — Serveur local JB EMERIC
// Remplace "npx serve" : même fonction + met à jour les HTML à chaque sauvegarde
//
// Lancement : node dev-server.js
// Puis ouvrir : http://localhost:3000

var http = require('http')
var fs   = require('fs')
var path = require('path')

var PORT = 3000
var ROOT = __dirname

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
        var page     = (payload.page || '').replace(/[^a-z0-9_-]/gi, '')
        var entries  = payload.entries || {}
        var filename = page + '.html'
        var filePath = path.join(ROOT, filename)

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

  if (!resolved) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404 — ' + pathname)
    return
  }

  var ext  = path.extname(resolved)
  var mime = MIME[ext] || 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime })
  fs.createReadStream(resolved).pipe(res)

}).listen(PORT, function () {
  console.log('─────────────────────────────────────────')
  console.log('  Serveur JBE : http://localhost:' + PORT)
  console.log('  /save-html  : actif (màj HTML auto)')
  console.log('─────────────────────────────────────────')
})
