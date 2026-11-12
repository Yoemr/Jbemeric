// admin.js : le mode édition de JB, joué dans un navigateur.
//
// POUR QUOI. Le live-editor ne tourne qu'avec une session administrateur, et
// aucun autre banc ne l'ouvre. Ses défauts n'apparaissaient que quand Yoan ou
// JB tombaient dessus : le « 32 » impossible à effacer du titre de
// l'Académie (10 novembre 2026), le bouton Dashboard vers une page qui
// n'existe pas, la barre d'édition elle-même proposée à l'édition.
//
// COMMENT. Comme visiteur.js : le module supabase-js de jsdelivr est remplacé
// par un faux client, ici avec une session administrateur. Les écritures sont
// capturées (window.__ecr), rien ne part vers la base. Chaque scénario dit ce
// qu'un humain ferait, et ce que la base devrait recevoir.
//
// Usage : node outil-dev/admin.js [--base=<instantane.json>]   (serveur local requis)
//
// --base : les vrais textes de la base, une liste [{id, content}] tirée de
// site_content par l'outil MCP (même instantané que visiteur.js, ou la seule
// table site_content). Le banc charge alors les pages du périmètre avec ces
// textes et signale chaque élément mis en forme (em, span, br) dont la
// reconstruction ne garde pas la structure d'origine : le défaut du titre de
// l'accueil coupé mot par mot (12 novembre 2026) se voyait ainsi sur trois
// éléments du site avant correction, et sur aucun après.
const { chromium } = require('playwright')
const fs = require('fs')
const CHROME = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined

function stub(lignes) {
  return `window.__ecr = []
const LIGNES = ${JSON.stringify(lignes || [])}
function q(table) {
  const rows = table === 'site_content' ? LIGNES.slice() : []
  const b = { select() { return b }, order() { return b }, range() { return b }, eq() { return b }, neq() { return b },
    in() { return b }, like() { return b }, limit() { return b }, single() { return b }, maybeSingle() { return b },
    upsert(p) { window.__ecr.push(p); return b }, insert(p) { window.__ecr.push(p); return b },
    update(p) { window.__ecr.push(p); return b }, delete() { return b },
    then(r, j) { return Promise.resolve({ data: rows, error: null }).then(r, j) },
    catch(f) { return Promise.resolve({ data: rows, error: null }).catch(f) } }
  return b
}
const U = { id: 'u', email: 'jb@essai', app_metadata: { role: 'admin' }, user_metadata: { prenom: 'JB' } }
export function createClient() { return { from: q,
  auth: { getSession: () => Promise.resolve({ data: { session: { user: U, access_token: 'x' } }, error: null }),
          getUser: () => Promise.resolve({ data: { user: U }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          signOut: () => Promise.resolve({ error: null }) },
  storage: { from: () => ({ upload: () => Promise.resolve({ data: {}, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  channel: () => ({ on() { return this }, subscribe() { return this } }),
  rpc: () => Promise.resolve({ data: null, error: null }) } }
export default { createClient }`
}

async function ouvrir(navigateur, page, lignes) {
  const p = await navigateur.newPage({ viewport: { width: 1440, height: 900 } })
  p.__erreurs = []
  p.on('pageerror', e => p.__erreurs.push(e.message))
  await p.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: stub(lignes) }))
  await p.route(/supabase\.co\/rest\/v1\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await p.goto('http://localhost:3000/' + page)
  await p.waitForTimeout(2500)
  return p
}

// Survoler, cliquer sur le crayon, poser le curseur en fin de texte.
async function editer(p, selecteur) {
  await p.hover(selecteur)
  await p.waitForTimeout(150)
  await p.click('#jbe-pencil-global')
  await p.waitForTimeout(200)
  await p.evaluate(sel => {
    const el = document.querySelector(sel); const r = document.createRange()
    r.selectNodeContents(el); r.collapse(false)
    const s = getSelection(); s.removeAllRanges(); s.addRange(r)
  }, selecteur)
}
async function valider(p) { await p.mouse.click(700, 880); await p.waitForTimeout(500) }
const derniere = p => p.evaluate(() => window.__ecr[window.__ecr.length - 1] || null)

const SCENARIOS = [
  {
    nom: 'la barre d edition mene au dashboard, et ne se propose pas a l edition',
    page: 'academie.html',
    jouer: async p => p.evaluate(() => ({
      lien: (document.querySelector('.jbe-btn-dash') || {}).getAttribute && document.querySelector('.jbe-btn-dash').getAttribute('href'),
      editables: document.querySelectorAll('#jbe-bar [data-legacy-id]').length,
    })),
    attendu: r => r.lien === '/admin/gestion.html' && r.editables === 0 || ('lien ' + r.lien + ', textes de la barre editables : ' + r.editables),
  },
  {
    nom: 'un texte modifie part en base sous sa cle',
    page: 'academie.html',
    jouer: async p => {
      await editer(p, '.pc-lead')
      await p.keyboard.type(' Essai.')
      await valider(p)
      return derniere(p)
    },
    attendu: r => (r && /\sEssai\.$/.test(r.content) && /^academie__/.test(r.id)) || ('ecriture : ' + JSON.stringify(r)),
  },
  {
    nom: 'une phrase tapee en majuscules est remise en casse normale',
    page: 'academie.html',
    jouer: async p => {
      await editer(p, '.pc-lead')
      await p.keyboard.press('Control+A')
      await p.keyboard.type('UNE JOURNEE A BRIGNOLES AVEC JB !!! venez')
      await valider(p)
      return derniere(p)
    },
    attendu: r => (r && r.content === 'Une journee a Brignoles avec JB\u00a0! Venez') || ('ecriture : ' + JSON.stringify(r)),
  },
  {
    // Le titre porte une balise <em>. La base contient un mot de plus.
    // Avant le correctif, le garde-fou des balises remettait le mot à chaque
    // effacement.
    nom: 'un mot ajoute dans un titre mis en forme s efface',
    page: 'academie.html',
    lignes: [{ id: 'academie__s_hero-academie__div_hero-content__h1_hero-title', content: "L'ACADÉMIE JB EMERIC 32" }],
    jouer: async p => {
      await editer(p, '.hero-title')
      for (let i = 0; i < 3; i++) await p.keyboard.press('Backspace')
      await valider(p)
      return derniere(p)
    },
    attendu: r => (r && r.content === "L'ACADÉMIE JB EMERIC") || ('ecriture : ' + JSON.stringify(r)),
  },
  {
    // Dates, FAQ et avis viennent du dashboard : pas de crayon, un bouton
    // vers le bon onglet (Yoan, 10 novembre 2026).
    nom: 'les blocs geres par le dashboard n ont pas de crayon et menent a leur onglet',
    page: 'academie.html',
    jouer: async p => p.evaluate(() => [...document.querySelectorAll('[data-gestion]')].map(b => ({
      onglet: b.getAttribute('data-gestion'),
      lien: (b.querySelector(':scope > .jbe-gerer') || {}).getAttribute ? b.querySelector(':scope > .jbe-gerer').getAttribute('href') : null,
      editables: b.querySelectorAll('[data-legacy-id]').length,
    }))),
    attendu: r => {
      if (r.length < 3) return 'attendu au moins trois blocs geres, trouve ' + r.length
      const faux = r.filter(b => b.lien !== '/admin/gestion.html#' + b.onglet || b.editables)
      return !faux.length || ('blocs fautifs : ' + JSON.stringify(faux))
    },
  },
  {
    // Le titre de l'accueil : un nom en clair, une accroche en <em>. JB a
    // changé le nom ; l'accroche ne doit pas se couper mot par mot
    // (12 novembre 2026, un mot par ligne).
    nom: 'un titre nom plus accroche garde l accroche en un seul passage',
    page: 'index.html',
    lignes: [{ id: 'index__s_hero-accueil__div_hero-content__h1_hero-title', content: 'JB Emeric Apprendre à piloter, à tout âge' }],
    jouer: async p => p.evaluate(() => document.querySelector('.hero-title').innerHTML),
    attendu: r => r === 'JB Emeric <em>Apprendre à piloter, à tout âge</em>' || ('titre reconstruit : ' + r),
  },
  {
    nom: 'la barre d edition occupe toute la largeur',
    page: 'academie.html',
    jouer: async p => p.evaluate(() => getComputedStyle(document.getElementById('jbe-bar')).right),
    attendu: r => r === '0px' || ('marge droite de la barre : ' + r),
  },
  {
    // Un texte collé en deux paragraphes garde son retour à la ligne, en base
    // et à l'écran (page Entreprises, 12 novembre 2026).
    nom: 'un texte colle en deux paragraphes garde son retour a la ligne',
    page: 'academie.html',
    jouer: async p => {
      await editer(p, '.pc-lead')
      await p.evaluate(() => { document.execCommand('selectAll'); document.execCommand('insertText', false, 'Premier paragraphe.\n\nSecond paragraphe.') })
      await valider(p)
      return { ecrit: await derniere(p), html: await p.evaluate(() => document.querySelector('.pc-lead').innerHTML) }
    },
    attendu: r => (r.ecrit && /Premier paragraphe\.\n+Second paragraphe\./.test(r.ecrit.content) && /<br>/.test(r.html))
      || ('ecrit ' + JSON.stringify(r.ecrit && r.ecrit.content) + ', affiche ' + r.html),
  },
  {
    nom: 'la fenetre de remplacement d une photo s ouvre',
    page: 'academie.html',
    jouer: async p => {
      const img = await p.$('#voie-photo-enfant')
      await img.hover(); await p.waitForTimeout(200)
      await p.hover('#jbe-img-float-btn').catch(() => {})
      await p.click('#jbe-img-float-btn').catch(() => {})
      await p.waitForTimeout(300)
      return p.evaluate(() => !![...document.querySelectorAll('input[type=file]')].find(i => i.closest('div') && i.closest('div').getClientRects().length))
    },
    attendu: r => r === true || 'aucune fenetre avec un choix de fichier',
  },
]

module.exports = { stub }

if (require.main === module) (async () => {
  try { const r = await fetch('http://localhost:3000/'); if (!r.ok) throw 0 }
  catch (e) { console.error('Serveur local injoignable : node outil-dev/dev-server.js'); process.exit(2) }
  const navigateur = await chromium.launch(CHROME ? { executablePath: CHROME } : {})
  let echecs = 0
  console.log('\n  MODE EDITION DE JB, session administrateur simulee, aucune ecriture reelle\n')
  for (const s of SCENARIOS) {
    const p = await ouvrir(navigateur, s.page, s.lignes)
    let verdict
    try { verdict = s.attendu(await s.jouer(p)) } catch (e) { verdict = 'le scenario a plante : ' + e.message }
    if (p.__erreurs.length) verdict = verdict === true ? 'erreur de page : ' + p.__erreurs[0] : verdict
    if (verdict === true) console.log('  OK       ' + s.nom)
    else { echecs++; console.log('  ECHEC    ' + s.nom + '\n             ' + verdict) }
    await p.close()
  }
  const optBase = process.argv.find(a => a.startsWith('--base='))
  if (optBase) {
    let lignes = JSON.parse(fs.readFileSync(optBase.slice(7), 'utf8'))
    if (!Array.isArray(lignes)) lignes = lignes.site_content || []
    lignes = lignes.filter(l => typeof l.content === 'string' && !/^https?:/.test(l.content))
    console.log('\n  MISE EN FORME, ' + lignes.length + ' textes de la base\n')
    for (const pg of require('./audit/perimetre').PAGES) {
      const p = await ouvrir(navigateur, pg, lignes)
      const casses = await p.evaluate(() => {
        const runs = h => (h.match(/<(em|span|strong|b|i)\b/gi) || []).length
        const brs = h => (h.match(/<br/gi) || []).length
        return [...document.querySelectorAll('[data-orig-html]')].filter(e => {
          const o = e.getAttribute('data-orig-html'), n = e.innerHTML
          return /<(em|span|strong|b|i|br)\b/i.test(o) && o !== n && (runs(o) !== runs(n) || brs(o) !== brs(n))
        }).map(e => e.id + ' : ' + e.innerHTML.slice(0, 100))
      })
      await p.close()
      if (casses.length) { echecs += casses.length; console.log('  ECHEC    ' + pg + '\n             ' + casses.join('\n             ')) }
      else console.log('  OK       ' + pg)
    }
  }
  await navigateur.close()
  console.log('\n  ' + (echecs ? echecs + ' scenario(s) en echec.' : 'Tous les scenarios passent.') + '\n')
  process.exit(echecs ? 1 : 0)
})()
