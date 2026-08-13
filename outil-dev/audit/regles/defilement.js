// Regle : blocs sautes par le scroll snap.
//
// snap.css declare « scroll-snap-type: y mandatory » sur html et body. Le
// navigateur s'arrete alors obligatoirement sur un point d'ancrage, c'est a
// dire sur un element portant « scroll-snap-align ». Dans ce projet, ce sont
// les .snap-section et #footer-root.
//
// Consequence : un bloc de premier niveau pose ENTRE deux points d'ancrage
// n'est jamais un point d'arret. Il est traverse d'un coup, sans que le
// defilement puisse s'y poser. Sur une page ou chaque section fait la hauteur
// de l'ecran, cela revient a ne jamais le montrer.
//
// Rencontre pour de vrai le 7 aout 2026 : un bloc d'avis ajoute entre
// .portes-citation-wrap et la derniere section n'apparaissait pas a l'ecran.
// Le HTML etait correct, le CSS aussi, chacun lu separement ne montrait rien.
// Seule une capture l'a revele.
//
// Le remede est toujours le meme : ranger le bloc DANS une section snap, en
// general la derniere, qui defile en interne grace a .snap-fin.

// Le snap ne compte que s'il est declare sur la racine, html ou body : c'est
// ce qui rend le document entier obligatoirement aimante. Une feuille peut
// parfaitement declarer « scroll-snap-type » sur un carrousel interne, comme
// palmares.css, sans que la page soit concernee. Chercher le mot seul, sans
// regarder sur quel selecteur, faisait inspecter la mauvaise page : l'audit
// annoncait alors « aucune faute » sur une page qu'il n'avait pas lue.
const SNAP_RACINE = /(^|\})\s*(html|body)\b[^{}]*\{[^{}]*scroll-snap-type/

function blocsDePremierNiveau(html) {
  // On ne lit que le corps, et seulement la profondeur 1 : un bloc imbrique
  // dans une snap-section est deja couvert par elle.
  const corps = html.slice(html.indexOf('<body'))
  const blocs = []
  let profondeur = 0
  const balise = /<(\/?)(div|section|main|footer|header|aside)\b([^>]*)>/g
  let m
  while ((m = balise.exec(corps))) {
    const fermante = m[1] === '/'
    const attributs = m[3] || ''
    const auto = /\/$/.test(attributs.trim())
    if (fermante) {
      profondeur--
      continue
    }
    if (profondeur === 0) blocs.push({ attributs, index: m.index })
    if (!auto) profondeur++
  }
  return blocs
}

module.exports = {
  id: 'defilement',
  titre: 'Blocs sautes par le scroll snap',
  reference: 'snap.css, constat du 7 aout 2026',

  executer(ctx) {
    const anomalies = []

    const feuillesSnap = ctx.css.filter(f => SNAP_RACINE.test(f.code)).map(f => f.chemin)
    if (!feuillesSnap.length) {
      return { anomalies, resume: 'aucune feuille n\'aimante le document' }
    }

    let inspectees = 0
    for (const p of ctx.pages) {
      // On passe par les feuilles reellement liees par la page, pas par une
      // recherche du nom de fichier dans le HTML.
      if (!p.feuilles.some(f => feuillesSnap.includes(f))) continue
      inspectees++

      const blocs = blocsDePremierNiveau(p.utile)
      // Un bloc est un point d'ancrage s'il porte snap-section, ou s'il est le
      // footer, ancre par #footer-root dans snap.css.
      const estAncre = b => /\bsnap-section\b/.test(b.attributs) || /id="footer-root"/.test(b.attributs)
      // La nav est hors du flux et n'a pas a etre une section.
      const estNav = b => /id="nav-root"/.test(b.attributs)

      const ancres = blocs.filter(estAncre)
      if (!ancres.length) continue   // page qui charge la feuille sans s'en servir

      const premiere = blocs.indexOf(ancres[0])
      const derniere = blocs.indexOf(ancres[ancres.length - 1])

      for (let i = premiere; i <= derniere; i++) {
        const b = blocs[i]
        if (estAncre(b) || estNav(b)) continue
        const classe = (b.attributs.match(/class="([^"]*)"/) || [, ''])[1].trim()
        const id = (b.attributs.match(/id="([^"]*)"/) || [, ''])[1].trim()
        const nom = id ? `#${id}` : classe ? `.${classe.split(/\s+/)[0]}` : 'un bloc sans nom'
        anomalies.push({
          niveau: 'faute',
          ou: p.chemin,
          quoi: `${nom} est pose entre deux points d'ancrage sans etre une snap-section : le defilement le saute, il ne s'affichera pas`,
        })
      }
    }

    return {
      anomalies,
      resume: inspectees ? `${inspectees} page(s) en scroll snap` : 'aucune page en scroll snap',
    }
  },
}
