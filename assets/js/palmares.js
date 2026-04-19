/**
 * palmares.js — JB EMERIC
 * Rendu dynamique complet du palmarès : hero stats, intro, timeline enrichie,
 * rencontres, voitures, mur de presse, sponsors, lightbox, filtres.
 * Utilise window.JBEMERIC_DATA (site-data.js)
 */

(function () {
  'use strict'

  var CAT_LABELS = {
    karting:    'Karting',
    monoplace:  'Monoplace',
    gt:         'GT',
    prototype:  'Sport Proto',
    tourisme:   'Tourisme',
    montagne:   'Course de côte',
    rallye:     'Rallye',
    endurance:  'Endurance',
    historique: 'Historique',
    multi:      'Multi-disciplines'
  }

  var currentCat = 'all'

  /* ── Helpers ─────────────────────────────────────────────── */
  function esc(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // esc mais qui conserve <em> (utilisé pour les citations avec emphase)
  function escAllowEm(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/<(?!\/?em>)/g, '&lt;')
      .replace(/>/g, function (m, i, all) {
        // conserve les > qui ferment <em> ou </em>
        var before = all.slice(Math.max(0, i - 5), i + 1)
        if (/<em>$|<\/em>$/.test(before)) return '>'
        return '&gt;'
      })
  }

  /* ── HERO : stats ───────────────────────────────────────── */
  function renderHeroStats() {
    var el = document.getElementById('pal-hero-stats')
    if (!el) return
    var d = window.JBEMERIC_DATA
    var stats = (d && d.palmaresIntro && d.palmaresIntro.chiffres) || []
    if (!stats.length) return
    el.innerHTML = stats.map(function (s) {
      return '<div class="pal-stat">' +
        '<span class="pal-stat-n">' + esc(s.n) + (s.suffix ? esc(s.suffix) : '') + '</span>' +
        '<span class="pal-stat-l">' + esc(s.l) + '</span>' +
      '</div>'
    }).join('')
  }

  /* ── INTRO / Citation ───────────────────────────────────── */
  function renderIntro() {
    var d = window.JBEMERIC_DATA
    if (!d || !d.palmaresIntro) return
    var txtEl = document.getElementById('pal-intro-text')
    var srcEl = document.getElementById('pal-intro-source')
    if (txtEl && d.palmaresIntro.citation) {
      txtEl.innerHTML = escAllowEm(d.palmaresIntro.citation.texte)
    }
    if (srcEl && d.palmaresIntro.citation && d.palmaresIntro.citation.source) {
      srcEl.textContent = '— ' + d.palmaresIntro.citation.source
    }
  }

  /* ── TIMELINE : années ──────────────────────────────────── */
  function renderTimeline() {
    var container = document.getElementById('palmares-timeline')
    if (!container) return

    var data = window.JBEMERIC_DATA
    if (!data || !data.palmares) {
      container.innerHTML = '<div class="pal-loading">Données non disponibles.</div>'
      return
    }

    // Trier par année ASC
    var entries = data.palmares.slice().sort(function (a, b) { return a.annee - b.annee })

    var html = entries.map(function (e) {
      var isHL = e.highlight === true
      var catLabel = CAT_LABELS[e.categorie] || e.categorie || '—'

      var imgs = ''
      if (e.images && e.images.length) {
        imgs = '<div class="pal-gallery">' +
          e.images.map(function (src) {
            return '<div class="pal-gallery-item" onclick="openLightbox(\'' + esc(src) + '\')">' +
              '<img src="' + esc(src) + '" alt="' + esc(e.annee + ' — ' + e.titre) + '" loading="lazy">' +
            '</div>'
          }).join('') +
        '</div>'
      }

      var presse = ''
      if (e.presse && e.presse.length) {
        presse = '<div class="pal-presse">' +
          '<div class="pal-presse-titre">Coupures de presse</div>' +
          '<div class="pal-presse-grid">' +
            e.presse.map(function (src) {
              return '<div class="pal-presse-item" onclick="openLightbox(\'' + esc(src) + '\')">' +
                '<img src="' + esc(src) + '" alt="Article presse ' + esc(e.annee) + '" loading="lazy">' +
              '</div>'
            }).join('') +
          '</div>' +
        '</div>'
      }

      var meta = ''
      var metaItems = []
      if (e.voiture)      metaItems.push({ label: 'Voiture',       val: e.voiture })
      if (e.coequipiers && e.coequipiers.length) metaItems.push({ label: 'Coéquipier' + (e.coequipiers.length > 1 ? 's' : ''), val: e.coequipiers.join(' · ') })
      if (e.circuits && e.circuits.length)       metaItems.push({ label: 'Circuit' + (e.circuits.length > 1 ? 's' : ''),       val: e.circuits.join(' · ') })
      if (metaItems.length) {
        meta = '<div class="pal-meta-grid">' +
          metaItems.map(function (m) {
            return '<div class="pal-meta-bloc">' +
              '<span class="pal-meta-label">' + esc(m.label) + '</span>' +
              '<span class="pal-meta-val">' + esc(m.val) + '</span>' +
            '</div>'
          }).join('') +
        '</div>'
      }

      var resultats = ''
      if (e.resultats && e.resultats.length) {
        resultats = '<div class="pal-resultats">' +
          '<div class="pal-resultats-titre">Résultats détaillés</div>' +
          '<ul class="pal-resultats-list">' +
            e.resultats.map(function (r) {
              return '<li><strong>' + esc(r.circuit) + '</strong>' + esc(r.place) + '</li>'
            }).join('') +
          '</ul>' +
        '</div>'
      }

      var citations = ''
      if (e.citations && e.citations.length) {
        citations = e.citations.map(function (c) {
          return '<div class="pal-year-cite">' +
            '<div class="pal-year-cite-text">« ' + escAllowEm(c.texte) + ' »</div>' +
            (c.source ? '<div class="pal-year-cite-src">— ' + esc(c.source) + '</div>' : '') +
          '</div>'
        }).join('')
      }

      var anecdote = e.anecdote ? '<div class="pal-anecdote">' + esc(e.anecdote) + '</div>' : ''

      return '<article class="pal-year' + (isHL ? ' pal-year--highlight' : '') + '" data-cat="' + esc(e.categorie) + '">' +
        '<aside class="pal-year-left">' +
          '<div class="pal-year-num">' + esc(e.annee) + '</div>' +
          '<div class="pal-year-cat">' + esc(catLabel) + '</div>' +
          (isHL ? '<div class="pal-year-star">★ Titre / Victoire</div>' : '') +
        '</aside>' +
        '<div class="pal-year-right">' +
          '<h3 class="pal-year-titre">' + esc(e.titre) + '</h3>' +
          '<p class="pal-year-detail">' + esc(e.detail || '') + '</p>' +
          meta +
          resultats +
          imgs +
          presse +
          citations +
          anecdote +
        '</div>' +
      '</article>'
    }).join('')

    container.innerHTML = html
    observeYears()
  }

  /* ── RENCONTRES ─────────────────────────────────────────── */
  function renderRencontres() {
    var el = document.getElementById('pal-rencontres')
    if (!el) return
    var data = window.JBEMERIC_DATA
    if (!data || !data.rencontres) return

    el.innerHTML = data.rencontres.map(function (r) {
      return '<div class="pal-renc">' +
        '<div class="pal-renc-annee">' + esc(r.annee) + '</div>' +
        '<h4 class="pal-renc-nom">' + esc(r.nom) + '</h4>' +
        '<div class="pal-renc-disc">' + esc(r.discipline) + '</div>' +
        '<p class="pal-renc-ctx">' + esc(r.contexte) + '</p>' +
      '</div>'
    }).join('')
  }

  /* ── VOITURES CARRIÈRE (extrait unique depuis palmares) ─ */
  function renderVoituresCarriere() {
    var el = document.getElementById('pal-voitures')
    if (!el) return
    var data = window.JBEMERIC_DATA
    if (!data || !data.palmares) return

    // Construit la liste unique des voitures + années associées
    var carMap = {}
    data.palmares.forEach(function (e) {
      if (!e.voiture) return
      // Séparer si plusieurs voitures dans le champ (ex: "Viper · FR")
      var cars = e.voiture.split(/\s*·\s*/)
      cars.forEach(function (c) {
        var key = c.trim()
        if (!key) return
        if (!carMap[key]) carMap[key] = { nom: key, annees: [], categorie: e.categorie }
        carMap[key].annees.push(e.annee)
      })
    })

    var cars = Object.keys(carMap).map(function (k) { return carMap[k] })
    // Trier par première année
    cars.sort(function (a, b) { return Math.min.apply(null, a.annees) - Math.min.apply(null, b.annees) })

    el.innerHTML = cars.map(function (c) {
      var min = Math.min.apply(null, c.annees)
      var max = Math.max.apply(null, c.annees)
      var range = min === max ? String(min) : (min + '–' + max)
      var catLabel = CAT_LABELS[c.categorie] || c.categorie || ''
      return '<div class="pal-voit">' +
        '<div class="pal-voit-annee">' + esc(range) + '</div>' +
        '<h4 class="pal-voit-nom">' + esc(c.nom) + '</h4>' +
        '<div class="pal-voit-cat">' + esc(catLabel) + '</div>' +
      '</div>'
    }).join('')
  }

  /* ── MUR DE PRESSE GLOBAL ───────────────────────────────── */
  function renderMurPresse() {
    var el = document.getElementById('pal-mur-presse')
    if (!el) return
    var data = window.JBEMERIC_DATA
    if (!data || !data.palmares) return

    // Agrège toutes les presse de toutes les années
    var allPresse = []
    data.palmares.forEach(function (e) {
      if (e.presse && e.presse.length) {
        e.presse.forEach(function (src) {
          allPresse.push({ src: src, annee: e.annee })
        })
      }
    })

    if (!allPresse.length) {
      el.innerHTML = '<div class="pal-loading">Aucune coupure disponible.</div>'
      return
    }

    el.innerHTML = allPresse.map(function (p) {
      return '<div class="pal-mur-item" onclick="openLightbox(\'' + esc(p.src) + '\')">' +
        '<img src="' + esc(p.src) + '" alt="Presse ' + esc(p.annee) + '" loading="lazy">' +
      '</div>'
    }).join('')
  }

  /* ── SPONSORS ───────────────────────────────────────────── */
  function renderSponsors() {
    var data = window.JBEMERIC_DATA
    if (!data || !data.sponsorsPalmares) return

    var hl = data.sponsorsPalmares.filter(function (s) { return s.highlight })
    var rest = data.sponsorsPalmares.filter(function (s) { return !s.highlight })

    var hlEl = document.getElementById('pal-sponsors-hl')
    if (hlEl) {
      hlEl.innerHTML = hl.map(function (s) {
        return '<div class="pal-sp-hl">' +
          (s.logo ? '<img class="pal-sp-hl-logo" src="' + esc(s.logo) + '" alt="' + esc(s.nom) + '">' : '') +
          '<div class="pal-sp-hl-nom">' + esc(s.nom) + '</div>' +
          (s.duree ? '<div class="pal-sp-hl-duree">' + esc(s.duree) + ' · depuis ' + esc(s.depuis || '') + '</div>' : '') +
          (s.note ? '<div class="pal-sp-hl-note">' + esc(s.note) + '</div>' : '') +
        '</div>'
      }).join('')
    }

    var wallEl = document.getElementById('pal-sponsors-wall')
    if (wallEl) {
      wallEl.innerHTML = rest.map(function (s) {
        return '<div class="pal-sp-cell" title="' + esc(s.nom) + '">' +
          (s.logo
            ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.nom) + '" loading="lazy">'
            : '<span style="font-family:Bebas Neue;color:rgba(255,255,255,.5)">' + esc(s.nom) + '</span>'
          ) +
        '</div>'
      }).join('')
    }
  }

  /* ── FILTRES ────────────────────────────────────────────── */
  function filterPalmares(cat, btn) {
    currentCat = cat

    var btns = document.querySelectorAll('.pal-filtre')
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active')
    if (btn) btn.classList.add('active')

    var items = document.querySelectorAll('.pal-year')
    for (var j = 0; j < items.length; j++) {
      var item = items[j]
      if (cat === 'all' || item.getAttribute('data-cat') === cat) {
        item.classList.remove('hidden')
      } else {
        item.classList.add('hidden')
      }
    }
  }

  /* ── LIGHTBOX ───────────────────────────────────────────── */
  function openLightbox(src) {
    var lb = document.getElementById('pal-lightbox')
    var img = document.getElementById('pal-lightbox-img')
    if (!lb || !img) return
    img.src = src
    lb.classList.add('open')
    document.body.style.overflow = 'hidden'
  }
  function closeLightbox() {
    var lb = document.getElementById('pal-lightbox')
    if (!lb) return
    lb.classList.remove('open')
    document.body.style.overflow = ''
  }

  /* ── INTERSECTION OBSERVER (fade-in) ───────────────────── */
  function observeYears() {
    if (!('IntersectionObserver' in window)) {
      // Fallback : tout visible d'office
      document.querySelectorAll('.pal-year').forEach(function (y) { y.classList.add('pal-visible') })
      return
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('pal-visible')
          obs.unobserve(en.target)
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    document.querySelectorAll('.pal-year').forEach(function (y) { obs.observe(y) })
  }

  /* ── KEYBOARD : ESC → close lightbox ──────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox()
  })

  /* ── Exposition globale (pour onclick inline) ─────────── */
  window.filterPalmares = filterPalmares
  window.openLightbox   = openLightbox
  window.closeLightbox  = closeLightbox

  /* ── INIT ───────────────────────────────────────────────── */
  function init() {
    renderHeroStats()
    renderIntro()
    renderTimeline()
    renderRencontres()
    renderVoituresCarriere()
    renderMurPresse()
    renderSponsors()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
