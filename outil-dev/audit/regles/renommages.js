// Regle : cohérence des renommages de pages.
//
// Renommer une page casse la cle Supabase du live-editor, qui derive du nom de
// fichier. Deux fichiers declarent donc une table d'anciennes cles :
//
//   assets/js/live-editor.js   pour la lecture a l'affichage
//   outil-dev/build-cache.js   pour le recuit du filet de secours au build
//
// Si elles divergent, le site marche et le filet de secours tombe. Le visiteur
// ne voit rien, jusqu'au jour ou Supabase ne repond pas : la page renommee
// affiche alors son HTML d'origine au lieu du texte de JB.
//
// C'est exactement le genre de defaut qu'on ne trouve jamais en naviguant.
// D'ou cette regle.

function extraireTable(source) {
  const m = source.match(/PAGE_ALIASES\s*=\s*\{([^}]*)\}/)
  if (!m) return null
  const table = {}
  for (const p of m[1].matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)) table[p[1]] = p[2]
  return table
}

module.exports = {
  id: 'renommages',
  titre: 'Renommages de pages',
  reference: 'live-editor.js, build-cache.js',

  executer(ctx) {
    const anomalies = []
    const le = ctx.js.find(f => f.chemin.endsWith('live-editor.js'))
    const bc = ctx.js.find(f => f.chemin.endsWith('build-cache.js'))
    if (!le || !bc) return { anomalies, resume: 'fichiers introuvables' }

    const a = extraireTable(le.source)
    const b = extraireTable(bc.source)

    if (!a || !b) {
      anomalies.push({
        niveau: 'faute',
        ou: !a ? le.chemin : bc.chemin,
        quoi: 'table PAGE_ALIASES introuvable, le repli de cle ne peut plus fonctionner',
      })
      return { anomalies, resume: 'table absente' }
    }

    const cles = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of cles) {
      if (a[k] !== b[k]) {
        // Le champ « ou » doit etre un vrai chemin de fichier : c'est lui qui
        // sert a classer l'anomalie dans le perimetre ou hors de lui. Un
        // libelle libre serait range dehors, donc masque par defaut, et cette
        // regle passerait inapercue au moment ou elle sert.
        anomalies.push({
          niveau: 'faute',
          ou: le.chemin,
          quoi: `« ${k} » diverge de build-cache.js : ici « ${a[k] || 'rien'} », la-bas « ${b[k] || 'rien'} »`,
        })
      }
    }

    // Une entree n'a de sens que si la nouvelle page existe et l'ancienne non.
    const pages = new Set(ctx.pages.map(p => p.chemin.split('/').pop().replace('.html', '')))
    for (const [nouveau, ancien] of Object.entries(a)) {
      if (!pages.has(nouveau)) {
        anomalies.push({ niveau: 'faute', ou: le.chemin, quoi: `alias vers « ${nouveau} », page qui n'existe pas` })
      }
      if (pages.has(ancien)) {
        anomalies.push({
          niveau: 'faute',
          ou: le.chemin,
          quoi: `« ${ancien} » existe encore comme page : deux pages se disputeraient la meme cle`,
        })
      }
    }

    const n = Object.keys(a).length
    return {
      anomalies,
      resume: n ? `${n} renommage(s) declare(s), tables identiques` : 'aucun renommage declare',
    }
  },
}
