// Regle : ne pas confondre une piste de karting et un circuit automobile.
//
// ── Pourquoi elle existe ────────────────────────────────────────────────────
// Correction de Yoan, 9 aout 2026 : « Fais attention de pas confondre circuit
// de karting (Brignoles) avec circuit de voiture, le Luc par exemple. Pas la
// meme chose. »
//
// Il avait raison, et le defaut ne venait pas que de moi. Cinq evenements de la
// table events placent une Caterham ou une voiture personnelle au Circuit de
// Brignoles. Le site range pourtant Brignoles parmi les cinq partenaires
// karting, aux cotes de Trets, Hyeres, La Penne et Cuges, sur trois pages
// differentes. paddock.html annonce meme « Roulage circuit, Caterham et voiture
// perso, Circuit de Brignoles » en dur dans son HTML, et la description Google
// de track.html cite Brignoles parmi les circuits automobiles.
//
// Envoyer un pilote avec sa voiture sur une piste de karting est le genre
// d'erreur qui coute un client pour de bon. C'est aussi typiquement ce qu'aucun
// outil ne pouvait voir : les deux mots sont justes separement.
//
// ── Ce qu'elle ne sait pas faire ────────────────────────────────────────────
// Elle ne connait pas la verite du terrain. Elle applique la liste ci-dessous,
// qui vient du site lui-meme et de la correction de Yoan. Un circuit qui
// accueille reellement les deux se declare 'mixte' et cesse d'etre signale.
//
// Elle ne lit pas la base. Les cinq evenements fautifs vivent dans Supabase,
// hors de portee de l'audit de fichiers. Ils sont signales dans docs/05.

// ── Les pistes, telles que le site les declare ──────────────────────────────
// Brignoles est ici en karting sur la correction de Yoan du 9 aout, alors que
// site-data.js et la table circuits disent tous deux « kart + auto ». Ces deux
// sources sont d'accord entre elles et en desaccord avec lui. Le jour ou il
// confirme qu'on y roule vraiment en voiture, passer la ligne en 'mixte'.
const PISTES = {
  'Brignoles':            'karting',
  'KIP La Penne':         'karting',
  'La Penne-sur-Huveaune': 'karting',
  'Trets':                'karting',
  'Hyères':               'karting',
  'Cuges-les-Pins':       'karting',
  'Grand Sambuc':         'auto',
  'Lédenon':              'auto',
  'Paul Ricard':          'auto',
  'Nogaro':               'auto',
  'Magny-Cours':          'auto',
  'Dijon-Prenois':        'auto',
  'Spa-Francorchamps':    'auto',
  'Monza':                'auto',
  'Catalunya':            'auto',
}
// « Circuit du Luc » se lit par « Luc », trop court pour etre cherche seul sans
// tomber sur « Lucas » ou « lucarne ». On exige donc le mot circuit devant.
const PISTES_EXIGEANTES = { 'Circuit du Luc': 'auto', 'Circuit du Var': 'auto' }

// ── Ce que la regle cherche, et pourquoi si peu ─────────────────────────────
// Premier essai, le 9 aout : tout mot de voiture pres d'une piste de karting,
// et l'inverse. Vingt-cinq fautes, presque toutes fausses. Une page qui
// presente l'offre entiere cite forcement les deux mondes : l'accueil nomme le
// Grand Sambuc a trois lignes du mot karting sans rien confondre, et la page
// karting adulte cite Magny-Cours en parlant du parcours vers la competition.
//
// Le defaut reel est plus etroit. Il n'est pas que les deux mots se croisent,
// il est qu'un vehicule nomme soit attache a une piste de karting. C'est le
// seul cas qui envoie quelqu'un au mauvais endroit avec sa voiture.
//
// La regle ne cherche donc que ca : un vehicule identifiable, colle a une piste
// de karting. Le sens inverse est abandonne, une piste automobile citee sur une
// page de karting est presque toujours le palmares ou le chemin vers la
// competition.
const VEHICULE_NOMME = /\b(caterham|206 s16|lotus|elise|porsche|ferrari|bmw \d|voiture perso(nnelle)?|votre voiture)\b/i

// Fenetre serree : un vehicule et une piste dans la meme carte, la meme ligne
// de tableau, le meme titre. Au dela, ils ne se parlent plus.
const FENETRE = 70

module.exports = {
  id: 'circuits',
  titre: 'KARTING ET AUTOMOBILE, NE PAS CONFONDRE',
  reference: 'correction de Yoan du 9 aout 2026',

  executer(ctx) {
    const anomalies = []
    let examines = 0

    const toutes = Object.assign({}, PISTES, PISTES_EXIGEANTES)

    for (const page of ctx.pages) {
      // Le cache du live-editor et les commentaires sont deja retires de
      // « visible ». On juge ce que le visiteur lit, plus les metadonnees, qui
      // sont ce que Google affiche.
      const source = page.visible
      for (const nom of Object.keys(toutes)) {
        const nature = toutes[nom]
        let depart = 0
        for (;;) {
          const i = source.indexOf(nom, depart)
          if (i === -1) break
          depart = i + nom.length
          examines++

          if (nature !== 'karting') continue

          const zone = source.slice(Math.max(0, i - FENETRE), i + nom.length + FENETRE)
          const m = zone.match(VEHICULE_NOMME)
          if (!m) continue

          anomalies.push({
            niveau: 'faute',
            ou: page.chemin,
            quoi: `« ${nom} » est une piste de karting, et « ${m[0]} » lui est attache. `
                + `Un pilote pourrait y venir avec sa voiture.`,
          })
        }
      }
    }

    return {
      anomalies,
      resume: `${examines} mention(s) de piste examinee(s), `
            + `${Object.keys(toutes).length} pistes declarees`,
    }
  },
}
