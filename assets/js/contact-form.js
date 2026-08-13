// contact-form.js : le formulaire de contact ne perd plus les messages
//
// ── Ce qu'il se passait avant, verifie dans un navigateur le 8 aout 2026 ────
// Le formulaire n'avait ni action, ni gestionnaire, ni le moindre script pour
// l'ecouter. Un <form> sans action se renvoie sur sa propre URL en GET. Au
// clic sur « Envoyer le message », la page se rechargeait avec
//
//   contact.html?prenom=Jean&nom=Dupont&email=...&message=Bonjour%2C+je...
//
// Le formulaire revenait vide, aucune requete ne partait nulle part, et rien
// n'indiquait au visiteur que son message venait de disparaitre. C'est le seul
// moyen de contact propose par le pied de page des neuf pages du site, et le
// seul que possedent les pages de l'Academie, qui n'ont ni telephone ni adresse
// dans leur corps.
//
// Au passage, le message finissait dans l'URL, donc dans l'historique du
// navigateur et dans les journaux du serveur.
//
// ── Ce que ce script fait, et ce qu'il ne fait pas ─────────────────────────
// Il n'invente aucune infrastructure. Il n'y a ni serveur d'envoi, ni table de
// messages : ce choix revient a Yoan, et la migration qui creerait cette table
// attend dans outil-dev/migrations/.
//
// En attendant, il garantit la seule chose qui compte : le message n'est plus
// perdu en silence. Il reste a l'ecran, et le visiteur repart avec un moyen
// d'atteindre JB qui fonctionne aujourd'hui.
//
// ── Universel ──────────────────────────────────────────────────────────────
// Le script ne connait pas la page de contact. Il se branche sur tout
// formulaire portant data-contact, quel que soit l'endroit ou il vit.

(function () {
  var TEL_JB   = '+33660188787'
  var TEL_LU   = '06 60 18 87 87'
  var MAIL_JB  = 'jbemeric@jbemeric.com'

  // Les intitules lisibles des sujets. Le <select> porte des valeurs courtes,
  // et « trackday » dans un objet de courriel n'aide personne.
  var SUJETS = {
    stage:     'Stage de pilotage',
    trackday:  'Track-Day en voiture personnelle',
    coaching:  'Coaching vidéo',
    karting:   'Karting enfant',
    challenge: 'Vers la compétition',
    autre:     'Demande de renseignements',
  }

  function valeur(form, nom) {
    var champ = form.elements[nom]
    return champ && champ.value ? String(champ.value).trim() : ''
  }

  function afficher(zone, texte, couleur) {
    if (!zone) return
    zone.style.display     = ''
    zone.style.background  = couleur === 'ok' ? 'rgba(34,197,94,.12)'  : 'rgba(220,38,38,.12)'
    zone.style.border      = '1px solid ' + (couleur === 'ok' ? 'rgba(34,197,94,.45)' : 'rgba(220,38,38,.45)')
    zone.style.color       = couleur === 'ok' ? '#7ee2a8' : '#fca5a5'
    zone.style.lineHeight  = '1.7'
    zone.innerHTML         = texte
  }

  function brancher(form) {
    var zone = document.getElementById(form.getAttribute('data-contact-alert') || 'contact-alert')

    form.addEventListener('submit', function (ev) {
      // Sans ceci, le navigateur recharge la page et le message est perdu.
      ev.preventDefault()

      var prenom  = valeur(form, 'prenom')
      var nom     = valeur(form, 'nom')
      var email   = valeur(form, 'email')
      var tel     = valeur(form, 'telephone')
      var sujet   = valeur(form, 'sujet')
      var message = valeur(form, 'message')

      if (!prenom || !nom || !email || !message) {
        afficher(zone, 'Il manque votre prénom, votre nom, votre email ou votre message.', 'err')
        return
      }

      var objet = (SUJETS[sujet] || 'Message depuis le site') + ', ' + prenom + ' ' + nom
      var corps = 'Prénom : ' + prenom + '\n'
                + 'Nom : ' + nom + '\n'
                + 'Email : ' + email + '\n'
                + (tel ? 'Téléphone : ' + tel + '\n' : '')
                + (sujet ? 'Sujet : ' + (SUJETS[sujet] || sujet) + '\n' : '')
                + '\n' + message + '\n'

      var lien = 'mailto:' + MAIL_JB
                + '?subject=' + encodeURIComponent(objet)
                + '&body='    + encodeURIComponent(corps)

      // Le message reste a l'ecran. Le visiteur voit ce qu'il a ecrit, il a un
      // bouton qui ouvre son logiciel de courrier avec tout dedans, et un
      // numero s'il prefere appeler. Aucun de ces trois chemins ne se perd.
      afficher(zone,
        '<strong>Votre message n\'est pas encore parti.</strong><br>'
      + 'Le bouton ci-dessous ouvre votre messagerie avec le texte déjà écrit, '
      + 'il ne reste qu\'à envoyer. Sinon, appelez JB.'
      + '<br><br>'
      + '<a href="' + lien + '" style="display:inline-block;padding:11px 22px;margin-right:10px;'
      + 'background:#FFCF00;color:#000;text-decoration:none;border-radius:5px;'
      + 'font-family:\'DM Mono\';font-size:10px;letter-spacing:1.5px;text-transform:uppercase">'
      + 'Ouvrir ma messagerie</a>'
      + '<a href="tel:' + TEL_JB + '" style="display:inline-block;padding:11px 22px;'
      + 'border:1px solid rgba(255,255,255,.25);color:#fff;text-decoration:none;border-radius:5px;'
      + 'font-family:\'DM Mono\';font-size:10px;letter-spacing:1.5px">' + TEL_LU + '</a>',
        'ok')

      zone.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  var formulaires = document.querySelectorAll('form[data-contact]')
  for (var i = 0; i < formulaires.length; i++) brancher(formulaires[i])
})()
