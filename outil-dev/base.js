// base.js : applique les regles d'ecriture au contenu de Supabase.
//
//   node outil-dev/base.js                     rapport
//   node outil-dev/base.js --tout              y compris le hors perimetre
//   node outil-dev/base.js --json              sortie machine
//   node outil-dev/base.js --fichier=x.json    juger un export au lieu du reseau
//
// L'entree par fichier existe pour deux raisons. Certains environnements
// filtrent Supabase, le mien par exemple, et l'outil serait alors intestable.
// Et elle permet de fabriquer un temoin portant les defauts pour verifier que
// l'outil les voit, controle negatif obligatoire avant de croire un « aucune
// faute ». Format attendu : un tableau de { id, content, media_type }.
//
// ── Le trou que cet outil bouche ────────────────────────────────────────────
// L'audit lit les fichiers du depot. Il ne voit pas la base. Or le live-editor
// sert la base AVANT le HTML : un texte enregistre sous la meme cle ecrase le
// fichier, sans que rien ne le signale.
//
// Consequence mesuree le 8 aout 2026 : pendant trois jours l'audit a annonce
// zero tiret cadratin, zero offre morte et zero antithese, pendant que la base
// servait les trois aux visiteurs. Onze lignes ont du etre supprimees, dont une
// promesse de BMW 325i en dotation et un tiret cadratin.
//
// ── Aucune regle n'est reecrite ici ─────────────────────────────────────────
// Les criteres vivent dans outil-dev/audit/regles/. Cet outil se contente de
// presenter chaque ligne de la base comme si c'etait une page, et de faire
// tourner les memes regles dessus. Deux definitions du meme interdit
// finiraient par diverger, et le jour ou elles divergent l'une declare propre
// ce que l'autre condamne. Le projet connait deja cette panne, voir la regle
// « renommages ».
//
// ── Les cles ────────────────────────────────────────────────────────────────
// La cle publique Supabase est celle que le site expose deja dans son code.
// Aucun secret n'est necessaire, et aucun n'est ecrit ici.

const https = require('https')
const path = require('path')
const fs = require('fs')
const PERIMETRE = require('./audit/perimetre')

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fyaybxamuabawerqzuud.supabase.co'
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9XPoYkZmVACEtI6UfPRhYg_3RAfWXFD'
const RACINE = path.resolve(__dirname, '..')

// Les regles qui jugent du texte, et elles seules.
//
// « referencement » a ete essaye puis retire : sur une ligne de base elle
// reclame un <h1>, un <title> et une canonique a un fragment de phrase, et
// noie le rapport sous huit fautes imaginaires. Une regle de structure de page
// n'a rien a dire sur un morceau de texte.
//
// Ce qu'on perd avec elle : la detection de « PACA » et des mentions de region,
// D-020. Verifie a la main le 8 aout, zero occurrence dans la base. A reprendre
// si le besoin revient, en extrayant ce critere dans un module partage plutot
// qu'en le recopiant ici.
const REGLES_DE_TEXTE = ['ecriture', 'offres-mortes', 'ton-ia']

// Une cle vaut « PAGE__identifiant », ou PAGE derive du nom de fichier. Le
// tableau reprend celui de live-editor.js pour les pages renommees.
const ALIAS = { karting: 'academie/karting-adulte.html' }

// Le champ « ou » d'une anomalie doit designer une PAGE, jamais la cle brute :
// c'est lui qui range le defaut dans le perimetre ou dehors. Une cle rangerait
// tout hors perimetre, donc masque par defaut, et l'outil serait inutile au
// moment precis ou il sert. Piege deja paye deux fois, voir docs/07 section 2.6.
function pagePourCle(cle, pagesConnues) {
  const nom = cle.split('__')[0]
  if (ALIAS[nom]) return ALIAS[nom]
  const candidat = pagesConnues.find(p => p.split('/').pop().replace('.html', '') === nom)
  return candidat || nom + '.html'
}

function listerPages(dossier, trouves) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.name.startsWith('.') || ['old', 'node_modules', 'docs', 'outil-dev'].includes(e.name)) continue
    const complet = path.join(dossier, e.name)
    if (e.isDirectory()) listerPages(complet, trouves)
    else if (e.name.endsWith('.html')) trouves.push(path.relative(RACINE, complet))
  }
  return trouves
}

function interroger(chemin) {
  return new Promise((ok, ko) => {
    https.get(SUPABASE_URL + '/rest/v1/' + chemin,
      { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } }, res => {
        let data = ''
        res.on('data', c => (data += c))
        res.on('end', () => {
          if (res.statusCode !== 200) return ko(new Error(`Supabase a repondu ${res.statusCode}`))
          try { ok(JSON.parse(data)) } catch (e) { ko(new Error('reponse illisible : ' + e.message)) }
        })
      }).on('error', e => ko(new Error('Supabase injoignable : ' + e.message)))
  })
}

// Deux tables portent du texte lu par un visiteur.
//
// site_content, ce que JB ecrit dans le live-editor.
//
// events.type, qui s'affiche sur les cartes de track.html. Oubliee d'abord, et
// elle contenait cinq tirets cadratins le 8 aout, « Caterham — Voiture perso ».
// L'interdit numero un, servi aux visiteurs, dans une table que l'outil ne
// regardait pas. Une table de donnees peut porter de la redaction.
function chargerBase() {
  const arg = process.argv.find(a => a.startsWith('--fichier='))
  if (arg) {
    return Promise.resolve(JSON.parse(fs.readFileSync(arg.slice('--fichier='.length), 'utf8')))
  }
  return Promise.all([
    interroger('site_content?select=id,content,media_type&order=id'),
    interroger('events?select=id,type,status&order=date_event'),
  ]).then(([contenus, evenements]) => contenus.concat(
    // Un type d'evenement devient une ligne comme une autre, sous une cle qui
    // dit ou le corriger. La page qui l'affiche est track.html.
    evenements.filter(e => e.type).map(e => ({
      id: 'track__type-' + String(e.id).slice(0, 8),
      content: e.type,
      media_type: null,
    }))
  ))
}

function principal() {
  const tout = process.argv.includes('--tout')
  const json = process.argv.includes('--json')

  chargerBase().then(lignes => {
    const pagesConnues = listerPages(RACINE, [])

    // Chaque ligne devient une « page » synthetique. Les regles savent deja
    // juger un texte, elles n'ont pas besoin de savoir d'ou il vient.
    const textes = lignes.filter(l =>
      l.content && !l.media_type && !/^https?:\/\//.test(l.content.trim()))

    const pages = textes.map(l => ({
      chemin: pagePourCle(l.id, pagesConnues),
      cle: l.id,
      html: l.content,
      utile: l.content,
      visible: l.content,
      sansScripts: l.content,
      classes: new Set(), ids: new Set(), balises: new Set(), feuilles: [],
    }))

    const ctx = {
      racine: RACINE,
      pages,
      css: [],
      js: [],
      classesJs: new Set(),
      routes: {},
      lire() { throw new Error('pas de fichier ici') },
    }

    const rapport = []
    for (const id of REGLES_DE_TEXTE) {
      let regle
      try { regle = require('./audit/regles/' + id) } catch (e) { continue }
      let res
      try { res = regle.executer(ctx) } catch (e) {
        rapport.push({ id, titre: regle.titre, erreur: e.message, anomalies: [] })
        continue
      }
      // On raccroche la cle a chaque anomalie : « academie.html » ne suffit pas
      // pour retrouver la ligne a corriger dans la base.
      for (const a of res.anomalies) {
        const p = pages.find(x => x.chemin === a.ou)
        if (p) a.cle = p.cle
      }
      rapport.push({ id, titre: regle.titre, resume: res.resume, anomalies: res.anomalies })
    }

    if (json) {
      console.log(JSON.stringify({ lignes: lignes.length, textes: textes.length, rapport }, null, 2))
      return
    }

    console.log('')
    console.log('  BASE JB EMERIC   ' + new Date().toISOString().slice(0, 16).replace('T', ' '))
    console.log('  ' + '-'.repeat(66))
    console.log(`  ${lignes.length} lignes dans site_content, dont ${textes.length} textes juges`)
    console.log('')

    let fautes = 0, dehors = 0
    for (const r of rapport) {
      const dedans = r.anomalies.filter(a => PERIMETRE.estDedans(a.ou))
      const hors = r.anomalies.filter(a => !PERIMETRE.estDedans(a.ou))
      fautes += dedans.filter(a => a.niveau === 'faute').length
      dehors += hors.length
      const n = dedans.filter(a => a.niveau === 'faute').length
      console.log(`  ${r.titre.toUpperCase()}`)
      if (r.erreur) { console.log(`    regle inapplicable ici : ${r.erreur}`); console.log(''); continue }
      console.log(`    ${n ? n + ' faute(s)' : 'aucune faute'}   ${r.resume || ''}`)
      for (const a of (tout ? r.anomalies : dedans)) {
        const marque = PERIMETRE.estDedans(a.ou) ? '' : '  [hors perimetre]'
        console.log(`      ${a.niveau.toUpperCase().padEnd(7)} ${a.cle || a.ou}${marque}`)
        console.log(`               ${a.quoi}`)
      }
      console.log('')
    }

    console.log('  ' + '-'.repeat(66))
    console.log(`  PERIMETRE   ${fautes} faute(s) dans la base`)
    if (dehors && !tout) console.log(`  HORS PERIMETRE   ${dehors} releve(s).  Les voir : --tout`)
    console.log('')
    console.log('  Corriger une ligne : la cle affichee est son identifiant dans site_content.')
    console.log('')
    process.exit(fautes ? 1 : 0)
  }).catch(e => {
    console.error('')
    console.error('  ' + e.message)
    console.error('  La base est peut-etre injoignable depuis cette machine. Ce n\'est pas')
    console.error('  un defaut du site : le reseau de certains environnements est filtre.')
    console.error('')
    process.exit(2)
  })
}

principal()
