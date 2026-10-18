const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT cycle, parcours, COUNT(*)::int AS n FROM "Enseignement" GROUP BY cycle, parcours ORDER BY cycle, parcours',
  );
  console.log('== Parcours presents dans Enseignement ==');
  console.table(rows);

  const mentions = await prisma.$queryRawUnsafe(
    'SELECT "mentionId", cycle, parcours, COUNT(*)::int AS n FROM "Enseignement" GROUP BY "mentionId", cycle, parcours ORDER BY cycle, parcours',
  );
  console.log('== Mention / parcours ==');
  console.table(mentions);

  const users = await prisma.$queryRawUnsafe(
    'SELECT DISTINCT "enseignantId" FROM "Enseignement" ORDER BY "enseignantId"',
  );
  console.log('== Enseignants presents ==');
  console.table(users);

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});
