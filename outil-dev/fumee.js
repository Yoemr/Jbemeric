// fumee.js : est-ce que les pages tournent ?
//
//   node outil-dev/fumee.js                  les 9 pages du perimetre
//   node outil-dev/fumee.js academie.html    une page precise
//   node outil-dev/fumee.js --tout           toutes les pages du site
//
// ── Ce que ca repond ────────────────────────────────────────────────────────
// L'audit lit des fichiers. Il ne saura jamais dire si une page PLANTE. Ce
// script ouvre chaque page dans un vrai navigateur et rapporte trois choses :
//
//   erreur JavaScript      une exception non rattrapee, la page s'arrete la
//   message console        une erreur ou un avertissement emis par le code
//   requete en echec       une image, un script ou une API qui ne repond pas
//
// C'est le complement exact de l'audit : lui verifie ce qui est ecrit, celui-ci
// verifie ce qui se passe.
//
// ── Pourquoi le protocole DevTools ──────────────────────────────────────────
// Chromium en ligne de commande ne remonte pas la console de la page, meme avec
// --enable-logging. Il faut s'y brancher. Node 22 fournit un client WebSocket
// integre, donc aucune dependance a installer.
//
// ── Ce que ca ne dit pas ────────────────────────────────────────────────────
// Une page sans erreur n'est pas une page correcte. Ce script ne clique sur
// rien, ne remplit aucun formulaire, ne juge aucun rendu. Il dit seulement que
// rien n'a explose au chargement, ce qui est le minimum et n'etait verifie
// nulle part avant le 7 aout 2026.

const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const PERIMETRE = require('./audit/perimetre')

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = process.env.JBE_BASE || 'http://localhost:3000'
const PORT = 9333
const ATTENTE = 5000   // laisser le temps aux appels reseau de repondre

// Bruits qui ne viennent pas du site et qu'on ne peut pas corriger ici.
const IGNORER = [
  /favicon\.ico/,
  /^chrome-extension:/,
  /DevTools/,
]

// Ce qui vient d'ailleurs que du site. Google Fonts, jsDelivr, Supabase et les
// vignettes YouTube sont des dependances externes : leur echec depuis un bac a
// sable ne dit rien sur le site. On les compte a part au lieu de les melanger
// aux vrais defauts, sinon le rapport est illisible et on cesse de le lire.
//
// Un echec externe reste une information : le jour ou jsDelivr ne repond plus,
// le live-editor ne se charge pas et JB ne peut plus rien editer. C'est pour ca
// qu'ils sont comptes, et pas simplement jetes.
const EXTERNE = /^https?:\/\/(?!localhost|127\.0\.0\.1)/
const CERTIFICAT = /ERR_CERT_|ERR_PROXY|ERR_TUNNEL/

function dormir(ms) { return new Promise(r => setTimeout(r, ms)) }

async function attendrePret() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) return
    } catch (e) { /* pas encore pret */ }
    await dormir(250)
  }
  throw new Error('le navigateur n\'a pas ouvert son port de debogage')
}

// Un onglet NEUF par page. Reutiliser le meme onglet paraissait economique et
// donnait de faux resultats : un script lent de la page precedente se declenche
// apres la navigation suivante, et son erreur est imputee a la mauvaise page.
// Le 7 aout, deux pages ont ete accusees d'une SyntaxError qui ne se
// reproduisait pas quand on les ouvrait seules.
async function ouvrirOnglet() {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
  return r.json()
}
async function fermerOnglet(id) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/close/${id}`) } catch (e) { /* tant pis */ }
}

async function inspecter(ws, url) {
  const trouve = { erreurs: [], console: [], reseau: [], externes: new Set() }
  const urlParRequete = new Map()
  let id = 0
  const envoyer = (method, params) => ws.send(JSON.stringify({ id: ++id, method, params: params || {} }))

  ws.onmessage = (ev) => {
    let m
    try { m = JSON.parse(ev.data) } catch (e) { return }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails
      const texte = (d.exception && (d.exception.description || d.exception.value)) || d.text
      // D'ou vient l'erreur : sans le fichier et la ligne, une SyntaxError est
      // introuvable. Le 7 aout, « Unexpected identifier 'DM' » n'a pu etre
      // localisee qu'apres avoir ajoute ceci.
      const ou = d.url ? ` [${d.url.replace(/^https?:\/\/[^/]+\//, '')}:${(d.lineNumber || 0) + 1}]` : ''
      trouve.erreurs.push(String(texte).split('\n')[0] + ou)
    }
    if (m.method === 'Log.entryAdded') {
      const e = m.params.entry
      if (e.level !== 'error' && e.level !== 'warning') return
      const cible = e.url || ''
      if (EXTERNE.test(cible)) { trouve.externes.add(new URL(cible).host); return }
      trouve.console.push(`${e.level} : ${e.text}${cible ? ' (' + cible + ')' : ''}`)
    }
    if (m.method === 'Network.requestWillBeSent') {
      urlParRequete.set(m.params.requestId, m.params.request.url)
    }
    if (m.method === 'Network.loadingFailed' && !m.params.canceled) {
      const cible = urlParRequete.get(m.params.requestId) || ''
      if (EXTERNE.test(cible) || CERTIFICAT.test(m.params.errorText)) {
        if (cible) trouve.externes.add(new URL(cible).host)
        return
      }
      trouve.reseau.push(`${m.params.errorText} sur ${cible || m.params.type}`)
    }
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
      const cible = m.params.response.url
      if (EXTERNE.test(cible)) { trouve.externes.add(new URL(cible).host); return }
      trouve.reseau.push(`HTTP ${m.params.response.status} sur ${cible}`)
    }
  }

  envoyer('Runtime.enable')
  envoyer('Log.enable')
  envoyer('Network.enable')
  envoyer('Page.enable')
  await dormir(150)
  envoyer('Page.navigate', { url })
  await dormir(ATTENTE)

  const garder = t => !IGNORER.some(r => r.test(t))
  return {
    erreurs: trouve.erreurs.filter(garder),
    console: [...new Set(trouve.console)].filter(garder),
    reseau: [...new Set(trouve.reseau)].filter(garder),
    externes: [...trouve.externes].sort(),
  }
}

async function principal() {
  const args = process.argv.slice(2)
  let pages
  if (args.includes('--tout')) {
    const { construire } = require('./audit/contexte')
    pages = construire().pages.map(p => p.chemin)
  } else {
    const nommees = args.filter(a => !a.startsWith('--'))
    pages = nommees.length ? nommees : PERIMETRE.PAGES
  }

  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'jbe-fumee-'))
  const nav = spawn(CHROME, [
    '--headless', '--no-sandbox', '--disable-gpu', '--no-proxy-server',
    '--user-data-dir=' + profil,
    '--remote-debugging-port=' + PORT,
    'about:blank',
  ], { stdio: 'ignore' })

  let code = 0
  try {
    await attendrePret()
    console.log('')
    console.log('  FUMEE JB EMERIC   ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
    console.log('  ' + '-'.repeat(66))
    console.log(`  ${pages.length} page(s), ${BASE}`)
    console.log('')

    for (const page of pages) {
      const onglet = await ouvrirOnglet()
      const ws = new WebSocket(onglet.webSocketDebuggerUrl)
      await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error('websocket refuse')) })
      const r = await inspecter(ws, `${BASE}/${page}`)
      ws.close()
      await fermerOnglet(onglet.id)

      const total = r.erreurs.length + r.console.length + r.reseau.length
      const dehors = r.externes.length ? `   (${r.externes.length} hote(s) externe(s) injoignable(s) : ${r.externes.join(', ')})` : ''
      if (!total) { console.log(`  OK       ${page}${dehors}`); continue }
      code = 1
      console.log(`  PROBLEME ${page}`)
      for (const e of r.erreurs) console.log(`             erreur JS   ${e.slice(0, 110)}`)
      for (const c of r.console) console.log(`             console     ${c.slice(0, 110)}`)
      for (const n of r.reseau) console.log(`             reseau      ${n.slice(0, 110)}`)
      if (dehors) console.log(`            ${dehors.trim()}`)
    }
    console.log('')
    console.log('  ' + '-'.repeat(66))
    console.log(code ? '  Des pages ne tournent pas proprement.' : '  Toutes les pages se chargent sans erreur.')
    console.log('')
  } finally {
    nav.kill()
    try { fs.rmSync(profil, { recursive: true, force: true }) } catch (e) { /* tant pis */ }
  }
  process.exit(code)
}

principal().catch(e => { console.error('  ' + e.message); process.exit(2) })
