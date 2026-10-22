import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient, RoleName } from '@prisma/client';

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

  // Comptes de démonstration — un par rôle, mot de passe commun 'Admin123!'.
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const demoUsers: {
    email: string;
    firstName: string;
    lastName: string;
    roleName: RoleName;
    mentionId?: string;
    cycles?: string[];
    parcours?: string;
  }[] = [
    { email: 'admin@emit.mg', firstName: 'Admin', lastName: 'EMIT', roleName: 'ADMINISTRATEUR' },
    { email: 'scolarite@emit.mg', firstName: 'Chef', lastName: 'Scolarité', roleName: 'CHEF_SCOLARITE' },
    {
      email: 'resp.licence.info@emit.mg',
      firstName: 'Raingo',
      lastName: 'Licence',
      roleName: 'RESPONSABLE_LICENCE',
      mentionId: 'INFORMATIQUE',
      cycles: ['LICENCE'],
      parcours: 'Informatique',
    },
    {
      email: 'resp.master.info@emit.mg',
      firstName: 'Raingo',
      lastName: 'Master',
      roleName: 'RESPONSABLE_MASTER',
      mentionId: 'INFORMATIQUE',
      cycles: ['MASTER'],
      parcours: 'Informatique',
    },
    { email: 'prof@emit.mg', firstName: 'Nirina', lastName: 'Rakoto', roleName: 'ENSEIGNANT' },
  ];

  for (const demo of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: demo.roleName } });
    await prisma.user.upsert({
      where: { email: demo.email },
      update: { password: hashedPassword },
      create: {
        email: demo.email,
        password: hashedPassword,
        firstName: demo.firstName,
        lastName: demo.lastName,
        roleId: role.id,
        mentionId: demo.mentionId,
        cycles: demo.cycles ?? [],
        parcours: demo.parcours,
      },
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
