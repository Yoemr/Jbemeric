#!/usr/bin/env node
// audit.js : etat du site JB EMERIC, calcule et non redige.
//
//   node outil-dev/audit/audit.js              rapport complet
//   node outil-dev/audit/audit.js --court      une ligne par regle
//   node outil-dev/audit/audit.js --json       sortie machine
//   node outil-dev/audit/audit.js liens css    seulement ces regles
//
// Pourquoi ce fichier existe : l'etat du site etait consigne a la main dans
// docs/05-etat-des-lieux.md. Un document ecrit perime des qu'on ferme la
// session, donc chaque session recommencait l'archeologie, et deux
// affirmations du releve se sont revelees fausses le 4 aout 2026. Ce qui est
// mesurable doit etre mesure. Le jugement reste aux humains et aux fiches.
//
// Code de sortie : 1 s'il reste au moins une faute, 0 sinon. Une tache ou un
// signal ne fait pas echouer.

const fs = require('fs')
const path = require('path')
const { construire } = require('./contexte')
const perimetre = require('./perimetre')

const NIVEAUX = {
  faute:  { rang: 0, etiquette: 'FAUTE ', tri: 0 },  // contredit une decision ou casse quelque chose
  tache:  { rang: 1, etiquette: 'tache ', tri: 1 },  // a nettoyer, sans consequence visible
  signal: { rang: 2, etiquette: 'signal', tri: 2 },  // demande un jugement humain
}

function chargerRegles() {
  const dossier = path.join(__dirname, 'regles')
  return fs.readdirSync(dossier)
    .filter(f => f.endsWith('.js'))
    .sort()
    .map(f => require(path.join(dossier, f)))
}

function main() {
  const args = process.argv.slice(2)
  const court = args.includes('--court')
  const json = args.includes('--json')
  const tout = args.includes('--tout')   // montre aussi le hors perimetre
  const filtres = args.filter(a => !a.startsWith('--'))

  const ctx = construire()
  let regles = chargerRegles()
  if (filtres.length) {
    regles = regles.filter(r => filtres.some(f => r.id.includes(f)))
  }

  const resultats = []
  for (const regle of regles) {
    let sortie
    try {
      sortie = regle.executer(ctx)
    } catch (e) {
      sortie = { anomalies: [{ niveau: 'faute', ou: regle.id, quoi: `la regle a echoue : ${e.message}` }], resume: 'erreur' }
    }
    // Chaque anomalie est rangee selon qu'elle touche une page qui compte.
    for (const a of sortie.anomalies) {
      a.dedans = perimetre.estDedans(String(a.ou).split(':')[0], ctx)
    }
    resultats.push({ regle, ...sortie })
  }

  if (json) {
    console.log(JSON.stringify(resultats.map(r => ({
      id: r.regle.id, titre: r.regle.titre, resume: r.resume, anomalies: r.anomalies,
    })), null, 2))
    return process.exit(resultats.some(r => r.anomalies.some(a => a.niveau === 'faute')) ? 1 : 0)
  }

  const total = { faute: 0, tache: 0, signal: 0 }
  console.log('')
  console.log('  AUDIT JB EMERIC   ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
  console.log('  ' + '-'.repeat(66))

  let horsTotal = 0
  for (const r of resultats) {
    const dedans = r.anomalies.filter(a => a.dedans)
    const dehors = r.anomalies.filter(a => !a.dedans)
    horsTotal += dehors.length

    const compte = { faute: 0, tache: 0, signal: 0 }
    dedans.forEach(a => compte[a.niveau]++)
    Object.keys(compte).forEach(k => { total[k] += compte[k] })

    const badge = compte.faute ? `${compte.faute} faute(s)` : 'aucune faute'
    const suffixe = dehors.length ? `   (+ ${dehors.length} hors perimetre)` : ''
    console.log('')
    console.log(`  ${r.regle.titre.toUpperCase()}   [${r.regle.reference}]`)
    console.log(`    ${badge}, ${compte.tache} a nettoyer, ${compte.signal} a juger   ${r.resume}${suffixe}`)

    if (!court) {
      const montrer = tout ? r.anomalies : dedans
      const tries = [...montrer].sort((a, b) => NIVEAUX[a.niveau].tri - NIVEAUX[b.niveau].tri)
      for (const a of tries) {
        const marque = a.dedans ? '' : '  [hors perimetre]'
        console.log(`      ${NIVEAUX[a.niveau].etiquette}  ${a.ou}${marque}`)
        console.log(`               ${a.quoi}`)
      }
    }
  }

  console.log('')
  console.log('  ' + '-'.repeat(66))
  console.log(`  PERIMETRE   ${total.faute} faute(s)   ${total.tache} a nettoyer   ${total.signal} a juger`)
  console.log(`  Les ${perimetre.PAGES.length} pages qui comptent : ${perimetre.PAGES.join(', ')}`)
  if (horsTotal) {
    console.log(`  HORS PERIMETRE   ${horsTotal} releve(s), sans consequence sur le code de sortie.`)
    if (!tout) console.log('  Les voir : --tout')
  }
  console.log('')
  if (total.faute) {
    console.log('  Une faute contredit une decision actee ou casse quelque chose.')
    console.log('  Une tache est sans consequence visible. Un signal demande ton avis.')
    console.log('')
  }
  process.exit(total.faute ? 1 : 0)
}

main()
