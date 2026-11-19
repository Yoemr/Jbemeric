// _emails.js : les emails de la boutique, envoyés par Brevo.
//
// Aperçu validé avec Yoan le 19 novembre 2026 : un avis pour JB à chaque
// réservation ou bon cadeau, une confirmation pour le client.
//
//   BREVO_API_KEY      la clé API de Brevo (secrète, dans Netlify)
//   EMAIL_EXPEDITEUR   l'adresse d'envoi, validée chez Brevo (défaut jbemeric@jbemeric.com)
//   EMAIL_JB           où JB reçoit ses avis (défaut emeric.jb@gmail.com)
//   EMAIL_REPONSE      où arrivent les réponses des clients (défaut emeric.jb@gmail.com)
//
// Sans clé, rien ne part, et rien ne casse. Un email qui échoue ne bloque
// jamais un paiement : la réservation est déjà enregistrée, elle reste visible
// dans le dashboard.

const SITE = 'https://deploy-preview-2--jbemeric.netlify.app'
const TEL = '06 60 18 87 87'
const CONDITIONS = 'Les journées ont lieu même sous la pluie. Un report de date se demande au moins 15 jours avant. ' +
  'Une annulation se notifie par lettre recommandée : jusqu\'à 11 jours avant, JB conserve l\'acompte de 30 % ; ' +
  'à moins de 10 jours, le règlement complet est conservé. Si le circuit annule, ou pour une raison de sécurité, un report est proposé.'
const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi']

function reglages() {
  const e = process.env
  return {
    cle: e.BREVO_API_KEY || '',
    de: e.EMAIL_EXPEDITEUR || 'jbemeric@jbemeric.com',
    jb: e.EMAIL_JB || 'emeric.jb@gmail.com',
    reponse: e.EMAIL_REPONSE || 'emeric.jb@gmail.com',
    site: e.URL_SITE || SITE,
  }
}

function ech(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function quand(iso) { if (!iso) return ''; const d = new Date(iso + 'T12:00:00'); return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear() }
function euros(n) { return (Math.round(Number(n) * 100) / 100).toFixed(2).replace('.', ',') + ' €' }

function gabarit(titre, corps, site) {
  return '<!doctype html><html lang="fr"><body style="margin:0;background:#e9edf5;font-family:Helvetica,Arial,sans-serif;color:#0d1530">' +
    '<div style="max-width:600px;margin:0 auto;background:#fff">' +
    '<div style="background:#040a1e;padding:18px 24px;border-bottom:3px solid #FFCF00">' +
      '<img src="' + site + '/assets/images/LOGO/logo-jb-emeric-web.png" alt="JB EMERIC" width="219" height="28" style="display:block"></div>' +
    '<div style="padding:8px 24px 4px"><h1 style="font-size:22px">' + ech(titre) + '</h1>' + corps + '</div>' +
    '<div style="background:#f4f6fb;color:#6b7390;font-size:12px;padding:14px 24px;margin-top:16px">JB EMERIC · Association Promotion Sport Auto · ' + TEL + '</div>' +
    '</div></body></html>'
}
function tableau(lignes) {
  return '<table style="border-collapse:collapse;font-size:14px;width:100%">' + lignes.filter(l => l[1]).map(l =>
    '<tr><td style="padding:7px 0;border-bottom:1px solid #edf0f6;color:#6b7390;width:150px;vertical-align:top">' + ech(l[0]) + '</td>' +
    '<td style="padding:7px 0;border-bottom:1px solid #edf0f6">' + l[1] + '</td></tr>').join('') + '</table>'
}
const p = t => '<p style="font-size:15px;line-height:1.6">' + t + '</p>'
const petit = t => '<p style="font-size:12px;line-height:1.6;color:#6b7390">' + t + '</p>'

async function envoyer(a, objet, html, r) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': r.cle, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ sender: { name: 'JB EMERIC', email: r.de }, to: [{ email: a }], replyTo: { email: r.reponse }, subject: objet, htmlContent: html }),
  })
  if (!res.ok) throw new Error('Brevo ' + res.status + ' ' + (await res.text()).slice(0, 200))
}

// Une réservation payée (ou réglée par un bon cadeau).
// ins : prenom, nom, age, email, telephone, montant, bon_code ; ev : date_event, type, nb_places, nb_inscrits ; lieu : nom du circuit
async function reservation(ins, ev, lieu) {
  const r = reglages()
  if (!r.cle) return 'eteint'
  const date = quand(ev.date_event)
  const regle = ins.bon_code ? 'bon cadeau ' + ech(ins.bon_code) : euros(ins.montant) + ' par PayPal'
  const restantes = ev.nb_places > 0 ? Math.max(0, ev.nb_places - (ev.nb_inscrits || 0)) : null
  const pourJb = gabarit(ins.bon_code ? 'Nouvelle réservation, réglée par bon cadeau' : 'Nouvelle réservation payée',
    tableau([
      ['Journée', ech(ev.type)],
      ['Date', ech(date) + (lieu ? ' · ' + ech(lieu) : '')],
      ['Pilote', ech(ins.prenom + ' ' + ins.nom) + (ins.age ? ', ' + ech(ins.age) + ' ans' : '')],
      ['Email', '<a href="mailto:' + ech(ins.email) + '">' + ech(ins.email) + '</a>'],
      ['Téléphone', ins.telephone ? '<a href="tel:' + ech(ins.telephone) + '">' + ech(ins.telephone) + '</a>' : ''],
      ['Réglé', regle],
      ['Places', restantes === null ? '' : (restantes === 0 ? 'la date est complète' : restantes + ' restante' + (restantes > 1 ? 's' : ''))],
    ]) + p('<a href="' + r.site + '/admin/gestion.html#reservations" style="display:inline-block;background:#FFCF00;color:#040a1e;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:6px">Voir toutes les réservations</a>'), r.site)
  const pourClient = gabarit('C\'est réservé, merci !',
    p('Bonjour ' + ech(ins.prenom) + ',') +
    p('La journée est confirmée : <b>' + ech(ev.type) + ', ' + ech(date) + (lieu ? ', ' + ech(lieu) : '') + '</b>.') +
    tableau([['Horaires', 'de 10 h à 18 h'], ['Compris', 'kart 4 temps, piste, encadrement, théorie, sept sessions et repas du midi'], ['À prévoir', 'boissons et goûter'], ['Réglé', regle + (ins.bon_code ? '' : ' (le reçu PayPal arrive à part)')]]) +
    petit(CONDITIONS) +
    p('Une question ? Répondez à cet email ou appelez JB au <b>' + TEL + '</b>.') + p('À bientôt sur la piste,<br>Jean-Baptiste Emeric'), r.site)
  await envoyer(r.jb, 'Nouvelle réservation : ' + ev.type + ', ' + date, pourJb, r)
  await envoyer(ins.email, 'Votre journée karting du ' + date + ' est réservée', pourClient, r)
  return 'envoye'
}

// Un bon cadeau payé. bon : code, libelle, montant, acheteur_nom, acheteur_email, beneficiaire, message
async function cadeau(bon) {
  const r = reglages()
  if (!r.cle) return 'eteint'
  const pourJb = gabarit('Nouveau bon cadeau vendu', tableau([
    ['Formule', ech(bon.libelle)], ['Code', '<b>' + ech(bon.code) + '</b>'], ['Montant', euros(bon.montant) + ' par PayPal'],
    ['Offert par', ech(bon.acheteur_nom) + ' · <a href="mailto:' + ech(bon.acheteur_email) + '">' + ech(bon.acheteur_email) + '</a>'],
    ['Pour', ech(bon.beneficiaire)], ['Message', ech(bon.message)],
  ]), r.site)
  const pourAcheteur = gabarit('Merci pour ce cadeau',
    p('Bonjour ' + ech(bon.acheteur_nom) + ',') +
    p('Voici le bon <b>« ' + ech(bon.libelle) + ' »</b>' + (bon.beneficiaire ? ' offert à <b>' + ech(bon.beneficiaire) + '</b>' : '') + ' :') +
    '<p style="font-family:Menlo,monospace;font-size:24px;letter-spacing:2px;background:#FFCF00;display:inline-block;padding:8px 14px;border-radius:6px">' + ech(bon.code) + '</p>' +
    p('Le bon n\'a pas de durée de validité. Pour réserver, il suffit de choisir une date sur le site, de cliquer sur « Réserver » et de saisir ce code : rien à payer.') +
    (bon.message ? petit('Votre mot : « ' + ech(bon.message) + ' »') : ''), r.site)
  await envoyer(r.jb, 'Bon cadeau vendu : ' + bon.libelle + ' (' + bon.code + ')', pourJb, r)
  await envoyer(bon.acheteur_email, 'Votre bon cadeau : ' + bon.libelle, pourAcheteur, r)
  return 'envoye'
}

// Jamais d'exception vers l'appelant : le paiement est déjà fait.
async function sansRisque(fn) {
  try { return await fn() } catch (e) { console.error('[emails]', e.message); return 'echec' }
}

module.exports = { reservation, cadeau, sansRisque }
