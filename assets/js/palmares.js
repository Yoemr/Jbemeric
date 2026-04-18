/**
 * palmares.js — JB EMERIC
 * Rendu dynamique du palmarès depuis window.JBEMERIC_DATA
 * Utilisé par palmares.html
 */

var CAT_LABELS = {
  karting:    'Karting',
  monoplace:  'Monoplace',
  gt:         'GT / Tourisme',
  prototype:  'Sport Proto',
  tourisme:   'Tourisme',
  montagne:   'Course de côte',
  rallye:     'Rallye',
  endurance:  'Endurance',
  historique: 'Historique',
  multi:      'Multi-disciplines'
}

var currentCat = 'all'

function renderPalmares() {
  var container = document.getElementById('palmares-timeline')
  if (!container) return

  var data = window.JBEMERIC_DATA
  if (!data || !data.palmares) {
    container.innerHTML = '<div class="pal-loading">Données non disponibles.</div>'
    return
  }

  var html = ''
  var entries = data.palmares

  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    var isHL = e.highlight === true
    var catLabel = CAT_LABELS[e.categorie] || e.categorie

    var hlClass = isHL ? ' pal-item--highlight' : ''
    var hiddenClass = (currentCat !== 'all' && e.categorie !== currentCat) ? ' hidden' : ''

    html += '<div class="pal-item' + hlClass + hiddenClass + '" data-cat="' + e.categorie + '">'
    html +=   '<div class="pal-dot"></div>'
    html +=   '<div class="pal-corps">'
    html +=     '<div class="pal-meta">'
    html +=       '<span class="pal-annee">' + e.annee + '</span>'
    html +=       '<span class="pal-cat" data-label="' + e.categorie + '">' + catLabel + '</span>'
    if (isHL) {
      html +=     '<span class="pal-badge-star">★ Titre / Victoire</span>'
    }
    html +=     '</div>'
    html +=     '<div class="pal-titre">' + e.titre + '</div>'
    html +=     '<div class="pal-detail">' + e.detail + '</div>'
    html +=   '</div>'
    html += '</div>'
  }

  container.innerHTML = html
}

function filterPalmares(cat, btn) {
  currentCat = cat

  // Mettre à jour les boutons
  var btns = document.querySelectorAll('.pal-filtre')
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.remove('active')
  }
  if (btn) btn.classList.add('active')

  // Filtrer les items
  var items = document.querySelectorAll('.pal-item')
  for (var j = 0; j < items.length; j++) {
    var item = items[j]
    if (cat === 'all' || item.getAttribute('data-cat') === cat) {
      item.classList.remove('hidden')
    } else {
      item.classList.add('hidden')
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  renderPalmares()
})
