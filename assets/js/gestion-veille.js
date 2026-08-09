// gestion-veille.js : l'onglet Veille.
//
// ── Ce qu'il montre ─────────────────────────────────────────────────────────
// Demande de Yoan, 9 août 2026 : « j'aimerais que dans le dashboard on arrive
// à récupérer automatiquement tous les events ».
//
// La base va lire les calendriers des circuits une fois par jour et dépose ce
// qu'elle trouve dans `veille_candidats`. Cet onglet est l'endroit où JB
// tranche : retenir, ou écarter.
//
// ── Pourquoi JB tranche, et pas une règle automatique ───────────────────────
// Un calendrier de circuit mélange les roulages autos, les roulages motos, les
// stages de l'école du circuit et les événements privés. Le 9 août, sur les
// dix-huit dates du Circuit du Var, deux seulement étaient des roulages autos.
// Aucune règle écrite d'avance ne dira lesquelles intéressent JB : ça dépend de
// ses accords, de ses clients et de son agenda.
//
// ── Retenir ne publie rien ──────────────────────────────────────────────────
// Retenir crée un événement en brouillon, invisible et au statut Potential. JB
// le complète ensuite dans l'onglet Track-days, prix, mode et résumé, puis le
// rend visible. Une date fausse ne peut donc pas atteindre le site toute seule.

;(function () {
  var ETIQUETTES = {
    nouveau: '<span class="g-tag">à trier</span>',
    retenu:  '<span class="g-oui">retenu</span>',
    ecarte:  '<span class="g-fade">écarté</span>',
  }

  // Le tri met le travail en premier : ce qui n'a pas encore été jugé, puis
  // les dates les plus proches. Ce que JB a déjà tranché descend.
  JBE.onglet({
    cle:   'veille',
    titre: 'Veille',
    table: 'veille_candidats',
    select: '*,veille_sources(nom)',
    tri:   'statut.asc,date_event.asc',

    nommer: function (l) { return l.titre + ' du ' + l.date_event },

    compter: function (lignes) {
      var neufs = lignes.filter(function (l) { return l.statut === 'nouveau' }).length
      if (!lignes.length) return 'aucune date trouvée pour l\'instant'
      return neufs
        ? neufs + ' date' + (neufs > 1 ? 's' : '') + ' à trier, sur ' + lignes.length + ' vues'
        : 'tout est trié, ' + lignes.length + ' dates vues'
    },

    // Rien ne se crée à la main ici : les lignes viennent des circuits.
    boutonNouveau: false,

    boutonsTete: [{
      cle: 'chercher',
      titre: 'Chercher maintenant',
      classe: 'g-btn-or',
      // Le passage a lieu tout seul chaque matin. Ce bouton sert le jour où JB
      // sait qu'un circuit vient de publier ses dates et ne veut pas attendre.
      faire: function () {
        JBE.dire('Lecture des calendriers…')
        JBE.requete('rpc/veille_passer', { methode: 'POST', corps: {} })
          .then(function (lignes) {
            var neufs = (lignes || []).reduce(function (n, l) { return n + (l.nouveaux || 0) }, 0)
            var cassees = (lignes || []).filter(function (l) { return l.message })
            if (cassees.length) {
              JBE.dire(cassees.length + ' source(s) muette(s) : ' + cassees.map(function (c) {
                return c.source + ', ' + c.message
              }).join(' · '), 'erreur')
            } else {
              JBE.dire(neufs ? neufs + ' nouvelle(s) date(s)' : 'Aucune nouveauté, tout était déjà là.')
            }
            JBE.rafraichir()
          })
          .catch(function (e) { JBE.dire('La recherche a échoué : ' + e.message, 'erreur') })
      },
    }],

    colonnes: [
      { cle: 'date_event', titre: 'Date' },
      { cle: 'titre', titre: 'Ce que le circuit annonce' },
      {
        titre: 'Où',
        rendu: function (l) {
          return JBE.ech(l.veille_sources ? l.veille_sources.nom : '')
        },
      },
      { titre: 'État', rendu: function (l) { return ETIQUETTES[l.statut] || JBE.ech(l.statut) } },
    ],

    actions: [
      {
        cle: 'retenir', titre: 'Retenir', classe: 'g-btn-or',
        quand: function (l) { return l.statut !== 'retenu' },
        faire: function (def, id) {
          JBE.requete('rpc/veille_retenir', { methode: 'POST', corps: { p_candidat: id } })
            .then(function () {
              JBE.dire('Retenu. L\'événement attend dans l\'onglet Track-days, en brouillon.')
              JBE.rafraichir()
            })
            .catch(function (e) { JBE.dire('Impossible de retenir : ' + e.message, 'erreur') })
        },
      },
      {
        cle: 'ecarter', titre: 'Écarter',
        quand: function (l) { return l.statut === 'nouveau' },
        faire: function (def, id) {
          JBE.requete('veille_candidats?id=eq.' + encodeURIComponent(id),
                      { methode: 'PATCH', corps: { statut: 'ecarte' } })
            .then(function () {
              JBE.dire('Écarté. Cette date ne remontera plus.')
              JBE.rafraichir()
            })
            .catch(function (e) { JBE.dire('Impossible d\'écarter : ' + e.message, 'erreur') })
        },
      },
      {
        cle: 'rendre', titre: 'Remettre à trier',
        quand: function (l) { return l.statut === 'ecarte' },
        faire: function (def, id) {
          JBE.requete('veille_candidats?id=eq.' + encodeURIComponent(id),
                      { methode: 'PATCH', corps: { statut: 'nouveau' } })
            .then(function () { JBE.rafraichir() })
            .catch(function (e) { JBE.dire('Impossible : ' + e.message, 'erreur') })
        },
      },
    ],

    champs: [],
  })
})()
