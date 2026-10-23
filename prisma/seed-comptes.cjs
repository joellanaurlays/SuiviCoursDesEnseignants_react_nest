/**
 * Seed des comptes d'authentification — branche feature/teaching-progress.
 *
 * À exécuter volontairement :   node prisma/seed-comptes.cjs
 *
 * Ce script est IDEMPOTENT : il ne crée l'utilisateur que s'il n'existe pas
 * déjà, et ne modifie jamais un compte existant.
 *
 * Comptes créés :
 * - scolarite@emit.mg  /  Scolarite123!   (Chef de scolarité — SCOLARITE)
 */
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const COMPTES = [
  {
    email: 'scolarite@emit.mg',
    password: 'Scolarite123!',
    role: 'SCOLARITE',
  },
];

async function main() {
  for (const c of COMPTES) {
    const existe = await prisma.user.findUnique({ where: { email: c.email } });
    if (existe) {
      console.log(`  = ${c.email} deja present (aucun changement)`);
      continue;
    }
    await prisma.user.create({
      data: {
        email: c.email,
        password: hashPassword(c.password),
        role: c.role,
        isActive: true,
      },
    });
    console.log(`  + ${c.email} cree (role: ${c.role})`);
  }
  console.log('Seed comptes termine.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });