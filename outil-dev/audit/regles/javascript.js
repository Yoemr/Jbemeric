// Regle : sante du JavaScript.
//
// Le 4 aout 2026, track-render.js ne s'evaluait pas du tout : une apostrophe
// non echappee ligne 250. Le fichier etant charge en type="module", le module
// entier etait rejete, donc le calendrier, le vote et la fenetre d'inscription
// de track.html n'existaient tout simplement pas. Le defaut etait present sur
// main depuis des mois.
//
// Un node --check aurait suffi. C'est desormais fait a chaque audit.
//
// ── Mais il faut le lancer dans le bon mode, constat du 7 aout 2026 ─────────
// admin.js portait SEPT chaines cassees, dont « font-family:'DM Mono' » a
// l'interieur d'une chaine a guillemets simples et un en-tete CSV coupe par un
// vrai retour a la ligne. Le fichier etant charge en type="module", le module
// entier etait rejete : le tableau de bord ne fonctionnait pas du tout.
//
// Cette regle lancait deja node --check dessus, et il repondait « valide ».
// Les memes octets, copies dans un fichier .mjs, echouent immediatement.
// Verifie et reproduit : le mode de parsing change le verdict.
//
// D'ou la regle : un fichier charge quelque part en type="module" est verifie
// EN TANT QUE MODULE. Le mode se lit dans les pages, pas au jugement, et un
// script classique reste verifie en script, sinon le mode strict des modules
// produirait de fausses alertes.

const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

// Fichiers qu'au moins une page charge avec type="module".
function scriptsModules(ctx) {
  const modules = new Set()
  for (const p of ctx.pages) {
    for (const m of p.utile.matchAll(/<script[^>]*\stype="module"[^>]*\ssrc="([^"]+)"/g)) {
      modules.add(m[1].split('?')[0].replace(/^\.?\//, ''))
    }
    // L'attribut src peut aussi preceder le type dans la balise.
    for (const m of p.utile.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*\stype="module"/g)) {
      modules.add(m[1].split('?')[0].replace(/^\.?\//, ''))
    }
  }
  return modules
}

module.exports = {
  id: 'javascript',
  titre: 'JavaScript',
  reference: 'D-019, releve 6.3',

  executer(ctx) {
    const anomalies = []
    const modules = scriptsModules(ctx)
    const bac = fs.mkdtempSync(path.join(os.tmpdir(), 'jbe-audit-js-'))
    let enModule = 0

    for (const f of ctx.js) {
      // 1. Le fichier compile-t-il seulement, dans le mode ou il est charge
      const estModule = modules.has(f.chemin)
      if (estModule) enModule++
      let aVerifier = path.join(ctx.racine, f.chemin)
      if (estModule) {
        // node --check deduit le mode de l'extension. Un .mjs force le parsing
        // de module, seul verdict qui compte pour un script charge ainsi.
        aVerifier = path.join(bac, path.basename(f.chemin).replace(/\.js$/, '') + '.mjs')
        fs.writeFileSync(aVerifier, f.source)
      }
      try {
        execFileSync(process.execPath, ['--check', aVerifier], { stdio: 'pipe' })
      } catch (e) {
        const detail = String(e.stderr || '').split('\n').find(l => l.includes('Error')) || 'erreur de syntaxe'
        const ligne = (String(e.stderr || '').match(/\.m?js:(\d+)/) || [])[1]
        anomalies.push({
          niveau: 'faute',
          ou: ligne ? `${f.chemin}:${ligne}` : f.chemin,
          quoi: `ne compile pas${estModule ? ' en tant que module' : ''} : ${detail.trim()}`,
        })
        continue
      }

      // 2. Bloc immediatement invoque non protege par un point-virgule.
      //    Sans lui, JS rattache le bloc a l'expression precedente et lit un
      //    appel de fonction sur son resultat.
      const lignes = f.source.split('\n')
      for (let i = 1; i < lignes.length; i++) {
        if (!/^\(\s*(async\s+)?function/.test(lignes[i])) continue
        let j = i - 1
        while (j >= 0 && (!lignes[j].trim() || /^\s*(\/\/|\/\*|\*)/.test(lignes[j]))) j--
        if (j >= 0 && /\)\s*\(\s*\)\s*$/.test(lignes[j].trim())) {
          anomalies.push({
            niveau: 'faute',
            ou: `${f.chemin}:${i + 1}`,
            quoi: 'bloc immediatement invoque precede de })() sans point-virgule, ecrire ;(function',
          })
        }
      }
    }

    try { fs.rmSync(bac, { recursive: true, force: true }) } catch (e) { /* tant pis */ }
    return { anomalies, resume: `${ctx.js.length} fichiers verifies, dont ${enModule} en tant que module` }
  },
}
