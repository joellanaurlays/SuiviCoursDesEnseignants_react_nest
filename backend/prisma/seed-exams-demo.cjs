/**
 * Donnees persistantes de demonstration pour les interfaces examens/alertes.
 * Idempotent : les sessions et examens sont retrouves par des cles fonctionnelles.
 * Non destructif : aucune ligne existante n'est supprimee ou modifiee.
 * Usage : yarn db:seed:exams
 */
const path = require('node:path');
const { config } = require('dotenv');
const { Client } = require('pg');

config({ path: path.resolve(__dirname, '..', '.env') });

const sessions = [
  {
    libelle: 'Session normale S1 — Démonstration',
    annee: '2026-2027',
    semestre: 'S1',
    debut: '2027-01-11',
    fin: '2027-01-23',
  },
  {
    libelle: 'Session normale S2 — Démonstration',
    annee: '2026-2027',
    semestre: 'S2',
    debut: '2027-06-07',
    fin: '2027-06-19',
  },
];

const examens = [
  { session: 'S1', enseignement: 'seed-enseig-30h-60pct', date: '2027-01-11', debut: '08:00', fin: '10:00', salle: 'Amphi A', statut: 'A_VENIR', notes: false },
  { session: 'S1', enseignement: 'seed-emit-li-info-1', date: '2027-01-12', debut: '10:00', fin: '12:00', salle: 'Labo Informatique', statut: 'A_VENIR', notes: false },
  { session: 'S1', enseignement: 'seed-emit-li-mgt-2', date: '2027-01-13', debut: '13:00', fin: '15:00', salle: 'Salle TD1', statut: 'EN_COURS', notes: false },
  { session: 'S1', enseignement: 'seed-emit-li-icm-1', date: '2027-01-14', debut: '08:00', fin: '10:00', salle: 'Amphi B', statut: 'TERMINE', notes: true },
  { session: 'S2', enseignement: 'seed-emit-ma-info-1', date: '2027-06-08', debut: '08:00', fin: '10:00', salle: 'Labo Informatique', statut: 'A_VENIR', notes: false },
  { session: 'S2', enseignement: 'seed-emit-ma-mgt-1', date: '2027-06-09', debut: '13:00', fin: '15:00', salle: 'Salle TD2', statut: 'A_VENIR', notes: false },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL introuvable dans backend/.env');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    let sessionsAjoutees = 0;
    for (const s of sessions) {
      const result = await db.query(
        `INSERT INTO sessions_examen (libelle, annee_universitaire, semestre, date_debut, date_fin)
         SELECT $1::varchar, $2::varchar, $3::varchar, $4::date, $5::date
         WHERE NOT EXISTS (
           SELECT 1 FROM sessions_examen
           WHERE libelle = $1 AND annee_universitaire = $2 AND semestre = $3
         )
         RETURNING id`,
        [s.libelle, s.annee, s.semestre, s.debut, s.fin],
      );
      sessionsAjoutees += result.rowCount;
    }

    let examensAjoutes = 0;
    const idsParSession = {};
    for (const e of examens) {
      const result = await db.query(
        `INSERT INTO examens (session_id, enseignement_id, date_examen, heure_debut, heure_fin, salle, statut, notes_remises, date_remise_notes)
         SELECT s.id, $2::text, $3::date, $4::time, $5::time, $6::varchar, $7::varchar, $8::boolean, CASE WHEN $8::boolean THEN now() ELSE NULL END
         FROM sessions_examen s
         WHERE s.annee_universitaire = '2026-2027' AND s.semestre = $1::varchar
           AND s.libelle = CASE WHEN $1::text = 'S1' THEN 'Session normale S1 — Démonstration' ELSE 'Session normale S2 — Démonstration' END
           AND EXISTS (SELECT 1 FROM "Enseignement" enseignement WHERE enseignement.id = $2)
           AND NOT EXISTS (
             SELECT 1 FROM examens existant
             WHERE existant.session_id = s.id AND existant.enseignement_id = $2 AND existant.date_examen = $3
           )
         RETURNING id`,
        [e.session, e.enseignement, e.date, e.debut, e.fin, e.salle, e.statut, e.notes],
      );
      examensAjoutes += result.rowCount;
      if (result.rows[0]) idsParSession[e.enseignement] = result.rows[0].id;
      else {
        const existing = await db.query(
          `SELECT id FROM examens WHERE enseignement_id = $1 AND date_examen = $2 LIMIT 1`,
          [e.enseignement, e.date],
        );
        if (existing.rows[0]) idsParSession[e.enseignement] = existing.rows[0].id;
      }
    }

    const alerts = [
      ['seed-enseig-30h-60pct', '2027-01-11', 'ECHEANCE_EXAMEN', 'Examen de Bases de données prévu le 11 janvier 2027.', false, false],
      ['seed-emit-li-mgt-2', '2027-01-13', 'NOTES_A_REMETTRE', 'Les notes de Comptabilité générale sont à remettre après la session.', true, false],
      ['seed-emit-li-icm-1', '2027-01-14', 'EXAMEN_TERMINE', 'L’examen de Communication professionnelle est terminé.', true, true],
    ];
    let alertesAjoutees = 0;
    for (const [enseignement, date, type, message, lue, traitee] of alerts) {
      const examenId = idsParSession[enseignement];
      if (!examenId) continue;
      const result = await db.query(
        `INSERT INTO alertes (examen_id, type_alerte, message, est_lue, est_traitee)
         SELECT $1::uuid, $2::varchar, $3::text, $4::boolean, $5::boolean
         WHERE NOT EXISTS (SELECT 1 FROM alertes WHERE examen_id = $1::uuid AND type_alerte = $2::varchar AND message = $3::text)
         RETURNING id`,
        [examenId, type, message, lue, traitee],
      );
      alertesAjoutees += result.rowCount;
    }
    console.log(`${sessionsAjoutees} session(s), ${examensAjoutes} examen(s), ${alertesAjoutees} alerte(s) ajoute(s).`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(`Echec du seed examens : ${error.message}`);
  process.exit(1);
});
