// perimetre.js : les pages qui comptent.
//
// Declare par Yoan le 4 aout 2026 : « je veux un focus sur index, academie,
// karting adulte et enfant, competition, coaching, track et paddock. Les
// autres pages honnetement je m'en fous un peu. »
//
// Consequence pour l'audit : un defaut sur une de ces pages est une faute qui
// fait echouer. Un defaut ailleurs est releve mais range a part, sans faire
// echouer, et masque par defaut. Il ne disparait pas, il cesse d'occuper la
// place.
//
// Les feuilles et les scripts suivent leurs pages : un CSS charge par au moins
// une page du perimetre est dans le perimetre.

const PAGES = [
  'index.html',
  'academie.html',
  'academie/karting.html',      // couvre aujourd'hui l'enfant ET l'adulte
  'academie/competition.html',
  'coaching.html',
  'track.html',
  'paddock.html',
  'paddock/palmares.html',      // ajoute par Yoan le 4 aout : « palmares aussi on garde »
]

// Volontairement dehors : les sept pages admin/, les gabarits d'articles du
// paddock, et nos-voitures dont le sort n'est pas tranche.

function estDedans(chemin, ctx) {
  if (PAGES.includes(chemin)) return true

  // Un fichier partage suit ses pages. Une feuille chargee par une page du
  // perimetre compte, meme si elle sert aussi ailleurs.
  if (chemin.endsWith('.css')) {
    const nom = chemin.replace(/^assets\/css\//, '')
    return ctx.pages.some(p => PAGES.includes(p.chemin) && p.feuilles.some(f => f.endsWith(nom)))
  }
  if (chemin.endsWith('.js')) {
    if (chemin.startsWith('outil-dev/')) return false
    const nom = chemin.replace(/^assets\/js\//, '')
    return ctx.pages.some(p => PAGES.includes(p.chemin) && p.html.includes(nom))
  }

  return false
}

module.exports = { PAGES, estDedans }
