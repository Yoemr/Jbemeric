#!/usr/bin/env node
// deploiements.js : le compteur de publications Netlify.
//
// ── Pourquoi ce fichier existe ───────────────────────────────────────────────
// Demande de Yoan, 9 aout 2026 : « ca coute cher. Alors tu as le droit, mais
// maximum 3 fois par tranche de 24 h pour ne pas depasser les 300. M'afficher
// un compteur mensuel pourrait etre cool. »
//
// Yoan paie le PUSH, pas le commit. Un commit reste sur la machine et ne
// declenche rien. Un push envoie tout ce qui s'est accumule et declenche une
// construction Netlify, quel que soit le nombre de commits qu'il porte.
//
// Le 9 aout 2026, seize pushes sont partis en vingt-deux heures. Une regle
// ecrite dans un document ne m'a pas arrete. Ce fichier est donc une porte,
// pas une note : le crochet pre-push refuse au-dela.
//
// ── Une hypothese prudente, non verifiee ─────────────────────────────────────
// Ce compteur compte TOUT push comme une construction, y compris sur une
// branche de travail. C'est certain pour la branche de production. Pour une
// branche, ca depend des reglages Netlify « branch deploys » et « deploy
// previews » : s'ils sont desactives, ces pushes ne coutent rien.
//
// Personne n'a pu le verifier depuis ce poste, qui n'a pas acces au tableau de
// bord Netlify. Le compteur se trompe donc du bon cote : il fait economiser
// plus que necessaire plutot que de laisser filer le budget.
//
// ── Ce qu'il compte, et d'ou il le tient ─────────────────────────────────────
// Du reflog de la branche distante, c'est-a-dire de ce qui est reellement
// parti. Un registre tenu a la main derive ; le reflog, non.
//
// Le reflog meurt avec le conteneur, qui est jetable. Les publications vues
// sont donc recopiees dans deploiements.json, versionne. Les deux sources sont
// fusionnees et dedoublonnees a la seconde : ce qui a ete vu une fois reste
// compte, meme sur une machine neuve.
//
// ── Usage ────────────────────────────────────────────────────────────────────
//   node outil-dev/deploiements.js             affiche le compteur
//   node outil-dev/deploiements.js --court     une seule ligne
//   node outil-dev/deploiements.js --peut-on   sort en 1 si le quota est plein
//
// --peut-on est ce qu'appelle le crochet pre-push. Il n'ecrit rien : c'est le
// push lui-meme qui laisse sa trace dans le reflog, donc dans le compteur.

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const RACINE   = path.resolve(__dirname, '..')
const REGISTRE = path.join(__dirname, 'deploiements.json')
// Regle precisee par Yoan le 10 aout 2026 : « ce que je paie c'est les 300
// pushes par mois. Tu te demerdes pour en regrouper plein et en faire le moins
// possible par jour, pour qu'on puisse travailler tout le mois sans
// restriction. »
//
// Le budget est donc mensuel. Le plafond du jour n'est qu'un garde-fou contre
// la journee du 9 aout, seize pushes en vingt-deux heures.
//
// Premiere version fausse : une fenetre glissante de 24 heures. Elle punissait
// aujourd'hui pour les pushes d'hier soir et bloquait le travail alors que le
// budget du mois etait large. Un jour calendaire repart a zero le matin, comme
// Yoan se le represente.
const PAR_JOUR = 3      // garde-fou, jour calendaire de Gemenos
const PAR_MOIS = 300    // le vrai budget, mot de Yoan
const FUSEAU   = 'Europe/Paris'

const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']

// ── Ce qui est reellement parti, vu par git ───────────────────────────────────
function duReflog() {
  let refs = []
  try {
    refs = execFileSync('git', ['for-each-ref', '--format=%(refname)', 'refs/remotes/origin'],
      { cwd: RACINE, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
  const vus = []
  for (const ref of refs) {
    let sortie = ''
    try {
      sortie = execFileSync('git', ['reflog', 'show', '--date=iso-strict', ref],
        { cwd: RACINE, encoding: 'utf8' })
    } catch {
      continue                      // une ref sans reflog n'est pas une erreur
    }
    for (const ligne of sortie.split('\n')) {
      // « <sha> refs/remotes/...@{2026-08-09T22:50:08+00:00}: update by push »
      const m = ligne.match(/@\{([^}]+)\}:\s*(.*)$/)
      if (!m) continue
      if (!/push/.test(m[2])) continue
      const t = Date.parse(m[1])
      if (Number.isNaN(t)) continue
      vus.push({ le: new Date(t).toISOString(), ou: ref.replace('refs/remotes/', '') })
    }
  }
  return vus
}

function duRegistre() {
  try {
    const j = JSON.parse(fs.readFileSync(REGISTRE, 'utf8'))
    return Array.isArray(j.publications) ? j.publications : []
  } catch {
    return []
  }
}

// Fusion a la seconde. Le reflog et le registre decrivent les memes
// publications ; les compter deux fois donnerait un compteur alarmiste, ce qui
// est aussi faux qu'un compteur rassurant.
function toutes() {
  const parCle = new Map()
  for (const p of duRegistre().concat(duReflog())) {
    const cle = p.le.slice(0, 19) + '|' + (p.ou || '')
    if (!parCle.has(cle)) parCle.set(cle, p)
  }
  return [...parCle.values()].sort((a, b) => a.le.localeCompare(b.le))
}

function enregistrer(pubs) {
  fs.writeFileSync(REGISTRE, JSON.stringify({ publications: pubs }, null, 2) + '\n')
}

// Ce qui est commite mais pas encore parti. Sans ce chiffre, la ligne de
// publications se lit comme un nombre de commits, ce qui est arrive.
function commitsEnAttente() {
  try {
    const branche = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
      { cwd: RACINE, encoding: 'utf8' }).trim()
    const n = execFileSync('git', ['rev-list', '--count', `origin/${branche}..HEAD`],
      { cwd: RACINE, encoding: 'utf8' }).trim()
    return parseInt(n, 10) || 0
  } catch {
    return 0                       // pas de branche distante, rien a dire
  }
}

// Le jour de Gemenos, pas celui d'UTC : Yoan raisonne en journees de travail.
function jourLocal(t) {
  return new Date(t).toLocaleDateString('fr-CA', { timeZone: FUSEAU })   // AAAA-MM-JJ
}
function moisLocal(t) {
  return jourLocal(t).slice(0, 7)
}

function comptes(pubs, maintenant) {
  const jour = jourLocal(maintenant)
  const mois = moisLocal(maintenant)
  return {
    duJour: pubs.filter(p => jourLocal(p.le) === jour).length,
    duMois: pubs.filter(p => moisLocal(p.le) === mois).length,
    total:  pubs.length,
  }
}

function main() {
  const args = process.argv.slice(2)
  const maintenant = new Date()
  const pubs = toutes()

  // Le registre suit ce que le reflog a montre, pour que le compte survive au
  // conteneur. On n'ecrit que si quelque chose a change.
  if (pubs.length !== duRegistre().length) enregistrer(pubs)

  const c = comptes(pubs, maintenant)
  const nomMois = MOIS[maintenant.getUTCMonth()] + ' ' + maintenant.getUTCFullYear()

  // ── La porte, appelee par le crochet pre-push ─────────────────────────────
  if (args.includes('--peut-on')) {
    if (c.duMois >= PAR_MOIS) {
      console.error('')
      console.error(`  PUSH REFUSE   ${c.duMois} publications en ${nomMois}, le budget du mois`)
      console.error(`                est de ${PAR_MOIS}. C'est celui-la que Yoan paie.`)
      console.error('')
      process.exit(1)
    }
    if (c.duJour >= PAR_JOUR) {
      console.error('')
      console.error(`  PUSH REFUSE   ${c.duJour} publications deja parties aujourd'hui,`)
      console.error(`                le garde-fou est de ${PAR_JOUR} par jour.`)
      console.error(`                Budget du mois : ${c.duMois} sur ${PAR_MOIS}, il en reste ${PAR_MOIS - c.duMois}.`)
      console.error('')
      console.error(`  Les commits en attente partiront TOUS ENSEMBLE au prochain push,`)
      console.error(`  et ne couteront qu'une seule publication. En regrouper plein est`)
      console.error(`  exactement ce qu'il faut faire.`)
      console.error('')
      console.error(`  La porte rouvre demain matin, heure de Gemenos.`)
      console.error(`  Si ca ne peut pas attendre, c'est a Yoan de le dire :`)
      console.error(`  git push --no-verify`)
      console.error('')
      process.exit(1)
    }
    console.error(`  Publication ${c.duJour + 1} / ${PAR_JOUR} aujourd'hui, ${c.duMois + 1} / ${PAR_MOIS} en ${nomMois}.`)
    return
  }

  // ── L'affichage ───────────────────────────────────────────────────────────
  //
  // Le 10 aout, Yoan a lu « 14 / 3 dans les 24 h » comme un nombre de commits.
  // Le nombre compte les publications DEJA PARTIES, pas le travail en attente :
  // les regrouper n'y change rien, et c'est justement ce qu'il faut faire.
  const enAttente = commitsEnAttente()

  if (args.includes('--court')) {
    let ligne = `  PUBLICATIONS   ${c.duJour} / ${PAR_JOUR} aujourd'hui`
              + `   ${c.duMois} / ${PAR_MOIS} en ${nomMois}`
    if (enAttente > 0) {
      ligne += `\n  EN ATTENTE     ${enAttente} commit${enAttente > 1 ? 's' : ''} en local, `
             + (enAttente > 1 ? `qui partiront ensemble en une seule publication`
                              : `qui partira a la prochaine publication`)
    }
    if (c.duJour >= PAR_JOUR) ligne += `\n  PORTE FERMEE   jusqu'a demain matin`
    console.log(ligne)
    return
  }

  console.log('')
  console.log('  PUBLICATIONS NETLIFY')
  console.log('  ' + '-'.repeat(66))
  console.log(`  Aujourd'hui   ${c.duJour} sur ${PAR_JOUR}`)
  console.log(`  En ${nomMois}   ${c.duMois} sur ${PAR_MOIS}, il en reste ${PAR_MOIS - c.duMois}`)
  console.log(`  En attente en local   ${enAttente} commit(s), qui partiront ensemble`)
  console.log('')
  console.log(`  Le budget que Yoan paie est mensuel : ${PAR_MOIS} publications.`)
  console.log(`  Le plafond du jour n'est qu'un garde-fou. Regrouper beaucoup de`)
  console.log(`  commits en une publication est la bonne facon de travailler.`)
  console.log('')

  const dernieres = pubs.slice(-6).reverse()
  if (dernieres.length) {
    console.log('  Les dernieres :')
    for (const p of dernieres) {
      console.log(`    ${p.le.slice(0, 16).replace('T', ' ')}   ${p.ou}`)
    }
  } else {
    console.log('  Aucune publication vue.')
  }
  console.log('')
}

main()
