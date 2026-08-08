// Regle : l'antithese, marque de fabrique du ton IA.
//
// Demande de Yoan, 7 aout 2026 : « sur le site il y a plein de phrases du type
// "blablabla" pas un "blablabla", c'est typiquement le genre de phrase IA que
// je deteste et qu'un etre humain detecte. »
//
// La forme : une affirmation, une virgule, puis la negation d'un contre-exemple
// que personne n'avait propose.
//
//   JB EMERIC forme des pilotes qui courent en championnat, pas des clients
//   qui se promenent sur un circuit.
//
// Le contre-exemple est un homme de paille. Personne n'a pretendu que JB
// formait des promeneurs. La seconde moitie n'apporte rien, elle sert a faire
// sonner la premiere, et repetee quinze fois elle donne le rythme mecanique.
//
// L'interdit existait depuis le 1er aout, formule en une ligne. Il n'a pas
// pris, entre autres parce que les fichiers de consignes employaient
// eux-memes la tournure en l'interdisant. Ce qui n'est pas mesure ne se
// corrige pas, d'ou cette regle.
//
// ── Toujours un signal, jamais une faute ────────────────────────────────────
// Le francais emploie « pas » a longueur de phrase pour de bonnes raisons.
// « Il n'y a aucun engagement, pas de duree minimum » est legitime. Seul un
// humain sait si le contre-exemple est un homme de paille ou une precision
// utile. La regle compte et montre, elle ne condamne pas.

// Une affirmation, une virgule, « pas », puis un groupe nominal. Le determinant
// est ce qui distingue la tournure d'une negation ordinaire : « , pas des
// clients » contre « , on ne peut pas tricher ».
const ANTITHESE = /,\s+pas\s+(?:des|du|de\s+la|de\s+l'|un|une|le|la|les|juste|seulement|celui|ceux|celle|celles|pour)\b[^.!?]*/gi

// Variantes du meme defaut, formulees autrement.
//
// La derniere merite un mot : « Ce que j'enseigne, je l'ai vecu en competition.
// Pas dans un manuel. » Le point remplace la virgule, le contre-exemple devient
// une phrase a lui seul, et l'effet est le meme en plus appuye.
const VARIANTES = [
  { motif: /\bce n'est pas\s[^.!?]*?,\s*c'est\b[^.!?]*/gi, nom: 'ce n\'est pas X, c\'est Y' },
  { motif: /\bnon pas\s[^.!?]*?\bmais\b[^.!?]*/gi, nom: 'non pas X mais Y' },
  { motif: /\bplus qu'un\b[^.!?]*/gi, nom: 'plus qu\'un X, un Y' },
  { motif: /[.!?]\s+Pas\s+(?:de|d'|dans|un|une|le|la|les|juste|seulement)\b[^.!?]*/g, nom: 'phrase entiere en negation' },
]

// Le texte saisi par JB dans le live-editor ne se juge pas, ce n'est pas notre
// ecriture. ctx.pages[].visible l'a deja retire, avec les commentaires.
// Les fichiers de l'audit s'excluent : celui-ci contient les exemples.
const EXCLUS = /^outil-dev\/audit\//

function phrases(html) {
  // Les descriptions meta d'abord. Elles vivent dans des attributs, donc le
  // nettoyage ci-dessous les effacerait, et ce sont pourtant elles que Google
  // affiche. Le 8 aout, « une vraie formation pour courir en championnat, pas
  // du loisir » se cachait la, invisible pour la regle.
  const metas = [...html.matchAll(/<meta[^>]*(?:name|property)="(?:description|og:description|twitter:description)"[^>]*content="([^"]*)"/gi)]
    .map(m => m[1])
    .join('. ')

  // Puis le texte entre balises, sans les valeurs d'attributs.
  const corps = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')

  return metas + '. ' + corps
}

module.exports = {
  id: 'ton-ia',
  titre: 'Ton IA, tournures antithetiques',
  reference: 'D-007, docs/04 section 1.1',

  executer(ctx) {
    const anomalies = []
    let total = 0

    for (const p of ctx.pages) {
      const texte = phrases(p.visible)
      const trouvees = []

      for (const m of texte.matchAll(ANTITHESE)) {
        trouvees.push({ nom: 'antithese', extrait: m[0].trim() })
      }
      for (const v of VARIANTES) {
        for (const m of texte.matchAll(v.motif)) {
          trouvees.push({ nom: v.nom, extrait: m[0].trim() })
        }
      }

      total += trouvees.length
      for (const t of trouvees) {
        anomalies.push({
          niveau: 'signal',
          ou: p.chemin,
          quoi: `${t.nom} : « ...${t.extrait.slice(0, 88)} »`,
        })
      }
    }

    // Les consignes doivent respecter ce qu'elles demandent. Le 7 aout, six
    // occurrences se cachaient dans les fichiers qui interdisent la tournure.
    for (const doc of ['docs/04-contenus-seo.md', '.claude/agents/jbe-editorial.md', 'CLAUDE.md']) {
      let source
      try { source = ctx.lire(doc) } catch (e) { continue }
      // Un exemple qui montre le defaut n'est pas le defaut. On retire les
      // blocs de citation, les listes a puces entre guillemets, et tout ce qui
      // est encadre par des guillemets francais : c'est ainsi que ces fichiers
      // citent les tournures qu'ils interdisent.
      const sansExemples = source
        .split('\n')
        .filter(l => !l.trim().startsWith('>') && !l.trim().startsWith('- «'))
        .join('\n')
        .replace(/«[^»]*»/g, ' ')
      for (const m of sansExemples.matchAll(ANTITHESE)) {
        total++
        anomalies.push({
          niveau: 'signal',
          ou: doc,
          quoi: `la consigne emploie la tournure qu'elle interdit : « ...${m[0].trim().slice(0, 80)} »`,
        })
      }
    }

    return {
      anomalies,
      resume: total ? `${total} tournure(s) a relire` : 'aucune tournure antithetique',
    }
  },
}
