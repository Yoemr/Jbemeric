/**
 * section-contact.js — JB EMERIC
 * Injecte la section "Nous contacter" dans les pages qui en ont besoin.
 * Inclure dans : academie-*.html, coaching.html, track.html
 * Usage : <div id="section-contact-root"></div>
 *         <script src="assets/js/section-contact.js"></script>
 */
(function() {

  var html =
    '<div class="section-contact" id="contact" style="scroll-margin-top:56px">' +
      '<div style="max-width:960px;margin:0 auto">' +

        '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,207,0,.5);margin-bottom:12px">Prendre contact</div>' +
        '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:clamp(28px,5vw,48px);color:#fff;line-height:.95;margin-bottom:28px">Nous <em style="font-style:normal;color:#FFCF00">contacter</em></div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px" class="sc-responsive-grid">' +

          // Colonne gauche — coordonnées
          '<div style="display:flex;flex-direction:column;gap:12px">' +

            '<a href="tel:+33660188787" style="display:flex;align-items:center;gap:14px;padding:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;text-decoration:none;transition:all .2s" onmouseover="this.style.borderColor=\'rgba(255,207,0,.2)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.07)\'">' +
              '<div style="width:36px;height:36px;flex-shrink:0;border-radius:7px;background:rgba(10,61,145,.25);border:1px solid rgba(10,61,145,.4);display:flex;align-items:center;justify-content:center">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFCF00"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>' +
              '</div>' +
              '<div>' +
                '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;color:#fff;line-height:1">06 60 18 87 87</div>' +
                '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:rgba(255,255,255,.4);margin-top:2px">Appel direct · 7j/7</div>' +
              '</div>' +
            '</a>' +

            '<a href="mailto:jbemeric@jbemeric.com" style="display:flex;align-items:center;gap:14px;padding:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px;text-decoration:none;transition:all .2s" onmouseover="this.style.borderColor=\'rgba(255,207,0,.2)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.07)\'">' +
              '<div style="width:36px;height:36px;flex-shrink:0;border-radius:7px;background:rgba(10,61,145,.25);border:1px solid rgba(10,61,145,.4);display:flex;align-items:center;justify-content:center">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="#FFCF00"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' +
              '</div>' +
              '<div>' +
                '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:18px;color:#fff;line-height:1">jbemeric@jbemeric.com</div>' +
                '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:rgba(255,255,255,.4);margin-top:2px">Réponse sous 24h</div>' +
              '</div>' +
            '</a>' +

            '<a href="contact.html" style="display:inline-flex;align-items:center;gap:8px;margin-top:4px;font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,207,0,.6);text-decoration:none;transition:color .15s" onmouseover="this.style.color=\'#FFCF00\'" onmouseout="this.style.color=\'rgba(255,207,0,.6)\'">' +
              'Formulaire de contact complet →' +
            '</a>' +

          '</div>' +

          // Colonne droite — formulaire rapide
          '<div>' +
            '<form id="sc-form" style="display:flex;flex-direction:column;gap:12px" onsubmit="(function(e){e.preventDefault();var f=e.target;var s=encodeURIComponent(\'[jbemeric.com] \'+f.sujet.value+\' — \'+f.nom.value);var b=encodeURIComponent(\'Nom : \'+f.nom.value+\'\\nEmail : \'+f.email.value+\'\\n\\n\'+f.message.value);window.location.href=\'mailto:jbemeric@jbemeric.com?subject=\'+s+\'&body=\'+b})(event)">' +

              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
                '<div>' +
                  '<label style="display:block;font-family:\'DM Mono\',monospace;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:5px">Nom *</label>' +
                  '<input type="text" name="nom" required placeholder="Votre nom" style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#fff;font-family:\'DM Mono\',monospace;font-size:11px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'rgba(255,207,0,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.1)\'">' +
                '</div>' +
                '<div>' +
                  '<label style="display:block;font-family:\'DM Mono\',monospace;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:5px">Email *</label>' +
                  '<input type="email" name="email" required placeholder="votre@email.com" style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#fff;font-family:\'DM Mono\',monospace;font-size:11px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'rgba(255,207,0,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.1)\'">' +
                '</div>' +
              '</div>' +

              '<div>' +
                '<label style="display:block;font-family:\'DM Mono\',monospace;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:5px">Sujet</label>' +
                '<select name="sujet" style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:rgba(255,255,255,.7);font-family:\'DM Mono\',monospace;font-size:11px;outline:none;box-sizing:border-box" onfocus="this.style.borderColor=\'rgba(255,207,0,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.1)\'">' +
                  '<option value="Demande d\'information" style="background:#07080f">Demande d\'information</option>' +
                  '<option value="Stage de pilotage" style="background:#07080f">Stage de pilotage</option>' +
                  '<option value="Track-Day voiture perso" style="background:#07080f">Track-Day voiture perso</option>' +
                  '<option value="Coaching vidéo" style="background:#07080f">Coaching vidéo</option>' +
                  '<option value="Karting enfant" style="background:#07080f">Karting enfant</option>' +
                  '<option value="Challenge" style="background:#07080f">Challenge Du Kart à l\'Auto</option>' +
                '</select>' +
              '</div>' +

              '<div>' +
                '<label style="display:block;font-family:\'DM Mono\',monospace;font-size:9px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:5px">Message *</label>' +
                '<textarea name="message" required rows="4" placeholder="Votre message…" style="width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#fff;font-family:\'DM Mono\',monospace;font-size:11px;outline:none;resize:vertical;box-sizing:border-box" onfocus="this.style.borderColor=\'rgba(255,207,0,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.1)\'"></textarea>' +
              '</div>' +

              '<button type="submit" style="padding:12px 24px;background:#FFCF00;color:#000;font-family:\'DM Mono\',monospace;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border:none;border-radius:5px;cursor:pointer;transition:filter .15s;align-self:flex-start" onmouseover="this.style.filter=\'brightness(1.1)\'" onmouseout="this.style.filter=\'none\'">' +
                'Envoyer →' +
              '</button>' +

            '</form>' +
          '</div>' +

        '</div>' +
      '</div>' +
    '</div>' +
    '<style>.sc-responsive-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}@media(max-width:640px){.sc-responsive-grid{grid-template-columns:1fr}}</style>'

  var root = document.getElementById('section-contact-root')
  if (root) root.innerHTML = html

})()
