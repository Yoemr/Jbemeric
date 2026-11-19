// paiement-config : ce que le navigateur a le droit de savoir de la boutique.
// L'identifiant PayPal est public par nature (il est écrit dans l'adresse du
// script PayPal) ; le secret ne sort jamais d'ici.
const { config, active, reponse } = require('./_boutique')

exports.handler = async () => {
  // Les noms des variables absentes, jamais leurs valeurs : de quoi savoir
  // ce qu'il reste à ranger dans Netlify sans rien dévoiler.
  if (!active()) {
    const manque = ['SUPABASE_SERVICE_ROLE_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'].filter(k => !process.env[k])
    return reponse(200, { active: false, manque: manque, contexte: process.env.CONTEXT || null })
  }
  const c = config()
  return reponse(200, { active: true, clientId: c.ppId, env: c.ppEnv })
}
