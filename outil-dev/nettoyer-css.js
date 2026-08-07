// nettoyer-css.js : retire d'une feuille les regles entierement mortes.
//
//   node outil-dev/nettoyer-css.js coaching.css            simulation
//   node outil-dev/nettoyer-css.js coaching.css --ecrire   applique
//
// Sans --ecrire, il ne touche a rien et se contente d'annoncer ce qu'il ferait.
//
// ── Ce qu'il fait, et surtout ce qu'il ne fait pas ──────────────────────────
// Il ne retire qu'une regle de PREMIER NIVEAU dont TOUS les selecteurs sont
// morts. Jamais une regle mixte, jamais quoi que ce soit dans un @media. Le but
// est une transformation dont l'innocuite se demontre, pas un nettoyage maximal.
// Ce qui survit a cette prudence reste signale par l'audit, et se traite a la
// main en connaissance de cause.
//
// ── Le critere n'est pas ici ────────────────────────────────────────────────
// « Ce selecteur peut-il correspondre a quelque chose ? » est defini une seule
// fois, dans audit/vocabulaire.js, partage avec la regle d'audit. Deux copies
// finiraient par diverger, et ce jour-la l'outil supprimerait ce que la regle
// croit vivant.
//
// ── Comment verifier apres coup ─────────────────────────────────────────────
// Pas au pixel, sauf sur une page statique. Une page rendue en JavaScript n'est
// pas reproductible d'une capture a l'autre : palmares.html a donne trois
// empreintes differentes en trois executions sans aucune modification. La
// preuve solide est ailleurs : chercher chaque classe des regles retirees dans
// le HTML et dans les scripts de la page. Zero occurrence, donc aucun element
// ne peut la porter, donc la suppression ne peut rien changer.
//
// Voir docs/03-technique.md section 6bis pour prendre une capture qui ne ment
// pas, et le controle negatif a faire avant de croire un « identique ».

const fs = require('fs')
const path = require('path')
const { construire, RACINE } = require('./audit/contexte')
const vocabulaire = require('./audit/vocabulaire')

const cible = process.argv[2]
const ecrire = process.argv.includes('--ecrire')

if (!cible || cible.startsWith('--')) {
  console.error('usage : node outil-dev/nettoyer-css.js <feuille.css> [--ecrire]')
  process.exit(2)
}

const ctx = construire()
const f = ctx.css.find(x => x.chemin.endsWith(cible))
if (!f) {
  console.error(`feuille introuvable : ${cible}`)
  process.exit(2)
}

const v = vocabulaire.pour(f, ctx)
if (!v.consommatrices.length) {
  console.error(`aucune page ne charge ${f.chemin}, cas a traiter a la main`)
  process.exit(2)
}

const lignes = f.source.split('\n')
const aRetirer = new Set()
const retirees = []
let profondeur = 0

for (let i = 0; i < lignes.length; i++) {
  const l = lignes[i]
  const debutRegle = l.match(/^([^{}@][^{}]*)\{/)
  if (debutRegle && profondeur === 0) {
    const sels = debutRegle[1].split(',').map(s => s.trim()).filter(Boolean)
    if (sels.length && sels.every(s => !v.vivant(s))) {
      let p = 0
      let j = i
      do {
        p += (lignes[j].match(/\{/g) || []).length - (lignes[j].match(/\}/g) || []).length
        aRetirer.add(j)
        j++
      } while (p > 0 && j < lignes.length)
      retirees.push(debutRegle[1].trim())
      i = j - 1
      continue
    }
  }
  profondeur += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length
}

const sortie = lignes.filter((_, i) => !aRetirer.has(i)).join('\n')
const equilibre = (sortie.match(/\{/g) || []).length === (sortie.match(/\}/g) || []).length

console.log(`  ${f.chemin}`)
console.log(`  chargee par     : ${v.consommatrices.map(p => p.chemin).join(', ')}`)
console.log(`  regles retirees : ${retirees.length}, soit ${aRetirer.size} lignes sur ${lignes.length}`)
console.log(`  accolades       : ${equilibre ? 'equilibrees' : 'DESEQUILIBREES, on n\'ecrit rien'}`)

if (process.argv.includes('--detail')) {
  for (const s of retirees) console.log(`      ${s.slice(0, 90)}`)
}

if (!equilibre) process.exit(1)

if (ecrire) {
  fs.writeFileSync(path.join(RACINE, f.chemin), sortie)
  console.log('  ecrit. Verifier ensuite : node outil-dev/audit/audit.js feuilles-de-style')
} else {
  console.log('  simulation. Ajouter --ecrire pour appliquer, --detail pour la liste.')
}
