#!/usr/bin/env node
// notify.js : le compteur de notifications envoyees a Yoan.
//
// ── Pourquoi ce fichier existe ───────────────────────────────────────────────
// Demande de Yoan, 9 aout 2026 : « tu recommences a envoyer sur Notify sans me
// demander, sauf que ca coute cher. Alors tu as le droit, mais maximum 3 fois
// par tranche de 24 h pour ne pas depasser les 300. M'afficher un compteur
// mensuel pourrait etre cool. »
//
// Le compteur s'affiche a chaque ouverture de session, juste apres l'audit,
// par le hook SessionStart de .claude/settings.json.
//
// ── Ce qu'il compte, et ce qu'il ne peut pas compter ─────────────────────────
// Il compte les envois volontaires, ceux que j'enregistre avec --envoi avant
// d'envoyer. Il ne voit pas les avis automatiques que l'outillage declenche
// tout seul quand une commande longue bascule en arriere-plan ou qu'un agent
// se termine. Ceux-la ne se comptent pas, ils s'evitent : une commande longue
// recoit un delai explicite pour finir au premier plan.
//
// Un compteur qui pretendrait tout voir donnerait un faux calme. Il dit donc
// ce qu'il sait, et rien de plus.
//
// ── Usage ────────────────────────────────────────────────────────────────────
//   node outil-dev/notify.js                    affiche le compteur
//   node outil-dev/notify.js --envoi "raison"   enregistre un envoi
//   node outil-dev/notify.js --court            une seule ligne
//
// --envoi refuse au-dela de 3 dans les 24 h et sort en code 1. C'est la
// garantie que la regle tient meme si je l'oublie.

const fs = require('fs')
const path = require('path')

const REGISTRE = path.join(__dirname, 'notifications.json')
const PAR_24H  = 3      // la regle de Yoan
const PLAFOND  = 300    // le nombre a ne pas depasser, mot de Yoan

const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre']

function lire() {
  try {
    const j = JSON.parse(fs.readFileSync(REGISTRE, 'utf8'))
    return Array.isArray(j.envois) ? j.envois : []
  } catch {
    return []
  }
}

function ecrire(envois) {
  fs.writeFileSync(REGISTRE, JSON.stringify({ envois }, null, 2) + '\n')
}

function comptes(envois, maintenant) {
  const il24h = maintenant.getTime() - 24 * 3600 * 1000
  const mois  = maintenant.getUTCFullYear() + '-' + String(maintenant.getUTCMonth() + 1).padStart(2, '0')
  return {
    recents: envois.filter(e => Date.parse(e.le) >= il24h).length,
    duMois:  envois.filter(e => String(e.le).slice(0, 7) === mois).length,
    total:   envois.length,
    mois,
  }
}

function main() {
  const args = process.argv.slice(2)
  const maintenant = new Date()
  const envois = lire()
  const c = comptes(envois, maintenant)

  // ── Enregistrer un envoi ──────────────────────────────────────────────────
  const i = args.indexOf('--envoi')
  if (i !== -1) {
    const raison = args[i + 1] || ''
    if (!raison) {
      console.error('  Il faut dire pourquoi : node outil-dev/notify.js --envoi "la raison"')
      process.exit(2)
    }
    if (c.recents >= PAR_24H) {
      const plusVieux = envois
        .filter(e => Date.parse(e.le) >= maintenant.getTime() - 24 * 3600 * 1000)
        .map(e => Date.parse(e.le))
        .sort((a, b) => a - b)[0]
      const libre = new Date(plusVieux + 24 * 3600 * 1000)
      console.error(`  REFUSE   ${c.recents} envois dans les 24 h, le maximum est ${PAR_24H}.`)
      console.error(`           Le prochain sera possible a ${libre.toISOString().slice(11, 16)} UTC.`)
      process.exit(1)
    }
    envois.push({ le: maintenant.toISOString(), pourquoi: raison })
    ecrire(envois)
    const apres = comptes(envois, maintenant)
    console.log(`  ENREGISTRE   ${apres.recents} / ${PAR_24H} dans les 24 h, ${apres.duMois} ce mois-ci.`)
    return
  }

  // ── Afficher le compteur ──────────────────────────────────────────────────
  const nomMois = MOIS[maintenant.getUTCMonth()] + ' ' + maintenant.getUTCFullYear()
  const reste = PLAFOND - c.total

  if (args.includes('--court')) {
    console.log(`  NOTIFICATIONS   ${c.recents} / ${PAR_24H} dans les 24 h   ${c.duMois} en ${nomMois}   ${reste} restantes sur ${PLAFOND}`)
    return
  }

  console.log('')
  console.log('  NOTIFICATIONS ENVOYEES A YOAN')
  console.log('  ' + '-'.repeat(66))
  console.log(`  Dans les 24 h   ${c.recents} sur ${PAR_24H} autorisees`)
  console.log(`  En ${nomMois}   ${c.duMois}`)
  console.log(`  Depuis le debut   ${c.total} sur ${PLAFOND}, il en reste ${reste}`)
  console.log('')

  const derniers = envois.slice(-5).reverse()
  if (derniers.length) {
    console.log('  Les derniers :')
    for (const e of derniers) {
      console.log(`    ${e.le.slice(0, 16).replace('T', ' ')}   ${e.pourquoi}`)
    }
  } else {
    console.log('  Aucun envoi volontaire enregistre.')
  }
  console.log('')
  console.log('  Ne sont pas comptes ici les avis automatiques de l\'outillage,')
  console.log('  qui ne se comptent pas mais s\'evitent : aucune commande longue')
  console.log('  ne doit basculer en arriere-plan.')
  console.log('')
}

main()
