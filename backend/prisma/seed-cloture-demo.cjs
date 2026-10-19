/*
 * Donnees de demonstration pour tester la cloture anticipee des enseignements.
 *
 *   node prisma/seed-cloture-demo.cjs            cree les donnees de demonstration
 *   node prisma/seed-cloture-demo.cjs --force    recree les donnees de demonstration
 *   node prisma/seed-cloture-demo.cjs --clean    supprime uniquement ces donnees
 *
 * Les lignes creees portent le marqueur MARQUEUR dans anneeUniversitaireId :
 * elles sont visibles dans l'interface et la suppression ne touche jamais
 * une autre donnee de la base.
 *
 * Les agregats (heuresRealisees, progression, etat) sont recalcules ici avec
 * la meme regle que backend/src/enseignements/domain/calcul-suivi.ts.
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const MARQUEUR = 'TEST-2026-2027';
const ENSEIGNANT = 'Professeur Rakoto';
const AUTRE_ENSEIGNANT = 'Professeur Andrianina';
const MENTION = 'Informatique';

/** Une seance de demonstration. */
function seance(date, debut, fin, duree, statut, contenu) {
  return { dateSeance: date, heureDebut: debut, heureFin: fin, duree, statut, contenuEnseigne: contenu };
}

const ENSEIGNEMENTS = [
  {
    matiereId: 'Reseaux informatiques',
    enseignantId: ENSEIGNANT,
    volumePrevu: 30,
    // 21 h realisees sur 30 h prevues -> EN_COURS a 70 %, cloturable par l'enseignant.
    seances: [
      seance('2026-09-07T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Modele OSI et couches'),
      seance('2026-09-09T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Couche physique : supports et transmission'),
      seance('2026-09-14T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Couche liaison de donnees'),
      seance('2026-09-16T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Protocole ARP et adresses MAC'),
      seance('2026-09-18T08:00:00Z', '08:00', '11:00', 3, 'ANNULEE', 'Reseau local : report'),
      seance('2026-09-21T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Couche reseau et adressage IP'),
      seance('2026-09-23T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Routage et tables de routage'),
      seance('2026-09-25T08:00:00Z', '08:00', '11:00', 3, 'REALISEE', 'Protocoles TCP et UDP'),
      seance('2026-10-05T08:00:00Z', '08:00', '11:00', 3, 'PLANIFIEE', 'Couche application'),
      seance('2026-10-07T08:00:00Z', '08:00', '11:00', 3, 'PLANIFIEE', 'Securite des reseaux'),
    ],
  },
  {
    matiereId: 'Systemes d exploitation',
    enseignantId: ENSEIGNANT,
    volumePrevu: 24,
    // Aucune seance realisee -> NON_COMMENCE, la cloture doit etre refusee.
    seances: [
      seance('2026-10-12T08:00:00Z', '08:00', '10:00', 2, 'PLANIFIEE', 'Gestion des processus'),
      seance('2026-10-13T08:00:00Z', '08:00', '10:00', 2, 'PLANIFIEE', 'Ordonnancement'),
      seance('2026-10-14T08:00:00Z', '08:00', '10:00', 2, 'PLANIFIEE', 'Synchronisation'),
    ],
  },
  {
    matiereId: 'Compilation',
    enseignantId: ENSEIGNANT,
    volumePrevu: 12,
    // Volume atteint -> TERMINE, cloture normale, cloture refusee.
    seances: [
      seance('2026-09-01T08:00:00Z', '08:00', '10:00', 2, 'REALISEE', 'Analyse lexicale'),
      seance('2026-09-03T08:00:00Z', '08:00', '10:00', 2, 'REALISEE', 'Analyse syntaxique'),
      seance('2026-09-08T08:00:00Z', '08:00', '10:00', 2, 'REALISEE', 'Analyse semantique'),
      seance('2026-09-10T08:00:00Z', '08:00', '10:00', 2, 'REALISEE', 'Generateur de code'),
      seance('2026-09-15T08:00:00Z', '08:00', '10:00', 2, 'REALISEE', 'Optimisations'),
      seance('2026-09-17T08:00:00Z', '08:00', '10:00', 2, 'REALISEE', 'Projets compiles'),
    ],
  },
  {
    matiereId: 'Genie logiciel (a cloturer)',
    enseignantId: ENSEIGNANT,
    volumePrevu: 20,
    // 9 h realisees sur 20 h prevues -> EN_COURS a 45 %, laisse volontairement
    // ouvert pour tester la cloture anticipee depuis l'interface.
    seances: [
      seance('2026-09-08T13:00:00Z', '13:00', '16:00', 3, 'REALISEE', 'Cycle de vie et modeles'),
      seance('2026-09-10T13:00:00Z', '13:00', '16:00', 3, 'REALISEE', 'Diagrammes UML'),
      seance('2026-09-15T13:00:00Z', '13:00', '16:00', 3, 'REALISEE', 'Patrons de conception'),
      seance('2026-10-06T13:00:00Z', '13:00', '16:00', 3, 'PLANIFIEE', 'Tests et integration continue'),
      seance('2026-10-13T13:00:00Z', '13:00', '16:00', 3, 'PLANIFIEE', 'Qualite et recette'),
    ],
  },
  {
    matiereId: 'Veille technologique ( cloture deja effectuee)',
    enseignantId: ENSEIGNANT,
    volumePrevu: 10,
    clotureAnticipee: true,
    motifCloture: 'Le programme national a ete raccourci de deux semaines : le contenu reste couvert.',
    dateCloture: new Date('2026-09-24T09:30:00Z'),
    // 4 h realisees sur 10 h prevues -> cloture anticipee deja appliquee.
    seances: [
      seance('2026-09-09T10:00:00Z', '10:00', '12:00', 2, 'REALISEE', 'Panorama des technologies'),
      seance('2026-09-14T10:00:00Z', '10:00', '12:00', 2, 'REALISEE', 'Etude de cas'),
    ],
  },
  {
    matiereId: 'Architecture logicielle',
    enseignantId: AUTRE_ENSEIGNANT,
    volumePrevu: 40,
    // Autre enseignant : visible pour le responsable et la scolarite, jamais
    // cloturable par Professeur Rakoto.
    seances: [
      seance('2026-09-09T09:00:00Z', '09:00', '11:00', 2, 'REALISEE', 'Styles architecturaux'),
    ],
  },
];

/** Replique backend/src/enseignements/domain/calcul-suivi.ts. */
function calculer(seances, volumePrevu, clotureAnticipee) {
  const heuresRealisees = seances
    .filter((s) => s.statut === 'REALISEE')
    .reduce((total, s) => total + s.duree, 0);
  let etat = 'EN_COURS';
  if (heuresRealisees === 0) etat = 'NON_COMMENCE';
  else if (clotureAnticipee || heuresRealisees >= volumePrevu) etat = 'TERMINE';
  const progression = volumePrevu > 0
    ? Math.round(Math.min((heuresRealisees / volumePrevu) * 100, 100) * 100) / 100
    : 0;
  return { heuresRealisees, progression, etat };
}

/** Charge DATABASE_URL depuis le fichier .env racine (aucune dependance dotenv). */
function chargerEnv() {
  const fichier = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(fichier)) return;
  for (const ligne of fs.readFileSync(fichier, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(ligne.trim());
    if (!m) continue;
    const valeur = m[2].trim().replace(/^["']|["']$/g, '');
    if (process.env[m[1]] === undefined) process.env[m[1]] = valeur;
  }
}

async function nettoyer(prisma) {
  const ids = (await prisma.enseignement.findMany({
    where: { anneeUniversitaireId: MARQUEUR },
    select: { id: true },
  })).map((e) => e.id);

  const [, { count }] = await prisma.$transaction([
    prisma.seance.deleteMany({ where: { enseignementId: { in: ids } } }),
    prisma.enseignement.deleteMany({ where: { id: { in: ids } } }),
  ]);

  console.log(`${count} enseignement(s) de demonstration supprime(s).`);
}

async function creer(prisma) {
  const existants = await prisma.enseignement.findMany({
    where: { anneeUniversitaireId: MARQUEUR },
    select: { matiereId: true },
  });

  if (existants.length > 0 && !process.argv.includes('--force')) {
    console.error('Des donnees de demonstration existent deja :');
    existants.forEach((e) => console.error(`  - ${e.matiereId}`));
    console.error('\nUtilisez --force pour les recreer, ou --clean pour les supprimer.');
    process.exitCode = 1;
    return;
  }

  if (existants.length > 0) await nettoyer(prisma);

  for (const item of ENSEIGNEMENTS) {
    const clotureAnticipee = Boolean(item.clotureAnticipee);
    const agregats = calculer(item.seances, item.volumePrevu, clotureAnticipee);

    const enseignement = await prisma.enseignement.create({
      data: {
        matiereId: item.matiereId,
        enseignantId: item.enseignantId,
        mentionId: MENTION,
        cycle: 'LICENCE',
        niveauId: 'L3',
        parcours: 'Genie Logiciel',
        semestreId: 'S5',
        anneeUniversitaireId: MARQUEUR,
        volumePrevu: item.volumePrevu,
        heuresRealisees: agregats.heuresRealisees,
        progression: agregats.progression,
        etat: agregats.etat,
        clotureAnticipee,
        motifCloture: item.motifCloture ?? null,
        dateCloture: item.dateCloture ?? null,
        seances: {
          create: item.seances.map((s) => ({
            dateSeance: s.dateSeance,
            heureDebut: s.heureDebut,
            heureFin: s.heureFin,
            duree: s.duree,
            statut: s.statut,
            contenuEnseigne: s.contenuEnseigne,
          })),
        },
      },
      include: { seances: true },
    });

    console.log(
      `${matiere(enseignement.matiereId, 34)} | ${String(enseignement.volumePrevu).padStart(3)} h prevues |` +
      ` ${String(agregats.heuresRealisees).padStart(4)} h realisees | ${String(agregats.progression).padStart(6)} % |` +
      ` ${etiquette(agregats.etat)} | cloture : ${clotureAnticipee ? 'ANTICIPEE' : '—'}`,
    );
  }

  console.log(`\nMarqueur « ${MARQUEUR} » dans le champ Annee universitaire.`);
  console.log('Nettoyage : node prisma/seed-cloture-demo.cjs --clean');
}

function matiere(texte, largeur) {
  return texte.length >= largeur ? texte : texte + ' '.repeat(largeur - texte.length);
}

function etiquette(etat) {
  return etat === 'TERMINE' ? 'TERMINE  ' : etat === 'EN_COURS' ? 'EN_COURS ' : 'NON_COMM  ';
}

async function main() {
  chargerEnv();
  const prisma = new PrismaClient();
  try {
    if (process.argv.includes('--clean')) await nettoyer(prisma);
    else await creer(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
