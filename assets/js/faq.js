// faq.js : une seule FAQ pour tout le site, filtrée par page.
//
// ── Le principe, demandé par Yoan le 9 août 2026 ────────────────────────────
// « Un système de tableau avec des tags attachés à chaque question. Le tableau
// entier est affiché dans le dashboard, c'est là qu'on met à jour, qu'on
// modifie ou qu'on crée une question. Et ensuite les pages affichent la FAQ
// avec le tag de la page. »
//
// C'est le principe commun/spécifique appliqué au texte. Le fonctionnement est
// le même partout, donc il est écrit une fois. Le contenu varie, donc il vit
// dans la base. Une question qui vaut pour deux pages porte deux tags au lieu
// d'être recopiée deux fois et de diverger : « Puis-je venir avec ma propre
// voiture ? » était déjà dans ce cas, sur Coaching et sur Événements.
//
// ── Comment une page s'en sert ──────────────────────────────────────────────
//     <div class="jbe-faq" data-faq="coaching">
//       <div class="rubrik">Questions</div>
//       <h2 class="sh"><em>FAQ</em></h2>
//       <div class="faq-list">
//         ... les questions ecrites en dur restent ici ...
//       </div>
//     </div>
//
// Le fond, les titres et la couleur restent à la page : c'est ce qui varie
// d'une page à l'autre et ce script n'a rien à en dire.
//
// ── Pourquoi le HTML garde ses questions ────────────────────────────────────
// Elles servent de filet. Si Supabase ne répond pas, le visiteur lit la FAQ
// d'avant plutôt qu'un trou. Le script ne remplace la liste que lorsqu'il a
// vraiment reçu quelque chose.
//
// Le jour où JB modifiera une question dans le dashboard, le HTML deviendra
// périmé sans que rien ne casse : la base gagne toujours quand elle répond.

(function () {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

  function ech(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // Une réponse peut contenir des retours à la ligne saisis par JB. Ils
  // deviennent des sauts, et rien d'autre n'est interprété comme du HTML.
  function enHtml(texte) {
    return ech(texte).replace(/\n/g, '<br>')
  }

  // ── L'accordéon ───────────────────────────────────────────────────────────
  // Posé sur le conteneur et non sur chaque question : les questions arrivent
  // après, et un écouteur par question ne verrait jamais celles de la base.
  function brancherAccordeon(bloc) {
    if (bloc.dataset.faqBranche) return
    bloc.dataset.faqBranche = '1'
    bloc.addEventListener('click', function (ev) {
      var fq = ev.target.closest ? ev.target.closest('.fq') : null
      if (!fq || !bloc.contains(fq)) return
      var ouvert = fq.classList.contains('open')
      var toutes = bloc.querySelectorAll('.fq')
      for (var i = 0; i < toutes.length; i++) toutes[i].classList.remove('open')
      if (!ouvert) fq.classList.add('open')
    })
  }

  function remplir(bloc, questions) {
    var liste = bloc.querySelector('.faq-list') || bloc
    liste.innerHTML = questions.map(function (q) {
      return '<div class="fq">' +
        '<div class="fq-q">' + ech(q.question) + '</div>' +
        '<div class="fq-a">' + enHtml(q.reponse) + '</div>' +
      '</div>'
    }).join('')
  }

  // Le contrat est l'attribut, pas la classe. Le site porte deux noms de
  // conteneur, « jbe-faq » et « faq-section », et un troisième arriverait le
  // jour où quelqu'un recopierait une page. Se fier au nom obligerait à tenir
  // une liste ; l'attribut dit ce que le bloc est.
  var blocs = document.querySelectorAll('[data-faq]')
  for (var i = 0; i < blocs.length; i++) brancherAccordeon(blocs[i])
  if (!blocs.length) {
    // Aucun tag posé : on branche quand même l'accordéon sur les anciens
    // conteneurs, pour que leurs questions écrites en dur restent cliquables.
    var vieux = document.querySelectorAll('.jbe-faq, .faq-section')
    for (var v = 0; v < vieux.length; v++) brancherAccordeon(vieux[v])
    return
  }

  var tags = []
  var parTag = {}
  for (var j = 0; j < blocs.length; j++) {
    var t = blocs[j].getAttribute('data-faq')
    if (!parTag[t]) { parTag[t] = []; tags.push(t) }
    parTag[t].push(blocs[j])
  }

  // Une seule requête pour toute la page, même si elle porte deux blocs.
  // « ov » veut dire overlap : la ligne sort si un de ses tags est demandé.
  var filtre = 'tags=ov.{' + tags.map(encodeURIComponent).join(',') + '}'
  fetch(SB_URL + 'faq?' + filtre + '&visible=eq.true&order=ordre.asc&select=question,reponse,tags,ordre',
        { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    .then(function (lignes) {
      if (!lignes || !lignes.length) return          // le filet reste en place
      for (var t in parTag) {
        var pour = lignes.filter(function (q) { return (q.tags || []).indexOf(t) !== -1 })
        if (!pour.length) continue                   // idem, bloc par bloc
        for (var k = 0; k < parTag[t].length; k++) remplir(parTag[t][k], pour)
      }
    })
    .catch(function () { /* le HTML de la page fait office de filet */ })
})()
