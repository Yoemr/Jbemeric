// paiement-config : ce que le navigateur a le droit de savoir de la boutique.
// L'identifiant PayPal est public par nature (il est écrit dans l'adresse du
// script PayPal) ; le secret ne sort jamais d'ici.
const { config, active, reponse } = require('./_boutique')

exports.handler = async () => {
  if (!active()) return reponse(200, { active: false })
  const c = config()
  return reponse(200, { active: true, clientId: c.ppId, env: c.ppEnv })
}
