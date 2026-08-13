// Regle : les coordonnees de JB, une seule verite.
//
// ── Pourquoi elle existe ────────────────────────────────────────────────────
// Le 8 aout 2026, en ecrivant un message de repli sur la page Evenements,
// j'ai invente un numero de telephone. « 06 08 33 10 76 » n'appartient a
// personne dans ce projet. Il est parti dans le code, il a passe l'audit, il a
// passe la fumee, il a passe les parcours. Aucun outil ne pouvait le voir :
// c'est un lien tel: parfaitement valide, vers un numero parfaitement
// syntaxique.
//
// Le seul controle qui l'a attrape est une lecture manuelle. Cette regle
// existe pour que la prochaine fois ce soit la machine qui le dise, parce que
// la prochaine fois il n'y aura peut-etre pas de lecture manuelle.
//
// Un numero faux sur un site dont le seul appel a l'action est « appelez JB »
// coute un client par visiteur qui le compose. C'est le defaut le plus cher du
// site pour le moins de code.
//
// ── Ce qu'elle sait faire et ce qu'elle ignore ──────────────────────────────
// Elle ne juge pas si un numero est joignable, elle n'appelle personne. Elle
// verifie que tout numero ecrit dans le site figure dans la liste ci-dessous,
// et que le texte affiche correspond au numero compose. Un lien qui affiche
// un numero et en compose un autre est le piege classique du copier-coller.

// ── Les coordonnees declarees ───────────────────────────────────────────────
// Toute adresse ou tout numero absent de ces listes est une faute, pas un
// signal : il n'y a aucune raison legitime d'en introduire un sans le declarer
// ici. Ajouter une ligne ici est le geste volontaire qui manquait.
const TELEPHONES = {
  '+33660188787': '06 60 18 87 87',   // le portable de JB, partout sur le site
  '+33442328787': '04 42 32 87 87',   // le fixe, mentions legales uniquement
}
const COURRIELS = ['jbemeric@jbemeric.com']

// Les archives et les pages legales gardent leurs propres coordonnees.
//
// outil-dev/ est exclu pour une autre raison, et c'est le piege que
// docs/07 section 2 appelle « l'outil qui se compte lui-meme » : le contexte
// d'audit balaie tout le depot, y compris les regles. Ce fichier contient
// « mailto:([^"'\s?]+) », que la regle lisait comme une adresse de courriel
// nommee « ([^ ». Deux fausses fautes au premier essai, sur les deux seuls
// fichiers qui parlaient de contacts sans en contenir aucun.
const IGNORES = ['old/', 'admin/legal/', 'outil-dev/']

module.exports = {
  id: 'contacts',
  titre: 'COORDONNEES DE JB',
  reference: 'CLAUDE.md section 5',

  executer(ctx) {
    const anomalies = []
    let liens = 0

    const sources = [
      ...ctx.pages.map(p => ({ chemin: p.chemin, source: p.utile, page: p.chemin })),
      // Un numero vit plus souvent dans un script que dans une page : le pied
      // de page et les messages d'erreur sont construits en JavaScript.
      ...ctx.js.map(f => ({ chemin: f.chemin, source: f.code, page: null })),
    ].filter(s => !IGNORES.some(i => s.chemin.startsWith(i)))

    for (const s of sources) {
      // Le « ou » doit designer une page pour que l'audit sache ranger la
      // trouvaille dans le perimetre ou hors de lui. Un fichier .js n'en est
      // pas une : on lui attribue la premiere page qui le charge, et a defaut
      // la racine, sinon la trouvaille disparait du rapport.
      const ou = s.page || pagePorteuse(ctx, s.chemin) || 'index.html'

      for (const m of s.source.matchAll(/href="tel:(\+?[0-9]+)"[^>]*>([^<]*)</g)) {
        liens++
        const numero = m[1]
        const affiche = m[2].trim()

        if (!TELEPHONES[numero]) {
          anomalies.push({
            niveau: 'faute',
            ou,
            quoi: `${s.chemin} : le numero ${numero} n'est declare nulle part. `
                + `Numeros connus : ${Object.keys(TELEPHONES).join(', ')}. `
                + `Soit c'est une faute de saisie, soit il faut l'ajouter a outil-dev/audit/regles/contacts.js.`,
          })
          continue
        }
        // Le texte affiche peut etre autre chose qu'un numero, « Appeler JB »
        // par exemple. On ne compare que s'il ressemble a un numero.
        const ressembleAUnNumero = /^[0-9 .\-+()]{8,}$/.test(affiche)
        if (ressembleAUnNumero && affiche.replace(/\D/g, '') !== TELEPHONES[numero].replace(/\D/g, '')) {
          anomalies.push({
            niveau: 'faute',
            ou,
            quoi: `${s.chemin} : le lien compose ${numero} mais affiche « ${affiche} ». `
                + `Le visiteur croit appeler un numero et en appelle un autre.`,
          })
        }
      }

      for (const m of s.source.matchAll(/mailto:([^"'\s?]+)/g)) {
        liens++
        if (m[1] && !COURRIELS.includes(m[1])) {
          anomalies.push({
            niveau: 'faute',
            ou,
            quoi: `${s.chemin} : l'adresse « ${m[1]} » n'est pas celle de JB (${COURRIELS.join(', ')}).`,
          })
        }
      }
    }

    return {
      anomalies,
      resume: `${liens} lien(s) de contact verifie(s), `
            + `${Object.keys(TELEPHONES).length} numero(s) et ${COURRIELS.length} adresse(s) declares`,
    }
  },
}

// Quelle page charge ce script ? Sert uniquement a ranger la trouvaille.
function pagePorteuse(ctx, cheminJs) {
  const nom = cheminJs.split('/').pop()
  const p = ctx.pages.find(p => p.html.includes(nom))
  return p ? p.chemin : null
}
