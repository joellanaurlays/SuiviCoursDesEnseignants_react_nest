/**
 * Verification que les donnees de test sont REELLEMENT stockees dans PostgreSQL.
 * Toute la verification passe par des requetes SQL brutes ($queryRawUnsafe) : les
 * agregats sont recalcules par PostgreSQL lui-meme, pas par Prisma ni par JS.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Regle metier traduite en SQL, appliquee par le serveur de base de donnees.
const SQL_SUIVI = `
  SELECT
    e."id",
    e."matiereId",
    e."enseignantId",
    e."mentionId",
    e."cycle",
    e."niveauId",
    e."parcours",
    e."semestreId",
    e."anneeUniversitaireId",
    e."volumePrevu",
    e."clotureAnticipee" AS "clotureAnticipeeColonne",
    e."motifCloture",
    e."dateCloture",
    e."heuresRealisees" AS "heuresRealiseesColonne",
    e."progression"     AS "progressionColonne",
    e."etat"            AS "etatColonne",
    COALESCE(SUM(s."duree") FILTER (WHERE s."statut" = 'REALISEE'), 0) AS "heuresRealiseesSql",
    GREATEST(
      e."volumePrevu" - COALESCE(SUM(s."duree") FILTER (WHERE s."statut" = 'REALISEE'), 0),
      0
    ) AS "heuresRestantesSql",
    CASE
      WHEN e."volumePrevu" > 0
      THEN ROUND(
        LEAST(COALESCE(SUM(s."duree") FILTER (WHERE s."statut" = 'REALISEE'), 0) / e."volumePrevu" * 100, 100)::numeric,
        2
      )
      ELSE 0
    END AS "progressionSql",
    CASE
      WHEN COALESCE(SUM(s."duree") FILTER (WHERE s."statut" = 'REALISEE'), 0) = 0 THEN 'NON_COMMENCE'
      WHEN e."clotureAnticipee" THEN 'TERMINE'
      WHEN COALESCE(SUM(s."duree") FILTER (WHERE s."statut" = 'REALISEE'), 0) >= e."volumePrevu" THEN 'TERMINE'
      ELSE 'EN_COURS'
    END AS "etatSql",
    COUNT(s."id") FILTER (WHERE s."statut" = 'REALISEE')  AS "nbRealisees",
    COUNT(s."id") FILTER (WHERE s."statut" = 'PLANIFIEE') AS "nbPlanifiees",
    COUNT(s."id") FILTER (WHERE s."statut" = 'ANNULEE')   AS "nbAnnulees"
  FROM "Enseignement" e
  LEFT JOIN "Seance" s ON s."enseignementId" = e."id"
  GROUP BY e."id"
  ORDER BY e."matiereId", e."id"
`;

function coherent(l) {
  return (
    Number(l.heuresRealiseesColonne) === Number(l.heuresRealiseesSql) &&
    Number(l.progressionColonne) === Number(l.progressionSql) &&
    l.etatColonne === l.etatSql
  );
}

function lignes(cases) {
  console.log('\n== Tous les enseignements (agregats recalcules par PostgreSQL) ==');
  for (const l of cases) {
    const typeCloture =
      l.etatSql === 'TERMINE' ? (l.clotureAnticipeeColonne ? 'ANTICIPEE' : 'NORMALE') : null;
    console.log(
      `  [${coherent(l) ? 'OK' : 'DIVERGENT'}] ${l.matiereId.padEnd(24)} ` +
        `${String(l.heuresRealiseesSql).padStart(5)} h / ${String(l.volumePrevu).padStart(3)} h  ` +
        `${String(l.progressionSql).padStart(6)} %  reste ${String(Number(l.heuresRestantesSql)).padStart(4)} h  ` +
        `${l.etatSql.padEnd(12)} cloture=${typeCloture ?? '—'}  ` +
        `R/P/A=${l.nbRealisees}/${l.nbPlanifiees}/${l.nbAnnulees}`,
    );
  }
}

(async () => {
  const tous = await prisma.$queryRawUnsafe(SQL_SUIVI);
  lignes(tous);
  const ok = tous.every(coherent);

  const ids = [
    ['seed-enseig-30h-non-commence', 'Cas A — NON_COMMENCE'],
    ['seed-enseig-30h-60pct', 'Cas B — 18 h / 30 h'],
    ['seed-enseig-30h-cloture-anticipee', 'Cas D — 27 h / 30 h avant cloture'],
    ['seed-enseig-30h-termine', 'Cas C — 30 h / 30 h'],
    ['seed-enseig-30h-depasse', 'Cas E — 32 h / 30 h'],
  ];
  for (const [id, libelle] of ids) {
    const l = tous.find((x) => x.id === id);
    console.log(`\n== ${libelle} ==`);
    if (!l) {
      console.log('  ABSENT');
      continue;
    }
    console.log(
      `  volumePrevu=${l.volumePrevu}  heuresRealisees=${l.heuresRealiseesSql}  ` +
        `heuresRestantes=${l.heuresRestantesSql}  progression=${l.progressionSql}  ` +
        `etat=${l.etatSql}  clotureAnticipee=${l.clotureAnticipeeColonne}`,
    );
    console.log(`  mention=${l.mentionId} cycle=${l.cycle} niveau=${l.niveauId} parcours=${l.parcours} semestre=${l.semestreId} annee=${l.anneeUniversitaireId}`);
  }

  console.log('\n== Detail seances seed-enseig-30h-60pct ==');
  const seances = await prisma.$queryRawUnsafe(`
    SELECT "dateSeance"::text AS "date", "heureDebut", "heureFin", "duree", "statut", "contenuEnseigne"
    FROM "Seance"
    WHERE "enseignementId" = 'seed-enseig-30h-60pct'
    ORDER BY "dateSeance" ASC, "heureDebut" ASC
  `);
  for (const s of seances) {
    console.log(
      `  ${s.date.slice(0, 10)} ${s.heureDebut}-${s.heureFin}  ${String(s.duree).padStart(4)} h  ` +
        `${s.statut.padEnd(10)} ${s.contenuEnseigne ?? ''}`,
    );
  }

  const compte = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM "Enseignement") AS "enseignements",
      (SELECT COUNT(*) FROM "Seance")      AS "seances"
  `);
  console.log('\n== Comptage global (SQL brut) ==');
  console.log(`  Enseignement : ${compte[0].enseignements}`);
  console.log(`  Seance      : ${compte[0].seances}`);

  console.log(`\nCoherence cache colonne / calcul SQL : ${ok ? 'OK' : 'DIVERGENCE DETECTEE'}`);
  await prisma.$disconnect();
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error('ERREUR:', e.message);
  process.exit(1);
});
