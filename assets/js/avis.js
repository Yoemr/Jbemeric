// avis.js : les avis du site, écrits une seule fois.
//
// ── Le principe, demandé par Yoan le 9 août 2026 ────────────────────────────
// « Header, menu, body, trip advisor, faq, footer. Hormis le texte du header
// rien n'a besoin d'être codé. Le fonctionnement est le même partout donc un
// seul code suffit, mais le contenu varie et s'adapte en fonction de la page. »
//
// C'est le jumeau de faq.js, à la lettre : même contrat, même filet, même
// vocabulaire de tags. Les deux blocs posent le même problème, ils reçoivent
// donc la même réponse plutôt que deux qui divergeront.
//
// ── Comment une page s'en sert ──────────────────────────────────────────────
//     <div class="jbe-avis" data-avis="coaching">
//       <div class="jbe-avis-in">
//         <div class="rubrik">Ce qu'ils disent</div>
//         <h2 class="sh">Avis <em>pilotes</em></h2>
//         <div class="avis-list">
//           ... les avis ecrits en dur restent ici ...
//         </div>
//         <div class="avis-lien"> ... </div>
//       </div>
//     </div>
//
// ── La différence avec la FAQ, et elle compte ───────────────────────────────
// Un avis sans tag vaut pour tout le site, et c'est le cas courant : « JB est
// compétent et sympathique » n'a aucune raison d'être rangé sous une page.
// Un avis tagué s'ajoute aux avis généraux sur les pages qu'il nomme.
//
// Une question de FAQ sans tag ne s'affiche nulle part, parce qu'une question
// est toujours la question de quelqu'un sur quelque chose. Les deux règles
// sont opposées, et c'est voulu.
//
// ── Pourquoi le HTML garde ses avis ─────────────────────────────────────────
// Deux raisons, une de plus que la FAQ. Le filet d'abord : si Supabase ne
// répond pas, le visiteur lit les avis d'avant plutôt qu'un trou. Le
// référencement ensuite : un avis rendu en JavaScript disparaît de ce que lit
// un moteur de recherche, et la preuve sociale est justement ce qu'on veut
// faire lire. Le HTML de la page reste donc la version que voit un robot.

(function () {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

  function ech(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // La note se rend en étoiles ici. JB saisit un chiffre de 1 à 5 dans la
  // fenêtre de gestion, il n'a pas à coller cinq caractères à la main.
  function etoiles(n) {
    var k = Math.max(1, Math.min(5, parseInt(n, 10) || 5))
    return new Array(k + 1).join('★')
  }

  function remplir(bloc, lignes) {
    var liste = bloc.querySelector('.avis-list')
    if (!liste) return
    liste.innerHTML = lignes.map(function (a) {
      return '<div class="av">' +
        '<div class="av-note">' + etoiles(a.note) + '</div>' +
        '<p class="av-texte">"' + ech(a.texte) + '"</p>' +
        '<div class="av-source">' + ech(a.auteur) +
          (a.contexte ? ' · ' + ech(a.contexte) : '') +
        '</div>' +
      '</div>'
    }).join('')
  }

  // Le contrat est l'attribut, pas la classe : une page recopiée porterait le
  // même nom de conteneur sans que personne ait à tenir une liste de noms.
  var blocs = document.querySelectorAll('[data-avis]')
  if (!blocs.length) return

  var tags = []
  var parTag = {}
  for (var j = 0; j < blocs.length; j++) {
    var t = blocs[j].getAttribute('data-avis') || ''
    if (!parTag[t]) { parTag[t] = []; tags.push(t) }
    parTag[t].push(blocs[j])
  }

  // Une seule requête pour toute la page, et le tri des tags se fait ici.
  //
  // La FAQ, elle, filtre côté serveur avec « tags=ov.{...} ». Le besoin n'est
  // pas le même : ici il faut « les avis sans tag, PLUS ceux qui nomment cette
  // page », soit deux conditions à combiner. PostgREST sait le faire, mais
  // avec des accolades imbriquées dans un « or=() » que ce poste ne peut pas
  // éprouver contre la vraie base. Le tri tient en trois lignes dans la page
  // et il est éprouvé par un parcours : c'est le choix sûr.
  //
  // Si la table dépassait un jour la centaine d'avis, il faudra revenir ici.
  fetch(SB_URL + 'avis?visible=eq.true&order=ordre.asc&select=auteur,contexte,texte,note,tags,ordre',
        { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    .then(function (lignes) {
      if (!lignes || !lignes.length) return          // le filet reste en place
      for (var t in parTag) {
        var pour = lignes.filter(function (a) {
          var ses = a.tags || []
          return !ses.length || ses.indexOf(t) !== -1
        })
        if (!pour.length) continue                   // idem, bloc par bloc
        for (var k = 0; k < parTag[t].length; k++) remplir(parTag[t][k], pour)
      }
    })
    .catch(function () { /* le HTML de la page fait office de filet */ })
})()
