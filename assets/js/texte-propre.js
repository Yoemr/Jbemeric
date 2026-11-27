// texte-propre.js : la protection « papa proof » de l'écriture.
//
// ── Ce que Yoan a demandé, 7 novembre 2026 ──────────────────────────────────
// Le HTML et le CSS protègent déjà la structure, la police et les couleurs :
// JB ne peut changer que des mots. Cette fonction protège les mots eux-mêmes,
// au moment de l'enregistrement : la touche de verrouillage des majuscules
// oubliée, les « !!! », les espaces en trop, la ponctuation à la française.
//
// ── La règle, sans seuil ni liste écrite en dur ─────────────────────────────
// Yoan, 10 novembre : un seuil (« quatre mots, vingt lettres ») est du
// bricolage, il cassera au premier cas imprévu. La règle tient dans le nom de
// l'ancienne fonction d'avril, `applyCasePattern` : un texte garde le modèle
// de casse de ce qu'il remplace.
//
//   - Le modèle est écrit en capitales (aucune minuscule, comme le titre
//     « L'ACADÉMIE JB EMERIC ») : ce que JB tape est gardé tel quel.
//   - Sinon, une phrase tapée sans aucune minuscule est un verrouillage
//     oublié : elle repasse en casse normale.
//
// Les sigles et les noms propres (JB, BPJEPS, Brignoles) ne viennent pas d'une
// liste : ils sont appris dans les textes existants, le modèle et le lexique
// que l'appelant fournit (les textes de la page, les lignes de la table). Un
// mot écrit avec une capitale ailleurs qu'en début de phrase y est retenu
// avec sa graphie.
//
// ── Où elle sert ────────────────────────────────────────────────────────────
// live-editor.js (les textes des pages) l'importe, gestion.js (les champs du
// dashboard qui portent `propre: true`) la lit sur window.JBE_TEXTE.
;(function () {
  var LETTRE = /[A-Za-zÀ-ÖØ-öø-ÿ]/
  var MOT = /[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9'’-]*/g

  function aMinuscule(t) { return /[a-zß-öø-ÿ]/.test(t) }
  function aLettre(t) { return LETTRE.test(t) }
  // Écrit en capitales : des lettres, et aucune minuscule.
  function enCapitales(t) { return !!t && aLettre(t) && !aMinuscule(t) }

  // Les graphies à respecter : chaque mot portant une capitale ailleurs qu'en
  // tête de phrase, dans les textes fournis. Clé : le mot en minuscules.
  function lexiqueDe(textes) {
    var lex = {}
    ;(textes || []).forEach(function (t) {
      if (typeof t !== 'string') return
      var re = new RegExp(MOT.source, 'g'), m
      while ((m = re.exec(t))) {
        var mot = m[0]
        if (mot === mot.toLowerCase()) continue
        var avant = t.slice(0, m.index).replace(/[\s"«“(]+$/, '')
        var enTete = avant === '' || /[.!?…:\n]$/.test(avant)
        if (enTete && !enCapitales(mot)) continue        // « Une » en tête de phrase n'apprend rien
        if (enCapitales(mot) && mot.length > 1 && !enCapitales(t)) { lex[mot.toLowerCase()] = mot; continue }
        if (!enCapitales(mot)) lex[mot.toLowerCase()] = mot
      }
    })
    return lex
  }

  function casseNormale(t, lex) {
    return t.toLowerCase().replace(new RegExp(MOT.source, 'g'), function (mot) {
      return lex[mot] || mot
    })
  }

  function majusculeDePhrase(t) {
    t = t.replace(/^(\s*["«“(]?\s*)([a-zà-ÿ])/, function (m, a, c) { return a + c.toUpperCase() })
    return t.replace(/([.!?…])(\s+["«“(]?\s*)([a-zà-ÿ])/g, function (m, p, sp, c) { return p + sp + c.toUpperCase() })
  }

  // proteger(texte, { modele, lexique })
  //   modele  : le texte que celui-ci remplace (son modèle de casse).
  //   lexique : d'autres textes du même endroit, pour apprendre les graphies.
  function proteger(texte, options) {
    if (texte == null || typeof texte !== 'string') return texte
    options = options || {}
    var t = texte.replace(/\r\n?/g, '\n')

    if (!enCapitales(options.modele || '')) {
      var lex = lexiqueDe([options.modele].concat(options.lexique || []))
      t = t.split('\n').map(function (ligne) {
        return ligne.split(/([.!?…]+\s*)/).map(function (bout) {
          return enCapitales(bout) ? casseNormale(bout, lex) : bout
        }).join('')
      }).join('\n')
    }

    // Ponctuation répétée : « !!! » devient « ! », « ?? » devient « ? »,
    // trois points ou plus deviennent des points de suspension.
    t = t.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?').replace(/([?!])[?!]+/g, '$1')
    t = t.replace(/\.{3,}/g, '…')

    // Espaces : un seul entre deux mots, aucun avant une virgule ou un point,
    // une espace insécable avant « ; ! ? : » à la française. Les heures
    // (10:30) et les adresses (https://) ne sont pas touchées.
    t = t.replace(/[ \t ]{2,}/g, ' ')
    t = t.replace(/[ \t ]+([,.])/g, '$1')
    t = t.replace(/([^\s\d\/:])[ \t ]*([!?;])/g, '$1 $2')
    t = t.replace(/([^\s\d\/:])[ \t ]*:(?=\s|$)/g, '$1 :')
    t = t.replace(/\n{3,}/g, '\n\n').trim()

    return majusculeDePhrase(t)
  }

  var api = { proteger: proteger, enCapitales: enCapitales, lexiqueDe: lexiqueDe }
  if (typeof window !== 'undefined') window.JBE_TEXTE = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})()
