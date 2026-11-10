// texte-propre.js : la protection « papa proof » de l'écriture.
//
// ── Ce que Yoan a demandé, 7 novembre 2026 ──────────────────────────────────
// Le HTML et le CSS protègent déjà la structure, la police et les couleurs :
// JB ne peut changer que des mots. Cette fonction protège les mots eux-mêmes,
// au moment de l'enregistrement : la touche de verrouillage des majuscules
// oubliée, les « !!! », les espaces en trop, la ponctuation à la française.
//
// ── Le piège déjà payé, avril 2026 ──────────────────────────────────────────
// L'ancienne `applyCasePattern` passait tout en minuscules sauf la première
// lettre, et « KARTING ENFANT » devenait « Karting Enfant » contre la volonté
// de JB. Elle a été réduite à la majuscule de début de phrase. Ici, un texte
// n'est remis en casse normale que s'il est long et presque entièrement en
// capitales : c'est le signe du verrouillage oublié. Un titre court en
// capitales reste tel quel, et les titres du site sont de toute façon mis en
// capitales par le CSS, JB n'a jamais à les taper ainsi.
//
// ── Où elle sert ────────────────────────────────────────────────────────────
// live-editor.js (les textes des pages) l'importe, gestion.js (les champs du
// dashboard qui portent `propre: true`) la lit sur window.JBE_TEXTE. Un seul
// code pour les deux.
;(function () {
  // Les mots qui gardent leurs capitales quand un bloc est remis en casse
  // normale. Ajouter un sigle ici suffit.
  var SIGLES = ['JB', 'EMERIC', 'BPJEPS', 'FFSA', 'CE', 'CSE', 'KIP', 'GT', 'TTC', 'HT', 'PACA', 'FR2000', 'BMW']
  // Les noms propres du métier, remis avec leur majuscule.
  var NOMS = ['Jean-Baptiste', 'Emeric', 'Brignoles', 'Trets', 'Hyères', 'Cuges', 'Gémenos', 'Marseille',
              'Paul Ricard', 'Lédenon', 'Magny-Cours', 'Nogaro', 'Dijon', 'Spa', 'Le Luc', 'France', 'Var',
              'Palmyr', 'Formule Ford', 'Formule Renault', 'Académie', 'YouTube', 'Instagram', 'Facebook', 'Google', 'Trustpilot']

  // Seuils : au moins quatre mots et vingt lettres, dont 80 % en capitales.
  // « KARTING ENFANT » ou « PORTE DE LA COMPÉTITION » restent tels quels :
  // c'est l'erreur d'avril qu'il ne faut pas refaire.
  function enMajuscules(t) {
    var lettres = t.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) || []
    var mots = t.split(/\s+/).filter(function (m) { return /[A-Za-zÀ-ÿ]/.test(m) })
    if (lettres.length < 20 || mots.length < 5) return false
    var maj = lettres.filter(function (c) { return c !== c.toLowerCase() && c === c.toUpperCase() }).length
    return maj / lettres.length >= 0.8
  }

  function echapperRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

  function casseNormale(t) {
    var r = t.toLowerCase()
    SIGLES.forEach(function (s) {
      r = r.replace(new RegExp('(^|[^A-Za-zÀ-ÿ0-9])' + echapperRegex(s.toLowerCase()) + '(?![A-Za-zÀ-ÿ0-9])', 'g'), function (m, avant) { return avant + s })
    })
    NOMS.forEach(function (n) {
      r = r.replace(new RegExp('(^|[^A-Za-zÀ-ÿ])' + echapperRegex(n.toLowerCase()) + '(?![A-Za-zÀ-ÿ])', 'g'), function (m, avant) { return avant + n })
    })
    return r
  }

  function majusculeDePhrase(t) {
    t = t.replace(/^(\s*["«“(]?\s*)([a-zà-ÿ])/, function (m, a, c) { return a + c.toUpperCase() })
    return t.replace(/([.!?…])(\s+["«“(]?\s*)([a-zà-ÿ])/g, function (m, p, sp, c) { return p + sp + c.toUpperCase() })
  }

  function proteger(texte) {
    if (texte == null || typeof texte !== 'string') return texte
    var t = texte.replace(/\r\n?/g, '\n')

    // Le verrouillage des majuscules oublié : tout le bloc, ligne par ligne.
    // Le calcul se fait phrase par phrase : « UNE JOURNÉE À BRIGNOLES AVEC JB !
    // venez nombreux » mélange les deux, et la ligne entière passait sous le seuil.
    t = t.split('\n').map(function (ligne) {
      return ligne.split(/([.!?…]+\s*)/).map(function (bout) {
        return enMajuscules(bout) ? casseNormale(bout) : bout
      }).join('')
    }).join('\n')

    // Ponctuation répétée : « !!! » devient « ! », « ?? » devient « ? »,
    // trois points ou plus deviennent des points de suspension.
    t = t.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?').replace(/([?!])[?!]+/g, '$1')
    t = t.replace(/\.{3,}/g, '…')

    // Espaces : un seul entre deux mots, aucun avant une virgule ou un point,
    // une espace insécable avant « : ; ! ? » à la française. Les heures
    // (10:30) et les adresses (https://) ne sont pas touchées.
    t = t.replace(/[ \t ]{2,}/g, ' ')
    t = t.replace(/[ \t ]+([,.])/g, '$1')
    t = t.replace(/([^\s\d\/:])[ \t ]*([!?;])/g, '$1 $2')
    t = t.replace(/([^\s\d\/:])[ \t ]*:(?=\s|$)/g, '$1 :')
    t = t.replace(/\n{3,}/g, '\n\n').trim()

    return majusculeDePhrase(t)
  }

  var api = { proteger: proteger, enMajuscules: enMajuscules }
  if (typeof window !== 'undefined') window.JBE_TEXTE = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})()
