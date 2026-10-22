import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const enseignement = await prisma.enseignement.create({
    data: {
      matiereId: 'Base de données',
      enseignantId: 'Professeur Rakoto',
      niveauId: 'L2',
      semestreId: 'S1',
      mentionId: 'INFO',
      cycle: 'LICENCE',
      parcours: 'TC',
      anneeUniversitaireId: '2023-2024',
      volumePrevu: 30,
      seances: {
        create: [
          { dateSeance: new Date('2023-10-01'), heureDebut: '08:00', heureFin: '10:00', duree: 2, statut: 'REALISEE' },
          { dateSeance: new Date('2023-10-08'), heureDebut: '08:00', heureFin: '10:00', duree: 2, statut: 'REALISEE' },
          { dateSeance: new Date('2023-10-15'), heureDebut: '08:00', heureFin: '11:00', duree: 3, statut: 'REALISEE' }
        ]
      }
    }
  })
  console.log('Test data created:', enseignement)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())