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
// ── Retenir, c'est créer l'événement ────────────────────────────────────────
// Le bouton ouvre un formulaire. Ce que la veille sait est rappelé en haut et
// n'est pas ressaisi : la date, l'heure, le circuit, la photo, le lien. Ce que
// JB seul sait est demandé : ce qu'il propose ce jour-là, ce qu'il loue, le
// prix, les places, le résumé.
//
// Le prix ne peut pas venir d'ailleurs : aucun circuit lu ne publie de tarif,
// vérifié page par page le 10 août. C'est JB qui négocie, donc c'est JB qui
// le donne.
//
// Il choisit à la fin de mettre en ligne ou de laisser en brouillon. Par
// défaut, brouillon : une date ne doit pas pouvoir atteindre le site par
// simple inattention.

;(function () {
  var ETIQUETTES = {
    nouveau: '<span class="g-tag">à trier</span>',
    retenu:  '<span class="g-oui">retenu</span>',
    ecarte:  '<span class="g-fade">écarté</span>',
  }

  // Wix sait renvoyer une image à la taille demandée. 5 Ko au lieu de 43,
  // mesuré. La photo d'origine reste en base : c'est elle qui part dans
  // l'événement quand JB retient une date. Mot de Yoan : « dans le dashboard
  // version réduite light, et si on crée l'event là on fait de la qualité ».
  function vignette(url) {
    if (!url) return null
    var m = url.match(/^(https:\/\/static\.wixstatic\.com\/media\/)([^/]+)$/)
    return m ? m[1] + m[2] + '/v1/fill/w_160,h_100,al_c,q_80/' + m[2] : url
  }

  var MODES = JBE_VOCABULAIRE.MODES
  var HORIZONS = [1, 2, 3, 6, 12, 24]

  // Le tri met le travail en premier : ce qui n'a pas encore été jugé, puis
  // les dates les plus proches. Ce que JB a déjà tranché descend.
  JBE.onglet({
    cle:   'veille',
    titre: 'Veille',
    table: 'veille_candidats',
    select: '*,veille_sources(nom,circuits(nom,pays,region))',
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

    // ── Les filtres ──────────────────────────────────────────────────────────
    // Demande de Yoan : par circuit, par pays, par région, par type, par date,
    // « et peut-être d'autres trucs que j'ai pas pensé ».
    //
    // Les deux que j'ajoute sont ceux qui coupent le plus. Sur les 83 dates du
    // Circuit du Var : 20 sont des roulages moto, que JB ne fait pas, et 17 des
    // événements privés. Cocher « auto » et « roulage libre » ramène la liste
    // à 10 dates, celles qui l'intéressent vraiment.
    //
    // Une case n'apparaît que si la valeur existe dans les lignes reçues. Tant
    // qu'une seule source est branchée, les cases pays et région ne s'affichent
    // pas : il n'y aurait qu'un choix, et un filtre à un seul choix ne filtre
    // rien.
    filtres: [
      { cle: 'discipline', titre: 'Discipline',
        valeur: function (l) { return l.discipline },
        nommer: function (v) {
          return { auto: 'Auto', moto: 'Moto', karting: 'Karting', 'a juger': 'À juger' }[v] || v
        } },
      // La seule question qui compte pour JB : est-ce qu'un client peut venir
      // avec SA voiture ? Reproche de Yoan, 10 août : « tu me parles de baptême
      // et de stage, mais moi ce que je veux savoir c'est les journées où on
      // peut venir avec une voiture personnelle. On appelle ça un trackday dans
      // le jargon. C'est pas du tout la même chose. »
      //
      // Le circuit emploie exactement les mêmes mots. Le titre de sa page dit
      // « Trackday | Roulage libre | Circuit du Var | Automobiles », et sa
      // description « chaque mois, une journée de roulage libre autos est
      // organisée par le circuit du Var, pour vous inscrire il suffit de nous
      // renvoyer le bulletin d'inscription ». Trackday, roulage libre et
      // voiture perso sont donc la même chose chez eux.
      //
      // Les étiquettes disent maintenant qui fournit la voiture, parce que
      // c'est ça qui sépare une date vendable d'une date inutile.
      { cle: 'genre', titre: 'Peut-on venir avec sa voiture ?',
        valeur: function (l) { return l.genre },
        nommer: function (v) {
          return {
            roulage: 'Trackday, voiture perso',
            stage:   'Stage, voiture du circuit',
            bapteme: 'Baptême, voiture du circuit',
            prive:   'Privé, fermé au public',
            'a juger': 'À vérifier',
          }[v] || v
        } },
      { cle: 'circuit', titre: 'Circuit',
        valeur: function (l) { var c = l.veille_sources && l.veille_sources.circuits; return c ? c.nom : null } },
      { cle: 'pays', titre: 'Pays',
        valeur: function (l) { var c = l.veille_sources && l.veille_sources.circuits; return c ? c.pays : null } },
      { cle: 'region', titre: 'Région',
        valeur: function (l) { var c = l.veille_sources && l.veille_sources.circuits; return c ? c.region : null } },
      { cle: 'mois', titre: 'Mois',
        // La date brute ferait autant de cases que de jours. Le mois est la
        // maille à laquelle JB raisonne quand il cale sa saison.
        valeur: function (l) { return l.date_event ? l.date_event.slice(0, 7) : null },
        nommer: function (v) {
          if (!v) return ''
          var m = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                   'août', 'septembre', 'octobre', 'novembre', 'décembre']
          return m[Number(v.slice(5, 7)) - 1] + ' ' + v.slice(0, 4)
        } },
      { cle: 'duree', titre: 'Durée',
        // Une journée entière ne se vend pas comme une demi-journée.
        valeur: function (l) {
          if (!l.debut || !l.fin) return null
          return (new Date(l.fin) - new Date(l.debut)) / 3600000 >= 7 ? 'jour' : 'demi'
        },
        nommer: function (v) {
          return { jour: 'Journée entière', demi: 'Demi-journée' }[v] || 'Horaires inconnus'
        } },
      { cle: 'statut', titre: 'État',
        valeur: function (l) { return l.statut },
        nommer: function (v) {
          return { nouveau: 'À trier', retenu: 'Retenu', ecarte: 'Écarté' }[v] || v
        } },
    ],

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
      {
        titre: '',
        // La vignette sert à reconnaître une date d'un coup d'œil. C'est
        // l'image du circuit, servie depuis chez lui : si elle manque, la
        // case reste vide plutôt que d'afficher une image cassée.
        rendu: function (l) {
          return l.photo
            ? '<img class="g-vignette" src="' + JBE.ech(vignette(l.photo)) + '" alt="" loading="lazy">'
            : '<span class="g-vignette g-vignette-vide"></span>'
        },
      },
      { cle: 'date_event', titre: 'Date' },
      {
        titre: 'Horaires',
        // Ce que le titre ne dit pas : une journée de 8 h 30 à 18 h n'est pas
        // un baptême de 14 h à 18 h, et JB n'y va pas pour les mêmes raisons.
        // La source donne l'instant, l'heure affichée est celle de Gemenos.
        rendu: function (l) {
          if (!l.debut) return '<span class="g-fade">?</span>'
          var h = function (t) {
            return new Date(t).toLocaleTimeString('fr-FR',
              { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
          }
          var texte = l.fin ? h(l.debut) + ' à ' + h(l.fin) : h(l.debut)
          // Une journée entière se repère d'un coup d'œil.
          var heures = l.fin ? (new Date(l.fin) - new Date(l.debut)) / 3600000 : 0
          return heures >= 7
            ? '<strong>' + JBE.ech(texte) + '</strong>'
            : JBE.ech(texte)
        },
      },
      { cle: 'titre', titre: 'Ce que le circuit annonce' },
      {
        titre: 'Où',
        // Demande de Yoan : « mettre le lien des sites qu'on scanne quelque
        // part discrètement, pour qu'on puisse double check ». Le lien de la
        // ligne mène à la page de CETTE date, pas à l'agenda entier : c'est
        // ce qui permet de vérifier sans chercher.
        rendu: function (l) {
          var nom = JBE.ech(l.veille_sources ? l.veille_sources.nom : '')
          if (!l.lien) return nom
          return '<a class="g-lien-source" href="' + JBE.ech(l.lien) + '"'
               + ' target="_blank" rel="noopener">' + nom + ' ↗</a>'
        },
      },
      { titre: 'État', rendu: function (l) { return ETIQUETTES[l.statut] || JBE.ech(l.statut) } },
    ],

    actions: [
      {
        cle: 'retenir', titre: 'Retenir', classe: 'g-btn-or',
        quand: function (l) { return l.statut !== 'retenu' },
        // Retenir ouvre le formulaire de création. Ce que la veille sait est
        // rappelé en haut et n'est pas ressaisi ; ce que JB seul sait est
        // demandé. Avant, ce bouton fabriquait un brouillon nu et il fallait
        // aller le retrouver dans un autre onglet.
        faire: function (def, id, l) {
          var quand = l.debut
            ? new Date(l.debut).toLocaleString('fr-FR',
                { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' })
            : l.date_event
          JBE.formulaire({
            titre: 'Créer l\'événement',
            valider: 'Créer',
            sous: '<strong>' + JBE.ech(quand) + '</strong>'
                + ' · ' + JBE.ech(l.veille_sources ? l.veille_sources.nom : '')
                + (l.lien ? ' · <a href="' + JBE.ech(l.lien) + '" target="_blank" rel="noopener">'
                          + 'voir chez le circuit ↗</a>' : '')
                + '<br>La date, le circuit, la photo et le lien sont déjà repris.',
            valeurs: {
              // Le titre du circuit est un point de départ, pas une obligation :
              // « Roulage autos » est ce que le circuit vend, pas ce que JB vend.
              p_type: l.titre,
              p_places: 10,
              p_publier: false,
            },
            champs: [
              { cle: 'p_type', titre: 'Ce que JB propose ce jour-là', obligatoire: true,
                aide: 'C\'est le titre que lira un visiteur. Repris du circuit, à réécrire si besoin.' },
              { cle: 'p_mode', titre: 'Ce qu\'on loue', type: 'choix', options: MODES,
                aide: 'Décide de ce que la page d\'événement propose au visiteur.' },
              { cle: 'p_prix', titre: 'Prix par pilote, en euros', type: 'number',
                aide: 'Le circuit ne publie aucun tarif. Ce chiffre vient de JB.' },
              { cle: 'p_places', titre: 'Nombre de places', type: 'number' },
              { cle: 'p_resume', titre: 'Résumé', type: 'texte-long', lignes: 3,
                aide: 'Deux phrases, celles qui s\'affichent sur la carte de la date.' },
              { cle: 'p_publier', titre: 'Mettre en ligne tout de suite', type: 'bascule',
                oui: 'visible sur le site',
                aide: 'Sinon l\'événement reste en brouillon, invisible, et attend.' },
            ],
            surValider: function (v) {
              v.p_candidat = id
              JBE.requete('rpc/veille_creer_evenement', { methode: 'POST', corps: v })
                .then(function () {
                  JBE.fermer()
                  JBE.dire(v.p_publier
                    ? 'Créé et mis en ligne.'
                    : 'Créé en brouillon. Il attend dans l\'onglet Track-days.')
                  JBE.rafraichir()
                })
                .catch(function (e) { JBE.dire('Refusé par la base : ' + e.message, 'erreur') })
            },
          })
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

    vide: 'Aucune date pour l\'instant. Le bouton « Chercher maintenant » va lire les calendriers.',

    // ── Jusqu'où on regarde ──────────────────────────────────────────────────
    // Mot de Yoan : « mon père n'a pas vraiment besoin d'une vue sur l'année
    // entière. En général 3 mois c'est suffisant mais je veux qu'il ait la
    // liberté de choisir. »
    //
    // Élargir ne coûte rien : les dates déjà lues restent en mémoire, elles
    // réapparaissent sans qu'une seule page soit relue. Rétrécir range le
    // surplus sans le perdre.
    entete: function (zone) {
      if (!zone) return
      JBE.requete('veille_reglages?select=horizon_mois&limit=1')
        .then(function (r) {
          var mois = (r && r[0] && r[0].horizon_mois) || 3
          zone.innerHTML = '<label class="g-reglage">Regarder jusqu\'à '
            + '<select class="g-select" data-horizon>'
            + HORIZONS.map(function (m) {
                return '<option value="' + m + '"' + (m === mois ? ' selected' : '') + '>'
                     + m + ' mois</option>'
              }).join('')
            + '</select></label>'

          // L'écouteur est posé ici et non sur le document : cet élément est
          // créé par cette fonction et disparaît avec elle, il ne peut donc
          // pas s'accumuler d'un rendu à l'autre.
          zone.querySelector('[data-horizon]').addEventListener('change', function (ev) {
            var m = Number(ev.target.value)
            JBE.dire('Réglage à ' + m + ' mois…')
            JBE.requete('rpc/veille_horizon', { methode: 'POST', corps: { p_mois: m } })
              .then(function () {
                JBE.dire('On regarde maintenant ' + m + ' mois devant.')
                JBE.rafraichir()
              })
              .catch(function (e) { JBE.dire('Réglage refusé : ' + e.message, 'erreur') })
          })
        })
        .catch(function () {
          zone.innerHTML = '<span class="g-fade">réglage indisponible</span>'
        })
    },

    // ── Les adresses lues, en bas de page ────────────────────────────────────
    // Demande de Yoan : « peut-être intéressant de mettre le lien des sites
    // qu'on scanne quelque part discrètement sur la page, pour qu'on puisse
    // double check ».
    //
    // Discret veut dire en pied de tableau, en petit, mais complet : l'adresse
    // exacte, la dernière lecture, ce qu'elle a répondu, et ce qui reste à
    // lire. Un compte rendu qui cacherait une source muette serait pire que
    // pas de compte rendu du tout.
    pied: function (zone) {
      if (!zone) return
      zone.innerHTML = '<div class="g-pied-titre">Ce qui est lu</div><p class="g-pied-vide">…</p>'
      JBE.requete('veille_sources?select=*&order=nom.asc')
        .then(function (sources) {
          if (!sources.length) {
            zone.innerHTML = '<div class="g-pied-titre">Ce qui est lu</div>'
                           + '<p class="g-pied-vide">Aucune source déclarée.</p>'
            return
          }
          zone.innerHTML = '<div class="g-pied-titre">Ce qui est lu, ' + sources.length + ' source'
            + (sources.length > 1 ? 's' : '') + '</div>'
            + '<ul class="g-sources">' + sources.map(function (s) {
                var quand = s.vue_le ? new Date(s.vue_le).toLocaleString('fr-FR') : 'jamais'
                var etat = s.dernier_message
                  ? '<span class="g-non">' + JBE.ech(s.dernier_message) + '</span>'
                  : '<span class="g-oui">' + (s.dernier_statut || '?') + '</span>'
                return '<li>'
                  + '<a href="' + JBE.ech(s.url) + '" target="_blank" rel="noopener">'
                  + JBE.ech(s.url) + ' ↗</a>'
                  + (s.sitemap_url
                      ? ' · <a href="' + JBE.ech(s.sitemap_url) + '" target="_blank" rel="noopener">sitemap ↗</a>'
                      : '')
                  + ' · lu le ' + JBE.ech(quand) + ' · ' + etat
                  + (s.actif ? '' : ' · <span class="g-fade">en pause</span>')
                  + '</li>'
              }).join('') + '</ul>'
        })
        .catch(function (e) {
          zone.innerHTML = '<div class="g-pied-titre">Ce qui est lu</div>'
                         + '<p class="g-pied-vide">Liste indisponible : ' + JBE.ech(e.message) + '</p>'
        })
    },

    champs: [],
  })
})()
