// Regle : offres commerciales mortes, D-008.
//
// Le Challenge JB EMERIC et la BMW 325i HTCC n'existent plus. L'entreprise n'a
// plus de parc, et le site ne vend plus un produit mais un homme et sa methode,
// D-009. Une page qui promet encore une voiture de course a la cle promet
// quelque chose que personne ne peut livrer.
//
// La regle distingue quatre endroits, parce qu'ils ne coutent pas la meme
// chose. La distinction n'est pas theorique : la premiere version de cette
// regle traitait « alt="BMW 325i HTCC" » comme une promesse et signalait six
// fautes dont quatre n'en etaient pas. Une photo d'archive decrite fidelement
// ne vend rien.
//
//   prose lue par le visiteur   une promesse qu'on ne peut pas tenir. FAUTE.
//   commentaire de code         personne ne le lit sauf le suivant, qu'il egare.
//   nom de classe               invisible, revient par copier-coller.
//   attribut alt, src, content  description ou nom de fichier. A juger.
//
// D'ou la methode : on retire d'abord TOUTES les valeurs d'attributs de la
// ligne. Ce qui reste est ce que le visiteur lit vraiment. Une regle qui lit la
// ligne brute confond la vitrine et la plomberie.

const MOT = /\bchallenge\b/i
const VOITURE = /\b(325i|htcc)\b/i
const concerne = s => MOT.test(s) || VOITURE.test(s)

// Ce qui raconte la carriere de JB reste legitime : le palmares est un fait,
// pas une offre. La 325i a couru, on a le droit de le dire au passe.
const CONTEXTES_LEGITIMES = /palmares|palmarès|1988|archive|histoire/i

const sansAttributs = l => l.replace(/\s[a-zA-Z-]+="[^"]*"/g, '')

function lignes(source) {
  return source.split('\n')
}

module.exports = {
  id: 'offres-mortes',
  titre: 'Offres commerciales mortes',
  reference: 'D-008, D-009',

  executer(ctx) {
    const anomalies = []
    let occurrences = 0

    for (const p of ctx.pages) {
      // p.visible : sans le cache live-editor ET sans les commentaires. C'est
      // ce que le visiteur a reellement sous les yeux.
      const vu = lignes(p.visible)
      for (let i = 0; i < vu.length; i++) {
        const l = vu[i]
        if (!concerne(l)) continue
        if (CONTEXTES_LEGITIMES.test(l)) continue
        occurrences++

        if (concerne(sansAttributs(l))) {
          anomalies.push({
            niveau: 'faute',
            ou: p.chemin,
            quoi: `ligne ${i + 1} : offre morte dans la prose lue par le visiteur, « ${sansAttributs(l).trim().slice(0, 90)} »`,
          })
          continue
        }

        const alt = (l.match(/\salt="([^"]*)"/) || [])[1]
        if (alt && concerne(alt)) {
          anomalies.push({
            niveau: 'signal',
            ou: p.chemin,
            quoi: `ligne ${i + 1} : alt « ${alt} », description d'une photo d'archive, a juger`,
          })
          continue
        }

        const classe = (l.match(/\sclass="([^"]*)"/) || [])[1]
        if (classe && concerne(classe)) {
          anomalies.push({
            niveau: 'tache',
            ou: p.chemin,
            quoi: `ligne ${i + 1} : classe « ${classe} » nommee d'apres une offre morte`,
          })
          continue
        }

        anomalies.push({
          niveau: 'signal',
          ou: p.chemin,
          quoi: `ligne ${i + 1} : nom de fichier ou URL qui nomme une offre morte, renommer casse des liens donc a valider`,
        })
      }

      // Commentaires : la difference entre le HTML utile et le HTML visible.
      const commentaires = [...p.utile.matchAll(/<!--([\s\S]*?)-->/g)].map(m => m[1])
      for (const c of commentaires) {
        if (!concerne(c)) continue
        if (CONTEXTES_LEGITIMES.test(c)) continue
        occurrences++
        anomalies.push({
          niveau: 'tache',
          ou: p.chemin,
          quoi: `commentaire qui nomme une offre morte, « ${c.trim().slice(0, 70)} »`,
        })
      }
    }

    // Noms de classes : invisibles, mais c'est par la que ca revient. Le 6 aout
    // .porte.challenge a du etre renomme en .porte.competition sur l'Academie,
    // et la meme classe dort encore dans index.css.
    for (const f of ctx.css) {
      for (const m of f.code.matchAll(/\.([a-zA-Z][\w-]*)/g)) {
        if (!concerne(m[1])) continue
        occurrences++
        anomalies.push({
          niveau: 'tache',
          ou: f.chemin,
          quoi: `classe « .${m[1]} » nommee d'apres une offre morte`,
        })
        break   // une seule fois par feuille, sinon le rapport deborde
      }
    }

    return {
      anomalies,
      resume: occurrences ? `${occurrences} occurrence(s)` : 'aucune trace des offres mortes',
    }
  },
}
