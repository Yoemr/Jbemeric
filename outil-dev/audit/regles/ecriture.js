// Regle : interdits d'ecriture. Aujourd'hui le tiret cadratin, D-007.
//
// Le comptage distingue trois natures, parce qu'elles n'ont pas la meme
// gravite : ce que le visiteur lit, ce que seul un developpeur lit, et ce que
// JB a saisi lui-meme et qu'on ne reecrit pas.

// Ecrit par son code Unicode et non en clair : sans cela, ce fichier
// declencherait sa propre regle a chaque audit.
const CADRATIN = String.fromCharCode(0x2014)

function compter(texte) {
  return (texte.match(new RegExp(CADRATIN, 'g')) || []).length
}

module.exports = {
  id: 'ecriture',
  titre: 'Interdits d\'ecriture',
  reference: 'D-007, D-015',

  executer(ctx) {
    const anomalies = []
    let visible = 0, commentaires = 0, cache = 0

    for (const p of ctx.pages) {
      const v = compter(p.visible)
      const c = compter(p.utile) - v
      const k = compter(p.html) - compter(p.utile)
      visible += v; commentaires += c; cache += k
      if (v) anomalies.push({ niveau: 'faute', ou: p.chemin, quoi: `${v} cadratin(s) dans le texte visible` })
      if (c) anomalies.push({ niveau: 'tache', ou: p.chemin, quoi: `${c} cadratin(s) en commentaire` })
    }

    for (const f of [...ctx.css, ...ctx.js]) {
      const total = compter(f.source)
      const dansCode = compter(f.code)
      commentaires += total - dansCode
      if (dansCode) {
        visible += dansCode
        anomalies.push({ niveau: 'faute', ou: f.chemin, quoi: `${dansCode} cadratin(s) hors commentaire` })
      }
      if (total - dansCode) {
        anomalies.push({ niveau: 'tache', ou: f.chemin, quoi: `${total - dansCode} cadratin(s) en commentaire` })
      }
    }

    return {
      anomalies,
      resume: `texte visible ${visible}, commentaires ${commentaires}, cache live-editor ${cache} (non traitable, saisi par JB)`,
    }
  },
}
