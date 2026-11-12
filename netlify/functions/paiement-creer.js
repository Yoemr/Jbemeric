// paiement-creer : prépare un paiement, une réservation ou un bon cadeau.
//
// Le prix ne vient jamais du navigateur : il est relu dans la base (la date
// pour une journée, la formule pour un bon cadeau). La réservation ou le bon
// est enregistré « en attente de paiement », puis la commande PayPal est créée
// avec sa référence. paiement-valider encaissera.
//
// Corps attendu (JSON) :
//   { quoi: 'journee', event_id, prenom, nom, age?, email, telephone?, bon_code? }
//   { quoi: 'cadeau', formule_id, acheteur_nom, acheteur_email, beneficiaire?, message? }
const B = require('./_boutique')

async function journee(d) {
  const ev = (await B.sb('events?id=eq.' + encodeURIComponent(d.event_id) +
    '&select=id,date_event,type,prix,nb_places,nb_inscrits,status,visible_site,formule_id'))[0]
  const aujourdhui = new Date().toISOString().slice(0, 10)
  if (!ev || !ev.visible_site || ev.status !== 'Open' || ev.date_event < aujourdhui) return B.reponse(409, { erreur: 'Cette date n\'est plus ouverte aux réservations.' })
  if (ev.nb_places > 0 && (ev.nb_inscrits || 0) >= ev.nb_places) return B.reponse(409, { erreur: 'Cette date est complète.' })
  if (!(ev.prix > 0)) return B.reponse(409, { erreur: 'Le prix de cette date n\'est pas fixé, appelez JB.' })

  const prenom = B.texte(d.prenom, 80), nom = B.texte(d.nom, 80), email = B.texte(d.email, 120)
  if (!prenom || !nom || !B.emailValide(email)) return B.reponse(400, { erreur: 'Il manque le prénom, le nom ou un email valide.' })
  const fiche = {
    event_id: ev.id, prenom, nom, user_name: prenom + ' ' + nom, email,
    telephone: B.texte(d.telephone, 30) || null,
    age: d.age ? Math.max(0, Math.min(99, parseInt(d.age, 10) || 0)) || null : null,
    montant: ev.prix,
  }

  // Un bon cadeau payé, valable et non utilisé règle la journée sans PayPal.
  if (d.bon_code) {
    const code = B.texte(d.bon_code, 20).toUpperCase()
    const bon = (await B.sb('bons_cadeaux?code=eq.' + encodeURIComponent(code) + '&select=id,statut,valable_jusqu,montant'))[0]
    if (!bon || bon.statut !== 'paye') return B.reponse(409, { erreur: 'Ce code cadeau n\'est pas valable ou a déjà servi.' })
    if (bon.valable_jusqu && bon.valable_jusqu < aujourdhui) return B.reponse(409, { erreur: 'Ce code cadeau a expiré.' })
    const ins = (await B.sb('inscriptions', { methode: 'POST', corps: Object.assign(fiche, { statut: 'confirmee', bon_code: code, paye_le: new Date().toISOString() }) }))[0]
    await B.sb('bons_cadeaux?id=eq.' + bon.id + '&statut=eq.paye', { methode: 'PATCH', corps: { statut: 'utilise', utilise_le: new Date().toISOString(), inscription_id: ins.id } })
    return B.reponse(200, { confirme: true, date: ev.date_event, type: ev.type })
  }

  const ins = (await B.sb('inscriptions', { methode: 'POST', corps: Object.assign(fiche, { statut: 'attente_paiement' }) }))[0]
  const commande = await B.paypal('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: 'journee', custom_id: 'I:' + ins.id,
      description: (ev.type || 'Journée karting') + ' du ' + ev.date_event,
      amount: { currency_code: 'EUR', value: B.euros(ev.prix) },
    }],
  })
  await B.sb('inscriptions?id=eq.' + ins.id, { methode: 'PATCH', corps: { paiement_ref: commande.id } })
  return B.reponse(200, { orderID: commande.id })
}

async function cadeau(d) {
  const f = (await B.sb('formules?id=eq.' + encodeURIComponent(d.formule_id) + '&actif=eq.true&bon_cadeau=eq.true&select=id,libelle,prix_conseille'))[0]
  if (!f || !(f.prix_conseille > 0)) return B.reponse(409, { erreur: 'Cette formule ne se vend pas en bon cadeau.' })
  const nom = B.texte(d.acheteur_nom, 120), email = B.texte(d.acheteur_email, 120)
  if (!nom || !B.emailValide(email)) return B.reponse(400, { erreur: 'Il manque votre nom ou un email valide.' })
  const bon = (await B.sb('bons_cadeaux', { methode: 'POST', corps: {
    code: B.codeCadeau(), formule_id: f.id, libelle: f.libelle, montant: f.prix_conseille,
    acheteur_nom: nom, acheteur_email: email,
    beneficiaire: B.texte(d.beneficiaire, 120) || null, message: B.texte(d.message, 500) || null,
  } }))[0]
  const commande = await B.paypal('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: 'cadeau', custom_id: 'B:' + bon.id,
      description: 'Bon cadeau : ' + f.libelle,
      amount: { currency_code: 'EUR', value: B.euros(f.prix_conseille) },
    }],
  })
  await B.sb('bons_cadeaux?id=eq.' + bon.id, { methode: 'PATCH', corps: { paiement_ref: commande.id } })
  return B.reponse(200, { orderID: commande.id })
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return B.reponse(405, { erreur: 'POST seulement' })
  if (!B.active()) return B.reponse(503, { erreur: 'La boutique n\'est pas encore ouverte.' })
  let d
  try { d = JSON.parse(event.body || '{}') } catch (e) { return B.reponse(400, { erreur: 'Demande illisible.' }) }
  try {
    if (d.quoi === 'journee') return await journee(d)
    if (d.quoi === 'cadeau') return await cadeau(d)
    return B.reponse(400, { erreur: 'Demande inconnue.' })
  } catch (e) {
    console.error('[paiement-creer]', e.message)
    return B.reponse(502, { erreur: 'Le paiement n\'a pas pu être préparé. Réessayez, ou appelez JB.' })
  }
}
