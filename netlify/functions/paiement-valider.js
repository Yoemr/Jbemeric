// paiement-valider : encaisse une commande PayPal validée par le client.
//
// L'encaissement se fait ici, côté serveur : le navigateur ne peut pas se
// déclarer payé. La somme encaissée est comparée à celle enregistrée ; la
// réservation passe « payee » (la jauge de la date baisse seule, par le
// déclencheur de la base) ou le bon cadeau passe « paye ». Un bon n'expire
// pas : « sans durée de validité », règle de JB dans la FAQ.
// Appeler deux fois pour la même commande ne fait rien de plus.
const B = require('./_boutique')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return B.reponse(405, { erreur: 'POST seulement' })
  if (!B.active()) return B.reponse(503, { erreur: 'La boutique n\'est pas encore ouverte.' })
  let d
  try { d = JSON.parse(event.body || '{}') } catch (e) { return B.reponse(400, { erreur: 'Demande illisible.' }) }
  const id = B.texte(d.orderID, 64)
  if (!/^[A-Z0-9-]+$/i.test(id)) return B.reponse(400, { erreur: 'Commande inconnue.' })

  try {
    const ins = (await B.sb('inscriptions?paiement_ref=eq.' + encodeURIComponent(id) + '&select=id,statut,montant,event_id'))[0]
    const bon = ins ? null : (await B.sb('bons_cadeaux?paiement_ref=eq.' + encodeURIComponent(id) + '&select=id,statut,montant,code,libelle'))[0]
    const ligne = ins || bon
    if (!ligne) return B.reponse(404, { erreur: 'Commande inconnue.' })

    // Déjà encaissée : on renvoie le même résultat.
    if (ins && ins.statut === 'payee') return B.reponse(200, { ok: true, quoi: 'journee' })
    if (bon && bon.statut === 'paye') return B.reponse(200, { ok: true, quoi: 'cadeau', code: bon.code, libelle: bon.libelle })

    const r = await B.paypal('/v2/checkout/orders/' + encodeURIComponent(id) + '/capture')
    const capture = (((r.purchase_units || [])[0] || {}).payments || {}).captures || []
    const c = capture[0] || {}
    if (r.status !== 'COMPLETED' || c.status !== 'COMPLETED') return B.reponse(402, { erreur: 'Le paiement n\'a pas abouti.' })
    if (!c.amount || c.amount.currency_code !== 'EUR' || B.euros(c.amount.value) !== B.euros(ligne.montant)) {
      console.error('[paiement-valider] montant inattendu', id, c.amount, ligne.montant)
      return B.reponse(409, { erreur: 'Le montant reçu ne correspond pas. JB va vous recontacter.' })
    }
    const maintenant = new Date().toISOString()
    if (ins) {
      await B.sb('inscriptions?id=eq.' + ins.id, { methode: 'PATCH', corps: { statut: 'payee', paye_le: maintenant } })
      return B.reponse(200, { ok: true, quoi: 'journee' })
    }
    await B.sb('bons_cadeaux?id=eq.' + bon.id, { methode: 'PATCH', corps: { statut: 'paye', paye_le: maintenant } })
    return B.reponse(200, { ok: true, quoi: 'cadeau', code: bon.code, libelle: bon.libelle })
  } catch (e) {
    console.error('[paiement-valider]', e.message)
    return B.reponse(502, { erreur: 'Le paiement n\'a pas pu être confirmé. Ne repayez pas : appelez JB, il vérifie.' })
  }
}
