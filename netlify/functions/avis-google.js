// avis-google : les vrais avis Google de JB, lus en direct.
//
// Demande de Yoan, 12 novembre 2026 : « les vrais, pas de copier-coller ». La
// fonction interroge l'API officielle de Google (Places API, version New) et
// rend la note moyenne, le nombre d'avis, le lien de la fiche et les avis que
// Google publie (Google en donne cinq, les plus pertinents selon lui).
//
//   GOOGLE_PLACES_KEY   la clé de l'API (Google Cloud, Places API (New) activée)
//   GOOGLE_PLACE_ID     l'identifiant de la fiche de JB
//
// La réponse est gardée six heures par le réseau de Netlify : quelques appels
// à Google par jour au plus, dans la gratuité de Google. Sans les deux
// variables, la fonction répond « inactive » et les pages gardent leurs avis.
exports.handler = async () => {
  const cle = process.env.GOOGLE_PLACES_KEY, lieu = process.env.GOOGLE_PLACE_ID
  const entetes = { 'Content-Type': 'application/json' }
  if (!cle || !lieu) return { statusCode: 200, headers: entetes, body: JSON.stringify({ active: false }) }
  try {
    const r = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(lieu) + '?languageCode=fr', {
      headers: { 'X-Goog-Api-Key': cle, 'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews' },
    })
    const j = await r.json()
    if (!r.ok) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status)
    const avis = (j.reviews || []).map(a => ({
      auteur: (a.authorAttribution && a.authorAttribution.displayName) || 'Client Google',
      photo: (a.authorAttribution && a.authorAttribution.photoUri) || null,
      profil: (a.authorAttribution && a.authorAttribution.uri) || null,
      note: a.rating || null,
      texte: (a.originalText && a.originalText.text) || (a.text && a.text.text) || '',
      quand: a.relativePublishTimeDescription || '',
      date: a.publishTime || null,
      lien: a.googleMapsUri || j.googleMapsUri || null,
    })).filter(a => a.texte)
    return {
      statusCode: 200,
      headers: Object.assign(entetes, { 'Cache-Control': 'public, max-age=3600', 'Netlify-CDN-Cache-Control': 'public, max-age=21600, stale-while-revalidate=86400' }),
      body: JSON.stringify({ active: true, source: 'Google', note: j.rating || null, nombre: j.userRatingCount || 0, lien: j.googleMapsUri || null, avis }),
    }
  } catch (e) {
    console.error('[avis-google]', e.message)
    return { statusCode: 502, headers: entetes, body: JSON.stringify({ active: false, erreur: 'Google ne répond pas' }) }
  }
}
