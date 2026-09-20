import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RoleName } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles: { name: RoleName; description: string }[] = [
    { name: 'CHEF_SCOLARITE', description: 'Chef de scolarité' },
    { name: 'ADMINISTRATEUR', description: 'Administrateur' },
    { name: 'RESPONSABLE_LICENCE', description: 'Responsable de mention Licence' },
    { name: 'RESPONSABLE_MASTER', description: 'Responsable de mention Master' },
    { name: 'ENSEIGNANT', description: 'Enseignant' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
}

main()
  .then(() => console.log('Seed terminé.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());