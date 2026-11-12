// _boutique.js : l'outillage commun des fonctions de la boutique.
//
// Fiche : docs/chantiers/2026-11-10-boutique.md. Le seul code serveur du site.
// Il tourne chez Netlify, jamais dans le navigateur : c'est ici que vivent la
// clé de service de Supabase et le secret PayPal, lus dans les variables
// d'environnement de Netlify, jamais écrits dans le dépôt.
//
//   SUPABASE_SERVICE_ROLE_KEY  la clé de service (Supabase, Project Settings, API)
//   PAYPAL_CLIENT_ID           l'identifiant de l'application PayPal (public)
//   PAYPAL_SECRET              son secret
//   PAYPAL_ENV                 « sandbox » pour les essais, « live » pour le réel
//
// Tant que l'une manque, la boutique se déclare éteinte (paiement-config) et
// le site garde son bouton vers le formulaire de contact.

const SB = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'

function config() {
  const env = process.env
  return {
    sbCle: env.SUPABASE_SERVICE_ROLE_KEY || '',
    ppId: env.PAYPAL_CLIENT_ID || '',
    ppSecret: env.PAYPAL_SECRET || '',
    ppBase: env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
    ppEnv: env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox',
  }
}
function active() { const c = config(); return !!(c.sbCle && c.ppId && c.ppSecret) }

function reponse(statut, corps) {
  return { statusCode: statut, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(corps) }
}

// Supabase avec la clé de service : la seule voie d'écriture des paiements.
async function sb(chemin, options) {
  options = options || {}
  const c = config()
  const r = await fetch(SB + chemin, {
    method: options.methode || 'GET',
    headers: { apikey: c.sbCle, Authorization: 'Bearer ' + c.sbCle, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: options.corps ? JSON.stringify(options.corps) : undefined,
  })
  const texte = await r.text()
  if (!r.ok) throw new Error('Base : ' + r.status + ' ' + texte)
  return texte ? JSON.parse(texte) : null
}

async function paypalJeton() {
  const c = config()
  const r = await fetch(c.ppBase + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(c.ppId + ':' + c.ppSecret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const j = await r.json()
  if (!r.ok || !j.access_token) throw new Error('PayPal refuse la connexion')
  return j.access_token
}

async function paypal(chemin, corps) {
  const c = config()
  const jeton = await paypalJeton()
  const r = await fetch(c.ppBase + chemin, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json' },
    body: corps ? JSON.stringify(corps) : undefined,
  })
  const j = await r.json()
  if (!r.ok) throw new Error('PayPal : ' + r.status + ' ' + (j.message || j.name || ''))
  return j
}

// Un montant en euros, au centime, comme PayPal le veut : « 195.00 ».
function euros(n) { return (Math.round(Number(n) * 100) / 100).toFixed(2) }

// Un code de bon cadeau lisible au téléphone : sans 0, O, 1, I ni L.
function codeCadeau() {
  const lettres = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const octets = require('crypto').randomBytes(8)
  let s = ''
  for (let i = 0; i < 8; i++) s += lettres[octets[i] % lettres.length]
  return 'JB-' + s.slice(0, 4) + '-' + s.slice(4)
}

function texte(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200) }
function emailValide(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')) }

module.exports = { config, active, reponse, sb, paypal, euros, codeCadeau, texte, emailValide }
