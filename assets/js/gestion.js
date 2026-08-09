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

  function dessinerBarre(actif) {
    document.getElementById('g-onglets').innerHTML = onglets.map(function (o) {
      return '<button class="g-onglet' + (o.cle === actif ? ' actif' : '') + '" data-onglet="' + ech(o.cle) + '">'
           + ech(o.titre) + '</button>'
    }).join('')
  }

  function ouvrir(cle) {
    var def = onglets.filter(function (o) { return o.cle === cle })[0] || onglets[0]
    if (!def) return
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
      .then(function (lignes) {
        var actions = actionsDe(def)
        zone.innerHTML =
          '<div class="g-tete">' +
            '<div><h2>' + ech(def.titre) + '</h2>' +
              '<p class="g-compte">' + (def.compter ? def.compter(lignes)
                : lignes.length + ' ligne' + (lignes.length > 1 ? 's' : '')) + '</p></div>' +
            '<div class="g-tete-boutons">' +
              (def.boutonsTete || []).map(function (b) {
                return '<button class="g-btn ' + ech(b.classe || '') + '" data-tete="' + ech(b.cle) + '">'
                     + ech(b.titre) + '</button>'
              }).join('') +
              (def.boutonNouveau === false ? ''
                : '<button class="g-btn g-btn-or" id="g-nouveau">+ Nouveau</button>') +
            '</div>' +
          '</div>' +
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
            : '<div class="g-vide">' + (def.vide || 'Rien pour l\'instant. Le bouton « Nouveau » crée la première ligne.') + '</div>') +
          // Un pied de tableau facultatif. La Veille y met les adresses
          // qu'elle lit, pour que Yoan puisse vérifier une date à la source.
          (def.pied ? '<div class="g-pied" id="g-pied"></div>' : '')

        if (def.pied) def.pied(document.getElementById('g-pied'), lignes)
        zone.__lignes = lignes
      })
      .catch(function (e) {
        zone.innerHTML = '<div class="g-erreur"><strong>La base n\'a pas répondu.</strong><br>' + ech(e.message) + '</div>'
      })
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

  function fermerModale() {
    var m = document.getElementById('g-modale')
    m.classList.remove('ouverte')
    m.innerHTML = ''
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
    if (t.closest && t.closest('[data-enregistrer]')) return enregistrer(courant)
    if (t.id === 'g-nouveau') return editer(courant, null)

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

  return { onglet: onglet, demarrer: demarrer, requete: requete, ech: ech, dire: dire, rafraichir: rafraichir }
})()
