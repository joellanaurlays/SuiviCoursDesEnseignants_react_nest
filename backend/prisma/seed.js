/**
 * Seed du module « Suivi des enseignements » — jeu de données de test.
 *
 * À exécuter volontairement :   npx prisma db seed
 *
 * GARANTIES
 * ---------
 * - NON DESTRUCTIF : ce script ne supprime jamais aucune ligne. Il n'utilise ni
 *   `delete`, ni `deleteMany`, ni `truncate`. Les données déjà présentes dans la
 *   base sont conservées.
 * - IDEMPOTENT    : les enseignements portent un `id` fixe et les séances une clé
 *   naturelle (enseignementId + dateSeance + heureDebut). Relancer le script
 *   dans n'importe quel ordre ne crée aucun doublon.
 * - REPRODUCTIBLE : toutes les dates et tous les identifiants sont figés, le
 *   résultat ne dépend ni de l'heure d'exécution ni du contenu antérieur de la
 *   base.
 * - COHÉRENT      : les durées sont recalculées depuis heureDebut/heureFin, comme
 *   le fait le serveur. Les colonnes agrégées (heuresRealisees, progression,
 *   etat) ne sont PAS écrites ici : `npm run db:reparer-suivi` les resynchronise
 *   avec les séances via l'unique règle métier
 *   (backend/src/enseignements/domain/calcul-suivi.ts).
 *
 * COUVERTURE DES SCÉNARIOS MÉTIER
 * -------------------------------
 *   seed-enseig-30h-non-commence         0 h  / 30 h  ->   0 %  NON_COMMENCE
 *   seed-enseig-30h-60pct               18 h  / 30 h  ->  60 %  EN_COURS
 *   seed-enseig-30h-cloture-anticipee   27 h  / 30 h  ->  90 %  EN_COURS  (à clôturer via l'API)
 *   seed-enseig-30h-termine             30 h  / 30 h  -> 100 %  TERMINE
 *   seed-enseig-30h-depasse             32 h  / 30 h  -> 100 %  TERMINE (plafonné, 0 restante)
 *   seed-enseig-master-info-40h        10 h  / 40 h  ->  25 %  EN_COURS  (perimètre MASTER)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Durée d'une séance, recalculée depuis ses horaires.
 * Replique backend/src/enseignements/domain/calcul-suivi.ts : la base ne peut
 * donc pas contenir une durée incohérente avec l'horaire affiché.
 */
function duree(heureDebut, heureFin) {
  const [hD, mD] = heureDebut.split(':').map(Number);
  const [hF, mF] = heureFin.split(':').map(Number);
  const minutes = hF * 60 + mF - (hD * 60 + mD);
  if (minutes <= 0) {
    throw new Error(` horaire invalide : ${heureDebut} -> ${heureFin}`);
  }
  return minutes / 60;
}

/** Seance de test : la durée est déduite, jamais saisie à la main. */
function seance(dateSeance, heureDebut, heureFin, statut, contenuEnseigne) {
  return { dateSeance, heureDebut, heureFin, statut, contenuEnseigne, duree: duree(heureDebut, heureFin) };
}

// ---------------------------------------------------------------------------
// Jeu de données : 5 enseignements couvrant tous les états + 1 périmètre MASTER
// ---------------------------------------------------------------------------

const ENSEIGNEMENTS = [
  {
    id: 'seed-enseig-30h-non-commence',
    matiereId: 'Algebre',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Mathematiques',
    parcours: 'Mathematiques',
    cycle: 'LICENCE',
    niveauId: 'L3',
    semestreId: 'S5',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    attendu: '0 h / 30 h -> 0 % -> NON_COMMENCE, 30 h restantes',
    seances: [
      seance('2026-10-01T08:00:00Z', '08:00', '10:00', 'PLANIFIEE', 'Groupes, sous-groupes et morphismes'),
      seance('2026-10-08T08:00:00Z', '08:00', '10:00', 'PLANIFIEE', 'Anneaux et corps commutatifs'),
    ],
  },
  {
    id: 'seed-enseig-30h-60pct',
    matiereId: 'Base de donnees',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Informatique',
    parcours: 'DA2I',
    cycle: 'LICENCE',
    niveauId: 'L2',
    semestreId: 'S1',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    // 3 h + 5 h + 10 h = 18 h REALISEE -> 60 %, EN_COURS, 12 h restantes.
    // Une séance PLANIFIEE et une séance ANNULEE ne doivent pas compter.
    attendu: '18 h / 30 h -> 60 % -> EN_COURS, 12 h restantes',
    seances: [
      seance('2026-09-07T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Introduction aux bases de donnees'),
      seance('2026-09-09T08:00:00Z', '08:00', '13:00', 'REALISEE', 'Modele relationnel et normalisation'),
      seance('2026-09-14T08:00:00Z', '08:00', '18:00', 'REALISEE', 'SQL : requetage et optimisation'),
      seance('2026-10-05T08:00:00Z', '08:00', '11:00', 'PLANIFIEE', 'Transactions et concurrence'),
      seance('2026-09-16T08:00:00Z', '08:00', '11:00', 'ANNULEE', 'JDBC : report, salle indisponible'),
    ],
  },
  {
    id: 'seed-enseig-30h-cloture-anticipee',
    matiereId: 'Systemes et reseaux',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Informatique',
    parcours: 'DA2I',
    cycle: 'LICENCE',
    niveauId: 'L2',
    semestreId: 'S1',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    // 9 x 3 h = 27 h REALISEE -> 90 %, EN_COURS, 3 h restantes.
    // Volontairement NON clôture par le seed : la clôture anticipée se teste
    // via POST /enseignements/:id/cloture, elle ne doit pas être pré-positionnée.
    attendu: '27 h / 30 h -> 90 % -> EN_COURS, 3 h restantes (a cloturer via l API)',
    seances: [
      seance('2026-09-01T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Presentation des protocoles'),
      seance('2026-09-03T08:00:00Z', '08:00', '11:00', 'REALISEE', 'TCP et UDP'),
      seance('2026-09-08T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Adressage IP et sous-reseaux'),
      seance('2026-09-10T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Routage et tables de routage'),
      seance('2026-09-15T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Serveurs DHCP et DNS'),
      seance('2026-09-17T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Web et services HTTP'),
      seance('2026-09-22T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Securite des reseaux'),
      seance('2026-09-24T08:00:00Z', '08:00', '11:00', 'REALISEE', 'VPN et tunneling'),
      seance('2026-09-29T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Projet fil rouge'),
      seance('2026-10-06T08:00:00Z', '08:00', '11:00', 'PLANIFIEE', 'Evaluation finale'),
    ],
  },
  {
    id: 'seed-enseig-30h-termine',
    matiereId: 'Probabilites',
    enseignantId: 'Professeur Andry',
    mentionId: 'Mathematiques',
    parcours: 'Statistique',
    cycle: 'MASTER',
    niveauId: 'M2',
    semestreId: 'S4',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    // 12 h + 12 h + 6 h = 30 h REALISEE -> 100 %, TERMINE, cloture NORMALE.
    attendu: '30 h / 30 h -> 100 % -> TERMINE, cloture normale',
    seances: [
      seance('2026-09-01T08:00:00Z', '08:00', '20:00', 'REALISEE', 'Espace probabiliste'),
      seance('2026-09-02T08:00:00Z', '08:00', '20:00', 'REALISEE', 'Variables aleatoires'),
      seance('2026-09-03T08:00:00Z', '08:00', '14:00', 'REALISEE', 'Estimateurs et convergence'),
    ],
  },
  {
    id: 'seed-enseig-30h-depasse',
    matiereId: 'Anglais technique',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Informatique',
    parcours: 'DA2I',
    cycle: 'LICENCE',
    niveauId: 'L2',
    semestreId: 'S1',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 30,
    // 12 h + 10 h + 6 h + 4 h = 32 h REALISEE -> progression plafonnee a 100 %,
    // heuresRestantes bornees a 0 par max(volumePrevu - heuresRealisees, 0).
    attendu: '32 h / 30 h -> 100 % -> TERMINE, 0 h restante',
    seances: [
      seance('2026-09-02T08:00:00Z', '08:00', '20:00', 'REALISEE', 'Communication professionnelle'),
      seance('2026-09-09T08:00:00Z', '08:00', '18:00', 'REALISEE', 'Documentation technique'),
      seance('2026-09-16T08:00:00Z', '08:00', '14:00', 'REALISEE', 'Presentations de projet'),
      seance('2026-09-23T08:00:00Z', '08:00', '12:00', 'REALISEE', 'Entretiens et negociation'),
    ],
  },
  {
    id: 'seed-enseig-master-info-40h',
    matiereId: 'Intelligence artificielle',
    enseignantId: 'Professeur Rakoto',
    mentionId: 'Informatique',
    parcours: 'Science des donnees',
    cycle: 'MASTER',
    niveauId: 'M2',
    semestreId: 'S3',
    anneeUniversitaireId: '2026-2027',
    volumePrevu: 40,
    // 3 h + 3 h + 4 h = 10 h REALISEE -> 25 %, EN_COURS.
    // Enseignement MASTER : il distingue le perimetre d'un responsable Master de
    // celui d'un responsable Licence sur la meme mention.
    attendu: '10 h / 40 h -> 25 % -> EN_COURS (perimetre MASTER)',
    seances: [
      seance('2026-09-04T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Recherche d espace de recherche'),
      seance('2026-09-11T08:00:00Z', '08:00', '11:00', 'REALISEE', 'Algorithmes d apprentissage'),
      seance('2026-09-18T08:00:00Z', '08:00', '12:00', 'REALISEE', 'Reseaux de neurones'),
      seance('2026-10-02T08:00:00Z', '08:00', '12:00', 'PLANIFIEE', 'Projet industriel'),
    ],
  },
];

/**
 * Crée un enseignement s'il est absent, sans jamais modifier un enregistrement
 * existant. `upsert` avec un `update` vide : si la ligne existe, Prisma ne fait
 * rien du tout.
 */
async function upsertEnseignement({ id, seances, attendu, ...champs }) {
  const avant = await prisma.enseignement.findUnique({ where: { id } });

  await prisma.enseignement.upsert({
    where: { id },
    update: {},
    create: { ...champs, id },
  });

  let creees = 0;
  for (const s of seances) {
    const donnees = { ...s, dateSeance: new Date(s.dateSeance), enseignementId: id };
    // Clé naturelle : une même date + un même début = la même séance.
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

  if (avant) {
    console.log(`  = ${id} deja present, ${creees} seance(s) ajoutee(s) — attendu : ${attendu}`);
  } else {
    console.log(`  + ${id} cree, ${creees} seance(s) — attendu : ${attendu}`);
  }
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
