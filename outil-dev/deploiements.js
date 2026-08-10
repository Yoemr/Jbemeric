#!/usr/bin/env node
// deploiements.js : le compteur de publications Netlify.
//
// ── Pourquoi ce fichier existe ───────────────────────────────────────────────
// Demande de Yoan, 9 aout 2026 : « ca coute cher. Alors tu as le droit, mais
// maximum 3 fois par tranche de 24 h pour ne pas depasser les 300. M'afficher
// un compteur mensuel pourrait etre cool. »
//
// Chaque push declenche une construction Netlify, qui lance build-cache.js
// puis publie. Le plafond gratuit se compte en minutes de construction par
// mois. Trois publications par jour tiennent dans le budget ; seize, non.
//
// Le 9 aout 2026, seize pushes sont partis en vingt-deux heures. Une regle
// ecrite dans un document ne m'a pas arrete. Ce fichier est donc une porte,
// pas une note : le crochet pre-push refuse la quatrieme.
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
const PAR_24H  = 3      // la regle de Yoan
const PLAFOND  = 300    // le nombre a ne pas depasser, mot de Yoan

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

// Quand la porte s'ouvre vraiment.
//
// Premiere version fausse : elle rendait « la plus vieille + 24 h », c'est-a-
// dire le moment ou UNE publication sort de la fenetre. Avec treize dedans et
// trois permises, ca annoncait 03:53 alors qu'il en restait douze a 03:53.
//
// Il faut que le compte tombe sous le plafond. Avec n publications et p
// permises, il faut que n - p + 1 sortent, donc c'est la (n - p + 1)-ieme
// plus vieille qui commande, d'indice n - p en partant de zero.
function heureDeDeblocage(c) {
  const instants = c.recentes.map(p => Date.parse(p.le)).sort((a, b) => a - b)
  const i = instants.length - PAR_24H
  if (i < 0) return null                       // la porte est deja ouverte
  return new Date(instants[i] + 24 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}

function comptes(pubs, maintenant) {
  const il24h = maintenant.getTime() - 24 * 3600 * 1000
  const mois  = maintenant.getUTCFullYear() + '-' + String(maintenant.getUTCMonth() + 1).padStart(2, '0')
  return {
    recentes: pubs.filter(p => Date.parse(p.le) >= il24h),
    duMois:   pubs.filter(p => p.le.slice(0, 7) === mois).length,
    total:    pubs.length,
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
    if (c.recentes.length >= PAR_24H) {
      const libre = heureDeDeblocage(c)
      console.error('')
      console.error(`  PUSH REFUSE   ${c.recentes.length} publications DEJA PARTIES dans les 24 h,`)
      console.error(`                le maximum est ${PAR_24H}.`)
      console.error(`                Chaque push declenche une construction Netlify, et le`)
      console.error(`                plafond est de ${PLAFOND}. Regle de Yoan du 9 aout 2026.`)
      console.error('')
      console.error(`  Les commits en attente partiront TOUS ENSEMBLE au prochain push,`)
      console.error(`  et ne couteront qu'une seule construction. Les regrouper en un`)
      console.error(`  seul commit n'y changerait rien : ce sont les publications deja`)
      console.error(`  parties qui remplissent le quota, pas le travail en attente.`)
      console.error('')
      console.error(`  La prochaine sera possible a ${libre} UTC.`)
      console.error(`  Si elle ne peut pas attendre, c'est a Yoan de le dire :`)
      console.error(`  git push --no-verify`)
      console.error('')
      process.exit(1)
    }
    console.error(`  ${c.recentes.length + 1} / ${PAR_24H} publications dans les 24 h.`)
    return
  }

  // ── L'affichage ───────────────────────────────────────────────────────────
  //
  // Le 10 aout, Yoan a lu « 14 / 3 dans les 24 h » comme un nombre de commits
  // et a demande pourquoi on ne les regroupait pas. Le nombre compte les
  // publications DEJA PARTIES, pas le travail en attente : les regrouper n'y
  // change rien. La ligne dit donc les deux, et l'heure de deblocage.
  const enAttente = commitsEnAttente()

  if (args.includes('--court')) {
    let ligne = `  PUBLICATIONS   ${c.recentes.length} deja parties sur ${PAR_24H} permises par 24 h`
                + `   ${c.duMois} en ${nomMois}`
    if (enAttente > 0) {
      ligne += `\n  EN ATTENTE     ${enAttente} commit${enAttente > 1 ? 's' : ''} en local`
             + `, qui partiront ensemble et ne couteront qu'une construction`
    }
    if (c.recentes.length >= PAR_24H) {
      ligne += `\n  PORTE FERMEE   prochaine publication possible a ${heureDeDeblocage(c)} UTC`
    }
    console.log(ligne)
    return
  }

  console.log('')
  console.log('  PUBLICATIONS NETLIFY')
  console.log('  ' + '-'.repeat(66))
  console.log(`  Deja parties dans les 24 h   ${c.recentes.length} sur ${PAR_24H} autorisees`)
  console.log(`  En attente en local   ${enAttente} commit(s), qui partiront ensemble`)
  console.log(`  En ${nomMois}   ${c.duMois}`)
  console.log(`  Vues depuis le debut   ${c.total}`)
  console.log('')
  console.log(`  Chaque publication declenche une construction Netlify. Le plafond`)
  console.log(`  que Yoan a donne est ${PLAFOND}. Trois par jour y tiennent.`)
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
