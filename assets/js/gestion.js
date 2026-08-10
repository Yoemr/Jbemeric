// gestion.js : la coquille à onglets, et rien d'autre.
//
// ── Ce que Yoan a demandé, 9 août 2026 ──────────────────────────────────────
// « Cette page sera un peu comme un logiciel au bout du compte. À la limite tu
// peux faire juste une fenêtre avec plein d'onglets. Et pour l'instant on crée
// un onglet pour chaque truc qu'on manage, pour chaque fonction. Et on verra
// plus tard comment designer ça. Plus tard on aura uniquement à bouger les
// onglets comme on veut. »
//
// ── La règle qui rend ça possible ───────────────────────────────────────────
// Cette coquille ne connaît aucun onglet. Elle sait ouvrir, fermer, retenir
// lequel était ouvert, et c'est tout. Un onglet s'enregistre lui-même :
//
//     JBE.onglet({ cle:'faq', titre:'FAQ', table:'faq', ... })
//
// Ajouter une fonction se fait donc en ajoutant un fichier, sans toucher à
// celui-ci. Les déplacer se fait en changeant l'ordre des balises script.
//
// ── Le petit outillage partagé ──────────────────────────────────────────────
// Chaque onglet gère une table : lister, créer, modifier, supprimer. Écrire
// ça une fois par onglet donnerait quatre versions du même code qui
// divergeraient. Un onglet déclare donc ses colonnes et ses champs, et cette
// coquille fabrique le tableau et le formulaire.

window.JBE = (function () {
  var SB_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
  var SB_KEY = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

  var onglets = []
  var jeton = null          // le jeton de la session, pour écrire

  // ── Échappement ───────────────────────────────────────────────────────────
  // Une valeur venue de la base ne devient jamais du code. C'est la faute qui
  // a tué les boutons du dashboard le 8 août : un UUID collé dans un onclick.
  function ech(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  // ── Parler à Supabase ─────────────────────────────────────────────────────
  function requete(chemin, options) {
    options = options || {}
    var entetes = {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + (jeton || SB_KEY),
      'Content-Type': 'application/json',
    }
    if (options.retour) entetes.Prefer = 'return=representation'
    return fetch(SB_URL + chemin, {
      method: options.methode || 'GET',
      headers: entetes,
      body: options.corps ? JSON.stringify(options.corps) : undefined,
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)) })
      return r.status === 204 ? null : r.json()
    })
  }

  // ── Le bandeau de message ─────────────────────────────────────────────────
  var minuteur = null
  function dire(texte, type) {
    var el = document.getElementById('g-message')
    if (!el) return
    el.textContent = texte
    el.className = 'g-message ' + (type || 'ok') + ' visible'
    clearTimeout(minuteur)
    minuteur = setTimeout(function () { el.className = 'g-message' }, 4200)
  }

  // ── Les champs d'un formulaire ────────────────────────────────────────────
  // Un champ se déclare, il ne s'écrit pas. Ajouter une colonne à une table
  // revient à ajouter une ligne dans la déclaration de son onglet.
  function champHtml(champ, valeur) {
    var id = 'ch-' + champ.cle
    var etiquette = '<label class="g-label" for="' + id + '">' + ech(champ.titre)
      + (champ.obligatoire ? ' <span class="g-requis">obligatoire</span>' : '') + '</label>'
    var aide = champ.aide ? '<div class="g-aide">' + ech(champ.aide) + '</div>' : ''
    var v = valeur == null ? (champ.defaut == null ? '' : champ.defaut) : valeur
    var corps

    if (champ.type === 'texte-long') {
      corps = '<textarea class="g-champ" id="' + id + '" rows="' + (champ.lignes || 6) + '">' + ech(v) + '</textarea>'
    } else if (champ.type === 'choix') {
      corps = '<select class="g-champ" id="' + id + '">'
        + champ.options.map(function (o) {
            return '<option value="' + ech(o.valeur) + '"' + (String(o.valeur) === String(v) ? ' selected' : '') + '>'
                 + ech(o.titre) + '</option>'
          }).join('')
        + '</select>'
    } else if (champ.type === 'cases') {
      var choisis = Array.isArray(v) ? v.map(String) : []
      corps = '<div class="g-cases">' + champ.options.map(function (o) {
          var coche = choisis.indexOf(String(o.valeur)) !== -1
          return '<label class="g-case' + (coche ? ' coche' : '') + '">'
               + '<input type="checkbox" value="' + ech(o.valeur) + '"' + (coche ? ' checked' : '') + '>'
               + ech(o.titre) + '</label>'
        }).join('') + '</div>'
    } else if (champ.type === 'bascule') {
      corps = '<label class="g-bascule"><input type="checkbox" id="' + id + '"' + (v ? ' checked' : '') + '>'
            + '<span>' + ech(champ.oui || 'oui') + '</span></label>'
    } else {
      corps = '<input class="g-champ" id="' + id + '" type="' + (champ.type || 'text') + '"'
            + (champ.pas ? ' step="' + champ.pas + '"' : '')
            + ' value="' + ech(v) + '">'
    }
    return '<div class="g-groupe" data-champ="' + ech(champ.cle) + '">' + etiquette + aide + corps + '</div>'
  }

  function lireChamp(groupe, champ) {
    if (champ.type === 'cases') {
      var pris = []
      groupe.querySelectorAll('input[type=checkbox]').forEach(function (c) { if (c.checked) pris.push(c.value) })
      return pris
    }
    var el = groupe.querySelector('.g-champ, input[type=checkbox]')
    if (!el) return null
    if (champ.type === 'bascule') return el.checked
    var v = el.value
    if (champ.type === 'number') return v === '' ? null : Number(v)
    return v === '' ? null : v
  }

  // ── Un onglet ─────────────────────────────────────────────────────────────
  function onglet(def) { onglets.push(def) }

  // Les actions d'une ligne se déclarent. Elles étaient écrites en dur, ce qui
  // allait tant que tous les onglets géraient une table de la même façon. Un
  // onglet qui trie plutôt qu'il ne modifie, comme la Veille, a besoin de ses
  // propres verbes. Un onglet qui ne déclare rien garde ceux d'avant.
  var ACTIONS_PAR_DEFAUT = [
    { cle: 'modifier', titre: 'Modifier', faire: function (def, id, l) { editer(def, l) } },
    { cle: 'supprimer', titre: 'Supprimer', classe: 'g-btn-rouge',
      faire: function (def, id, l) { supprimer(def, id, def.nommer ? def.nommer(l) : id) } },
  ]

  function actionsDe(def) { return def.actions || ACTIONS_PAR_DEFAUT }

  // ── Les filtres ───────────────────────────────────────────────────────────
  // Demande de Yoan, 10 août 2026 : « des cases qu'on coche ou décoche pour
  // afficher ce qu'on veut ».
  //
  // Un filtre se déclare comme le reste : une clé, un titre, et de quoi lire
  // la valeur d'une ligne. Les cases sont construites à partir des lignes
  // reçues, pas d'une liste écrite d'avance : une valeur qui n'existe dans
  // aucune ligne n'a pas de case, et une valeur nouvelle en a une sans qu'on
  // touche au code.
  //
  // Rien de coché veut dire tout afficher. C'est le contraire d'une liste
  // vide : personne ne veut ouvrir un onglet et n'y rien voir.
  var choix = {}                       // { cle du filtre : { valeur : true } }

  function valeursDe(f, lignes) {
    var compte = {}
    lignes.forEach(function (l) {
      var v = f.valeur(l)
      var liste = Array.isArray(v) ? v : [v]
      liste.forEach(function (x) {
        var cle = x == null || x === '' ? '' : String(x)
        compte[cle] = (compte[cle] || 0) + 1
      })
    })
    return Object.keys(compte).sort(function (a, b) {
      if (!a) return 1                 // « non renseigné » en dernier
      if (!b) return -1
      return a.localeCompare(b, 'fr')
    }).map(function (v) {
      return { valeur: v, titre: (f.nommer ? f.nommer(v) : v) || 'non renseigné', combien: compte[v] }
    })
  }

  function garde(def, ligne) {
    return (def.filtres || []).every(function (f) {
      var pris = choix[f.cle]
      if (!pris || !Object.keys(pris).length) return true      // rien de coché
      var v = f.valeur(ligne)
      var liste = Array.isArray(v) ? v : [v]
      return liste.some(function (x) {
        return pris[x == null || x === '' ? '' : String(x)]
      })
    })
  }

  function filtresHtml(def, lignes) {
    if (!def.filtres || !def.filtres.length) return ''
    return '<div class="g-filtres">' + def.filtres.map(function (f) {
      var valeurs = valeursDe(f, lignes)
      if (valeurs.length < 2) return ''        // un seul choix ne filtre rien
      var pris = choix[f.cle] || {}
      return '<div class="g-filtre">' +
        '<div class="g-filtre-titre">' + ech(f.titre) + '</div>' +
        valeurs.map(function (v) {
          return '<label class="g-coche' + (pris[v.valeur] ? ' pris' : '') + '">' +
            '<input type="checkbox" data-filtre="' + ech(f.cle) + '"' +
            ' value="' + ech(v.valeur) + '"' + (pris[v.valeur] ? ' checked' : '') + '>' +
            ech(v.titre) + ' <span class="g-filtre-n">' + v.combien + '</span></label>'
        }).join('') +
      '</div>'
    }).join('') +
    (Object.keys(choix).some(function (k) { return Object.keys(choix[k] || {}).length })
      ? '<button class="g-btn g-btn-mini" data-filtre-vider>Tout afficher</button>' : '') +
    '</div>'
  }

  function dessinerBarre(actif) {
    document.getElementById('g-onglets').innerHTML = onglets.map(function (o) {
      return '<button class="g-onglet' + (o.cle === actif ? ' actif' : '') + '" data-onglet="' + ech(o.cle) + '">'
           + ech(o.titre) + '</button>'
    }).join('')
  }

  function ouvrir(cle) {
    var def = onglets.filter(function (o) { return o.cle === cle })[0] || onglets[0]
    if (!def) return
    // Les filtres appartiennent a l'onglet qu'on quitte. Les garder ferait
    // ouvrir le suivant avec des cases qui ne veulent plus rien dire.
    if (courant && courant.cle !== def.cle) choix = {}
    dessinerBarre(def.cle)
    try { localStorage.setItem('jbe-onglet', def.cle) } catch (e) { /* navigation privee */ }
    location.hash = def.cle
    lister(def)
  }

  // ── La liste d'une table ──────────────────────────────────────────────────
  var courant = null
  function lister(def) {
    courant = def
    var zone = document.getElementById('g-contenu')
    zone.innerHTML = '<div class="g-attente">Chargement…</div>'

    requete((def.vue || def.table) + '?select=' + (def.select || '*') + '&order=' + (def.tri || 'created_at.desc'))
      .then(function (toutes) {
        zone.__toutes = toutes
        dessiner(def, toutes)
      })
      .catch(function (e) {
        zone.innerHTML = '<div class="g-erreur"><strong>La base n\'a pas répondu.</strong><br>' + ech(e.message) + '</div>'
      })
  }

  // Dessiner : appelé au chargement, puis à chaque changement de filtre. Les
  // lignes ne sont pas rechargées, elles sont déjà là.
  function dessiner(def, toutes) {
    var zone = document.getElementById('g-contenu')
    var lignes = toutes.filter(function (l) { return garde(def, l) })
    ;(function () {
        var actions = actionsDe(def)
        zone.innerHTML =
          '<div class="g-tete">' +
            '<div><h2>' + ech(def.titre) + '</h2>' +
              '<p class="g-compte">' + (def.compter ? def.compter(lignes, toutes)
                : lignes.length + ' ligne' + (lignes.length > 1 ? 's' : '')) +
                (lignes.length !== toutes.length
                  ? ' <span class="g-fade">sur ' + toutes.length + ', le reste est masqué</span>' : '') +
              '</p></div>' +
            // Une zone de réglages facultative, au même titre que le pied.
            // La Veille y met jusqu'où elle regarde.
            (def.entete ? '<div class="g-tete-reglage" id="g-tete-reglage"></div>' : '') +
            '<div class="g-tete-boutons">' +
              (def.boutonsTete || []).map(function (b) {
                return '<button class="g-btn ' + ech(b.classe || '') + '" data-tete="' + ech(b.cle) + '">'
                     + ech(b.titre) + '</button>'
              }).join('') +
              (def.boutonNouveau === false ? ''
                : '<button class="g-btn g-btn-or" id="g-nouveau">+ Nouveau</button>') +
            '</div>' +
          '</div>' +
          filtresHtml(def, toutes) +
          (lignes.length
            ? '<div class="g-table-cadre"><table class="g-table"><thead><tr>' +
                def.colonnes.map(function (c) { return '<th>' + ech(c.titre) + '</th>' }).join('') +
                '<th></th></tr></thead><tbody>' +
                lignes.map(function (l) {
                  return '<tr data-id="' + ech(l.id) + '">' +
                    def.colonnes.map(function (c) {
                      return '<td>' + (c.rendu ? c.rendu(l) : ech(l[c.cle])) + '</td>'
                    }).join('') +
                    '<td class="g-actions">' +
                      actions.filter(function (a) { return !a.quand || a.quand(l) })
                        .map(function (a) {
                          // Aucun identifiant dans un onclick : c'est ce qui
                          // avait tué les boutons du dashboard le 8 août.
                          return '<button class="g-btn g-btn-mini ' + ech(a.classe || '') + '"'
                               + ' data-agir="' + ech(a.cle) + '" data-ligne="' + ech(l.id) + '">'
                               + ech(a.titre) + '</button>'
                        }).join('') +
                    '</td></tr>'
                }).join('') +
              '</tbody></table></div>'
            : '<div class="g-vide">' + (toutes.length
                ? 'Aucune ligne ne passe les filtres. Décochez pour revoir les ' + toutes.length + '.'
                : (def.vide || 'Rien pour l\'instant. Le bouton « Nouveau » crée la première ligne.')) + '</div>') +
          // Un pied de tableau facultatif. La Veille y met les adresses
          // qu'elle lit, pour que Yoan puisse vérifier une date à la source.
          (def.pied ? '<div class="g-pied" id="g-pied"></div>' : '')

        if (def.entete) def.entete(document.getElementById('g-tete-reglage'), lignes)
        if (def.pied) def.pied(document.getElementById('g-pied'), lignes)
        zone.__lignes = lignes
    })()
  }

  // ── Le formulaire ─────────────────────────────────────────────────────────
  function editer(def, ligne) {
    var neuf = !ligne
    document.getElementById('g-modale').innerHTML =
      '<div class="g-modale-boite">' +
        '<div class="g-modale-tete">' +
          '<h3>' + (neuf ? 'Nouvelle entrée' : 'Modifier') + ' · ' + ech(def.titre) + '</h3>' +
          '<button class="g-fermer" data-fermer>×</button>' +
        '</div>' +
        '<div class="g-modale-corps">' +
          def.champs.map(function (c) { return champHtml(c, ligne ? ligne[c.cle] : null) }).join('') +
        '</div>' +
        '<div class="g-modale-pied">' +
          '<button class="g-btn" data-fermer>Annuler</button>' +
          '<button class="g-btn g-btn-or" data-enregistrer>Enregistrer</button>' +
        '</div>' +
      '</div>'
    document.getElementById('g-modale').classList.add('ouverte')
    document.getElementById('g-modale').dataset.id = ligne ? ligne.id : ''
  }

  // Un formulaire qui n'appartient à aucune table.
  //
  // `editer` sait modifier une ligne de la table de l'onglet courant. La Veille
  // a besoin d'autre chose : ses lignes sont des candidats, et le formulaire
  // qu'elle ouvre crée un événement. Deux objets différents, un seul mécanisme
  // de saisie, donc la boîte se déclare comme le reste.
  var formulaireCourant = null

  function formulaire(def) {
    formulaireCourant = def
    document.getElementById('g-modale').innerHTML =
      '<div class="g-modale-boite">' +
        '<div class="g-modale-tete">' +
          '<h3>' + ech(def.titre) + '</h3>' +
          '<button class="g-fermer" data-fermer>×</button>' +
        '</div>' +
        (def.sous ? '<p class="g-modale-sous">' + def.sous + '</p>' : '') +
        '<div class="g-modale-corps">' +
          def.champs.map(function (c) {
            return champHtml(c, def.valeurs ? def.valeurs[c.cle] : null)
          }).join('') +
        '</div>' +
        '<div class="g-modale-pied">' +
          '<button class="g-btn" data-fermer>Annuler</button>' +
          '<button class="g-btn g-btn-or" data-enregistrer>' + ech(def.valider || 'Enregistrer') + '</button>' +
        '</div>' +
      '</div>'
    document.getElementById('g-modale').classList.add('ouverte')
    document.getElementById('g-modale').dataset.id = ''
  }

  function validerFormulaire() {
    var def = formulaireCourant
    var m = document.getElementById('g-modale')
    var valeurs = {}
    var manquants = []
    def.champs.forEach(function (c) {
      var groupe = m.querySelector('[data-champ="' + c.cle + '"]')
      if (!groupe) return
      var v = lireChamp(groupe, c)
      if (c.obligatoire && (v == null || v === '' || (Array.isArray(v) && !v.length))) manquants.push(c.titre)
      valeurs[c.cle] = v
    })
    if (manquants.length) { dire('Il manque : ' + manquants.join(', '), 'err'); return }
    def.surValider(valeurs)
  }

  function fermerModale() {
    var m = document.getElementById('g-modale')
    m.classList.remove('ouverte')
    m.innerHTML = ''
    formulaireCourant = null
  }

  function enregistrer(def) {
    var m = document.getElementById('g-modale')
    var corps = {}
    var manquants = []
    def.champs.forEach(function (c) {
      var groupe = m.querySelector('[data-champ="' + c.cle + '"]')
      if (!groupe) return
      var v = lireChamp(groupe, c)
      if (c.obligatoire && (v == null || v === '' || (Array.isArray(v) && !v.length))) manquants.push(c.titre)
      corps[c.cle] = v
    })
    if (manquants.length) { dire('Il manque : ' + manquants.join(', '), 'err'); return }

    var id = m.dataset.id
    var p = id
      ? requete(def.table + '?id=eq.' + encodeURIComponent(id), { methode: 'PATCH', corps: corps })
      : requete(def.table, { methode: 'POST', corps: corps })

    p.then(function () {
      fermerModale()
      dire(id ? 'Modifié.' : 'Créé.')
      lister(def)
    }).catch(function (e) {
      dire('Refusé par la base : ' + e.message, 'err')
    })
  }

  function supprimer(def, id, quoi) {
    if (!confirm('Supprimer « ' + quoi + ' » ? C\'est définitif.')) return
    requete(def.table + '?id=eq.' + encodeURIComponent(id), { methode: 'DELETE' })
      .then(function () { dire('Supprimé.'); lister(def) })
      .catch(function (e) { dire('Refusé par la base : ' + e.message, 'err') })
  }

  // ── Les clics, en un seul endroit ─────────────────────────────────────────
  // Un écouteur posé sur le document, jamais dans un attribut. Les tableaux
  // sont reconstruits à chaque chargement, et un gestionnaire écrit dans le
  // HTML se perdrait à la première mise à jour.
  document.addEventListener('click', function (ev) {
    var t = ev.target
    var ong = t.closest && t.closest('[data-onglet]')
    if (ong) return ouvrir(ong.dataset.onglet)

    if (t.closest && t.closest('[data-fermer]')) return fermerModale()
    if (t.id === 'g-modale') return fermerModale()
    if (t.closest && t.closest('[data-enregistrer]')) {
      // Un formulaire libre l'emporte : c'est lui qui est ouvert.
      return formulaireCourant ? validerFormulaire() : enregistrer(courant)
    }
    if (t.id === 'g-nouveau') return editer(courant, null)

    if (t.closest && t.closest('[data-filtre-vider]')) {
      choix = {}
      return dessiner(courant, document.getElementById('g-contenu').__toutes || [])
    }

    var tete = t.closest && t.closest('[data-tete]')
    if (tete) {
      var bt = (courant.boutonsTete || []).filter(function (b) { return b.cle === tete.dataset.tete })[0]
      if (bt) return bt.faire(courant)
      return
    }

    var agir = t.closest && t.closest('[data-agir]')
    if (agir) {
      var acte = actionsDe(courant).filter(function (a) { return a.cle === agir.dataset.agir })[0]
      if (!acte) return
      var lignes = document.getElementById('g-contenu').__lignes || []
      var l = lignes.filter(function (x) { return String(x.id) === agir.dataset.ligne })[0] || {}
      return acte.faire(courant, agir.dataset.ligne, l)
    }

    var caseCoche = t.closest && t.closest('.g-case')
    if (caseCoche) setTimeout(function () {
      caseCoche.classList.toggle('coche', caseCoche.querySelector('input').checked)
    }, 0)
  })

  // Les cases de filtre. Un « change » et non un « click » : la case répond
  // aussi au clavier, et c'est la seule facon de connaitre son etat final.
  document.addEventListener('change', function (ev) {
    var c = ev.target
    if (!c.dataset || !c.dataset.filtre) return
    var cle = c.dataset.filtre
    choix[cle] = choix[cle] || {}
    if (c.checked) choix[cle][c.value] = true
    else delete choix[cle][c.value]
    dessiner(courant, document.getElementById('g-contenu').__toutes || [])
  })

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerModale() })

  // ── Démarrage ─────────────────────────────────────────────────────────────
  // La session sert à écrire : les policies n'ouvrent l'écriture qu'à un
  // administrateur, et la clé publique seule ne suffit pas.
  function demarrer(jetonSession) {
    jeton = jetonSession
    var voulu = (location.hash || '').replace('#', '')
    if (!voulu) { try { voulu = localStorage.getItem('jbe-onglet') || '' } catch (e) { voulu = '' } }
    ouvrir(voulu || (onglets[0] && onglets[0].cle))
  }

  // rafraichir : après une action, la liste doit refléter la base et non ce
  // que le navigateur croit. Un onglet qui redessinerait sa ligne lui-même
  // afficherait le résultat qu'il espère, pas celui qui a eu lieu.
  function rafraichir() { if (courant) lister(courant) }

  return {
    onglet: onglet, demarrer: demarrer, requete: requete, ech: ech, dire: dire,
    rafraichir: rafraichir, formulaire: formulaire, fermer: fermerModale,
  }
})()
