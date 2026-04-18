// faq.js — JB EMERIC
// Accordion FAQ universel — fond blanc, design uniforme
// Chargé dans toutes les pages qui ont une section .jbe-faq
// ZERO class ES6 · ZERO template literal · ZERO arrow function

document.addEventListener('DOMContentLoaded', function () {
  var fqs = document.querySelectorAll('.fq')
  if (!fqs.length) return

  for (var i = 0; i < fqs.length; i++) {
    (function (fq) {
      fq.addEventListener('click', function () {
        var isOpen = fq.classList.contains('open')
        // Fermer tous les items ouverts
        for (var j = 0; j < fqs.length; j++) {
          fqs[j].classList.remove('open')
        }
        // Ouvrir celui cliqué si ce n'était pas déjà ouvert
        if (!isOpen) fq.classList.add('open')
      })
    })(fqs[i])
  }
})
