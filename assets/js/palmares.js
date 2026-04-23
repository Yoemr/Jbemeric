/**
 * palmares.js — JB EMERIC
 * Timeline scroll-snap : 1 slide = 100vh, 1 ou plusieurs années par slide (packing sparse).
 * Layout : hero photo SOUS la date (sidebar) + centre (titre, détail, carousel auto,
 * banderole caption, grille presse clickable).
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

  var CAROUSEL_AUTOPLAY_MS = 3500
  var PACK_CAP = 10  // capacité d'un slide pour packing sparse

  /* ═══ TIMELINE AUTOPLAY — config ═══════════════════════════ */
  var TIMELINE_DEFAULT_MS = 6000   // délai si slide sans carousel
  var USER_IDLE_MS        = 8000   // pause après interaction user
  var lastUserInteraction = 0
  var timelineAutoplayTimer = null
  var timelineObserver = null

  /* ═══ LIGHTBOX MAGAZINE — state ════════════════════════════ */
  var lbCollections = {}
  var lbState = { id: null, index: 0, zoom: 1 }

  /* ═══ CAROUSELS — state (par carousel id) ══════════════════ */
  var carouselTimers = {}

  /* ── Helpers ─────────────────────────────────────────────── */
  function esc(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function escAllowEm(s) {
    if (s == null) return ''
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/<(?!\/?em>)/g, '&lt;')
      .replace(/>/g, function (m, i, all) {
        var before = all.slice(Math.max(0, i - 5), i + 1)
        if (/<em>$|<\/em>$/.test(before)) return '>'
        return '&gt;'
      })
  }

  /* ── Calcule un nombre de colonnes qui donne des rangées symétriques ──
        Règle user : "quand il y a deux rangées, même nombre en haut qu'en bas".
        On privilégie les diviseurs exacts ; sinon on évite l'asymétrie en passant
        à 1 seule rangée si possible (N ≤ 5) ou on prend le moins déséquilibré. */
  function symGridCols(n) {
    if (n <= 1) return 1
    if (n === 2) return 2
    if (n === 3) return 3
    if (n === 4) return 4      // 1 rangée de 4 (évite 2+2 plus haut)
    if (n === 5) return 5      // 1 rangée de 5 (évite 3+2 asymétrique)
    if (n === 6) return 3      // 2 rangées de 3 — symétrique
    if (n === 7) return 4      // 4+3 (compromis : 7 cols = trop étroit)
    if (n === 8) return 4      // 2 rangées de 4 — symétrique
    if (n === 9) return 3      // 3 rangées de 3 — symétrique
    if (n === 10) return 5     // 2 rangées de 5 — symétrique
    if (n === 12) return 4     // 3 rangées de 4 — symétrique
    return 4                   // fallback : 4 cols
  }

  function yearHasContent(e, rencontres) {
    if (e.titre || e.detail) return true
    if (e.images && e.images.length) return true
    if (e.presse && e.presse.length) return true
    if (e.resultats && e.resultats.length) return true
    if (e.voiture) return true
    if (e.coequipiers && e.coequipiers.length) return true
    if (e.adversaires && e.adversaires.length) return true
    if (e.circuits && e.circuits.length) return true
    if (e.citations && e.citations.length) return true
    if (e.anecdote) return true
    if (rencontres && rencontres.some(function (r) { return r.annee === e.annee })) return true
    return false
  }

  /* ─── Poids de densité d'une année (pour packing) ────────── */
  function yearWeight(e) {
    var w = 1
    if (e.detail) w += 1
    if (e.images && e.images.length) w += 5
    if (e.images && e.images.length > 1) w += 2
    if (e.presse && e.presse.length) w += Math.min(4, e.presse.length)
    if (e.resultats && e.resultats.length) w += 2
    if (e.anecdote) w += 1
    if (e.citations && e.citations.length) w += 1
    if (e.voiture || (e.circuits && e.circuits.length)) w += 1
    return w
  }

  function isHeavy(e) {
    // Une année "lourde" = a au moins une image OU au moins 2 articles presse
    return (e.images && e.images.length > 0) ||
           (e.presse && e.presse.length >= 2) ||
           (e.resultats && e.resultats.length >= 3)
  }

  /* ─── Packing : groupe les années sparses dans mêmes slides ─ */
  function packYears(entries) {
    var slides = []
    var current = null
    entries.forEach(function (e) {
      var heavy = isHeavy(e)
      var w = yearWeight(e)
      if (heavy) {
        if (current) { slides.push(current); current = null }
        slides.push({ years: [e], weight: w, heavy: true })
      } else {
        if (!current) current = { years: [], weight: 0, heavy: false }
        if (current.weight + w > PACK_CAP || current.years.length >= 3) {
          slides.push(current)
          current = { years: [e], weight: w, heavy: false }
        } else {
          current.years.push(e)
          current.weight += w
        }
      }
    })
    if (current) slides.push(current)
    return slides
  }

  /* ═══ HERO / INTRO : inchangé ══════════════════════════════ */
  function renderHeroStats() {
    var el = document.getElementById('pal-hero-stats')
    if (!el) return
    var d = window.JBEMERIC_DATA
    var stats = (d && d.palmaresIntro && d.palmaresIntro.chiffres) || []
    if (!stats.length) return
    el.innerHTML = stats.map(function (s) {
      var prefixHtml = s.prefix ? '<span class="pal-stat-prefix">' + esc(s.prefix) + '</span>' : ''
      var suffix = s.suffix ? esc(s.suffix) : ''
      return '<div class="pal-stat">' +
        '<span class="pal-stat-n">' + prefixHtml + esc(s.n) + suffix + '</span>' +
        '<span class="pal-stat-l">' + esc(s.l) + '</span>' +
      '</div>'
    }).join('')
  }

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

  /* ── Détecte si un chemin d'image ressemble à un scan d'article de presse ── */
  /*    Filet de sécurité : si un scan d'article est rangé par erreur dans `images[]`,
        on le bascule automatiquement vers `presse[]` pour éviter de l'afficher en hero. */
  function isLikelyArticle(src) {
    if (!src) return false
    var s = String(src).toLowerCase()
    // Règle 1 (forte) : fichier rangé dans /presse/ = article
    if (s.indexOf('/presse/') >= 0) return true
    // Règle 2 : si déjà dans /annees/, c'est une photo — respecter le classement manuel
    if (s.indexOf('/annees/') >= 0) return false
    // Règle 3 : patterns de noms de magazines/articles (pour chemins libres)
    return /(^|[/_-])(article|articles|presse|echappement|marseillaise|bitume|busines|bitume|decathlonien)(s|e|es)?([/_\.-]|$)/.test(s)
  }

  /* ── Partitionne images[] en vraies photos vs articles détectés ── */
  function splitImages(e) {
    var imgs = (e.images || []).slice()
    var presse = (e.presse || []).slice()
    var realImgs = []
    imgs.forEach(function (src) {
      if (isLikelyArticle(src)) {
        if (presse.indexOf(src) < 0) presse.push(src)
      } else {
        realImgs.push(src)
      }
    })
    return { images: realImgs, presse: presse }
  }

  /* ═══ BUILD : single year card (slide "heavy") ════════════ */
  function buildYearCardHTML(e, rencontres, slideIndex, totalSlides) {
    var isHL = e.highlight === true
    var catLabel = CAT_LABELS[e.categorie] || e.categorie || '—'
    var collHeroId = 'y' + e.annee + '-img'
    var collPresseId = 'y' + e.annee + '-presse'
    var collCarouselId = 'y' + e.annee + '-car'

    // Appliquer le filet de sécurité articles/photos
    var sp = splitImages(e)
    var cleanImages = sp.images
    var cleanPresse = sp.presse

    /* ── Hero (1re image PHOTO — jamais un article) : va dans la sidebar sous la date ── */
    var heroSide = ''
    var carousel = ''
    if (cleanImages && cleanImages.length) {
      lbCollections[collHeroId] = cleanImages.map(function (src) {
        return { src: src, caption: e.annee + ' — ' + (e.titre || '') }
      })
      heroSide = '<div class="pal-year-hero" onclick="openLightbox(\'' + collHeroId + '\', 0)">' +
        '<img src="' + esc(cleanImages[0]) + '" alt="' + esc(e.annee + ' — ' + e.titre) + '" loading="lazy">' +
        '<span class="pal-hero-badge">◉ Voir</span>' +
      '</div>'

      /* Carousel : les AUTRES images (slice(1)) si 2+ */
      if (cleanImages.length > 1) {
        var carImgs = cleanImages.slice(1)
        lbCollections[collCarouselId] = carImgs.map(function (src, i) {
          return { src: src, caption: e.annee + ' — Photo ' + (i + 2) + '/' + cleanImages.length }
        })
        carousel = '<div class="pal-carousel" data-id="' + collCarouselId + '" data-auto="' + CAROUSEL_AUTOPLAY_MS + '">' +
          '<div class="pal-carousel-track">' +
            carImgs.map(function (src, i) {
              return '<div class="pal-carousel-slide" onclick="openLightbox(\'' + collCarouselId + '\',' + i + ')">' +
                '<img src="' + esc(src) + '" alt="' + esc(e.annee + ' — photo ' + (i + 2)) + '" loading="lazy">' +
              '</div>'
            }).join('') +
          '</div>' +
          (carImgs.length > 1 ? (
            '<button class="pal-carousel-btn pal-carousel-prev" aria-label="Précédent">‹</button>' +
            '<button class="pal-carousel-btn pal-carousel-next" aria-label="Suivant">›</button>' +
            '<div class="pal-carousel-dots">' +
              carImgs.map(function (_, i) {
                return '<button class="pal-carousel-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"></button>'
              }).join('') +
            '</div>'
          ) : '') +
        '</div>'
      }
    }

    /* ── Banderole caption (voiture / circuits / équipiers / adversaires) ── */
    var bandParts = []
    if (e.voiture)                                 bandParts.push('<span class="pal-band-lbl">Voiture</span><span class="pal-band-val">' + esc(e.voiture) + '</span>')
    if (e.circuits && e.circuits.length)           bandParts.push('<span class="pal-band-lbl">' + (e.circuits.length > 1 ? 'Circuits' : 'Circuit') + '</span><span class="pal-band-val">' + esc(e.circuits.slice(0, 3).join(' · ') + (e.circuits.length > 3 ? ' …' : '')) + '</span>')
    if (e.coequipiers && e.coequipiers.length)     bandParts.push('<span class="pal-band-lbl">' + (e.coequipiers.length > 1 ? 'Coéquipiers' : 'Coéquipier') + '</span><span class="pal-band-val">' + esc(e.coequipiers.join(' · ')) + '</span>')
    if (e.adversaires && e.adversaires.length)     bandParts.push('<span class="pal-band-lbl">' + (e.adversaires.length > 1 ? 'Adversaires' : 'Adversaire') + '</span><span class="pal-band-val">' + esc(e.adversaires.join(' · ')) + '</span>')
    var banderole = bandParts.length ? '<div class="pal-band">' + bandParts.join('<span class="pal-band-sep">·</span>') + '</div>' : ''

    /* ── Articles presse : grille compacte, clic = lightbox ── */
    var presseGrid = ''
    if (cleanPresse && cleanPresse.length) {
      lbCollections[collPresseId] = cleanPresse.map(function (src, idx) {
        return { src: src, caption: e.annee + ' · Article ' + (idx + 1) + '/' + cleanPresse.length }
      })
      var maxShown = Math.min(cleanPresse.length, 8)  // max 8 vignettes pour tenir dans 100vh
      var pressCols = symGridCols(maxShown)           // colonnes calculées pour rangées symétriques
      presseGrid = '<div class="pal-pressrow">' +
        '<div class="pal-pressrow-label">📰 ' + cleanPresse.length + ' article' + (cleanPresse.length > 1 ? 's' : '') + ' de presse</div>' +
        '<div class="pal-pressrow-grid" style="grid-template-columns: repeat(' + pressCols + ', 1fr);">' +
          cleanPresse.slice(0, maxShown).map(function (src, i) {
            var isMore = (i === maxShown - 1 && cleanPresse.length > maxShown)
            return '<div class="pal-pressrow-item' + (isMore ? ' pal-pressrow-item--more' : '') + '" onclick="openLightbox(\'' + collPresseId + '\',' + i + ')">' +
              '<img src="' + esc(src) + '" alt="Article presse ' + esc(e.annee) + '" loading="lazy">' +
              (isMore ? '<div class="pal-pressrow-more">+' + (cleanPresse.length - maxShown + 1) + '</div>' : '') +
            '</div>'
          }).join('') +
        '</div>' +
      '</div>'
    }

    /* ── Vidéos YouTube de l'année (rattachées par millésime) ── */
    var videosBlock = ''
    if (e.videos && e.videos.length) {
      videosBlock = '<div class="pal-videos">' +
        '<div class="pal-videos-label">▶ ' + e.videos.length + ' vidéo' + (e.videos.length > 1 ? 's' : '') + ' · YouTube</div>' +
        '<div class="pal-videos-grid">' +
        e.videos.map(function (v) {
          var id = (typeof v === 'string') ? v : v.id
          var title = (typeof v === 'string') ? '' : (v.titre || '')
          return '<a class="pal-video-item" href="https://www.youtube.com/watch?v=' + esc(id) + '" target="_blank" rel="noopener" title="' + esc(title) + '">' +
            '<img src="https://i.ytimg.com/vi/' + esc(id) + '/hqdefault.jpg" alt="' + esc(title) + '" loading="lazy">' +
            '<div class="pal-video-play">▶</div>' +
            (title ? '<div class="pal-video-title">' + esc(title) + '</div>' : '') +
          '</a>'
        }).join('') +
        '</div>' +
      '</div>'
    }

    var rencsYear = (rencontres || []).filter(function (r) { return r.annee === e.annee })
    var rencsHTML = ''
    if (rencsYear.length) {
      rencsHTML = '<div class="pal-year-rencs">' +
        rencsYear.map(function (r) {
          return '<span class="pal-year-renc">🤝 ' + esc(r.nom) + ' · <em>' + esc(r.discipline) + '</em></span>'
        }).join('') +
      '</div>'
    }

    return '<article class="pal-year pal-year--heavy' + (isHL ? ' pal-year--highlight' : '') + '" data-year="' + e.annee + '" data-cat="' + esc(e.categorie) + '">' +
      '<div class="pal-year-inner">' +
        '<aside class="pal-year-side">' +
          '<div class="pal-year-num">' + esc(e.annee) + '</div>' +
          '<div class="pal-year-cat">' + esc(catLabel) + '</div>' +
          (isHL ? '<div class="pal-year-star">★ Titre</div>' : '') +
          heroSide +
          '<div class="pal-year-count">' + slideIndex + ' / ' + totalSlides + '</div>' +
        '</aside>' +
        '<div class="pal-year-main">' +
          '<h3 class="pal-year-titre">' + esc(e.titre || '') + '</h3>' +
          (e.detail ? '<p class="pal-year-detail">' + esc(e.detail) + '</p>' : '') +
          carousel +
          banderole +
          videosBlock +
          rencsHTML +
          presseGrid +
        '</div>' +
      '</div>' +
    '</article>'
  }

  /* ═══ BUILD : packed (slide avec plusieurs années sparses) ═ */
  function buildPackedCardHTML(years, slideIndex, totalSlides) {
    var cards = years.map(function (e) {
      var isHL = e.highlight === true
      var catLabel = CAT_LABELS[e.categorie] || e.categorie || '—'
      var metaBits = []
      if (e.voiture) metaBits.push('<span><b>Voiture</b> ' + esc(e.voiture) + '</span>')
      if (e.circuits && e.circuits.length) metaBits.push('<span><b>' + (e.circuits.length > 1 ? 'Circuits' : 'Circuit') + '</b> ' + esc(e.circuits.slice(0, 2).join(' · ')) + (e.circuits.length > 2 ? ' …' : '') + '</span>')
      var meta = metaBits.length ? '<div class="pal-packed-meta">' + metaBits.join('') + '</div>' : ''

      return '<div class="pal-packed-card' + (isHL ? ' pal-packed-card--highlight' : '') + '" data-cat="' + esc(e.categorie) + '" data-year="' + e.annee + '">' +
        '<div class="pal-packed-head">' +
          '<span class="pal-packed-year">' + esc(e.annee) + '</span>' +
          '<span class="pal-packed-cat">' + esc(catLabel) + '</span>' +
          (isHL ? '<span class="pal-packed-star">★</span>' : '') +
        '</div>' +
        '<h3 class="pal-packed-titre">' + esc(e.titre || '') + '</h3>' +
        (e.detail ? '<p class="pal-packed-detail">' + esc(e.detail) + '</p>' : '') +
        meta +
      '</div>'
    }).join('')

    return '<article class="pal-year pal-year--packed" data-slide="' + slideIndex + '">' +
      '<div class="pal-packed-wrap">' +
        '<div class="pal-packed-head-big">' +
          '<span class="pal-packed-range">' + esc(years[0].annee) + (years.length > 1 ? ' — ' + esc(years[years.length - 1].annee) : '') + '</span>' +
          '<span class="pal-packed-label">' + years.length + ' année' + (years.length > 1 ? 's' : '') + '</span>' +
          '<span class="pal-packed-count">' + slideIndex + ' / ' + totalSlides + '</span>' +
        '</div>' +
        '<div class="pal-packed-grid pal-packed-grid--' + years.length + '">' +
          cards +
        '</div>' +
      '</div>' +
    '</article>'
  }

  /* ═══ TIMELINE ═════════════════════════════════════════════ */
  function renderTimeline() {
    var container = document.getElementById('palmares-timeline')
    if (!container) return

    var data = window.JBEMERIC_DATA
    if (!data || !data.palmares) {
      container.innerHTML = '<div class="pal-loading">Données non disponibles.</div>'
      return
    }

    var rencontres = data.rencontres || []
    var entries = data.palmares.slice()
      .filter(function (e) { return yearHasContent(e, rencontres) })
      .sort(function (a, b) { return a.annee - b.annee })

    var slides = packYears(entries)
    var total = slides.length

    container.innerHTML = slides.map(function (slide, i) {
      var idx = i + 1
      if (slide.heavy || slide.years.length === 1) {
        return buildYearCardHTML(slide.years[0], rencontres, idx, total)
      }
      return buildPackedCardHTML(slide.years, idx, total)
    }).join('')

    initCarousels()
  }

  /* ═══ CAROUSELS : autoplay + navigation ═══════════════════ */
  function initCarousels() {
    // Clean timers
    Object.keys(carouselTimers).forEach(function (k) { clearInterval(carouselTimers[k]) })
    carouselTimers = {}

    var carousels = document.querySelectorAll('.pal-carousel')
    carousels.forEach(function (car) {
      var track = car.querySelector('.pal-carousel-track')
      var slides = car.querySelectorAll('.pal-carousel-slide')
      var dots = car.querySelectorAll('.pal-carousel-dot')
      var prevBtn = car.querySelector('.pal-carousel-prev')
      var nextBtn = car.querySelector('.pal-carousel-next')
      if (!track || !slides.length) return
      var auto = parseInt(car.getAttribute('data-auto'), 10) || CAROUSEL_AUTOPLAY_MS
      var idx = 0
      var n = slides.length
      var isHovering = false

      // ── FIX BUG SCROLL : scrollTo horizontal direct, sans toucher l'axe vertical ──
      function goTo(i) {
        idx = (i + n) % n
        // Quand on arrive à la dernière photo → marquer cycle complet (pour autoplay vertical)
        if (idx === n - 1) { car._palCycleComplete = true }
        track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' })
        dots.forEach(function (d, di) { d.classList.toggle('active', di === idx) })
      }

      // Reset du flag cycle à chaque nouvelle slide (appelé par initTimelineAutoplay)
      car._palCycleComplete = false
      car._palN = n

      if (prevBtn) prevBtn.addEventListener('click', function () {
        lastUserInteraction = Date.now()
        goTo(idx - 1); restartTimer()
      })
      if (nextBtn) nextBtn.addEventListener('click', function () {
        lastUserInteraction = Date.now()
        goTo(idx + 1); restartTimer()
      })
      dots.forEach(function (d) {
        d.addEventListener('click', function () {
          lastUserInteraction = Date.now()
          goTo(parseInt(d.getAttribute('data-i'), 10) || 0); restartTimer()
        })
      })

      // Sync dots on manual scroll — ne PAS toucher lastUserInteraction ici
      // (ce listener se déclenche aussi sur scrollTo programmatique → faux positifs qui
      //  empêchaient l'autoplay vertical de repartir). L'interaction utilisateur réelle
      //  est déjà captée au niveau document via wheel/touchstart/keydown/mousedown.
      var scrollTimer = null
      track.addEventListener('scroll', function () {
        if (scrollTimer) clearTimeout(scrollTimer)
        scrollTimer = setTimeout(function () {
          var tw = track.clientWidth
          var best = Math.round(track.scrollLeft / tw)
          if (best !== idx) {
            idx = Math.max(0, Math.min(n - 1, best))
            dots.forEach(function (d, di) { d.classList.toggle('active', di === idx) })
          }
        }, 100)
      })

      // Pause autoplay on hover
      car.addEventListener('mouseenter', function () { isHovering = true })
      car.addEventListener('mouseleave', function () { isHovering = false })

      var timerId = 'c-' + Math.random().toString(36).substr(2, 8)
      function tick() {
        if (isHovering) return
        if (Date.now() - lastUserInteraction < USER_IDLE_MS) return
        // Pause si un lightbox est ouvert
        var lb = document.getElementById('pal-lightbox')
        if (lb && lb.classList.contains('open')) return
        goTo(idx + 1)
      }
      function restartTimer() {
        if (carouselTimers[timerId]) clearInterval(carouselTimers[timerId])
        carouselTimers[timerId] = setInterval(tick, auto)
      }
      carouselTimers[timerId] = setInterval(tick, auto)
    })
  }

  /* ═══ TIMELINE AUTOPLAY VERTICAL ══════════════════════════ */
  /*
   * Avance automatiquement d'une slide à l'autre.
   * Règles :
   *   - Si la slide a un carousel : attend que la dernière photo ait été montrée
   *     (car._palCycleComplete = true) avant de passer à la suivante.
   *   - Si pas de carousel : attend TIMELINE_DEFAULT_MS.
   *   - Toute interaction user (molette, touch, clavier, clic) met en pause USER_IDLE_MS.
   *   - Ne scrolle pas si lightbox ouvert.
   */
  function initTimelineAutoplay() {
    // Écouter les interactions user pour pause
    ;['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        lastUserInteraction = Date.now()
        clearTimeout(timelineAutoplayTimer)
        timelineAutoplayTimer = null
      }, { passive: true, capture: true })
    })

    // Observer : détecter quelle slide est active (>60% visible)
    if (timelineObserver) timelineObserver.disconnect()
    timelineObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          var slide = entry.target
          // Réinitialiser le flag cycle du carousel de cette slide
          var car = slide.querySelector('.pal-carousel')
          if (car) { car._palCycleComplete = false }
          scheduleTimelineAdvance(slide)
        }
      })
    }, { threshold: 0.6 })

    document.querySelectorAll('.pal-year:not(.hidden)').forEach(function (s) {
      timelineObserver.observe(s)
    })
  }

  function scheduleTimelineAdvance(slide) {
    clearTimeout(timelineAutoplayTimer)
    timelineAutoplayTimer = null

    var car = slide.querySelector('.pal-carousel')

    // Helper : temps à attendre pour que l'idle utilisateur expire
    function idleRemaining() {
      return Math.max(0, USER_IDLE_MS - (Date.now() - lastUserInteraction))
    }

    if (car && car._palN > 1) {
      // Attendre que le carousel ait montré sa dernière photo
      var started = Date.now()
      function pollCarousel() {
        // Lightbox ouvert → re-polling dans 1s (pas d'abandon définitif)
        var lb = document.getElementById('pal-lightbox')
        if (lb && lb.classList.contains('open')) {
          timelineAutoplayTimer = setTimeout(pollCarousel, 1000)
          return
        }
        if (car._palCycleComplete) {
          // Carousel terminé → attendre la fin de l'idle user, puis avancer
          var wait = Math.max(800, idleRemaining() + 200)
          timelineAutoplayTimer = setTimeout(function () {
            tryAdvance(slide)
          }, wait)
          return
        }
        if (Date.now() - started > 120000) return // sécurité 2min max
        timelineAutoplayTimer = setTimeout(pollCarousel, 400)
      }
      timelineAutoplayTimer = setTimeout(pollCarousel, 400)
    } else {
      // Pas de carousel : on attend le délai par défaut, augmenté si l'user vient d'interagir
      var wait = Math.max(TIMELINE_DEFAULT_MS, idleRemaining() + 500)
      timelineAutoplayTimer = setTimeout(function () {
        tryAdvance(slide)
      }, wait)
    }
  }

  // Tente d'avancer ; si l'user vient d'interagir, re-schedule plutôt qu'abandonner
  function tryAdvance(slide) {
    var lb = document.getElementById('pal-lightbox')
    if (lb && lb.classList.contains('open')) {
      timelineAutoplayTimer = setTimeout(function () { tryAdvance(slide) }, 1500)
      return
    }
    if (Date.now() - lastUserInteraction < USER_IDLE_MS) {
      var wait = USER_IDLE_MS - (Date.now() - lastUserInteraction) + 300
      timelineAutoplayTimer = setTimeout(function () { tryAdvance(slide) }, wait)
      return
    }
    doAdvanceSlide(slide)
  }

  function doAdvanceSlide(slide) {
    var all = Array.from(document.querySelectorAll('.pal-year:not(.hidden)'))
    var i = all.indexOf(slide)
    if (i >= 0 && i < all.length - 1) {
      all[i + 1].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  /* ═══ VOITURES CARRIÈRE ════════════════════════════════════ */
  /*
   * Matching intelligent photo ↔ voiture :
   *   1. On rejette les scans d'article (isLikelyArticle).
   *   2. On rejette les photos "contexte" (podium, portrait, pilote, livre, sponsors, feu,
   *      plaque 4x3, etc.) — ce ne sont PAS des photos de voiture.
   *   3. On détecte le "brand claim" du filename : si le nom du fichier identifie une
   *      marque/modèle, et que la voiture n'a aucun rapport avec ce claim (ni directement,
   *      ni via alias), on applique un gros malus (anti-confusion).
   *   4. On boost fortement les filenames qui contiennent un token de la marque/modèle
   *      de la voiture (incluant les abréviations courtes FF/FR/F3/RS si pertinentes).
   *   5. Seuil final : on refuse toute photo qui ne contient AUCUN signal marque pertinent.
   */
  var NON_CAR_RE = /podium|portrait|pilote|\bbook\b|vainqueur|sponsors|4x3|\bfeu\b|en-feu|paddock|yvan-muller|merzario|vigeant|\bdepart\b|\bbriefing\b/
  var CAR_TOKEN_RE = /(proto|spider|camaro|viper|hommell|barquette|caterham|mitjet|norma|hydra|reynard|rondeau|triumph|alfa|f3000|fr2000|\bf3\b|\bff\b|\bfr\b|ferrari|civic|lotus|fun-cup|funcup|porsche|bmw|honda|peugeot|206|325i|nissan|rallycircuit|martini|karting|kart|lamborghini|renault|van-diemen|vandiemen|mercedes|corvette)/

  // Brands/models distinctifs : si présents dans le filename, la photo EST de cette marque
  var BRAND_RE = /(triumph|camaro|spider|viper|hommell|porsche|ferrari|peugeot|honda|civic|bmw|325i|nissan|lamborghini|caterham|mitjet|norma|hydra|reynard|rondeau|barquette|chrysler|martini|alfa|karting|kart|fun-cup|funcup|van-diemen|vandiemen|corvette|lotus|145|964|206|905|f3000|fr2000|rallycircuit|mercedes)/g

  // Aliases voiture ↔ tokens image. Bidirectionnel pour les abréviations courantes.
  // Ex : "FF" dans le nom de voiture équivaut à "ford" ou "formule" dans le filename.
  var CAR_ALIASES = {
    'ff':      ['ff', 'ford', 'formule'],
    'fr':      ['fr', 'renault', 'formule'],
    'f3':      ['f3', 'formule'],
    'f3000':   ['f3000', 'formule'],
    'fr2000':  ['fr2000', 'renault', 'formule'],
    'ford':    ['ford', 'ff', 'formule'],
    'renault': ['renault', 'fr', 'formule'],
    '145':     ['145', 'alfa'],
    '964':     ['964', 'porsche'],
    '325i':    ['325i', 'bmw'],
    '206':     ['206', 'peugeot'],
    '905':     ['905', 'spider', 'peugeot'],
    'norma':   ['norma', 'proto'],
    'hydra':   ['hydra', 'proto'],
    'hommell': ['hommell', 'barquette'],
    'prototype': ['prototype', 'proto'],
    'vhrs':    ['vhrs', 'rallycircuit']
  }

  // Tokens courts (2 chars) admis dans carBrandTokens : indispensables pour FF/FR/F3
  var KNOWN_SHORT_TOKENS = ['ff', 'fr', 'f3', 'rs']

  function carBrandTokens(carName) {
    // Nettoyage : · / \ ( ) virgules et autres → espaces pour split propre
    var raw = String(carName || '').toLowerCase()
      .replace(/[·\/\\()\[\],]/g, ' ')
      .split(/[\s\-_]+/)
    var result = []
    raw.forEach(function (t) {
      if (!t) return
      if (/^(de|la|le|du|des|les|et|ou|avec|sur|gt|ht|mk|sr)$/.test(t)) return
      if (t.length < 3) {
        if (KNOWN_SHORT_TOKENS.indexOf(t) >= 0) result.push(t)
        return
      }
      result.push(t)
    })
    // Expansion via aliases
    var expanded = result.slice()
    result.forEach(function (t) {
      if (CAR_ALIASES[t]) {
        CAR_ALIASES[t].forEach(function (a) {
          if (expanded.indexOf(a) < 0) expanded.push(a)
        })
      }
    })
    return expanded
  }

  // Extrait les marques/modèles distinctifs revendiqués par le filename.
  function filenameBrands(s) {
    var matches = s.match(BRAND_RE) || []
    var set = {}
    matches.forEach(function (m) { set[m] = true })
    return Object.keys(set)
  }

  // Vrai ssi la marque extraite du filename correspond à la voiture (directement ou via alias).
  function carMatchesBrand(carTokens, brand) {
    // Match direct
    if (carTokens.indexOf(brand) >= 0) return true
    // Match par alias bidirectionnel
    var aliases = CAR_ALIASES[brand]
    if (aliases) {
      for (var i = 0; i < aliases.length; i++) {
        if (carTokens.indexOf(aliases[i]) >= 0) return true
      }
    }
    // Si l'un des tokens de la voiture a 'brand' dans ses aliases, match aussi
    for (var j = 0; j < carTokens.length; j++) {
      var tokAli = CAR_ALIASES[carTokens[j]]
      if (tokAli && tokAli.indexOf(brand) >= 0) return true
    }
    // Fallback pour marques multi-parties (ex: "fun-cup" → ["fun","cup"])
    // Match si TOUTES les parties sont dans les tokens de la voiture
    if (brand.indexOf('-') >= 0) {
      var parts = brand.split('-')
      var allIn = true
      for (var k = 0; k < parts.length; k++) {
        if (carTokens.indexOf(parts[k]) < 0) { allIn = false; break }
      }
      if (allIn) return true
    }
    return false
  }

  function scorePhotoForCar(src, carName) {
    if (!src) return -Infinity
    var s = String(src).toLowerCase()
    // Un scan d'article n'est jamais une photo de voiture
    if (isLikelyArticle(s)) return -Infinity

    var tokens = carBrandTokens(carName)
    var score = 0

    // Photos "contexte" (non-voiture) : fort malus mais pas éliminatoire
    if (NON_CAR_RE.test(s)) score -= 40
    // Tokens véhicule génériques : léger boost
    if (CAR_TOKEN_RE.test(s)) score += 20

    // Détection conflit de marque : si le filename revendique une marque
    // et qu'AUCUNE de ces marques ne correspond à la voiture → gros malus.
    var fileBrands = filenameBrands(s)
    if (fileBrands.length > 0) {
      var hasMatching = false
      for (var k = 0; k < fileBrands.length; k++) {
        if (carMatchesBrand(tokens, fileBrands[k])) { hasMatching = true; break }
      }
      if (!hasMatching) score -= 80
      else score += 10  // bonus léger : au moins une marque correspond
    }

    // Match par token de voiture : très fort boost (cumulable si plusieurs tokens hit)
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].length >= 3 && s.indexOf(tokens[i]) >= 0) score += 60
      else if (tokens[i].length === 2) {
        // Short tokens : match strict avec bordures (-xx- ou début/fin)
        var short = tokens[i]
        var re = new RegExp('(^|[^a-z0-9])' + short + '([^a-z0-9]|$)')
        if (re.test(s)) score += 60
      }
    }
    return score
  }

  function bestPhotoForCar(entry, carName) {
    if (!entry.images || !entry.images.length) return null
    var best = null
    var bestScore = -Infinity
    for (var i = 0; i < entry.images.length; i++) {
      var sc = scorePhotoForCar(entry.images[i], carName)
      if (sc > bestScore) { bestScore = sc; best = entry.images[i] }
    }
    // Seuil final : on exige au moins un match marque (score ≥ 60 après bonus/malus)
    if (bestScore < 40) return null
    return best
  }

  function renderVoituresCarriere() {
    var el = document.getElementById('pal-voitures')
    if (!el) return
    var data = window.JBEMERIC_DATA
    if (!data || !data.palmares) return

    var carMap = {}
    data.palmares.forEach(function (e) {
      if (!e.voiture) return
      var cars = e.voiture.split(/\s*·\s*/)
      cars.forEach(function (c) {
        var key = c.trim()
        if (!key) return
        if (!carMap[key]) {
          carMap[key] = { nom: key, annees: [], categorie: e.categorie, image: null, imageScore: -Infinity }
        }
        carMap[key].annees.push(e.annee)
        // Score la photo de CETTE entrée pour CETTE voiture, et garde la meilleure globale
        if (e.images && e.images.length) {
          for (var j = 0; j < e.images.length; j++) {
            var sc = scorePhotoForCar(e.images[j], key)
            // Seuil ≥ 40 : exige au moins un match de marque/modèle, pas juste CAR_TOKEN
            if (sc > carMap[key].imageScore && sc >= 40) {
              carMap[key].imageScore = sc
              carMap[key].image = e.images[j]
            }
          }
        }
      })
    })

    var cars = Object.keys(carMap).map(function (k) { return carMap[k] })
    // Exclut les voitures sans photo valide — fini les tuiles vides qui polluent la grille
    cars = cars.filter(function (c) { return !!c.image })
    cars.sort(function (a, b) { return Math.min.apply(null, a.annees) - Math.min.apply(null, b.annees) })

    el.innerHTML = cars.map(function (c) {
      var min = Math.min.apply(null, c.annees)
      var max = Math.max.apply(null, c.annees)
      var range = min === max ? String(min) : (min + '–' + max)
      var catLabel = CAT_LABELS[c.categorie] || c.categorie || ''
      var imgHTML = '<div class="pal-voit-img"><img src="' + esc(c.image) + '" alt="' + esc(c.nom) + '" loading="lazy" onerror="this.parentElement.classList.add(\'pal-voit-img--noimg\');this.remove()"></div>'
      return '<div class="pal-voit">' +
        imgHTML +
        '<div class="pal-voit-body">' +
          '<div class="pal-voit-annee">' + esc(range) + '</div>' +
          '<h4 class="pal-voit-nom">' + esc(c.nom) + '</h4>' +
          '<div class="pal-voit-cat">' + esc(catLabel) + '</div>' +
        '</div>' +
      '</div>'
    }).join('')
  }

  /* ═══ MUR DE PRESSE GLOBAL ═════════════════════════════════ */
  function renderMurPresse() {
    var el = document.getElementById('pal-mur-presse')
    if (!el) return
    var data = window.JBEMERIC_DATA
    if (!data || !data.palmares) return

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

    lbCollections['mur-presse'] = allPresse.map(function (p, i) {
      return { src: p.src, caption: p.annee + ' · Article ' + (i + 1) + '/' + allPresse.length }
    })

    el.innerHTML = allPresse.map(function (p, i) {
      return '<div class="pal-mur-item" onclick="openLightbox(\'mur-presse\',' + i + ')">' +
        '<img src="' + esc(p.src) + '" alt="Presse ' + esc(p.annee) + '" loading="lazy">' +
      '</div>'
    }).join('')
  }

  /* ═══ SPONSORS ═════════════════════════════════════════════ */
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

  /* ═══ FILTRES ══════════════════════════════════════════════ */
  function filterPalmares(cat, btn) {
    var btns = document.querySelectorAll('.pal-filtre')
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active')
    if (btn) btn.classList.add('active')
    // Heavy years : match data-cat direct
    var items = document.querySelectorAll('.pal-year')
    for (var j = 0; j < items.length; j++) {
      var item = items[j]
      if (item.classList.contains('pal-year--packed')) {
        // Slide packed : visible si au moins une card correspond
        if (cat === 'all') {
          item.classList.remove('hidden')
          var cards = item.querySelectorAll('.pal-packed-card')
          cards.forEach(function (c) { c.classList.remove('hidden') })
        } else {
          var matching = item.querySelectorAll('.pal-packed-card[data-cat="' + cat + '"]')
          var cardsAll = item.querySelectorAll('.pal-packed-card')
          if (matching.length) {
            item.classList.remove('hidden')
            cardsAll.forEach(function (c) {
              c.classList.toggle('hidden', c.getAttribute('data-cat') !== cat)
            })
          } else {
            item.classList.add('hidden')
          }
        }
      } else {
        if (cat === 'all' || item.getAttribute('data-cat') === cat) {
          item.classList.remove('hidden')
        } else {
          item.classList.add('hidden')
        }
      }
    }
    var p = document.getElementById('pal-filtres-panel')
    if (p) p.classList.remove('open')
  }

  function toggleFiltresPanel() {
    var p = document.getElementById('pal-filtres-panel')
    if (p) p.classList.toggle('open')
  }

  /* ═══ LIGHTBOX MAGAZINE ════════════════════════════════════ */
  function updateLightbox() {
    var coll = lbCollections[lbState.id]
    if (!coll || !coll.length) return
    var cur = coll[lbState.index]
    var img = document.getElementById('pal-lightbox-img')
    var cap = document.getElementById('pal-lightbox-caption')
    var counter = document.getElementById('pal-lightbox-counter')
    var prev = document.getElementById('pal-lightbox-prev')
    var next = document.getElementById('pal-lightbox-next')
    if (img) {
      img.src = cur.src
      img.style.transform = 'scale(' + lbState.zoom + ')'
      img.style.cursor = lbState.zoom === 1 ? 'zoom-in' : 'zoom-out'
    }
    if (cap)     cap.textContent = cur.caption || ''
    if (counter) counter.textContent = (lbState.index + 1) + ' / ' + coll.length
    if (prev) prev.style.display = coll.length > 1 ? '' : 'none'
    if (next) next.style.display = coll.length > 1 ? '' : 'none'
  }

  function openLightbox(collectionId, index) {
    if (typeof collectionId === 'string' && (collectionId.indexOf('/') >= 0 || /\.(jpg|jpeg|png|webp|gif)$/i.test(collectionId))) {
      lbCollections['__single__'] = [{ src: collectionId, caption: '' }]
      collectionId = '__single__'
      index = 0
    }
    if (!lbCollections[collectionId]) return
    lbState = { id: collectionId, index: index || 0, zoom: 1 }
    updateLightbox()
    var lb = document.getElementById('pal-lightbox')
    if (lb) lb.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    var lb = document.getElementById('pal-lightbox')
    if (!lb) return
    lb.classList.remove('open')
    document.body.style.overflow = ''
    lbState.zoom = 1
  }

  function nextLightbox() {
    var coll = lbCollections[lbState.id]
    if (!coll || coll.length <= 1) return
    lbState.index = (lbState.index + 1) % coll.length
    lbState.zoom = 1
    updateLightbox()
  }

  function prevLightbox() {
    var coll = lbCollections[lbState.id]
    if (!coll || coll.length <= 1) return
    lbState.index = (lbState.index - 1 + coll.length) % coll.length
    lbState.zoom = 1
    updateLightbox()
  }

  function toggleZoom() {
    lbState.zoom = lbState.zoom === 1 ? 2 : 1
    var img = document.getElementById('pal-lightbox-img')
    if (img) {
      img.style.transform = 'scale(' + lbState.zoom + ')'
      img.style.cursor = lbState.zoom === 1 ? 'zoom-in' : 'zoom-out'
    }
  }

  /* ═══ KEYBOARD ═════════════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    var lb = document.getElementById('pal-lightbox')
    if (lb && lb.classList.contains('open')) {
      if (e.key === 'Escape')      { closeLightbox();  e.preventDefault() }
      else if (e.key === 'ArrowRight') { nextLightbox(); e.preventDefault() }
      else if (e.key === 'ArrowLeft')  { prevLightbox(); e.preventDefault() }
    }
  })

  /* ═══ Exposition globale ═══════════════════════════════════ */
  window.filterPalmares     = filterPalmares
  window.toggleFiltresPanel = toggleFiltresPanel
  window.openLightbox       = openLightbox
  window.closeLightbox      = closeLightbox
  window.nextLightbox       = nextLightbox
  window.prevLightbox       = prevLightbox
  window.toggleZoom         = toggleZoom

  /* ═══ INIT ═════════════════════════════════════════════════ */
  function init() {
    renderHeroStats()
    renderIntro()
    renderTimeline()       // inclut initCarousels()
    initTimelineAutoplay() // autoplay vertical, attend après les carousels
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
