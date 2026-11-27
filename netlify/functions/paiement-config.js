// paiement-config : ce que le navigateur a le droit de savoir de la boutique.
// L'identifiant PayPal est public par nature (il est écrit dans l'adresse du
// script PayPal) ; le secret ne sort jamais d'ici.
const { config, active, reponse } = require('./_boutique')

exports.handler = async () => {
  // Les noms des variables absentes, jamais leurs valeurs : de quoi savoir
  // ce qu'il reste à ranger dans Netlify sans rien dévoiler.
  if (!active()) {
    const manque = ['SUPABASE_SERVICE_ROLE_KEY', 'PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'].filter(k => !process.env[k])
    // Les noms voisins que la fonction voit vraiment (faute de frappe,
    // espace en trop, variable rangée ailleurs). Jamais les valeurs.
    const vues = Object.keys(process.env).filter(k => /PAYPAL|SUPABASE|GOOGLE/i.test(k)).map(k => JSON.stringify(k))
    return reponse(200, { active: false, manque: manque, vues: vues, contexte: process.env.CONTEXT || null })
  }
  const c = config()
  return reponse(200, { active: true, clientId: c.ppId, env: c.ppEnv })
}
