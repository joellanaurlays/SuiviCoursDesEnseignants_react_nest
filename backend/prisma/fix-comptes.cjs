/**
 * fix-comptes.cjs
 * ===============
 * Recrée (ou met à jour) tous les comptes de démonstration dans la base
 * de données actuelle, avec le mot de passe correct.
 *
 * Usage :
 *   cd backend
 *   node -r dotenv/config ../prisma/fix-comptes.cjs
 *
 * Ce script est IDEMPOTENT : il peut être relancé sans problème.
 */

const { PrismaClient, RoleName } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const COMPTES = [
  { email: 'admin@emit.mg', firstName: 'Admin', lastName: 'EMIT', roleName: 'ADMINISTRATEUR', mentionId: null, cycles: [], parcours: null },
  { email: 'scolarite@emit.mg', firstName: 'Chef', lastName: 'Scolarité', roleName: 'CHEF_SCOLARITE', mentionId: null, cycles: [], parcours: null },
  { email: 'resp.licence.info@emit.mg', firstName: 'Raingo', lastName: 'Licence', roleName: 'RESPONSABLE_LICENCE', mentionId: 'INFORMATIQUE', cycles: ['LICENCE'], parcours: 'Informatique' },
  { email: 'resp.master.info@emit.mg', firstName: 'Raingo', lastName: 'Master', roleName: 'RESPONSABLE_MASTER', mentionId: 'INFORMATIQUE', cycles: ['MASTER'], parcours: 'Informatique' },
  { email: 'prof@emit.mg', firstName: 'Nirina', lastName: 'Rakoto', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'rakoto@emit.mg', firstName: 'Professeur', lastName: 'Rakoto', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'andry@emit.mg', firstName: 'Professeur', lastName: 'Andry', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'hery@emit.mg', firstName: 'Professeur', lastName: 'Hery', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'jaona@emit.mg', firstName: 'Professeur', lastName: 'Jaona', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'naina@emit.mg', firstName: 'Professeur', lastName: 'Naina', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'andrianina@emit.mg', firstName: 'Professeur', lastName: 'Andrianina', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
  { email: 'rasoa@emit.mg', firstName: 'Professeur', lastName: 'Rasoa', roleName: 'ENSEIGNANT', mentionId: null, cycles: [], parcours: null },
];

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  // S'assurer que les rôles existent
  const roles = ['ADMINISTRATEUR', 'CHEF_SCOLARITE', 'RESPONSABLE_LICENCE', 'RESPONSABLE_MASTER', 'ENSEIGNANT'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: roleName },
    });
  }

  // Créer/mettre à jour chaque compte
  for (const compte of COMPTES) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: compte.roleName } });
    await prisma.user.upsert({
      where: { email: compte.email },
      update: {
        password: hashedPassword,
        firstName: compte.firstName,
        lastName: compte.lastName,
        roleId: role.id,
        mentionId: compte.mentionId,
        cycles: compte.cycles,
        parcours: compte.parcours,
        isActive: true,
      },
      create: {
        email: compte.email,
        password: hashedPassword,
        firstName: compte.firstName,
        lastName: compte.lastName,
        roleId: role.id,
        mentionId: compte.mentionId,
        cycles: compte.cycles,
        parcours: compte.parcours,
        isActive: true,
      },
    });
    console.log(`✅ ${compte.email} (${compte.roleName})`);
  }

  console.log('');
  console.log('🔑 Mot de passe pour tous les comptes : Admin123!');
  console.log('🚀 Vous pouvez maintenant vous connecter sur le frontend.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Erreur :', e.message);
  process.exit(1);
});