// boutique.js : les fonctions de paiement, jouées contre une fausse base et
// un faux PayPal.
//
// POUR QUOI. Les fonctions de netlify/functions/ ne tournent que chez Netlify,
// avec de vraies clés. Ce banc les exécute ici, sans réseau : fetch est
// remplacé par un simulateur de Supabase (tables en mémoire, filtres eq) et de
// PayPal (commandes, encaissement). Il prouve les règles qui protègent
// l'argent de l'association : le prix vient de la base, une date complète se
// refuse, un montant encaissé différent n'est pas validé, une double
// validation ne paie pas deux fois, un bon cadeau ne sert qu'une fois.
//
// Usage : node outil-dev/boutique.js
const path = require('path')
const F = path.join(__dirname, '..', 'netlify', 'functions')

const vraiFetch = global.fetch
let BASE, COMMANDES, MONTANT_ENCAISSE
function remettre() {
  const demain = new Date(Date.now() + 86400e3).toISOString().slice(0, 10)
  BASE = {
    events: [
      { id: 'ev1', date_event: demain, type: 'Karting enfant, la journée', prix: 195, nb_places: 6, nb_inscrits: 2, status: 'Open', visible_site: true, formule_id: 101 },
      { id: 'ev2', date_event: demain, type: 'Karting adulte, la journée', prix: 195, nb_places: 6, nb_inscrits: 6, status: 'Open', visible_site: true, formule_id: 102 },
    ],
    formules: [{ id: 101, libelle: 'Karting enfant, la journée', prix_conseille: 195, actif: true, bon_cadeau: true }],
    inscriptions: [], bons_cadeaux: [],
  }
  COMMANDES = {}
  MONTANT_ENCAISSE = null
}
let n = 0
const uid = () => 'id' + (++n)

function filtrer(rows, params) {
  return rows.filter(r => {
    for (const [k, v] of params) {
      if (['select', 'order', 'limit'].includes(k)) continue
      const [op, val] = [v.slice(0, v.indexOf('.')), v.slice(v.indexOf('.') + 1)]
      if (op === 'eq' && String(r[k]) !== decodeURIComponent(val)) return false
    }
    return true
  })
}

global.fetch = async (url, opt) => {
  opt = opt || {}
  const ok = (corps, statut) => ({ ok: (statut || 200) < 400, status: statut || 200, json: async () => corps, text: async () => JSON.stringify(corps) })
  if (url.includes('/rest/v1/')) {
    const u = new URL(url); const table = u.pathname.split('/rest/v1/')[1]
    const rows = BASE[table]
    if (!opt.method || opt.method === 'GET') return ok(filtrer(rows, u.searchParams))
    if (opt.method === 'POST') { const r = Object.assign({ id: uid() }, JSON.parse(opt.body)); rows.push(r); return ok([r], 201) }
    if (opt.method === 'PATCH') { const c = JSON.parse(opt.body); const t = filtrer(rows, u.searchParams); t.forEach(r => Object.assign(r, c)); return ok(t) }
  }
  if (url.endsWith('/v1/oauth2/token')) return ok({ access_token: 'jeton' })
  if (url.endsWith('/v2/checkout/orders')) {
    const c = JSON.parse(opt.body); const id = 'PP' + uid().toUpperCase()
    COMMANDES[id] = c.purchase_units[0]; return ok({ id, status: 'CREATED' }, 201)
  }
  const m = url.match(/\/v2\/checkout\/orders\/([^/]+)\/capture$/)
  if (m) {
    const pu = COMMANDES[m[1]]
    const valeur = MONTANT_ENCAISSE || pu.amount.value
    return ok({ status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ status: 'COMPLETED', amount: { currency_code: 'EUR', value: valeur } }] } }] })
  }
  throw new Error('appel inattendu ' + url)
}

function charger(nom) { delete require.cache[require.resolve(path.join(F, nom))]; delete require.cache[require.resolve(path.join(F, '_boutique'))]; return require(path.join(F, nom)) }
const appel = async (nom, corps) => { const r = await charger(nom).handler({ httpMethod: 'POST', body: JSON.stringify(corps) }); return { statut: r.statusCode, corps: JSON.parse(r.body) } }
function cles(sur) {
  if (sur) Object.assign(process.env, { SUPABASE_SERVICE_ROLE_KEY: 'svc', PAYPAL_CLIENT_ID: 'client-public', PAYPAL_SECRET: 'secret', PAYPAL_ENV: 'sandbox' })
  else ['SUPABASE_SERVICE_ROLE_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET', 'PAYPAL_ENV'].forEach(k => delete process.env[k])
}
// Un faux PayPal : un bouton qui appelle createOrder puis onApprove, et un
// message de paiement en 4 fois.
const FAUX_PAYPAL = `window.paypal = {
  Buttons: function (o) { return { render: function (zone) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'faux-paypal'; b.textContent = 'Payer avec PayPal'
    b.onclick = function () { o.onClick({}, { resolve: function () { return true }, reject: function () { window.__refuse = true; return false } })
      if (window.__refuse) { window.__refuse = false; return }
      o.createOrder().then(function (id) { window.__commande = id; return o.onApprove({ orderID: id }) }) }
    zone.appendChild(b) } } },
  Messages: function (o) { return { render: function (z) { z.textContent = 'ou 4 x ' + (o.amount / 4).toFixed(2) + ' € sans frais' } } },
}`
async function page(actif) {
  const { chromium } = require('playwright')
  const fs = require('fs')
  const nav = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {})
  const p = await nav.newPage({ viewport: { width: 1280, height: 900 } })
  p.__envois = []
  const demain = new Date(Date.now() + 86400e3).toISOString().slice(0, 10)
  await p.route('**/.netlify/functions/paiement-config', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(actif ? { active: true, clientId: 'test', env: 'sandbox' } : { active: false }) }))
  await p.route('**/.netlify/functions/paiement-creer', r => { p.__envois.push(JSON.parse(r.request().postData())); r.fulfill({ contentType: 'application/json', body: '{"orderID":"PP1"}' }) })
  await p.route('**/.netlify/functions/paiement-valider', r => { p.__envois.push(JSON.parse(r.request().postData())); r.fulfill({ contentType: 'application/json', body: '{"ok":true,"quoi":"journee"}' }) })
  await p.route('https://www.paypal.com/sdk/js**', r => r.fulfill({ contentType: 'application/javascript', body: FAUX_PAYPAL }))
  await p.route(/supabase\.co\/rest\/v1\/events/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify([{ id: 'ev1', date_event: demain, type: 'Karting enfant, la journée', status: 'Open', prix: 195, nb_places: 6, nb_inscrits: 2, circuit_id: 1 }]) }))
  await p.route(/supabase\.co\/rest\/v1\/circuits/, r => r.fulfill({ contentType: 'application/json', body: '[{"id":1,"nom":"Circuit de Brignoles"}]' }))
  await p.goto('http://localhost:3000/academie.html'); await p.waitForTimeout(1500)
  p.__fermer = () => nav.close()
  return p
}
const NAVIGATEUR = [
  ['boutique fermee : Reserver mene au formulaire de contact', async () => {
    const p = await page(false)
    const href = await p.getAttribute('#dates [data-reserver]', 'href')
    await p.click('#dates [data-reserver]'); await p.waitForTimeout(800)
    const r = (/contact\.html/.test(p.url()) && !(await p.$('.btq-fenetre'))) || ('reste sur ' + p.url() + ', lien ' + href)
    await p.__fermer(); return r
  }],
  ['boutique ouverte : la fenetre s ouvre, le paiement part avec la bonne date', async () => {
    const p = await page(true)
    await p.click('#dates [data-reserver]'); await p.waitForSelector('.btq-fenetre')
    const quatre = await p.textContent('.btq-4x')
    await p.fill('[name=prenom]', 'Léa'); await p.fill('[name=nom]', 'Martin'); await p.fill('[name=age]', '9'); await p.fill('[name=email]', 'lea@exemple.fr')
    await p.click('.faux-paypal'); await p.waitForTimeout(300)
    const avantConditions = p.__envois.length
    await p.check('[name=conditions]')
    await p.click('.faux-paypal'); await p.waitForTimeout(800)
    const confirme = await p.textContent('.btq-fenetre')
    const e = p.__envois[0] || {}
    await p.__fermer()
    if (avantConditions) return 'le paiement est parti sans les conditions cochees'
    if (!/4 x 48\.75/.test(quatre)) return 'pas de message 4x : ' + quatre
    if (e.event_id !== 'ev1' || e.quoi !== 'journee' || e.prenom !== 'Léa' || e.age !== '9') return 'demande envoyee : ' + JSON.stringify(e)
    if ('prix' in e || 'montant' in e) return 'le navigateur envoie un prix'
    return /Réservation confirmée/.test(confirme) || 'pas de confirmation : ' + confirme
  }],
]

const pilote = { quoi: 'journee', event_id: 'ev1', prenom: 'Léa', nom: 'Martin', email: 'lea@exemple.fr', age: 9 }

const SCENARIOS = [
  ['sans cles, la boutique se dit eteinte', async () => {
    cles(false)
    const r = await charger('paiement-config').handler({})
    const c = JSON.parse(r.body)
    return c.active === false || 'config : ' + r.body
  }],
  ['avec les cles, seul l identifiant public sort', async () => {
    const r = await charger('paiement-config').handler({}); const t = r.body
    return (JSON.parse(t).clientId === 'client-public' && !t.includes('secret') && !t.includes('svc')) || 'config : ' + t
  }],
  ['une journee : reservation en attente, puis payee apres encaissement', async () => {
    const c = await appel('paiement-creer', pilote)
    if (c.statut !== 200 || !c.corps.orderID) return 'creation : ' + JSON.stringify(c)
    const ins = BASE.inscriptions[0]
    if (ins.statut !== 'attente_paiement' || ins.paiement_ref !== c.corps.orderID) return 'reservation : ' + JSON.stringify(ins)
    const v = await appel('paiement-valider', { orderID: c.corps.orderID })
    return (v.statut === 200 && ins.statut === 'payee' && !!ins.paye_le) || 'validation : ' + JSON.stringify(v) + ' ' + ins.statut
  }],
  ['le prix vient de la base, jamais du navigateur', async () => {
    const c = await appel('paiement-creer', Object.assign({}, pilote, { prix: 1, montant: 1 }))
    const pu = COMMANDES[c.corps.orderID]
    return pu.amount.value === '195.00' || 'montant demande a PayPal : ' + pu.amount.value
  }],
  ['une date complete se refuse', async () => {
    const c = await appel('paiement-creer', Object.assign({}, pilote, { event_id: 'ev2' }))
    return (c.statut === 409 && BASE.inscriptions.length === 0) || JSON.stringify(c)
  }],
  ['un email invalide se refuse', async () => {
    const c = await appel('paiement-creer', Object.assign({}, pilote, { email: 'pas-un-email' }))
    return c.statut === 400 || JSON.stringify(c)
  }],
  ['un montant encaisse different n est pas valide', async () => {
    const c = await appel('paiement-creer', pilote)
    MONTANT_ENCAISSE = '1.00'
    const v = await appel('paiement-valider', { orderID: c.corps.orderID })
    return (v.statut === 409 && BASE.inscriptions[0].statut === 'attente_paiement') || JSON.stringify(v) + ' ' + BASE.inscriptions[0].statut
  }],
  ['une double validation ne paie pas deux fois', async () => {
    const c = await appel('paiement-creer', pilote)
    let captures = 0; const f = global.fetch
    global.fetch = async (u, o) => { if (/\/capture$/.test(u)) captures++; return f(u, o) }
    await appel('paiement-valider', { orderID: c.corps.orderID })
    const v2 = await appel('paiement-valider', { orderID: c.corps.orderID })
    global.fetch = f
    return (captures === 1 && v2.statut === 200) || 'encaissements : ' + captures
  }],
  ['un bon cadeau achete, puis utilise une seule fois', async () => {
    const c = await appel('paiement-creer', { quoi: 'cadeau', formule_id: 101, acheteur_nom: 'Paul Martin', acheteur_email: 'paul@exemple.fr', beneficiaire: 'Léa' })
    if (c.statut !== 200) return 'achat : ' + JSON.stringify(c)
    const v = await appel('paiement-valider', { orderID: c.corps.orderID })
    const bon = BASE.bons_cadeaux[0]
    if (!(v.statut === 200 && bon.statut === 'paye' && /^JB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(v.corps.code) && !bon.valable_jusqu)) return 'bon : ' + JSON.stringify(v) + ' ' + JSON.stringify(bon)
    const r1 = await appel('paiement-creer', Object.assign({}, pilote, { bon_code: v.corps.code.toLowerCase() }))
    if (!(r1.statut === 200 && r1.corps.confirme && bon.statut === 'utilise' && BASE.inscriptions[0].statut === 'confirmee')) return 'utilisation : ' + JSON.stringify(r1) + ' ' + bon.statut
    const r2 = await appel('paiement-creer', Object.assign({}, pilote, { bon_code: v.corps.code }))
    return r2.statut === 409 || 'reutilisation acceptee : ' + JSON.stringify(r2)
  }],
]

;(async () => {
  let echecs = 0
  console.log('\n  BOUTIQUE, fonctions de paiement contre une fausse base et un faux PayPal\n')
  for (const [nom, jouer] of SCENARIOS) {
    remettre(); if (!nom.startsWith('sans cles')) cles(true)
    let v
    try { v = await jouer() } catch (e) { v = 'plantage : ' + e.message }
    if (v === true) console.log('  OK       ' + nom)
    else { echecs++; console.log('  ECHEC    ' + nom + '\n             ' + v) }
  }
  // ── La fenêtre, dans un navigateur (serveur local requis) ──────────────────
  let serveur = false
  try { serveur = (await vraiFetch('http://localhost:3000/')).ok } catch (e) {}
  if (!serveur) console.log('\n  Serveur local absent : la fenetre de reservation n est pas jouee.')
  else {
    console.log('\n  LA FENETRE, PayPal et les fonctions simules\n')
    for (const [nom, jouer] of NAVIGATEUR) {
      let v
      try { v = await jouer() } catch (e) { v = 'plantage : ' + e.message }
      if (v === true) console.log('  OK       ' + nom)
      else { echecs++; console.log('  ECHEC    ' + nom + '\n             ' + v) }
    }
  }
  console.log('\n  ' + (echecs ? echecs + ' scenario(s) en echec.' : 'Tous les scenarios passent.') + '\n')
  process.exit(echecs ? 1 : 0)
})()
