import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Mention } from './mention/mention.entity.js';
import { Cycle, TypeCycle } from './cycle/cycle.entity.js';
import { Niveau } from './niveau/niveau.entity.js';
import { AnneeUniversitaire } from './annee-universitaire/annee-universitaire.entity.js';
import { Semestre } from './semestre/semestre.entity.js';
import { Matiere } from './matiere/matiere.entity.js';

/**
 * Donnees de demonstration pour la soutenance.
 * Usage : `yarn seed` (idempotent : ne fait rien si des mentions existent deja).
 */
try {
  process.loadEnvFile('.env');
} catch {
  // pas de fichier .env : on utilise les variables d'environnement / valeurs par defaut
}

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Mention, Cycle, Niveau, AnneeUniversitaire, Semestre, Matiere],
  synchronize: true,
});

await ds.initialize();

if ((await ds.getRepository(Mention).count()) > 0) {
  console.log('Des donnees existent deja : seed ignore.');
  await ds.destroy();
  process.exit(0);
}

const annee = '2025-2026';

async function addMatieres(semestre: Semestre, matieres: [string, number][]) {
  for (const [nom, volumeHoraire] of matieres) {
    await ds.getRepository(Matiere).save({ nom, volumeHoraire, semestreId: semestre.id });
  }
}

async function addNiveau(cycle: Cycle, libelle: string, semestres: Record<number, [string, number][]>) {
  const niveau = await ds.getRepository(Niveau).save({ libelle, cycleId: cycle.id });
  const an = await ds.getRepository(AnneeUniversitaire).save({ libelle: annee, niveauId: niveau.id });
  for (const [numero, matieres] of Object.entries(semestres)) {
    const s = await ds
      .getRepository(Semestre)
      .save({ numero: Number(numero), anneeUniversitaireId: an.id });
    await addMatieres(s, matieres);
  }
}

const informatique = await ds.getRepository(Mention).save({ nom: 'Informatique' });
const gestion = await ds.getRepository(Mention).save({ nom: 'Gestion' });

const licInfo = await ds.getRepository(Cycle).save({ type: TypeCycle.LICENCE, mentionId: informatique.id });
const masInfo = await ds.getRepository(Cycle).save({ type: TypeCycle.MASTER, mentionId: informatique.id });
const licGestion = await ds.getRepository(Cycle).save({ type: TypeCycle.LICENCE, mentionId: gestion.id });

await addNiveau(licInfo, 'L1', {
  1: [['Algorithmique', 40], ['Mathématiques discrètes', 36], ['Architecture des ordinateurs', 30]],
  2: [['Programmation C', 45], ['Algèbre linéaire', 32]],
});
await addNiveau(licInfo, 'L2', {
  3: [['Structures de données', 42], ['Bases de données', 48]],
  4: [['Programmation orientée objet', 45], ['Réseaux', 36]],
});
await addNiveau(licInfo, 'L3', {
  5: [['Génie logiciel', 40], ['Systèmes d\'exploitation', 36]],
  6: [['Développement web', 48], ['Projet tutoré', 60]],
});
await addNiveau(masInfo, 'M1', {
  1: [['Architecture logicielle', 40], ['Intelligence artificielle', 45]],
});
await addNiveau(licGestion, 'L1', {
  1: [['Comptabilité générale', 40], ['Microéconomie', 36]],
});

console.log('Seed termine : 2 mentions, 3 cycles, 5 niveaux, matieres de demonstration creees.');
await ds.destroy();
