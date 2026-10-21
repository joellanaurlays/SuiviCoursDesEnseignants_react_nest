/**
 * Comptes de démonstration pour l'app intégrée (reliure Membre 1 <-> Membre 4).
 *
 * À exécuter volontairement :  node -r dotenv/config prisma/seed-comptes-suivi.cjs
 *
 * Le module suivi des enseignements identifie un enseignant par la chaîne
 * `Enseignement.enseignantId` (ex. « Professeur Rakoto », voir seed.js /
 * seed-parcours.cjs). Ce script crée les comptes de connexion correspondants :
 * le nom affiché (firstName + lastName) retombe EXACTEMENT sur ces valeurs, et
 * chaque responsable de parcours porte le couple (cycles, parcours) seedé.
 *
 * GARANTIES : non destructif (upsert par email), idempotent, mot de passe
 * commun 'Admin123!' comme les autres comptes de démo (seed.ts).
 */
const { PrismaClient, RoleName } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ENSEIGNANTS = [
  'Professeur Rakoto',
  'Professeur Andry',
  'Professeur Hery',
  'Professeur Jaona',
  'Professeur Naina',
  'Professeur Andrianina',
  'Professeur Rasoa',
];

const PARCOURS = ['Informatique', 'Management', 'ICM'];
const EMAIL_SUFFIX = { Informatique: 'info', Management: 'mgt', ICM: 'icm' };

function splitNom(nom) {
  const space = nom.indexOf(' ');
  return { firstName: nom.slice(0, space), lastName: nom.slice(space + 1) };
}

function slug(nom) {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^professeur /, '')
    .replace(/[^a-z]+/g, '.');
}

async function upsertCompte({ email, firstName, lastName, roleName, mentionId, cycles, parcours }) {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, password: hashedPassword, roleId: role.id, mentionId, cycles, parcours, isActive: true },
    create: { email, password: hashedPassword, firstName, lastName, roleId: role.id, mentionId, cycles, parcours },
  });
  return email;
}

async function main() {
  const created = [];

  for (const nom of ENSEIGNANTS) {
    const { firstName, lastName } = splitNom(nom);
    created.push(
      await upsertCompte({
        email: `${slug(nom)}@emit.mg`,
        firstName,
        lastName,
        roleName: RoleName.ENSEIGNANT,
      }),
    );
  }

  for (const cycle of ['licence', 'master']) {
    for (const parcours of PARCOURS) {
      created.push(
        await upsertCompte({
          email: `resp.${cycle}.${EMAIL_SUFFIX[parcours]}@emit.mg`,
          firstName: `Responsable ${cycle === 'licence' ? 'Licence' : 'Master'} ${parcours}`,
          lastName: 'EMIT',
          roleName: cycle === 'licence' ? RoleName.RESPONSABLE_LICENCE : RoleName.RESPONSABLE_MASTER,
          mentionId: parcours,
          cycles: [cycle.toUpperCase()],
          parcours,
        }),
      );
    }
  }

  console.log('Comptes de demonstration (mot de passe : Admin123!) :');
  created.forEach((e) => console.log('  -', e));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
