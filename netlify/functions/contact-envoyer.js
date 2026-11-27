// contact-envoyer : le formulaire de contact envoie depuis le site.
//
// Demande de Yoan, 10 novembre 2026 : « j'aimerais qu'on puisse envoyer depuis
// le site », et que JB reçoive un mail. Le message est rangé dans la table
// messages (onglet Messages du dashboard) et envoyé à JB par Brevo, avec le
// visiteur en adresse de réponse. Il suffit qu'un des deux réussisse pour que
// le message ne soit pas perdu ; si aucun ne marche, la fonction le dit, et le
// formulaire propose la messagerie du visiteur et le téléphone.
//
// Anti-robot : un champ « site_web » caché aux humains. Rempli, le message est
// ignoré sans le dire au robot.
const B = require('./_boutique')
const E = require('./_emails')
const SUJETS = ['karting', 'karting-adulte', 'entreprise', 'colonie', 'course', 'autre']

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return B.reponse(405, { erreur: 'POST seulement' })
  let d
  try { d = JSON.parse(event.body || '{}') } catch (e) { return B.reponse(400, { erreur: 'Demande illisible.' }) }
  if (d.site_web) return B.reponse(200, { ok: true })
  const m = {
    prenom: B.texte(d.prenom, 80), nom: B.texte(d.nom, 80), email: B.texte(d.email, 120),
    telephone: B.texte(d.telephone, 30) || null,
    sujet: SUJETS.indexOf(d.sujet) !== -1 ? d.sujet : null,
    message: B.texte(d.message, 5000),
  }
  if (!m.prenom || !m.nom || !B.emailValide(m.email) || !m.message) return B.reponse(400, { erreur: 'Il manque votre prénom, votre nom, un email valide ou votre message.' })

  let range = false, envoye = false
  if (B.config().sbCle) {
    try { await B.sb('messages', { methode: 'POST', corps: m }); range = true } catch (e) { console.error('[contact]', e.message) }
  }
  const resultat = await E.sansRisque(() => E.message(m))
  envoye = resultat === 'envoye'
  if (!range && !envoye) return B.reponse(503, { erreur: 'L\'envoi depuis le site ne marche pas pour le moment.' })
  return B.reponse(200, { ok: true })
}
