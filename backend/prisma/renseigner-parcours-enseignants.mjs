/**
 * Renseigne le parcours et les cycles des comptes enseignants de démonstration
 * (données, pas de schéma). Idempotent, non destructif.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AFFECTATIONS = {
  'rakoto@emit.mg': { parcours: 'Informatique', cycles: ['LICENCE', 'MASTER'] },
  'andry@emit.mg': { parcours: 'ICM', cycles: ['LICENCE', 'MASTER'] },
  'hery@emit.mg': { parcours: 'Informatique', cycles: ['MASTER'] },
  'jaona@emit.mg': { parcours: 'Informatique', cycles: ['LICENCE'] },
  'naina@emit.mg': { parcours: 'Management', cycles: ['MASTER'] },
  'andrianina@emit.mg': { parcours: 'Management', cycles: ['LICENCE'] },
  'rasoa@emit.mg': { parcours: 'ICM', cycles: ['MASTER'] },
};

for (const [email, { parcours, cycles }] of Object.entries(AFFECTATIONS)) {
  const u = await prisma.user.update({ where: { email }, data: { parcours, cycles } });
  console.log(`${u.email} -> parcours=${u.parcours} cycles=[${u.cycles.join(', ')}]`);
}
await prisma.$disconnect();
