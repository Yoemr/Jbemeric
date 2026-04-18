/**
 * section-avis.js — JB EMERIC
 * Injecte la section "Avis clients" dans les pages qui en ont besoin.
 * Usage : <div id="section-avis-root"></div>
 *         <script src="assets/js/section-avis.js"></script>
 */
(function() {

  var AVIS = [
    {
      auteur: 'Basquin Yoann',
      note: 5,
      texte: 'Juste un message pour dire merci pour la journée au Luc. Première journée pour moi et c\'était vraiment super, autant niveau organisation que niveau ambiance. Je reviendrai.',
      tag: 'Circuit du Luc'
    },
    {
      auteur: 'Christian J.',
      note: 5,
      texte: 'J\'ai passé une super journée inoubliable avec Jean-Baptiste qui est très sympathique et très compétent pour vous faire progresser dans le pilotage automobile en toute sécurité.',
      tag: 'Stage pilotage'
    },
    {
      auteur: 'Montaner',
      note: 5,
      texte: 'Super journée. Le circuit du Luc était top et le personnel à notre écoute !',
      tag: 'Track-Day'
    },
    {
      auteur: 'Thomas R.',
      note: 5,
      texte: 'Le coaching vidéo m\'a permis de comprendre ce que je faisais mal sur Lédenon. Le rapport était très détaillé, avec des captures annotées. Vraiment utile.',
      tag: 'Coaching vidéo'
    },
    {
      auteur: 'Guillaume B.',
      note: 5,
      texte: 'Premier stage en 206 S16. JB est pédagogue et disponible toute la journée. Le débrief de fin de session m\'a appris plus que 3 ans de conduite sur route.',
      tag: 'Stage 206 S16'
    },
    {
      auteur: 'Pascal V.',
      note: 5,
      texte: 'Organisation impeccable, circuit magnifique, encadrement professionnel. Je recommande sans hésiter à tous les passionnés.',
      tag: 'Circuit du Luc'
    },
  ]

  function stars(n) {
    var s = ''
    for (var i = 0; i < n; i++) s += '★'
    for (var j = n; j < 5; j++) s += '☆'
    return s
  }

  var cardsHTML = AVIS.map(function(a) {
    return (
      '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:20px;display:flex;flex-direction:column;gap:10px">' +
        '<div style="color:#FFCF00;font-size:14px;letter-spacing:2px">' + stars(a.note) + '</div>' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:11px;color:rgba(255,255,255,.7);line-height:1.7;flex:1">' + a.texte + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,207,0,.6)">' + a.auteur + '</div>' +
          '<div style="font-family:\'DM Mono\',monospace;font-size:8px;color:rgba(255,255,255,.3);background:rgba(255,255,255,.05);padding:2px 8px;border-radius:10px">' + a.tag + '</div>' +
        '</div>' +
      '</div>'
    )
  }).join('')

  var html =
    '<div style="background:#040a1e;padding:clamp(40px,5vw,64px) clamp(20px,5vw,72px)">' +
      '<div style="max-width:960px;margin:0 auto">' +
        '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,207,0,.5);margin-bottom:12px">Ils en parlent</div>' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:clamp(28px,5vw,48px);color:#fff;line-height:.95;margin-bottom:28px">Avis <em style="font-style:normal;color:#FFCF00">clients</em></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">' +
          cardsHTML +
        '</div>' +
      '</div>' +
    '</div>'

  var root = document.getElementById('section-avis-root')
  if (root) root.innerHTML = html

})()
