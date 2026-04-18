/**
 * footer.js — JB EMERIC
 * Injecte le footer dans chaque page.
 * Modifier ce fichier = mise à jour automatique sur tout le site.
 */
(function() {

  var footerHTML =
    '<footer class="footer">' +
    '<div class="footer-top">' +

    // Brand
    '<div class="ft-brand">' +
      '<div class="ft-logo">JB <em>EMERIC</em></div>' +
      '<div class="ft-tagline">École de Pilotage · Région PACA<br>Champion de France 1988<br>Fondée en 1989</div>' +
      '<div class="ft-socials">' +
        '<a class="ft-social" href="https://www.youtube.com/channel/UCMTQjYff8llakx2twVNH2SA" target="_blank" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8ZM9.7 15.5V8.5l6.3 3.5-6.3 3.5Z"/></svg></a>' +
        '<a class="ft-social" href="https://www.instagram.com/jbemeric.ecoledepilotage/" target="_blank" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.2.1 4.6 1.6 4.7 4.7.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.1-1.5 4.6-4.7 4.7-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1C4 21.2 2.5 19.8 2.4 16.6c-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8C2.5 3.8 4 2.3 7.2 2.2c1.2 0 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1.1 8.3 0 8.7 0 12c0 3.3 0 3.7.1 4.9.2 4.4 2.6 6.8 7 7C8.3 24 8.7 24 12 24s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9 0-3.3 0-3.7-.1-4.9C23.7 2.7 21.3.3 16.9.1 15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"/></svg></a>' +
        '<a class="ft-social" href="https://www.facebook.com/JBEMERIC.Since1989" target="_blank" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.9v2.3h3.3l-.5 3.5h-2.8V24C19.6 23.1 24 18.1 24 12.1z"/></svg></a>' +
        '<a class="ft-social" href="https://www.tiktok.com/@stagepilotagejbemeric" target="_blank" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M19.6 3.3A4.5 4.5 0 0 1 15.2 0h-3.4v15.6a2.6 2.6 0 0 1-2.6 2.4 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 2.6-2.6c.3 0 .5 0 .7.1V9.4a6 6 0 0 0-.7 0 6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6V8.2a8 8 0 0 0 4.6 1.4V6.2a4.5 4.5 0 0 1-2.2-.9z"/></svg></a>' +
      '</div>' +
    '</div>' +

    // Nav footer
    '<div class="ft-col">' +
      '<div class="ft-col-title">Navigation</div>' +
      '<a href="index.html">Accueil</a>' +
      '<a href="academie.html">Académie</a>' +
      '<a href="coaching.html">Coaching</a>' +
      '<a href="track.html">Stages &amp; Track-Days</a>' +
      '<a href="paddock.html">Paddock</a>' +
    '</div>' +

    // Académie
    '<div class="ft-col">' +
      '<div class="ft-col-title">Académie</div>' +
      '<a href="academie-karting.html">Karting Enfant</a>' +
      '<a href="academie-adulte.html">Karting Adulte</a>' +
      '<a href="academie-challenge.html">Challenge Auto</a>' +
      '<a href="coaching.html">Coaching vidéo</a>' +
    '</div>' +

    // Contact
    '<div class="ft-contact">' +
      '<div class="ft-col-title">Contact</div>' +
      '<div class="ft-contact-item">' +
        '<span class="ft-contact-label">Email</span>' +
        '<a class="ft-contact-val" href="mailto:jbemeric@jbemeric.com">jbemeric@jbemeric.com</a>' +
      '</div>' +
      '<div class="ft-contact-item">' +
        '<span class="ft-contact-label">Téléphone</span>' +
        '<a class="ft-contact-val" href="tel:+33660188787">06 60 18 87 87</a>' +
      '</div>' +
      '<div class="ft-contact-item">' +
        '<span class="ft-contact-label">Région</span>' +
        '<span class="ft-contact-val" style="cursor:default">Provence · Alpes · Côte d\'Azur</span>' +
      '</div>' +
      '<div class="ft-contact-item">' +
        '<span class="ft-contact-label">Contact</span>' +
        '<a class="ft-contact-val" href="contact.html">Formulaire de contact</a>' +
      '</div>' +
    '</div>' +

    '</div>' + // footer-top

    '<div class="footer-bottom">' +
      '<span class="fb-copy">&copy; 2026 JB EMERIC &middot; Tous droits réservés</span>' +
      '<div class="fb-badge">' +
        '<a href="contact.html">Contact</a>' +
        '<span>&middot;</span>' +
        '<a href="mentions-legales.html">Mentions légales</a>' +
        '<span>&middot;</span>' +
        '<a href="confidentialite.html">Confidentialité</a>' +
      '</div>' +
    '</div>' +

    '</footer>'

  var footerRoot = document.getElementById('footer-root')
  if (footerRoot) {
    footerRoot.innerHTML = footerHTML
  }

})()
