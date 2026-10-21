import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { calculerSuivi } from '../enseignements/domain/calcul-suivi';

if (!process.env.DATABASE_URL) {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

/**
 * Resynchronise les colonnes agrégées (heuresRealisees, progression, etat) de
 * tous les enseignements avec leurs séances réelles.
 *
 * Ces colonnes ne sont qu'un cache dénormalisé alimenté par
 * `SuiviRecalculService` à chaque création ou modification de séance. Ce script
 * répare les données dont le cache a divergé (imports, saisies antérieures à
 * la mise en place du service, écritures directes en base).
 *
 *   npx ts-node -P backend/tsconfig.json backend/src/maintenance/reparer-suivi.ts
 *   npx ts-node -P backend/tsconfig.json backend/src/maintenance/reparer-suivi.ts --dry-run
 *
 * Le calcul est délégué à `calculerSuivi` : il n'existe qu'une seule implémentation
 * de la règle métier dans le projet.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaService();

  try {
    const enseignements = await prisma.enseignement.findMany({
      select: {
        id: true,
        matiereId: true,
        volumePrevu: true,
        heuresRealisees: true,
        progression: true,
        etat: true,
        clotureAnticipee: true,
        seances: { select: { duree: true, statut: true } },
      },
      orderBy: { matiereId: 'asc' },
    });

    let corriges = 0;

    for (const enseignement of enseignements) {
      const attendu = calculerSuivi(
        enseignement.volumePrevu,
        enseignement.seances,
        enseignement.clotureAnticipee,
      );

      const divergent =
        attendu.heuresRealisees !== enseignement.heuresRealisees ||
        attendu.progression !== enseignement.progression ||
        attendu.etat !== enseignement.etat;

      if (!divergent) continue;

      corriges += 1;
      const avant = `${enseignement.heuresRealisees} h / ${enseignement.progression} % / ${enseignement.etat}`;
      const apres = `${attendu.heuresRealisees} h / ${attendu.progression} % / ${attendu.etat}`;

      console.log(
        `${dryRun ? '[dry-run] ' : ''}${enseignement.matiereId} (${enseignement.id})\n` +
          `  avant : ${avant}\n  apres : ${apres}`,
      );

      if (!dryRun) {
        await prisma.enseignement.update({
          where: { id: enseignement.id },
          data: {
            heuresRealisees: attendu.heuresRealisees,
            progression: attendu.progression,
            etat: attendu.etat,
          },
        });
      }
    }

    console.log(
      `\n${enseignements.length} enseignement(s) analyse(s), ${corriges} cache(s) resynchronise(s)` +
        `${dryRun ? ' (simulation)' : ''}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
