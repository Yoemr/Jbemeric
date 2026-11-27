// palmares-une.js : les résultats « à la une » du palmarès, ailleurs que sur
// la page Palmarès.
//
// Demande de Yoan, 6 novembre 2026 : la colonne du palmarès de l'Académie
// « doit être mise à jour automatiquement à partir de la vraie page
// palmarès ». La page Palmarès lit site-data.js, et chaque résultat y porte
// highlight: true ou non. Ce script lit les mêmes résultats, garde ceux qui
// sont à la une, et les range du plus ancien au plus récent. Marquer ou
// démarquer un résultat dans site-data.js change les deux pages à la fois.
//
// Usage :
//     <div class="ac-pal-list" data-palmares-une data-jbe-externe>
//       ... résultats écrits en dur, le filet si le script échoue ...
//     </div>
//
// data-jbe-externe : le live-editor ne propose pas ces lignes à JB, elles se
// corrigent à la source, une seule fois pour tout le site.
(function () {
  var D = window.JBEMERIC_DATA
  if (!D || !D.palmares) return
  var cats = D.palmaresCategories || {}

  function ech(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
  // Le détail du palmarès est parfois un paragraphe : la colonne n'en garde
  // que la première phrase.
  function court(t) {
    t = String(t || '').trim()
    var i = t.indexOf('. ')
    return i > 0 ? t.slice(0, i + 1) : t
  }

  var une = D.palmares.filter(function (e) { return e.highlight })
    .sort(function (a, b) { return a.annee - b.annee })
  if (!une.length) return

  var html = une.map(function (e) {
    return '<div class="ac-pal-item">' +
      '<div class="ac-pal-yr">' + ech(e.annee) + '</div>' +
      '<div class="ac-pal-body">' +
        '<div class="ac-pal-cat">' + ech(cats[e.categorie] || e.categorie || '') + '</div>' +
        '<div class="ac-pal-titre">' + ech(e.titre) + '</div>' +
        (e.detail ? '<div class="ac-pal-detail">' + ech(court(e.detail)) + '</div>' : '') +
      '</div>' +
    '</div>'
  }).join('')

  var blocs = document.querySelectorAll('[data-palmares-une]')
  for (var i = 0; i < blocs.length; i++) blocs[i].innerHTML = html
})()
