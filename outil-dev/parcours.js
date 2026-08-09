// parcours.js : est-ce qu'un visiteur peut cliquer ?
//
//   node outil-dev/parcours.js            joue tous les parcours
//   node outil-dev/parcours.js accordeon  seulement ceux dont le nom contient ca
//
// ── Ce que ca repond, et que rien d'autre ne repondait ──────────────────────
// L'audit verifie que les liens pointent quelque part. fumee.js verifie que les
// pages ne plantent pas. Aucun des deux ne verifie qu'un bouton FAIT quelque
// chose.
//
// Or une bonne partie de ce site ne marche que par JavaScript : les portes de
// l'Academie naviguent par onclick et non par un <a>, l'accordeon de la FAQ
// n'ouvre rien sans son script, le menu telephone est un burger. Un lien
// correct dans le HTML ne prouve rien de tout ca.
//
// ── Ce que ca ne fait pas, volontairement ───────────────────────────────────
// Aucune ecriture dans la base de production de JB. Personne n'a demande a y
// semer des donnees de test.
//
// L'inscription est tout de meme testee, en remplacant fetch le temps du clic :
// la requete est capturee au lieu de partir, la reponse est simulee. Les deux
// parcours d'inscription sont donc jouables partout, y compris chez Yoan.
//
// Restent hors de portee : la connexion, et la sauvegarde d'un texte par JB.
// Elles attendent un environnement separe ou un compte d'essai.
//
// ── Honnetete sur la methode ────────────────────────────────────────────────
// Les clics sont declenches par element.click() via le protocole DevTools, pas
// par un vrai mouvement de souris. Un vrai clic testerait en plus que l'element
// n'est pas recouvert par un autre. C'est une limite connue, assumee, et
// suffisante pour prouver qu'un gestionnaire existe et fonctionne.

const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = process.env.JBE_BASE || 'http://localhost:3000'
const PORT = 9334

// Les trois evenements de travail, servis a la place de Supabase. Ecrits une
// seule fois : trois parcours s'en servent, et deux definitions du meme jeu de
// donnees finiraient par diverger.
const PRELUDE_EVENEMENTS = `(function () {
  var tout = [
    { id:'p1', slug:'track-day-ledenon-19-septembre', date_event:'2099-09-19',
      type:'Track-Day GT & Tourisme', status:'Open', prix:'245.00', nb_places:10, nb_inscrits:0,
      visible_site:true, mode:'box', organisateur:'Circuit de Lédenon',
      lien_organisateur:'https://exemple.test/ledenon',
      photo:'assets/images/porsche-gt3-circuit-albi.jpg',
      resume:'Le circuit le plus technique du sud.',
      description:'Premier paragraphe de la journee.\\n\\nSecond paragraphe, apres une ligne vide.',
      circuits:{ nom:'Circuit de Lédenon', region:'Gard (30)' } },
    { id:'p2', slug:'stage-206-grand-sambuc-10-octobre', date_event:'2099-10-10',
      type:'Stage 206 S16', status:'Open', prix:'195.00', nb_places:8, nb_inscrits:0,
      visible_site:true, mode:'entier', organisateur:null, lien_organisateur:null,
      photo:'assets/images/peugeot-206-s16-ricard.jpg',
      resume:'Une journee entiere dans la 206 S16 preparee.',
      description:'Un paragraphe.\\n\\nUn autre paragraphe.',
      circuits:{ nom:'Circuit du Grand Sambuc', region:'Bouches-du-Rhône' } },
    { id:'p3', slug:'track-day-le-luc-7-novembre', date_event:'2099-11-07',
      type:'Track-Day voiture personnelle', status:'Open', prix:'175.00', nb_places:12, nb_inscrits:0,
      visible_site:true, mode:'greffe', organisateur:'Circuit du Var',
      lien_organisateur:'https://exemple.test/var',
      photo:'assets/images/lotus-circuit-du-luc.jpg',
      resume:'Le plus accessible des circuits du Var.',
      description:'Un paragraphe.\\n\\nUn autre paragraphe.',
      circuits:{ nom:'Circuit du Luc', region:'Var (83)' } }
  ]
  var vrai = window.fetch
  window.fetch = function (url) {
    var u = String(url)
    if (u.indexOf('/events?') !== -1) {
      var m = u.match(/slug=eq\\.([a-z0-9-]+)/)
      var r = m ? tout.filter(function (e) { return e.slug === m[1] }) : tout
      return Promise.resolve({ ok:true, status:200, json:function () { return Promise.resolve(r) } })
    }
    return vrai.apply(this, arguments)
  }
})()`

// Trois questions servies a la place de la table faq. Une par tag, plus une
// portant les deux : c'est elle qui prouve qu'une question s'ecrit une fois et
// s'affiche partout ou elle sert.
const PRELUDE_FAQ = `(function () {
  var tout = [
    { question:'Question tag coaching',   reponse:'Reponse A.', tags:['coaching'], ordre:10 },
    { question:'Question deux tags',      reponse:'Reponse B.', tags:['coaching','evenements'], ordre:20 },
    { question:'Question tag evenements', reponse:'Reponse C.', tags:['evenements'], ordre:30 },
    { question:'Question tag academie',   reponse:'Reponse D.', tags:['academie'], ordre:40 }
  ]
  // On rend TOUT, sans filtrer. Un banc qui filtre a la place du code ne
  // teste que lui-meme : le 9 aout, retirer le filtre de faq.js n'a fait
  // echouer aucun parcours tant que le banc faisait le travail.
  //
  // PostgREST filtre bien cote serveur en production. Ce parcours eprouve la
  // seconde barriere, celle de la page, qui est la seule a proteger contre une
  // requete mal formee.
  var vrai = window.fetch
  window.fetch = function (u) {
    if (String(u).indexOf('/faq?') !== -1) {
      return Promise.resolve({ ok:true, status:200, json:function () { return Promise.resolve(tout) } })
    }
    return vrai.apply(this, arguments)
  }
})()`

// Quatre avis servis a la place de la table avis. Deux sans tag, qui doivent
// sortir partout, et deux tagues, qui ne doivent sortir que sur leur page.
// C'est la regle inverse de la FAQ, et c'est elle qu'il faut garder.
const PRELUDE_AVIS = `(function () {
  var tout = [
    { auteur:'General un',  contexte:'Le Luc',  texte:'Avis sans tag, valable partout.', note:5, tags:[],             ordre:10 },
    { auteur:'Pour coaching', contexte:null,    texte:'Avis reserve au coaching.',       note:4, tags:['coaching'],   ordre:20 },
    { auteur:'General deux', contexte:null,     texte:'Second avis sans tag.',           note:5, tags:[],             ordre:30 },
    { auteur:'Pour evenements', contexte:null,  texte:'Avis reserve aux evenements.',    note:5, tags:['evenements'], ordre:40 }
  ]
  // On rend TOUT, sans filtrer, pour la meme raison que le prelude FAQ : un
  // banc qui filtre a la place du code ne mesure que lui-meme.
  var vrai = window.fetch
  window.fetch = function (u) {
    if (String(u).indexOf('/avis?') !== -1) {
      return Promise.resolve({ ok:true, status:200, json:function () { return Promise.resolve(tout) } })
    }
    return vrai.apply(this, arguments)
  }
})()`

// La fenetre de gestion, servie sans toucher a Supabase. Les lectures rendent
// un jeu fixe, les ecritures sont capturees dans window.__envois au lieu de
// partir. C'est ce qui rend ce parcours jouable partout, y compris chez Yoan,
// sur une page qui ecrit dans la base de production.
const PRELUDE_GESTION = `(function () {
  var FAQ = [
    { id:'f1', question:'Faut-il un niveau minimum ?', reponse:'Aucun.', tags:['coaching'], ordre:10, visible:true },
    { id:'f2', question:'Puis-je venir avec ma voiture ?', reponse:'Oui.', tags:['coaching','evenements'], ordre:20, visible:true },
    { id:'f3', question:'Question masquee', reponse:'Texte.', tags:[], ordre:30, visible:false }
  ]
  var EV = [
    { id:'e1', date_event:'2099-09-19', type:'Track-Day GT', mode:'box', slug:'essai-ledenon',
      visible_site:true, status:'Open', prix:245, nb_places:10, circuit_id:8 },
    { id:'e2', date_event:'2099-10-10', type:'Stage 206', mode:null, slug:null,
      visible_site:false, status:'Potential', prix:195, nb_places:8, circuit_id:7 }
  ]
  var CIRCUITS = [{ id:7, nom:'Circuit du Grand Sambuc' }, { id:8, nom:'Circuit de Lédenon' }]
  window.__envois = []
  var vrai = window.fetch
  window.fetch = function (url, opt) {
    var u = String(url); opt = opt || {}
    if (u.indexOf('/rest/v1/') === -1) return vrai.apply(this, arguments)
    if (opt.method && opt.method !== 'GET') {
      window.__envois.push({ methode: opt.method, url: u.split('/rest/v1/')[1], corps: opt.body })
      return Promise.resolve({ ok:true, status:200, json:function(){ return Promise.resolve([{}]) } })
    }
    var jeu = u.indexOf('/faq?') !== -1 ? FAQ : u.indexOf('/events?') !== -1 ? EV : CIRCUITS
    return Promise.resolve({ ok:true, status:200, json:function(){ return Promise.resolve(jeu) } })
  }
})()`

// Un parcours : une page, une largeur, une action, et ce qu'on attend apres.
// « action » et « attendu » sont evalues dans la page. « attendu » rend un
// booleen, ou une chaine expliquant l'echec.
const PARCOURS = [
  {
    nom: 'accordeon FAQ, Academie',
    page: 'academie.html',
    largeur: 1300,
    action: `document.querySelector('.fq .fq-q').click()`,
    attendu: `!!document.querySelector('.fq.open') || 'aucune question ne s est ouverte'`,
  },
  {
    nom: 'accordeon FAQ, Coaching',
    page: 'coaching.html',
    largeur: 1300,
    action: `document.querySelector('.fq .fq-q').click()`,
    attendu: `!!document.querySelector('.fq.open') || 'aucune question ne s est ouverte'`,
  },
  {
    nom: 'porte de l Academie, navigation par onclick',
    page: 'academie.html',
    largeur: 1300,
    // Les portes ne sont pas des <a> : elles portent onclick="location.href=...".
    // Un verificateur de liens ne voit donc rien a verifier ici.
    action: `document.querySelector('.porte.enfant').click()`,
    attente: 1200,
    attendu: `location.pathname.includes('karting-enfant') || 'la porte n a pas navigue, on est reste sur ' + location.pathname`,
  },
  {
    nom: 'menu burger, telephone',
    page: 'index.html',
    largeur: 390,
    action: `document.getElementById('nav-burger').click()`,
    attendu: `document.getElementById('nav-mobile').classList.contains('open') || 'le menu mobile ne s est pas ouvert'`,
  },
  {
    nom: 'sous-menu Academie, bureau',
    page: 'index.html',
    largeur: 1300,
    action: `null`,
    attendu: `document.querySelectorAll('#nav-root a[href*="karting"]').length >= 2 || 'les entrees karting du menu sont absentes'`,
  },
  {
    nom: 'videos YouTube, tirage sur grand ecran',
    page: 'academie.html',
    largeur: 1300,
    action: `null`,
    attendu: `document.querySelectorAll('[data-videos] iframe').length === 4 || 'attendu 4 videos tirees, trouve ' + document.querySelectorAll('[data-videos] iframe').length`,
  },
  {
    nom: 'videos YouTube, aucune requete sur telephone',
    page: 'academie.html',
    largeur: 390,
    action: `null`,
    attendu: `document.querySelectorAll('[data-videos] iframe').length === 0 || 'des videos sont chargees sur telephone'`,
  },
  {
    nom: 'carte Coaching de l accueil, vers la bonne offre',
    page: 'index.html',
    largeur: 1300,
    // Les cartes de l'accueil sont aspirees de coaching.html par sync-mirror.js
    // et pointent sur #amateur et #competition. Ces deux ancres ont manque
    // pendant des mois : le visiteur atterrissait en haut de la page au lieu
    // de l'offre sur laquelle il avait clique. Invisible pour un verificateur
    // de liens, qui ne lisait pas les ancres construites en JavaScript.
    action: `document.querySelector('#mirror-coaching a[href*="#amateur"]').click()`,
    attente: 1500,
    attendu: `(location.pathname.includes('coaching') && !!document.getElementById('amateur')) || 'arrive sur ' + location.pathname + location.hash + ', ancre presente : ' + !!document.getElementById('amateur')`,
  },
  {
    nom: 'calendrier Evenements, les dates arrivent de Supabase',
    page: 'evenements.html',
    largeur: 1300,
    // La grille est vide dans le HTML : elle ne contient qu'un « Chargement… »
    // que track-render.js remplace. Si la requete echoue, le visiteur reste
    // devant ce mot sans que rien ne signale une panne. L'audit de fichiers ne
    // peut pas voir ca, il ne lit pas la base.
    besoinBase: true,
    action: `null`,
    attente: 2500,
    attendu: `document.querySelectorAll('#sr-grid .sr-card').length > 0 || 'aucune date affichee, la grille est restee sur ' + document.getElementById('sr-grid').textContent.trim().slice(0, 40)`,
  },
  {
    nom: 'onglets Evenements, chaque filtre laisse quelque chose a voir',
    page: 'evenements.html',
    largeur: 1300,
    // L'onglet « Vote en cours » vidait la grille sans un mot d'explication :
    // aucune carte ne portait ce statut, le filtre ne pouvait qu'echouer. Il a
    // ete retire. Ce parcours verifie qu'aucun onglet survivant ne refait ca.
    besoinBase: true,
    action: `null`,
    attente: 2500,
    attendu: `(function () {
      var statuts = {}
      document.querySelectorAll('#sr-grid .sr-card').forEach(function (c) { statuts[c.dataset.status] = 1 })
      var morts = []
      document.querySelectorAll('.sr-tab').forEach(function (t) {
        var m = (t.getAttribute('onclick') || '').match(/filterCards\\(this,'([a-z]+)'\\)/)
        if (m && m[1] !== 'all' && !statuts[m[1]]) morts.push(t.textContent.trim())
      })
      return morts.length === 0 || 'onglet(s) sans aucune carte : ' + morts.join(', ')
    })()`,
  },
  {
    nom: 'inscription, le corps envoye est celui que la base accepte',
    page: 'evenements.html',
    largeur: 1300,
    // ── Comment ce parcours evite d'ecrire en production ────────────────────
    // Il remplace fetch le temps du clic. La requete est capturee au lieu de
    // partir, et la reponse est simulee reussie. Rien n'atteint Supabase, donc
    // ce parcours est jouable partout, y compris sur le poste de Yoan.
    //
    // Ce qu'il verifie, et qui a coute cher : la cle etrangere de
    // inscriptions.event_id visait track_days alors que le site envoie un
    // identifiant venu de events. La base refusait chaque inscription depuis
    // toujours, et personne ne pouvait le voir. Ce parcours fige le contrat
    // entre ce que la page envoie et ce que la base attend.
    action: `(function () {
      var vrai = window.fetch
      window.__capture = null
      window.fetch = function (url, options) {
        if (String(url).indexOf('/inscriptions') !== -1) {
          window.__capture = { url: String(url), corps: JSON.parse(options.body) }
          return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve({}) } })
        }
        return vrai.apply(this, arguments)
      }
      window.openModal('Essai', 195, 'Circuit de Brignoles', '00000000-1111-2222-3333-444444444444')
      document.getElementById('sr-prenom').value = 'Jean'
      document.getElementById('sr-nom').value    = 'Dupont'
      document.getElementById('sr-email').value  = 'jean.dupont@exemple.fr'
      document.getElementById('sr-tel').value    = '0612345678'
      window.confirmInscription()
    })()`,
    attente: 800,
    attendu: `(function () {
      var c = window.__capture
      if (!c) return 'aucune requete d inscription n a ete construite'

      // Les colonnes obligatoires de la table. user_name et email sont NOT NULL :
      // les oublier fait echouer l insertion sans que la page le sache.
      var obligatoires = ['user_name', 'email']
      var manquants = obligatoires.filter(function (k) { return !c.corps[k] })
      if (manquants.length) return 'champs obligatoires absents du corps : ' + manquants.join(', ')

      if (c.corps.event_id !== '00000000-1111-2222-3333-444444444444')
        return 'l identifiant de l evenement ne suit pas, recu : ' + c.corps.event_id

      if (c.corps.user_name !== 'Jean Dupont') return 'user_name mal compose : ' + c.corps.user_name
      if (c.corps.email !== 'jean.dupont@exemple.fr') return 'email mal transmis : ' + c.corps.email

      // Et la confirmation ne doit s afficher qu apres une reponse favorable.
      var conf = document.getElementById('sr-confirm-view')
      if (!conf || getComputedStyle(conf).display === 'none')
        return 'la base a repondu oui mais la confirmation ne s affiche pas'
      var rappel = document.getElementById('confirm-email')
      if (!rappel || rappel.textContent !== 'jean.dupont@exemple.fr')
        return 'la confirmation ne rappelle pas l adresse saisie, le visiteur ne peut pas voir sa faute de frappe'

      return true
    })()`,
  },
  {
    nom: 'inscription, un echec ne se deguise jamais en confirmation',
    page: 'evenements.html',
    largeur: 1300,
    // Le defaut le plus grave possible sur un formulaire, corrige le 8 aout :
    // l ecran de confirmation s affichait quoi qu il arrive. Le visiteur
    // repartait en croyant sa place reservee. Ni lui ni JB ne pouvaient le voir.
    action: `(function () {
      var vrai = window.fetch
      window.fetch = function (url) {
        if (String(url).indexOf('/inscriptions') !== -1) {
          return Promise.resolve({ ok: false, status: 500 })
        }
        return vrai.apply(this, arguments)
      }
      window.openModal('Essai', 195, 'Circuit de Brignoles', '00000000-1111-2222-3333-444444444444')
      document.getElementById('sr-prenom').value = 'Jean'
      document.getElementById('sr-nom').value    = 'Dupont'
      document.getElementById('sr-email').value  = 'jean.dupont@exemple.fr'
      window.confirmInscription()
    })()`,
    attente: 800,
    attendu: `(function () {
      var conf = document.getElementById('sr-confirm-view')
      if (conf && getComputedStyle(conf).display !== 'none')
        return 'la base a refuse et la page affiche pourtant une confirmation'

      var err = document.getElementById('sr-erreur')
      if (!err) return 'aucun message d erreur, le visiteur ne sait pas que rien n est enregistre'

      var tel = err.querySelector('a[href^="tel:"]')
      if (!tel) return 'le message d erreur ne donne aucun numero a appeler'
      if (tel.getAttribute('href') !== 'tel:+33660188787')
        return 'numero inattendu dans le message d erreur : ' + tel.getAttribute('href')

      return true
    })()`,
  },
  {
    nom: 'formulaire de contact, un message n est jamais perdu en silence',
    page: 'admin/legal/contact.html',
    largeur: 1300,
    // Cette page est hors perimetre, mais elle est le seul moyen de contact
    // propose par le pied de page des neuf pages qui comptent, et le seul que
    // possedent les pages de l'Academie : ni telephone ni adresse dans leur
    // corps. A ce titre elle casse le perimetre, donc elle se teste.
    //
    // Avant le 8 aout 2026 le formulaire n'avait ni action ni gestionnaire. Un
    // <form> sans action se renvoie sur sa propre URL en GET : la page se
    // rechargeait, le formulaire revenait vide, le message partait dans l'URL
    // et disparaissait. Rien ne le disait au visiteur.
    action: `(function () {
      var f = document.querySelector('form[data-contact]') || document.getElementById('contact-form')
      f.prenom.value  = 'Jean'
      f.nom.value     = 'Dupont'
      f.email.value   = 'jean.dupont@exemple.fr'
      f.message.value = 'Bonjour, je voudrais un coaching au Grand Sambuc.'
      document.getElementById('contact-btn').click()
    })()`,
    attente: 900,
    attendu: `(function () {
      if (location.search !== '')
        return 'la page s est rechargee, le message est parti dans l URL et le formulaire est vide'

      var f = document.getElementById('contact-form')
      if (!f || !f.message.value)
        return 'le message a disparu du formulaire'

      var zone = document.getElementById('contact-alert')
      if (!zone || getComputedStyle(zone).display === 'none')
        return 'rien n indique au visiteur ce qu il doit faire de son message'

      var courrier = zone.querySelector('a[href^="mailto:"]')
      if (!courrier) return 'aucun moyen d envoyer le message'
      var lien = decodeURIComponent(courrier.getAttribute('href'))
      if (lien.indexOf('Grand Sambuc') === -1)
        return 'le message du visiteur n est pas repris dans le courrier prepare'

      var tel = zone.querySelector('a[href^="tel:"]')
      if (!tel) return 'aucun numero de repli si la messagerie ne s ouvre pas'
      if (tel.getAttribute('href') !== 'tel:+33660188787')
        return 'numero inattendu : ' + tel.getAttribute('href')

      return true
    })()`,
  },
  {
    nom: 'carte d evenement, une photo, une date, un seul bouton',
    page: 'evenements.html',
    largeur: 1300,
    // Une carte ne decide plus rien. Elle montre, et elle mene a la page de
    // l'evenement. Empiler le prix, le mode et deux boutons dessus donnait une
    // grille illisible et forcait a choisir avant d'avoir lu.
    prelude: PRELUDE_EVENEMENTS,
    action: `null`,
    attente: 2500,
    attendu: `(function () {
      var cartes = document.querySelectorAll('#sr-grid .sr-card')
      if (cartes.length !== 3) return 'attendu 3 cartes, trouve ' + cartes.length

      for (var i = 0; i < cartes.length; i++) {
        var c = cartes[i]
        if (!c.querySelector('.sr-card-img img')) return 'carte ' + (i+1) + ' sans photo'
        if (!c.querySelector('.sr-card-date'))    return 'carte ' + (i+1) + ' sans date'
        if (!c.querySelector('.sr-card-resume'))  return 'carte ' + (i+1) + ' sans resume'

        var boutons = c.querySelectorAll('.sr-btn-savoir')
        if (boutons.length !== 1) return 'carte ' + (i+1) + ' porte ' + boutons.length + ' bouton(s), il en faut un'

        var lien = c.querySelector('.sr-card-lien')
        if (!lien) return 'carte ' + (i+1) + ' n est pas cliquable en entier'
        // Pas d'expression reguliere ici : dans un gabarit de chaine, le \/
        // d'une regex est avale a l'ecriture et le navigateur recoit une
        // division. indexOf ne pose pas ce probleme.
        if (String(lien.getAttribute('href')).indexOf('evenements/') !== 0)
          return 'carte ' + (i+1) + ' ne mene pas a la page de l evenement, mais a ' + lien.getAttribute('href')
      }
      return true
    })()`,
  },
  {
    nom: 'page d evenement, le mode decide de ce qu on peut faire',
    page: 'evenement.html?e=track-day-ledenon-19-septembre',
    largeur: 1300,
    // C'est ici que le basculement se joue. JB ne loue plus le circuit a la
    // journee : le plus souvent le pilote s'inscrit chez l'organisateur pour
    // rouler, et paie JB pour le coaching. Le site ne peut encaisser que
    // lorsque JB est le vendeur.
    prelude: PRELUDE_EVENEMENTS,
    action: `null`,
    attente: 2500,
    attendu: `(function () {
      if (!document.querySelector('.ev-titre')) return 'la page ne s est pas remplie'
      if (!/Lédenon/.test(document.querySelector('.ev-titre').textContent))
        return 'mauvais evenement affiche : ' + document.querySelector('.ev-titre').textContent
      if (document.querySelectorAll('.ev-texte p').length < 2)
        return 'la description n a pas ete decoupee en paragraphes'
      if (!/Lédenon/.test(document.title)) return 'le titre de la page ne nomme pas l evenement : ' + document.title

      // Mode box : deux gestes, l organisateur puis JB.
      var vers = document.querySelector('.ev-btn-creux[href]')
      if (!vers) return 'aucun lien vers l organisateur sur un mode box'
      if (vers.target !== '_blank') return 'le lien vers l organisateur reste dans l onglet'
      if (!document.querySelector('[data-inscr]')) return 'aucun moyen de reserver JB'

      // Et de quoi le joindre, quoi qu il arrive.
      if (!document.querySelector('.ev-joindre a[href^="tel:+33660188787"]'))
        return 'le telephone de JB manque sur la page'
      return true
    })()`,
  },
  {
    nom: 'page d evenement, une adresse inconnue ne laisse pas dans le vide',
    page: 'evenement.html?e=cette-date-nexiste-pas',
    largeur: 1300,
    prelude: PRELUDE_EVENEMENTS,
    action: `null`,
    attente: 2000,
    attendu: `(function () {
      var bloc = document.querySelector('.ev-absent')
      if (!bloc) return 'aucun message, la page reste sur son chargement'
      if (/Chargement/.test(bloc.textContent)) return 'la page est restee sur « Chargement »'
      if (!bloc.querySelector('a[href="evenements.html"]')) return 'aucun retour vers le calendrier'
      return true
    })()`,
  },
  {
    nom: 'FAQ, chaque page ne recoit que les questions de son tag',
    page: 'coaching.html',
    largeur: 1300,
    // Une question s'ecrit une fois et porte les tags des pages ou elle sert.
    // Ce parcours verifie qu'une page ne recoit pas les questions des autres,
    // et qu'une question partagee sort bien sur celles qui la reclament.
    prelude: PRELUDE_FAQ,
    action: `null`,
    attente: 2000,
    attendu: `(function () {
      var bloc = document.querySelector('[data-faq="coaching"]')
      if (!bloc) return 'la page ne declare aucun tag de FAQ'
      var qs = [].map.call(bloc.querySelectorAll('.fq-q'), function (e) { return e.textContent.trim() })
      if (qs.indexOf('Question tag coaching') === -1) return 'la question de la page manque'
      if (qs.indexOf('Question deux tags') === -1)   return 'la question partagee ne sort pas ici'
      if (qs.indexOf('Question tag evenements') !== -1)
        return 'une question d une autre page s affiche : ' + qs.join(' | ')
      if (qs.indexOf('Question tag academie') !== -1)
        return 'une question d une autre page s affiche : ' + qs.join(' | ')
      return true
    })()`,
  },
  {
    nom: 'FAQ, une sous-page de l Academie recoit les questions du parent',
    page: 'academie/karting-enfant.html',
    largeur: 1300,
    // Regle donnee par Yoan le 9 aout 2026 : le tag se cree sur la page ou on
    // insere la FAQ, pas pour les sous-pages, ce sont les memes questions. Les
    // trois pages de l'Academie portent donc « academie » et rien d'autre.
    //
    // Ce parcours garde cette decision : si quelqu'un rendait a une sous-page
    // un tag a elle, elle cesserait de recevoir les questions du parent et ce
    // parcours le dirait.
    prelude: PRELUDE_FAQ,
    action: `null`,
    attente: 2000,
    attendu: `(function () {
      var bloc = document.querySelector('[data-faq]')
      if (!bloc) return 'la page ne declare aucun tag de FAQ'
      var tag = bloc.getAttribute('data-faq')
      if (tag !== 'academie') return 'la sous-page porte un tag a elle : ' + tag
      var qs = [].map.call(bloc.querySelectorAll('.fq-q'), function (e) { return e.textContent.trim() })
      if (qs.indexOf('Question tag academie') === -1)
        return 'les questions de l Academie n arrivent pas ici : ' + qs.join(' | ')
      if (qs.indexOf('Question tag coaching') !== -1)
        return 'une question d une autre page s affiche : ' + qs.join(' | ')
      return true
    })()`,
  },
  {
    nom: 'Avis, un avis sans tag sort partout, un avis tague reste chez lui',
    page: 'coaching.html',
    largeur: 1300,
    // La regle est l'inverse de celle de la FAQ, et c'est ce parcours qui
    // l'empeche de deriver vers celle de la FAQ le jour ou quelqu'un
    // recopiera faq.js pour aller plus vite.
    prelude: PRELUDE_AVIS,
    action: `null`,
    attente: 2000,
    attendu: `(function () {
      var bloc = document.querySelector('[data-avis]')
      if (!bloc) return 'la page ne declare aucun bloc d avis'
      var qui = [].map.call(bloc.querySelectorAll('.av-source'), function (e) { return e.textContent.trim() })
      var a = qui.join(' | ')
      if (a.indexOf('General un') === -1)  return 'un avis sans tag ne sort pas : ' + a
      if (a.indexOf('General deux') === -1) return 'un avis sans tag ne sort pas : ' + a
      if (a.indexOf('Pour coaching') === -1) return 'l avis de la page ne sort pas : ' + a
      if (a.indexOf('Pour evenements') !== -1) return 'un avis d une autre page s affiche : ' + a
      // Le contexte est facultatif en base. Une ligne sans contexte ne doit
      // pas laisser un separateur orphelin derriere le nom.
      if (a.indexOf('Pour coaching ·') !== -1) return 'un separateur reste sans contexte : ' + a
      // La note se rend en etoiles, JB saisit un chiffre.
      var notes = [].map.call(bloc.querySelectorAll('.av-note'), function (e) { return e.textContent.trim() })
      if (notes.indexOf('★★★★') === -1) return 'la note de 4 ne rend pas quatre etoiles : ' + notes.join(' | ')
      return true
    })()`,
  },
  {
    nom: 'Avis, la base coupee laisse les avis ecrits dans la page',
    page: 'academie.html',
    largeur: 1300,
    // Le HTML garde ses avis, et pour une raison de plus que la FAQ : c'est
    // la preuve sociale, et un moteur de recherche ne lit que le HTML.
    prelude: `(function () {
      var vrai = window.fetch
      window.fetch = function (u) {
        if (String(u).indexOf('/avis?') !== -1) return Promise.reject(new Error('coupee'))
        return vrai.apply(this, arguments)
      }
    })()`,
    action: `null`,
    attente: 1500,
    attendu: `(function () {
      var bloc = document.querySelector('[data-avis]')
      if (!bloc) return 'la page ne declare aucun bloc d avis'
      var n = bloc.querySelectorAll('.av').length
      if (!n) return 'le bloc d avis est vide alors que la page en portait'
      if (!bloc.querySelector('.avis-lien a')) return 'le lien TripAdvisor a disparu'
      // La feuille est-elle vraiment branchee ? Sans le <link>, le bloc
      // resterait la, sans fond ni cartes, et le reste du parcours passerait.
      // C'est la variable qui le dit : elle n'existe que dans avis.css.
      var v = getComputedStyle(bloc).getPropertyValue('--avis-fond').trim()
      if (!v) return 'avis.css n est pas chargee sur cette page'
      return true
    })()`,
  },
  {
    nom: 'FAQ, la base coupee laisse les questions ecrites dans la page',
    page: 'coaching.html',
    largeur: 1300,
    // Le HTML garde ses questions et sert de filet. Sans lui, une panne de
    // Supabase laisserait un trou a la place de la FAQ.
    prelude: `(function () {
      var vrai = window.fetch
      window.fetch = function (u) {
        if (String(u).indexOf('/faq?') !== -1) return Promise.reject(new Error('coupee'))
        return vrai.apply(this, arguments)
      }
    })()`,
    action: `document.querySelector('[data-faq] .fq .fq-q').click()`,
    attente: 1200,
    attendu: `(function () {
      var bloc = document.querySelector('[data-faq="coaching"]')
      var qs = bloc.querySelectorAll('.fq')
      if (!qs.length) return 'la FAQ est vide alors que la page en portait'
      if (!bloc.querySelector('.fq.open')) return 'l accordeon ne repond plus sans la base'
      return true
    })()`,
  },
  {
    nom: 'gestion, les onglets et le formulaire',
    page: 'admin/gestion.html',
    largeur: 1400,
    // ── La fenetre de gestion ───────────────────────────────────────────────
    // Une coquille a onglets. Elle ne connait aucun onglet : chacun declare sa
    // table, ses colonnes et ses champs, et la coquille fabrique le tableau et
    // le formulaire. Ajouter une fonction se fait en ajoutant un fichier.
    //
    // Ce parcours verifie la chaine entiere sans jamais ecrire en base : la
    // requete d'enregistrement est capturee au lieu de partir.
    prelude: PRELUDE_GESTION,
    action: `(function () {
      JBE.demarrer('jeton-d-essai')
    })()`,
    attente: 1400,
    attendu: `(function () {
      var onglets = document.querySelectorAll('.g-onglet')
      if (onglets.length < 2) return 'attendu au moins deux onglets, trouve ' + onglets.length
      if (!document.querySelector('.g-onglet.actif')) return 'aucun onglet actif au demarrage'
      if (!document.querySelector('.g-table tbody tr')) return 'le tableau du premier onglet est vide'
      return true
    })()`,
  },
  {
    nom: 'gestion, modifier une question envoie le bon corps',
    page: 'admin/gestion.html',
    largeur: 1400,
    prelude: PRELUDE_GESTION,
    action: `(function () {
      JBE.demarrer('jeton-d-essai')
      return new Promise(function (fini) {
        setTimeout(function () {
          document.querySelector('[data-onglet="faq"]').click()
          setTimeout(function () {
            document.querySelector('[data-modifier]').click()
            setTimeout(function () {
              document.getElementById('ch-question').value = 'Question modifiee'
              var c = [].filter.call(document.querySelectorAll('.g-case input'), function (x) {
                return x.value === 'evenements'
              })[0]
              c.checked = true
              document.querySelector('[data-enregistrer]').click()
              setTimeout(fini, 600)
            }, 500)
          }, 700)
        }, 900)
      })
    })()`,
    attente: 400,
    attendu: `(function () {
      var e = window.__envois || []
      if (e.length !== 1) return 'attendu un envoi, trouve ' + e.length
      if (e[0].methode !== 'PATCH') return 'methode inattendue : ' + e[0].methode
      if (e[0].url.indexOf('faq?id=eq.') !== 0) return 'mauvaise cible : ' + e[0].url

      var corps = JSON.parse(e[0].corps)
      if (corps.question !== 'Question modifiee') return 'la question saisie n est pas transmise'
      if (corps.tags.indexOf('evenements') === -1) return 'le tag coche n est pas transmis'
      if (corps.tags.indexOf('coaching') === -1)   return 'le tag deja present a ete perdu'
      if (corps.visible !== true) return 'la bascule visible n est pas transmise'

      if (document.getElementById('g-modale').classList.contains('ouverte'))
        return 'la fenetre reste ouverte apres enregistrement'
      return true
    })()`,
  },
]

// ── Pourquoi ce preambule existe ────────────────────────────────────────────
// Le 8 aout, les deux parcours ci-dessus ont echoue en annoncant « aucune date
// affichee ». Le site n'y etait pour rien : le poste ne joignait plus Supabase.
// Un outil qui ne sait pas distinguer « la page est cassee » de « le reseau est
// coupe » ment dans les deux sens, et c'est le pire des deux mensonges qu'on
// croit. Les parcours marques besoinBase sont donc declares non concluants
// quand la base est injoignable, au lieu d'etre comptes en echec.
const BASE_URL = 'https://fyaybxamuabawerqzuud.supabase.co/rest/v1/'
const BASE_CLE = 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'

async function baseJoignable() {
  try {
    const r = await fetch(BASE_URL, { headers: { apikey: BASE_CLE }, signal: AbortSignal.timeout(10000) })
    return r.ok || r.status === 401 || r.status === 404   // elle repond, c'est tout ce qui compte
  } catch (e) { return false }
}

function dormir(ms) { return new Promise(r => setTimeout(r, ms)) }

async function attendrePret() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) return } catch (e) { /* pas pret */ }
    await dormir(250)
  }
  throw new Error('le navigateur n\'a pas ouvert son port de debogage')
}

// Un onglet neuf par parcours. Reutiliser le meme laisse l'etat de la page
// precedente, et un parcours peut alors passer grace au travail du precedent.
async function ouvrirOnglet() {
  return (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
}
async function fermerOnglet(id) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/close/${id}`) } catch (e) { /* tant pis */ }
}

function dialogue(ws) {
  let id = 0
  const attentes = new Map()
  ws.onmessage = ev => {
    let m
    try { m = JSON.parse(ev.data) } catch (e) { return }
    // Le protocole enveloppe : le message porte { id, result }, et pour un
    // Runtime.evaluate ce result porte lui-meme { result: objet, exceptionDetails }.
    // Lire un niveau trop haut rend undefined partout, et tous les parcours
    // echouent pour la meme mauvaise raison.
    if (m.id && attentes.has(m.id)) { attentes.get(m.id)(m.result || {}); attentes.delete(m.id) }
  }
  return (method, params) => new Promise(ok => {
    const n = ++id
    attentes.set(n, ok)
    ws.send(JSON.stringify({ id: n, method, params: params || {} }))
  })
}

async function jouer(p) {
  const onglet = await ouvrirOnglet()
  const ws = new WebSocket(onglet.webSocketDebuggerUrl)
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error('websocket refuse')) })
  const envoyer = dialogue(ws)

  try {
    await envoyer('Emulation.setDeviceMetricsOverride', {
      width: p.largeur, height: 900, deviceScaleFactor: 1, mobile: p.largeur < 700,
    })
    await envoyer('Page.enable')
    await envoyer('Runtime.enable')
    // Le profil est neuf a chaque execution, donc le cache est deja vide. On le
    // coupe quand meme : un parcours qui recharge la page en cours de route
    // pourrait sinon relire un fichier d'avant la correction qu'on teste.
    // Piege paye le 8 aout sur un banc d'essai bricole qui gardait son profil :
    // la correction du formulaire de contact a semble ne rien changer pendant
    // trois essais.
    await envoyer('Network.enable')
    await envoyer('Network.setCacheDisabled', { cacheDisabled: true })
    // Un « prelude » s'execute avant les scripts de la page. C'est le seul
    // moment ou l'on peut remplacer fetch pour servir des donnees choisies :
    // apres la navigation, le calendrier a deja lance sa requete.
    if (p.prelude) await envoyer('Page.addScriptToEvaluateOnNewDocument', { source: p.prelude })
    await envoyer('Page.navigate', { url: `${BASE}/${p.page}` })
    await dormir(2500)

    if (p.action && p.action !== 'null') {
      const r = await envoyer('Runtime.evaluate', { expression: p.action, awaitPromise: true })
      if (r.exceptionDetails) {
        const d = r.exceptionDetails
        const texte = (d.exception && (d.exception.description || d.exception.value)) || d.text
        return { ok: false, pourquoi: 'l action a echoue : ' + String(texte).split('\n')[0] }
      }
    }
    await dormir(p.attente || 400)

    const v = await envoyer('Runtime.evaluate', { expression: p.attendu, returnByValue: true })
    if (v.exceptionDetails) {
      const d = v.exceptionDetails
      const texte = (d.exception && (d.exception.description || d.exception.value)) || d.text
      return { ok: false, pourquoi: 'la verification a plante : ' + String(texte).split('\n')[0] }
    }
    const valeur = v.result && v.result.value
    if (valeur === true) return { ok: true }
    return { ok: false, pourquoi: String(valeur) }
  } finally {
    ws.close()
    await fermerOnglet(onglet.id)
  }
}

async function principal() {
  const filtre = process.argv.slice(2).find(a => !a.startsWith('--'))
  const liste = filtre ? PARCOURS.filter(p => p.nom.includes(filtre)) : PARCOURS

  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'jbe-parcours-'))
  const nav = spawn(CHROME, [
    '--headless', '--no-sandbox', '--disable-gpu', '--no-proxy-server',
    '--user-data-dir=' + profil, '--remote-debugging-port=' + PORT, 'about:blank',
  ], { stdio: 'ignore' })

  let echecs = 0
  let sansBase = 0
  try {
    await attendrePret()
    const joignable = await baseJoignable()
    console.log('')
    console.log('  PARCOURS JB EMERIC   ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
    console.log('  ' + '-'.repeat(66))
    console.log(`  ${liste.length} parcours, ${BASE}`)
    if (!joignable) console.log('  Supabase injoignable depuis ce poste : les parcours qui en dependent')
    if (!joignable) console.log('  seront declares non concluants, pas en echec.')
    console.log('')

    for (const p of liste) {
      if (p.besoinBase && !joignable) {
        sansBase++
        console.log(`  SANS BASE ${p.nom}`)
        continue
      }
      const r = await jouer(p)
      if (r.ok) { console.log(`  OK       ${p.nom}`); continue }
      if (p.tolere) { console.log(`  CONNU    ${p.nom}`); console.log(`             ${r.pourquoi}`); continue }
      echecs++
      console.log(`  ECHEC    ${p.nom}`)
      console.log(`             ${r.pourquoi}`)
      console.log(`             page ${p.page}, largeur ${p.largeur}`)
    }

    console.log('')
    console.log('  ' + '-'.repeat(66))
    console.log(echecs ? `  ${echecs} parcours cassé(s).` : '  Tous les parcours joues passent.')
    if (sansBase) console.log(`  ${sansBase} parcours non joue(s), faute d acces a Supabase. A rejouer sur un poste connecte.`)
    console.log('')
    console.log('  L inscription est testee sans rien ecrire : fetch est remplace le temps')
    console.log('  du clic, la requete est capturee et la reponse simulee. Restent hors de')
    console.log('  portee : la connexion, et la sauvegarde d un texte par JB.')
    console.log('')
  } finally {
    nav.kill()
    try { fs.rmSync(profil, { recursive: true, force: true }) } catch (e) { /* tant pis */ }
  }
  process.exit(echecs ? 1 : 0)
}

principal().catch(e => { console.error('  ' + e.message); process.exit(2) })
