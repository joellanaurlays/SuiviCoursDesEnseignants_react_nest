/**
 * Ajoute des séances à l'emploi du temps de démonstration existant.
 * Non destructif et idempotent par code matière + date.
 * Usage : yarn db:seed:planning
 */
const path = require('node:path');
const { config } = require('dotenv');
const { Client } = require('pg');

config({ path: path.resolve(__dirname, '..', '.env') });

const sessions = [
  { day: 'Mercredi', date: '2026-11-04', time: '08:00', room: 'Amphi A', code: 'DEMO-INFO-101', subject: 'Algorithmique', type: 'CM', teacherId: 101, teacher: 'Professeur Rakoto', levelId: 3, level: 'L3', mention: 'Informatique', semester: 'S5', status: 'PLANIFIE', notes: 'Séance de démonstration publiée.' },
  { day: 'Jeudi', date: '2026-11-05', time: '10:15', room: 'Labo Informatique', code: 'DEMO-INFO-201', subject: 'Bases de données', type: 'TP', teacherId: 102, teacher: 'Professeur Andry', levelId: 2, level: 'L2', mention: 'Informatique', semester: 'S3', status: 'VALIDE', notes: 'TP avec postes informatiques.' },
  { day: 'Vendredi', date: '2026-11-06', time: '13:00', room: 'Salle TD1', code: 'DEMO-MGT-101', subject: 'Comptabilité générale', type: 'TD', teacherId: 103, teacher: 'Professeur Hery', levelId: 1, level: 'L1', mention: 'Management', semester: 'S1', status: 'BROUILLON', notes: 'Brouillon pour tester la validation.' },
  { day: 'Samedi', date: '2026-11-07', time: '15:15', room: 'Salle TP Sciences', code: 'DEMO-ICM-201', subject: 'Médiation et culture', type: 'TP', teacherId: 104, teacher: 'Professeur Jaona', levelId: 2, level: 'L2', mention: 'ICM', semester: 'S3', status: 'EN_CONFLIT', notes: 'Cas de conflit à examiner.' },
  { day: 'Lundi', date: '2026-11-09', time: '08:00', room: 'Amphi B', code: 'DEMO-INFO-301', subject: 'Génie logiciel', type: 'CM', teacherId: 105, teacher: 'Professeur Naina', levelId: 3, level: 'L3', mention: 'Informatique', semester: 'S5', status: 'REALISE', notes: 'Séance passée de démonstration.' },
  { day: 'Mardi', date: '2026-11-10', time: '13:00', room: 'Salle TD2', code: 'DEMO-MGT-201', subject: 'Gestion de projet', type: 'TD', teacherId: 106, teacher: 'Professeur Andrianina', levelId: 1, level: 'M1', mention: 'Management', semester: 'S7', status: 'ANNULE', notes: 'Cas annulé pour tester les filtres.' },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL introuvable dans backend/.env');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const planning = await db.query('SELECT id FROM emploi_du_temps ORDER BY id LIMIT 1');
    if (!planning.rows.length) throw new Error('Aucun emploi du temps : initialisez le module planning avant ce seed.');
    let added = 0;
    for (const s of sessions) {
      const result = await db.query(
        `INSERT INTO seance_planifiee (
           emploi_du_temps_id, enseignement_id, code_matiere, matiere_nom, type_seance,
           enseignant_id, nom_enseignant, niveau_id, code_niveau, mention_nom, semestre_nom,
           salle_id, creneau_id, date_seance, statut, notes
         )
         SELECT $1::int, $2::int, $3::varchar, $4::varchar, $5::varchar, $6::int, $7::varchar, $8::int, $9::varchar, $10::varchar, $11::varchar, salle.id, creneau.id, $12::date, $13::varchar, $14::text
         FROM salle, creneau_horaire creneau
         WHERE salle.nom = $15 AND creneau.jour_semaine = $16 AND creneau.heure_debut = $17
           AND NOT EXISTS (SELECT 1 FROM seance_planifiee WHERE code_matiere = $3::varchar AND date_seance = $12::date)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [planning.rows[0].id, s.teacherId, s.code, s.subject, s.type, s.teacherId, s.teacher, s.levelId, s.level, s.mention, s.semester, s.date, s.status, s.notes, s.room, s.day, s.time],
      );
      added += result.rowCount;
    }
    console.log(`${added} séance(s) planning ajoutée(s) (total visé : ${sessions.length}).`);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(`Echec du seed planning : ${error.message}`);
  process.exit(1);
});
