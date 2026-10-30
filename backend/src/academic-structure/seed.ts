import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Mention } from './mention/mention.entity.js';
import { Cycle } from './cycle/cycle.entity.js';
import { Niveau } from './niveau/niveau.entity.js';
import { AnneeUniversitaire } from './annee-universitaire/annee-universitaire.entity.js';
import { Semestre } from './semestre/semestre.entity.js';
import { Matiere } from './matiere/matiere.entity.js';
import { StructureGeneratorService } from './tree/structure-generator.service.js';

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

const generator = new StructureGeneratorService(ds);

/** Mention + structure standard (L1-L3, M1-M2, S1..S10) pour l'annee 2025-2026, puis matieres. */
async function creerMention(nom: string) {
  const { mentionId } = await generator.createMentionWithStructure(nom, '2025-10-01');
  return mentionId;
}

async function semestre(mentionId: number, niveau: string, numero: number) {
  return ds
    .getRepository(Semestre)
    .createQueryBuilder('s')
    .innerJoin('s.anneeUniversitaire', 'a')
    .innerJoin('a.niveau', 'n')
    .innerJoin('n.cycle', 'c')
    .where('c.mentionId = :mentionId AND n.libelle = :niveau AND s.numero = :numero', { mentionId, niveau, numero })
    .getOneOrFail();
}

async function matieres(mentionId: number, niveau: string, numero: number, liste: [string, number][]) {
  const s = await semestre(mentionId, niveau, numero);
  for (const [nom, volumeHoraire] of liste) {
    await ds.getRepository(Matiere).save({ nom, volumeHoraire, semestreId: s.id });
  }
}

const informatique = await creerMention('Informatique');
await creerMention('Management');
await creerMention('ICM');

await matieres(informatique, 'L1', 1, [['Algorithmique', 40], ['Mathématiques discrètes', 36], ['Architecture des ordinateurs', 30]]);
await matieres(informatique, 'L1', 2, [['Programmation C', 45], ['Algèbre linéaire', 32]]);
await matieres(informatique, 'L2', 3, [['Structures de données', 42], ['Bases de données', 48]]);
await matieres(informatique, 'L2', 4, [['Programmation orientée objet', 45], ['Réseaux', 36]]);
await matieres(informatique, 'L3', 5, [['Génie logiciel', 40], ["Systèmes d'exploitation", 36]]);
await matieres(informatique, 'L3', 6, [['Développement web', 48], ['Projet tutoré', 60]]);
await matieres(informatique, 'M1', 7, [['Architecture logicielle', 40], ['Intelligence artificielle', 45]]);

console.log('Seed termine : 3 mentions (Informatique, Management, ICM), structure S1..S10 generee, matieres de demonstration creees.');
await ds.destroy();