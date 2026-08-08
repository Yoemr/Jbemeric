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
    nom: 'carte Coaching de l accueil, vers la bonne offre',
    page: 'index.html',
    largeur: 1300,
    // Les cartes de l'accueil sont aspirees de coaching.html par sync-mirror.js
    // et pointent sur #amateur et #competition. Ces deux ancres ont manque
    // pendant des mois : le visiteur atterrissait en haut de la page au lieu
    // de l'offre sur laquelle il avait clique. Invisible pour un verificateur
    // de liens, qui ne lisait pas les ancres construites en JavaScript.
    action: `document.querySelector('#mirror-coaching a[href*="#amateur"]').click()`,
    attente: 1500,
    attendu: `(location.pathname.includes('coaching') && !!document.getElementById('amateur')) || 'arrive sur ' + location.pathname + location.hash + ', ancre presente : ' + !!document.getElementById('amateur')`,
  },
  {
    nom: 'calendrier Evenements, les dates arrivent de Supabase',
    page: 'track.html',
    largeur: 1300,
    // La grille est vide dans le HTML : elle ne contient qu'un « Chargement… »
    // que track-render.js remplace. Si la requete echoue, le visiteur reste
    // devant ce mot sans que rien ne signale une panne. L'audit de fichiers ne
    // peut pas voir ca, il ne lit pas la base.
    besoinBase: true,
    action: `null`,
    attente: 2500,
    attendu: `document.querySelectorAll('#sr-grid .sr-card').length > 0 || 'aucune date affichee, la grille est restee sur ' + document.getElementById('sr-grid').textContent.trim().slice(0, 40)`,
  },
  {
    nom: 'onglets Evenements, chaque filtre laisse quelque chose a voir',
    page: 'track.html',
    largeur: 1300,
    // L'onglet « Vote en cours » vidait la grille sans un mot d'explication :
    // aucune carte ne portait ce statut, le filtre ne pouvait qu'echouer. Il a
    // ete retire. Ce parcours verifie qu'aucun onglet survivant ne refait ca.
    besoinBase: true,
    action: `null`,
    attente: 2500,
    attendu: `(function () {
      var statuts = {}
      document.querySelectorAll('#sr-grid .sr-card').forEach(function (c) { statuts[c.dataset.status] = 1 })
      var morts = []
      document.querySelectorAll('.sr-tab').forEach(function (t) {
        var m = (t.getAttribute('onclick') || '').match(/filterCards\\(this,'([a-z]+)'\\)/)
        if (m && m[1] !== 'all' && !statuts[m[1]]) morts.push(t.textContent.trim())
      })
      return morts.length === 0 || 'onglet(s) sans aucune carte : ' + morts.join(', ')
    })()`,
  },
]

// ── Pourquoi ce preambule existe ────────────────────────────────────────────
// Le 8 aout, les deux parcours ci-dessus ont echoue en annoncant « aucune date
// affichee ». Le site n'y etait pour rien : le poste ne joignait plus Supabase.
// Un outil qui ne sait pas distinguer « la page est cassee » de « le reseau est
// coupe » ment dans les deux sens, et c'est le pire des deux mensonges qu'on
// croit. Les parcours marques besoinBase sont donc declares non concluants
// quand la base est injoignable, au lieu d'etre comptes en echec.
const BASE_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
const BASE_CLE = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

async function baseJoignable() {
  try {
    const r = await fetch(BASE_URL, { headers: { apikey: BASE_CLE }, signal: AbortSignal.timeout(10000) })
    return r.ok || r.status === 401 || r.status === 404   // elle repond, c'est tout ce qui compte
  } catch (e) { return false }
}

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
  let sansBase = 0
  try {
    await attendrePret()
    const joignable = await baseJoignable()
    console.log('')
    console.log('  PARCOURS JB EMERIC   ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
    console.log('  ' + '-'.repeat(66))
    console.log(`  ${liste.length} parcours, ${BASE}`)
    if (!joignable) console.log('  Supabase injoignable depuis ce poste : les parcours qui en dependent')
    if (!joignable) console.log('  seront declares non concluants, pas en echec.')
    console.log('')

    for (const p of liste) {
      if (p.besoinBase && !joignable) {
        sansBase++
        console.log(`  SANS BASE ${p.nom}`)
        continue
      }
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
    console.log(echecs ? `  ${echecs} parcours cassé(s).` : '  Tous les parcours joues passent.')
    if (sansBase) console.log(`  ${sansBase} parcours non joue(s), faute d acces a Supabase. A rejouer sur un poste connecte.`)
    console.log('')
    console.log('  Non teste, faute d environnement separe : inscription, connexion,')
    console.log('  sauvegarde d un texte par JB. Ces parcours ecrivent en base.')
    console.log('')
  } finally {
    nav.kill()
    try { fs.rmSync(profil, { recursive: true, force: true }) } catch (e) { /* tant pis */ }
  }
  process.exit(echecs ? 1 : 0)
}

principal().catch(e => { console.error('  ' + e.message); process.exit(2) })
