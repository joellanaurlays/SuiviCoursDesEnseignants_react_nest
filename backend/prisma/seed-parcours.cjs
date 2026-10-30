/**
 * Seed du module « Suivi des enseignements » — adaptation aux 6 parcours EMIT.
 *
 * À exécuter volontairement :   node prisma/seed-parcours.cjs
 * (ou : npm run db:parcours)
 *
 * POURQUOI CE SEED
 * ----------------
 * L'organisation académique réelle de l'EMIT distingue six parcours :
 *   Licence Informatique, Licence Management, Licence ICM,
 *   Master  Informatique, Master  Management, Master  ICM.
 * La base de test historique ne contenait aucune donnée pour ces parcours.
 * Ce script ajoute le jeu de données MINIMAL permettant de démontrer la
 * séparation stricte des périmètres sans rien supprimer.
 *
 * GARANTIES
 * ---------
 * - NON DESTRUCTIF : aucune suppression (`delete`/`deleteMany`/`truncate`).
 *   Les enseignements et séances existants (DA2I, Genie Logiciel, ...) sont
 *   conservés intacts.
 * - IDEMPOTENT     : identifiants fixes pour les enseignements, clé naturelle
 *   (enseignementId + dateSeance + heureDebut) pour les séances. Relancer le
 *   script ne crée aucun doublon.
 * - REPRODUCTIBLE  : dates et identifiants figés.
 * - COHÉRENT      : les durées sont déduites des horaires, comme le serveur.
 *   Les colonnes agrégées (heuresRealisees, progression, etat) sont
 *   resynchronisées par `npm run db:reparer-suivi` via l'unique règle métier
 *   (backend/src/enseignements/domain/calcul-suivi.ts).
 *
 * Le `parcours` est la dimension de responsabilité : informatique, management,
 * icm — toujours combinée au `cycle` (Licence / Master).
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Durée d'une séance en heures, déduite de l'horaire (jamais saisie). */
function duree(heureDebut, heureFin) {
  const [hD, mD] = heureDebut.split(':').map(Number);
  const [hF, mF] = heureFin.split(':').map(Number);
  const minutes = hF * 60 + mF - (hD * 60 + mD);
  if (minutes <= 0) {
    throw new Error(`horaire invalide : ${heureDebut} -> ${heureFin}`);
  }
  return minutes / 60;
}

function seance(dateSeance, heureDebut, heureFin, statut, contenuEnseigne) {
  return {
    dateSeance,
    heureDebut,
    heureFin,
    statut,
    contenuEnseigne,
    duree: duree(heureDebut, heureFin),
  };
}

// ---------------------------------------------------------------------------
// Deux enseignements par parcours, avec des états variés
// ---------------------------------------------------------------------------
const ENSEIGNEMENTS = [
  // ---------------------------------------------------------------- Licence Informatique
  {
    id: 'seed-emit-li-info-1',
    matiereId: 'Algorithmique avancee',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Informatique',
    parcours: 'Informatique',
    cycle: 'LICENCE',
    niveauId: 'L2',
    semestreId: 'S3',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    seances: [
      seance('2026-09-08T08:00:00Z', '08:00', '14:00', 'REALISEE', 'Complexite et structures'),
      seance('2026-09-15T08:00:00Z', '08:00', '14:00', 'REALISEE', 'Graphes et parcours'),
      seance('2026-09-22T08:00:00Z', '08:00', '14:00', 'REALISEE', 'Algorithmes gloutons'),
    ],
  },
  {
    id: 'seed-emit-li-info-2',
    matiereId: 'Programmation web',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Informatique',
    parcours: 'Informatique',
    cycle: 'LICENCE',
    niveauId: 'L3',
    semestreId: 'S5',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    seances: [
      seance('2026-09-09T08:00:00Z', '08:00', '18:00', 'REALISEE', 'HTML/CSS et mise en page'),
      seance('2026-09-16T08:00:00Z', '08:00', '18:00', 'REALISEE', 'JavaScript cote client'),
      seance('2026-09-23T08:00:00Z', '08:00', '18:00', 'REALISEE', 'API REST et integration'),
    ],
  },

  // ---------------------------------------------------------------- Licence Management
  {
    id: 'seed-emit-li-mgt-1',
    matiereId: 'Introduction a la gestion',
    enseignantId: 'Professeur Rasoa',
    mentionId: 'Management',
    parcours: 'Management',
    cycle: 'LICENCE',
    niveauId: 'L1',
    semestreId: 'S1',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 24,
    seances: [
      seance('2026-10-05T08:00:00Z', '08:00', '10:00', 'PLANIFIEE', 'Notions d entreprise'),
    ],
  },
  {
    id: 'seed-emit-li-mgt-2',
    matiereId: 'Comptabilite generale',
    enseignantId: 'Professeur Rasoa',
    mentionId: 'Management',
    parcours: 'Management',
    cycle: 'LICENCE',
    niveauId: 'L2',
    semestreId: 'S4',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 36,
    seances: [
      seance('2026-09-10T08:00:00Z', '08:00', '12:00', 'REALISEE', 'Bilan et compte de resultat'),
      seance('2026-09-17T08:00:00Z', '08:00', '12:00', 'REALISEE', 'Ecritures comptables'),
      seance('2026-09-24T08:00:00Z', '08:00', '12:00', 'REALISEE', 'Travaux de cloture'),
    ],
  },

  // ---------------------------------------------------------------- Licence ICM
  {
    id: 'seed-emit-li-icm-1',
    matiereId: 'Communication professionnelle',
    enseignantId: 'Professeur Jaona',
    mentionId: 'ICM',
    parcours: 'ICM',
    cycle: 'LICENCE',
    niveauId: 'L2',
    semestreId: 'S3',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    seances: [
      seance('2026-09-11T08:00:00Z', '08:00', '13:00', 'REALISEE', 'Communication ecrite'),
      seance('2026-09-18T08:00:00Z', '08:00', '13:00', 'REALISEE', 'Communication orale'),
      seance('2026-09-25T08:00:00Z', '08:00', '13:00', 'REALISEE', 'Mediation culturelle'),
    ],
  },
  {
    id: 'seed-emit-li-icm-2',
    matiereId: 'Multimedia et creation',
    enseignantId: 'Professeur Jaona',
    mentionId: 'ICM',
    parcours: 'ICM',
    cycle: 'LICENCE',
    niveauId: 'L3',
    semestreId: 'S5',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    // Cloture anticipee volontaire : 27 h / 30 h -> 90 %, TERMINE (ANTICIPEE).
    clotureAnticipee: true,
    motifCloture: 'Contenu pedagogique termine, projet final valide.',
    dateCloture: '2026-10-01T10:00:00Z',
    seances: [
      seance('2026-09-12T08:00:00Z', '08:00', '17:00', 'REALISEE', 'Montage video'),
      seance('2026-09-19T08:00:00Z', '08:00', '17:00', 'REALISEE', 'Design graphique'),
      seance('2026-09-26T08:00:00Z', '08:00', '17:00', 'REALISEE', 'Projet multimedia'),
    ],
  },

  // ---------------------------------------------------------------- Master Informatique
  {
    id: 'seed-emit-ma-info-1',
    matiereId: 'Apprentissage automatique',
    enseignantId: 'Professeur Andrianina',
    mentionId: 'Informatique',
    parcours: 'Informatique',
    cycle: 'MASTER',
    niveauId: 'M1',
    semestreId: 'S7',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 40,
    seances: [
      seance('2026-09-14T08:00:00Z', '08:00', '13:00', 'REALISEE', 'Apprentissage supervise'),
      seance('2026-09-21T08:00:00Z', '08:00', '13:00', 'REALISEE', 'Evaluation de modeles'),
    ],
  },
  {
    id: 'seed-emit-ma-info-2',
    matiereId: 'Architecture logicielle avancee',
    enseignantId: 'Professeur Andrianina',
    mentionId: 'Informatique',
    parcours: 'Informatique',
    cycle: 'MASTER',
    niveauId: 'M2',
    semestreId: 'S9',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    seances: [
      seance('2026-10-06T08:00:00Z', '08:00', '12:00', 'PLANIFIEE', 'Microservices'),
    ],
  },

  // ---------------------------------------------------------------- Master Management
  {
    id: 'seed-emit-ma-mgt-1',
    matiereId: 'Management strategique',
    enseignantId: 'Professeur Hery',
    mentionId: 'Management',
    parcours: 'Management',
    cycle: 'MASTER',
    niveauId: 'M1',
    semestreId: 'S8',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 20,
    seances: [
      seance('2026-09-13T08:00:00Z', '08:00', '18:00', 'REALISEE', 'Diagnostic strategique'),
      seance('2026-09-20T08:00:00Z', '08:00', '18:00', 'REALISEE', 'Plan d action'),
    ],
  },
  {
    id: 'seed-emit-ma-mgt-2',
    matiereId: 'Gestion de projet',
    enseignantId: 'Professeur Hery',
    mentionId: 'Management',
    parcours: 'Management',
    cycle: 'MASTER',
    niveauId: 'M2',
    semestreId: 'S10',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 24,
    seances: [
      seance('2026-09-15T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Cadrage et planning'),
      seance('2026-09-22T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Suivi et risques'),
      seance('2026-09-29T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Cloture de projet'),
    ],
  },

  // ---------------------------------------------------------------- Master ICM
  {
    id: 'seed-emit-ma-icm-1',
    matiereId: 'Communication numerique',
    enseignantId: 'Professeur Naina',
    mentionId: 'ICM',
    parcours: 'ICM',
    cycle: 'MASTER',
    niveauId: 'M1',
    semestreId: 'S7',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    seances: [
      seance('2026-10-07T08:00:00Z', '08:00', '11:00', 'PLANIFIEE', 'Strategie digitale'),
    ],
  },
  {
    id: 'seed-emit-ma-icm-2',
    matiereId: 'Mediation et culture',
    enseignantId: 'Professeur Naina',
    mentionId: 'ICM',
    parcours: 'ICM',
    cycle: 'MASTER',
    niveauId: 'M2',
    semestreId: 'S9',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    seances: [
      seance('2026-09-16T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Theories de la mediation'),
      seance('2026-09-23T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Etude de cas'),
    ],
  },
];

/**
 * Crée un enseignement s'il est absent, sans jamais modifier un enregistrement
 * existant. `upsert` avec un `update` vide : si la ligne existe, Prisma ne fait
 * rien du tout (données préservées).
 */
async function upsertEnseignement({ id, seances, ...champs }) {
  const avant = await prisma.enseignement.findUnique({ where: { id } });

  await prisma.enseignement.upsert({
    where: { id },
    update: {},
    create: { ...champs, id },
  });

  let creees = 0;
  for (const s of seances) {
    const donnees = { ...s, dateSeance: new Date(s.dateSeance), enseignementId: id };
    const existante = await prisma.seance.findFirst({
      where: {
        enseignementId: id,
        dateSeance: donnees.dateSeance,
        heureDebut: s.heureDebut,
      },
      select: { id: true },
    });
    if (existante) continue;
    await prisma.seance.create({ data: donnees });
    creees += 1;
  }

  console.log(
    avant
      ? `  = ${id} deja present, ${creees} seance(s) ajoutee(s)`
      : `  + ${id} cree, ${creees} seance(s)`,
  );
}

async function main() {
  const totalAvant = await prisma.enseignement.count();
  const seancesAvant = await prisma.seance.count();

  for (const enseignement of ENSEIGNEMENTS) {
    await upsertEnseignement(enseignement);
  }

  const totalApres = await prisma.enseignement.count();
  const seancesApres = await prisma.seance.count();

  console.log('');
  console.log(`enseignements : ${totalAvant} -> ${totalApres}`);
  console.log(`seances       : ${seancesAvant} -> ${seancesApres}`);
  console.log('Agregats recalcules par : npm run db:reparer-suivi');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
