// parcours.js : est-ce qu'un visiteur peut cliquer ?
//
//   node outil-dev/parcours.js            joue tous les parcours
//   node outil-dev/parcours.js accordeon  seulement ceux dont le nom contient ca
//
// ── Ce que ca repond, et que rien d'autre ne repondait ──────────────────────
// L'audit verifie que les liens pointent quelque part. fumee.js verifie que les
// pages ne plantent pas. Aucun des deux ne verifie qu'un bouton FAIT quelque
// chose.
//
// Or une bonne partie de ce site ne marche que par JavaScript : les portes de
// l'Academie naviguent par onclick et non par un <a>, l'accordeon de la FAQ
// n'ouvre rien sans son script, le menu telephone est un burger. Un lien
// correct dans le HTML ne prouve rien de tout ca.
//
// ── Ce que ca ne fait pas, volontairement ───────────────────────────────────
// Aucune ecriture. Ni inscription, ni vote enregistre, ni connexion, ni
// sauvegarde de texte. Ces parcours ecrivent dans la base de production de JB,
// et personne n'a demande a y semer des donnees de test. Ils restent a faire,
// le jour ou on aura un environnement separe ou un compte d'essai.
//
// ── Honnetete sur la methode ────────────────────────────────────────────────
// Les clics sont declenches par element.click() via le protocole DevTools, pas
// par un vrai mouvement de souris. Un vrai clic testerait en plus que l'element
// n'est pas recouvert par un autre. C'est une limite connue, assumee, et
// suffisante pour prouver qu'un gestionnaire existe et fonctionne.

const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = process.env.JBE_BASE || 'http://localhost:3000'
const PORT = 9334

// Un parcours : une page, une largeur, une action, et ce qu'on attend apres.
// « action » et « attendu » sont evalues dans la page. « attendu » rend un
// booleen, ou une chaine expliquant l'echec.
const PARCOURS = [
  {
    nom: 'accordeon FAQ, Academie',
    page: 'academie.html',
    largeur: 1300,
    action: `document.querySelector('.fq .fq-q').click()`,
    attendu: `!!document.querySelector('.fq.open') || 'aucune question ne s est ouverte'`,
  },
  {
    nom: 'accordeon FAQ, Coaching',
    page: 'coaching.html',
    largeur: 1300,
    action: `document.querySelector('.fq .fq-q').click()`,
    attendu: `!!document.querySelector('.fq.open') || 'aucune question ne s est ouverte'`,
  },
  {
    nom: 'porte de l Academie, navigation par onclick',
    page: 'academie.html',
    largeur: 1300,
    // Les portes ne sont pas des <a> : elles portent onclick="location.href=...".
    // Un verificateur de liens ne voit donc rien a verifier ici.
    action: `document.querySelector('.porte.enfant').click()`,
    attente: 1200,
    attendu: `location.pathname.includes('karting-enfant') || 'la porte n a pas navigue, on est reste sur ' + location.pathname`,
  },
  {
    nom: 'menu burger, telephone',
    page: 'index.html',
    largeur: 390,
    action: `document.getElementById('nav-burger').click()`,
    attendu: `document.getElementById('nav-mobile').classList.contains('open') || 'le menu mobile ne s est pas ouvert'`,
  },
  {
    nom: 'sous-menu Academie, bureau',
    page: 'index.html',
    largeur: 1300,
    action: `null`,
    attendu: `document.querySelectorAll('#nav-root a[href*="karting"]').length >= 2 || 'les entrees karting du menu sont absentes'`,
  },
  {
    nom: 'videos YouTube, tirage sur grand ecran',
    page: 'academie.html',
    largeur: 1300,
    action: `null`,
    attendu: `document.querySelectorAll('[data-videos] iframe').length === 4 || 'attendu 4 videos tirees, trouve ' + document.querySelectorAll('[data-videos] iframe').length`,
  },
  {
    nom: 'videos YouTube, aucune requete sur telephone',
    page: 'academie.html',
    largeur: 390,
    action: `null`,
    attendu: `document.querySelectorAll('[data-videos] iframe').length === 0 || 'des videos sont chargees sur telephone'`,
  },
  {
    nom: 'vote track-day, connu pour ne rien enregistrer',
    page: 'track.html',
    largeur: 1300,
    action: `(document.querySelector('[id^="btn-vote-"]') || {click(){}}).click()`,
    // Ce parcours documente un defaut connu au lieu de le taire. Le compteur
    // vit dans une variable du navigateur, rien ne part vers Supabase.
    // Voir docs/chantiers/2026-08-07-page-evenements.md section 5.
    attendu: `'defaut connu, le vote n enregistre rien, voir la fiche Evenements'`,
    tolere: true,
  },
]

function dormir(ms) { return new Promise(r => setTimeout(r, ms)) }

async function attendrePret() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) return } catch (e) { /* pas pret */ }
    await dormir(250)
  }
  throw new Error('le navigateur n\'a pas ouvert son port de debogage')
}

// Un onglet neuf par parcours. Reutiliser le meme laisse l'etat de la page
// precedente, et un parcours peut alors passer grace au travail du precedent.
async function ouvrirOnglet() {
  return (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
}
async function fermerOnglet(id) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/close/${id}`) } catch (e) { /* tant pis */ }
}

function dialogue(ws) {
  let id = 0
  const attentes = new Map()
  ws.onmessage = ev => {
    let m
    try { m = JSON.parse(ev.data) } catch (e) { return }
    // Le protocole enveloppe : le message porte { id, result }, et pour un
    // Runtime.evaluate ce result porte lui-meme { result: objet, exceptionDetails }.
    // Lire un niveau trop haut rend undefined partout, et tous les parcours
    // echouent pour la meme mauvaise raison.
    if (m.id && attentes.has(m.id)) { attentes.get(m.id)(m.result || {}); attentes.delete(m.id) }
  }
  return (method, params) => new Promise(ok => {
    const n = ++id
    attentes.set(n, ok)
    ws.send(JSON.stringify({ id: n, method, params: params || {} }))
  })
}

async function jouer(p) {
  const onglet = await ouvrirOnglet()
  const ws = new WebSocket(onglet.webSocketDebuggerUrl)
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error('websocket refuse')) })
  const envoyer = dialogue(ws)

  try {
    await envoyer('Emulation.setDeviceMetricsOverride', {
      width: p.largeur, height: 900, deviceScaleFactor: 1, mobile: p.largeur < 700,
    })
    await envoyer('Page.enable')
    await envoyer('Runtime.enable')
    await envoyer('Page.navigate', { url: `${BASE}/${p.page}` })
    await dormir(2500)

    if (p.action && p.action !== 'null') {
      const r = await envoyer('Runtime.evaluate', { expression: p.action, awaitPromise: true })
      if (r.exceptionDetails) {
        const d = r.exceptionDetails
        const texte = (d.exception && (d.exception.description || d.exception.value)) || d.text
        return { ok: false, pourquoi: 'l action a echoue : ' + String(texte).split('\n')[0] }
      }
    }
    await dormir(p.attente || 400)

    const v = await envoyer('Runtime.evaluate', { expression: p.attendu, returnByValue: true })
    if (v.exceptionDetails) {
      const d = v.exceptionDetails
      const texte = (d.exception && (d.exception.description || d.exception.value)) || d.text
      return { ok: false, pourquoi: 'la verification a plante : ' + String(texte).split('\n')[0] }
    }
    const valeur = v.result && v.result.value
    if (valeur === true) return { ok: true }
    return { ok: false, pourquoi: String(valeur) }
  } finally {
    ws.close()
    await fermerOnglet(onglet.id)
  }
}

async function principal() {
  const filtre = process.argv.slice(2).find(a => !a.startsWith('--'))
  const liste = filtre ? PARCOURS.filter(p => p.nom.includes(filtre)) : PARCOURS

  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'jbe-parcours-'))
  const nav = spawn(CHROME, [
    '--headless', '--no-sandbox', '--disable-gpu', '--no-proxy-server',
    '--user-data-dir=' + profil, '--remote-debugging-port=' + PORT, 'about:blank',
  ], { stdio: 'ignore' })

  let echecs = 0
  try {
    await attendrePret()
    console.log('')
    console.log('  PARCOURS JB EMERIC   ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
    console.log('  ' + '-'.repeat(66))
    console.log(`  ${liste.length} parcours, ${BASE}`)
    console.log('')

    for (const p of liste) {
      const r = await jouer(p)
      if (r.ok) { console.log(`  OK       ${p.nom}`); continue }
      if (p.tolere) { console.log(`  CONNU    ${p.nom}`); console.log(`             ${r.pourquoi}`); continue }
      echecs++
      console.log(`  ECHEC    ${p.nom}`)
      console.log(`             ${r.pourquoi}`)
      console.log(`             page ${p.page}, largeur ${p.largeur}`)
    }

    console.log('')
    console.log('  ' + '-'.repeat(66))
    console.log(echecs ? `  ${echecs} parcours cassé(s).` : '  Tous les parcours passent.')
    console.log('')
    console.log('  Non teste, faute d environnement separe : inscription, vote enregistre,')
    console.log('  connexion, sauvegarde d un texte par JB. Ces parcours ecrivent en base.')
    console.log('')
  } finally {
    nav.kill()
    try { fs.rmSync(profil, { recursive: true, force: true }) } catch (e) { /* tant pis */ }
  }
  process.exit(echecs ? 1 : 0)
}

principal().catch(e => { console.error('  ' + e.message); process.exit(2) })
