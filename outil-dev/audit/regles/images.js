// Regle : honnetete de la bibliotheque d'images.
//
// Trouve le 7 aout 2026, en cherchant une photo pour un hero. Trois paires de
// fichiers sont strictement identiques, au bit pres, sous des noms differents :
//
//   lotus-circuit-du-luc.jpg   = peugeot-206-s16-ricard.jpg
//   bmw-325i-htcc.jpg          = jb-emeric-pilote.jpg
//   bmw-325i-htcc-cote.jpg     = porsche-gt3-circuit-albi.jpg
//
// Autrement dit, la meme photo est servie sous le nom que la page reclamait.
// Une « Lotus au circuit du Luc » qui est une Peugeot au Paul Ricard, une
// « Porsche GT3 a Albi » qui est une BMW. Le nom de fichier finit dans le alt
// et dans la legende, donc le site affirme des choses fausses.
//
// Le nom de fichier n'est pas une preuve du contenu, un audit ne peut pas voir
// ce qu'il y a sur une photo. Mais deux fichiers identiques sous deux noms qui
// se contredisent, ca, ca se mesure. C'est un signal, pas une faute : c'est a
// un humain de dire quel nom est le bon, et si la photo a le droit d'etre la.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4']

function lister(dossier, racine, trouves) {
  let entrees
  try { entrees = fs.readdirSync(dossier, { withFileTypes: true }) } catch (e) { return trouves }
  for (const e of entrees) {
    if (e.name.startsWith('.')) continue
    const complet = path.join(dossier, e.name)
    if (e.isDirectory()) lister(complet, racine, trouves)
    else if (EXTENSIONS.includes(path.extname(e.name).toLowerCase())) {
      trouves.push(path.relative(racine, complet))
    }
  }
  return trouves
}

module.exports = {
  id: 'images',
  titre: 'Bibliotheque d\'images',
  reference: 'constat du 7 aout 2026',

  executer(ctx) {
    const anomalies = []
    const dossier = path.join(ctx.racine, 'assets', 'images')
    const fichiers = lister(dossier, ctx.racine, [])
    if (!fichiers.length) return { anomalies, resume: 'aucune image trouvee' }

    // Empreinte du contenu, pas du nom.
    const parEmpreinte = new Map()
    for (const f of fichiers) {
      const somme = crypto.createHash('md5').update(fs.readFileSync(path.join(ctx.racine, f))).digest('hex')
      if (!parEmpreinte.has(somme)) parEmpreinte.set(somme, [])
      parEmpreinte.get(somme).push(f)
    }

    // Ou chaque image est-elle employee ? Une image en double dont une seule
    // copie sert n'a pas la meme gravite qu'une paire employee des deux cotes.
    // L'audit s'exclut de son propre corpus. Les commentaires de CE fichier
    // citent les noms de fichiers en exemple : sans cette exclusion, la regle
    // se compte elle-meme et declare employe un nom que plus aucune page
    // n'utilise. Troisieme piege du LISEZMOI, refait le jour meme.
    const corpus = ctx.pages.map(p => p.visible).join("\n") + "\n"
      + ctx.js.filter(j => !j.chemin.startsWith('outil-dev/audit/')).map(j => j.source).join('\n')
    const employee = f => corpus.includes(path.basename(f))

    // Pages qui affichent une image donnee. Le champ « ou » doit designer une
    // PAGE et non le fichier image : c'est lui qui sert a classer l'anomalie
    // dans le perimetre ou dehors. Pointer l'image rangeait le defaut hors
    // perimetre, donc masque par defaut, alors qu'il touche l'accueil et
    // l'Academie. Meme piege que dans la regle « renommages ».
    const pagesQuiEmploient = f => ctx.pages.filter(p => p.visible.includes(path.basename(f))).map(p => p.chemin)

    let paires = 0
    for (const [, memes] of parEmpreinte) {
      if (memes.length < 2) continue
      paires++
      const employees = memes.filter(employee)
      const pages = [...new Set(memes.flatMap(pagesQuiEmploient))]
      // Toujours un signal, jamais une faute. L'audit ne sait pas ce qu'il y a
      // sur une photo : deux noms peuvent decrire le meme podium sans que
      // personne ne mente. C'est a un humain de dire lequel est juste. Crier a
      // la faute sur les cas legitimes ferait ignorer les autres.
      anomalies.push({
        niveau: 'signal',
        ou: pages[0] || memes[0],
        quoi: `${memes.length} noms pour la meme photo au bit pres : « ${memes.join(' », « ')} »`
          + (employees.length > 1 ? `, et ${employees.length} de ces noms servent dans le site` : ', un seul sert')
          + (pages.length > 1 ? `, pages concernees : ${pages.join(', ')}` : ''),
      })
    }

    // L'inverse : une image reclamee qui n'existe pas. La regle « liens » ne
    // regarde que le HTML, or track-render.js choisit sa photo dans du code.
    // Trois chemins y pointaient dans le vide le 7 aout, dont l'image de repli,
    // celle que renvoie tout type d'evenement non reconnu. Personne ne l'avait
    // vu parce qu'il faut une date au bon type pour l'afficher.
    const present = new Set(fichiers.map(f => f.replace(/\\/g, '/')))
    let manquantes = 0
    for (const j of ctx.js) {
      for (const m of j.code.matchAll(/['"`](assets\/images\/[^'"`]+?\.(?:jpg|jpeg|png|webp|gif|mp4))['"`]/gi)) {
        if (present.has(m[1])) continue
        manquantes++
        anomalies.push({
          niveau: 'faute',
          ou: j.chemin,
          quoi: `reclame « ${m[1]} », qui n'existe pas : l'image sera cassee a l'ecran`,
        })
      }
    }

    // Images presentes mais employees nulle part. Simple signal : une photo en
    // reserve n'est pas un defaut, mais 129 Mo de medias meritent d'etre connus.
    const inutilisees = fichiers.filter(f => !employee(f))

    return {
      anomalies,
      resume: `${fichiers.length} fichiers, ${paires} doublon(s) de contenu, ${manquantes} reclamee(s) sans exister, ${inutilisees.length} jamais employe(s)`,
    }
  },
}
