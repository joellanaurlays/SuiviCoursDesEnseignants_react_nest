import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SalleEntity } from '../entities/salle.entity.js';
import { CreneauHoraireEntity } from '../entities/creneau-horaire.entity.js';
import { SeancePlanifieeEntity } from '../entities/seance-planifiee.entity.js';
import { EmploiDuTempsEntity } from '../entities/emploi-du-temps.entity.js';
import { ContraintePlanificationEntity } from '../entities/contrainte-planification.entity.js';

// Charge toujours backend/.env, même quand Yarn est lancé depuis la racine du projet.
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export interface EnseignementReference {
  id: number;
  codeMatiere: string;
  nomMatiere: string;
  enseignantId: number;
  nomEnseignant: string;
  niveauId: number;
  codeNiveau: string;
  mentionNom: string;
  semestreNom: string;
  effectifEtudiants: number;
  volumeHoraireTotal: number;
  heuresPlanifiees: number;
  heuresRealisees: number;
  typeSalleRequis: 'AMPHI' | 'SALLE_TP' | 'SALLE_TD' | 'LABO';
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
  database: process.env.DB_DATABASE || process.env.PGDATABASE || 'suivicours_db',
  // node-postgres retombe sinon sur l'utilisateur système (ex. « joella »).
  user: process.env.DB_USERNAME || process.env.PGUSER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

function camelCaseRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value,
  ]));
}

function stableNumericIds(values: Array<string | null | undefined>): Map<string, number> {
  const uniqueValues = [...new Set(values.filter((value): value is string => Boolean(value)).map(String))].sort();
  const used = new Set<number>();
  const ids = new Map<string, number>();

  for (const value of uniqueValues) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
    }
    let id = (hash >>> 0) & 0x7fffffff;
    if (id === 0) id = 1;
    while (used.has(id)) id = id === 0x7fffffff ? 1 : id + 1;
    used.add(id);
    ids.set(value, id);
  }
  return ids;
}

/** PostgreSQL-backed application state. No demo or fallback records are loaded. */
export class DataStore {
  private static instance: DataStore;
  public rooms: SalleEntity[] = [];
  public timeSlots: CreneauHoraireEntity[] = [];
  public sessions: SeancePlanifieeEntity[] = [];
  public scheduleMeta!: EmploiDuTempsEntity;
  public constraints: ContraintePlanificationEntity[] = [];
  public teachings: EnseignementReference[] = [];
  private initialized = false;
  private persistedIds = { rooms: new Set<number>(), timeSlots: new Set<number>(), sessions: new Set<number>(), constraints: new Set<number>() };

  private constructor() {}

  public static getInstance(): DataStore {
    if (!DataStore.instance) DataStore.instance = new DataStore();
    return DataStore.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    const schema = await readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');
    await pool.query(schema);
    await pool.query(`CREATE TABLE IF NOT EXISTS planning_app_state (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1), state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const { rows } = await pool.query('SELECT state FROM planning_app_state WHERE id = 1');
    if (rows[0]) {
      this.loadState(rows[0].state);
      if (!this.scheduleMeta) {
        const latest = await pool.query('SELECT * FROM emploi_du_temps ORDER BY id DESC LIMIT 1');
        if (latest.rows[0]) this.scheduleMeta = new EmploiDuTempsEntity(camelCaseRow(latest.rows[0]) as any);
        else await this.createInitialScheduleMetadata();
        await this.save();
      }
    } else {
      await this.importExistingPlanningTables();
      if (!this.scheduleMeta) await this.createInitialScheduleMetadata();
      this.capturePersistedIds();
      await this.save();
    }
    // Les références académiques restent la source des tables des autres membres.
    // Ne pas utiliser une copie JSON potentiellement périmée lors de la génération.
    await this.refreshTeachings();
    this.initialized = true;
  }

  public async save(): Promise<void> {
    const state = {
      rooms: this.rooms, timeSlots: this.timeSlots, sessions: this.sessions,
      scheduleMeta: this.scheduleMeta ?? null, constraints: this.constraints, teachings: this.teachings,
    };
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (this.scheduleMeta) await client.query(`INSERT INTO emploi_du_temps
        (id,titre,semestre_nom,mention_nom,annee_universitaire,semaine_du,date_mise_a_jour,est_valide,est_publie,version)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET
        titre=EXCLUDED.titre,semestre_nom=EXCLUDED.semestre_nom,mention_nom=EXCLUDED.mention_nom,
        annee_universitaire=EXCLUDED.annee_universitaire,semaine_du=EXCLUDED.semaine_du,
        date_mise_a_jour=EXCLUDED.date_mise_a_jour,est_valide=EXCLUDED.est_valide,
        est_publie=EXCLUDED.est_publie,version=EXCLUDED.version`,
      [this.scheduleMeta.id,this.scheduleMeta.titre,this.scheduleMeta.semestreNom,this.scheduleMeta.mentionNom,
       this.scheduleMeta.anneeUniversitaire,this.scheduleMeta.semaineDu,this.scheduleMeta.dateMiseAJour,
       this.scheduleMeta.estValide,this.scheduleMeta.estPublie,this.scheduleMeta.version]);
      for (const r of this.rooms) await client.query(`INSERT INTO salle
        (id,nom,capacite,type_salle,batiment,equipements,est_disponible,statut,remarques)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET
        nom=EXCLUDED.nom,capacite=EXCLUDED.capacite,type_salle=EXCLUDED.type_salle,
        batiment=EXCLUDED.batiment,equipements=EXCLUDED.equipements,est_disponible=EXCLUDED.est_disponible,
        statut=EXCLUDED.statut,remarques=EXCLUDED.remarques`,
      [r.id,r.nom,r.capacite,r.typeSalle,r.batiment,r.equipements,r.estDisponible,r.statut,r.remarques ?? null]);
      for (const s of this.timeSlots) await client.query(`INSERT INTO creneau_horaire
        (id,jour_semaine,heure_debut,heure_fin,duree_minutes,plage,libelle,actif)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET
        jour_semaine=EXCLUDED.jour_semaine,heure_debut=EXCLUDED.heure_debut,heure_fin=EXCLUDED.heure_fin,
        duree_minutes=EXCLUDED.duree_minutes,plage=EXCLUDED.plage,libelle=EXCLUDED.libelle,actif=EXCLUDED.actif`,
      [s.id,s.jourSemaine,s.heureDebut,s.heureFin,s.dureeMinutes,s.plage,s.libelle,s.actif]);
      for (const c of this.constraints) await client.query(`INSERT INTO contrainte_planification
        (id,titre,type_contrainte,niveau_priorite,cible_id,cible_nom,description,regle_json,active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) ON CONFLICT (id) DO UPDATE SET
        titre=EXCLUDED.titre,type_contrainte=EXCLUDED.type_contrainte,niveau_priorite=EXCLUDED.niveau_priorite,
        cible_id=EXCLUDED.cible_id,cible_nom=EXCLUDED.cible_nom,description=EXCLUDED.description,
        regle_json=EXCLUDED.regle_json,active=EXCLUDED.active`,
      [c.id,c.titre,c.typeContrainte,c.niveauPriorite,c.cibleId ?? null,c.cibleNom,c.description,JSON.stringify(c.regle),c.active]);
      for (const s of this.sessions) await client.query(`INSERT INTO seance_planifiee
        (id,emploi_du_temps_id,enseignement_id,code_matiere,matiere_nom,type_seance,enseignant_id,
         nom_enseignant,niveau_id,code_niveau,mention_nom,semestre_nom,salle_id,creneau_id,date_seance,statut,notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET emploi_du_temps_id=EXCLUDED.emploi_du_temps_id,
        enseignement_id=EXCLUDED.enseignement_id,code_matiere=EXCLUDED.code_matiere,
        matiere_nom=EXCLUDED.matiere_nom,type_seance=EXCLUDED.type_seance,enseignant_id=EXCLUDED.enseignant_id,
        nom_enseignant=EXCLUDED.nom_enseignant,niveau_id=EXCLUDED.niveau_id,code_niveau=EXCLUDED.code_niveau,
        mention_nom=EXCLUDED.mention_nom,semestre_nom=EXCLUDED.semestre_nom,salle_id=EXCLUDED.salle_id,
        creneau_id=EXCLUDED.creneau_id,date_seance=EXCLUDED.date_seance,statut=EXCLUDED.statut,notes=EXCLUDED.notes`,
      [s.id,s.emploiDuTempsId,s.enseignementId,s.codeMatiere,s.matiereNom,s.typeSeance,s.enseignantId,
       s.nomEnseignant,s.niveauId,s.codeNiveau,s.mentionNom,s.semestreNom,s.salleId,s.creneauId,s.dateSeance,s.statut,s.notes ?? null]);
      await this.deleteRemoved(client, 'seance_planifiee', this.persistedIds.sessions, this.sessions.map(item => item.id));
      await this.deleteRemoved(client, 'contrainte_planification', this.persistedIds.constraints, this.constraints.map(item => item.id));
      await this.deleteRemoved(client, 'salle', this.persistedIds.rooms, this.rooms.map(item => item.id));
      await this.deleteRemoved(client, 'creneau_horaire', this.persistedIds.timeSlots, this.timeSlots.map(item => item.id));
      await client.query(`INSERT INTO planning_app_state (id,state,updated_at) VALUES (1,$1::jsonb,now())
        ON CONFLICT (id) DO UPDATE SET state=EXCLUDED.state,updated_at=now()`, [JSON.stringify(state)]);
      await client.query('COMMIT');
      this.capturePersistedIds();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async deleteRemoved(client: import('pg').PoolClient, table: string, oldIds: Set<number>, ids: number[]): Promise<void> {
    const current = new Set(ids);
    for (const id of oldIds) if (!current.has(id)) await client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  }

  private capturePersistedIds(): void {
    this.persistedIds = {
      rooms: new Set(this.rooms.map(item => item.id)), timeSlots: new Set(this.timeSlots.map(item => item.id)),
      sessions: new Set(this.sessions.map(item => item.id)), constraints: new Set(this.constraints.map(item => item.id)),
    };
  }

  private loadState(state: Record<string, any>): void {
    this.rooms = (state.rooms || []).map((item: any) => new SalleEntity(item));
    this.timeSlots = (state.timeSlots || []).map((item: any) => new CreneauHoraireEntity(item));
    this.sessions = (state.sessions || []).map((item: any) => new SeancePlanifieeEntity(item));
    this.scheduleMeta = state.scheduleMeta ? new EmploiDuTempsEntity(state.scheduleMeta) : undefined!;
    this.constraints = (state.constraints || []).map((item: any) => new ContraintePlanificationEntity(item));
    this.teachings = state.teachings || [];
    this.capturePersistedIds();
  }

  private async importExistingPlanningTables(): Promise<void> {
    const available = await pool.query(`SELECT to_regclass('public.salle') AS salle,
      to_regclass('public.creneau_horaire') AS creneau,
      to_regclass('public.emploi_du_temps') AS planning,
      to_regclass('public.seance_planifiee') AS seance,
      to_regclass('public.contrainte_planification') AS contrainte`);
    const tables = available.rows[0];
    if (tables.salle) this.rooms = (await pool.query('SELECT * FROM salle ORDER BY id')).rows.map(row => new SalleEntity(camelCaseRow(row) as any));
    if (tables.creneau) this.timeSlots = (await pool.query('SELECT * FROM creneau_horaire ORDER BY id')).rows.map(row => new CreneauHoraireEntity(camelCaseRow(row) as any));
    if (tables.planning) {
      const row = (await pool.query('SELECT * FROM emploi_du_temps ORDER BY id DESC LIMIT 1')).rows[0];
      if (row) this.scheduleMeta = new EmploiDuTempsEntity(camelCaseRow(row) as any);
    }
    if (tables.seance) this.sessions = (await pool.query(`SELECT s.*, r.nom AS nom_salle, c.jour_semaine, c.heure_debut, c.heure_fin
      FROM seance_planifiee s JOIN salle r ON r.id = s.salle_id
      JOIN creneau_horaire c ON c.id = s.creneau_id ORDER BY s.id`)).rows.map(row => new SeancePlanifieeEntity(camelCaseRow(row) as any));
    if (tables.contrainte) this.constraints = (await pool.query('SELECT *, regle_json AS regle FROM contrainte_planification ORDER BY id')).rows.map(row => new ContraintePlanificationEntity(camelCaseRow(row) as any));
  }

  private async createInitialScheduleMetadata(): Promise<void> {
    const today = new Date();
    const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);
    const year = today.getUTCFullYear();
    const semesterName = process.env.SEMESTRE_NOM || '';
    const academicYear = process.env.ANNEE_UNIVERSITAIRE || `${year}-${year + 1}`;
    const { rows } = await pool.query(`INSERT INTO emploi_du_temps
      (titre, semestre_nom, mention_nom, annee_universitaire, semaine_du)
      VALUES ($1, $2, 'Toutes', $3, $4) RETURNING *`,
    [`Emploi du temps ${semesterName}`.trim(), semesterName, academicYear, weekStart]);
    this.scheduleMeta = new EmploiDuTempsEntity(camelCaseRow(rows[0]) as any);
  }

  public async refreshTeachings(): Promise<void> {
    const configuredQuery = process.env.ACADEMIC_TEACHINGS_SQL;
    if (configuredQuery) {
      const result = await pool.query(configuredQuery);
      this.teachings = result.rows.map(row => camelCaseRow(row) as unknown as EnseignementReference);
      return;
    }

    const getColumns = async (table: string) => {
      const result = await pool.query(`SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = $1`, [table]);
      return new Set(result.rows.map(row => row.column_name as string));
    };
    const prismaCourse = await getColumns('Enseignement');
    if (prismaCourse.has('matiereId') && prismaCourse.has('enseignantId') && prismaCourse.has('niveauId')) {
      const result = await pool.query(`SELECT "id", "matiereId", "enseignantId", "mentionId", "cycle",
        "niveauId", "parcours", "semestreId", "volumePrevu", "heuresRealisees"
        FROM "Enseignement" ORDER BY "id"`);
      const courseIds = stableNumericIds(result.rows.map(row => String(row.id)));
      const teacherIds = stableNumericIds(result.rows.map(row => String(row.enseignantId ?? 'inconnu')));
      const levelIds = stableNumericIds(result.rows.map(row => String(row.niveauId ?? 'inconnu')));
      this.teachings = result.rows.map(row => {
        const matiere = String(row.matiereId ?? 'Matière');
        const enseignant = String(row.enseignantId ?? 'inconnu');
        const niveau = String(row.niveauId ?? 'inconnu');
        return {
          id: courseIds.get(String(row.id))!,
          codeMatiere: matiere,
          nomMatiere: matiere,
          enseignantId: teacherIds.get(enseignant)!,
          nomEnseignant: enseignant,
          niveauId: levelIds.get(niveau)!,
          codeNiveau: niveau,
          mentionNom: String(row.mentionId ?? row.parcours ?? 'Toutes'),
          semestreNom: String(row.semestreId ?? ''),
          effectifEtudiants: 0,
          volumeHoraireTotal: Number(row.volumePrevu ?? 0),
          heuresPlanifiees: 0,
          heuresRealisees: Number(row.heuresRealisees ?? 0),
          typeSalleRequis: 'SALLE_TD' as const,
        };
      });
      return;
    }
    const pick = (columns: Set<string>, names: string[], required = true): string | undefined => {
      const found = names.find(name => columns.has(name));
      if (!found && required) throw new Error(`Schéma académique incompatible: colonne attendue parmi ${names.join(', ')}`);
      return found;
    };
    const q = (name: string) => `"${name.replaceAll('"', '""')}"`;
    const [course, teacher, level] = await Promise.all([
      getColumns('enseignement'), getColumns('enseignant'), getColumns('niveau'),
    ]);
    if (!course.size || !teacher.size || !level.size) {
      throw new Error('Tables académiques manquantes: enseignement, enseignant et niveau. Définissez ACADEMIC_TEACHINGS_SQL si leurs noms diffèrent.');
    }
    const c = (candidates: string[], required = true) => pick(course, candidates, required);
    const t = (candidates: string[], required = true) => pick(teacher, candidates, required);
    const n = (candidates: string[], required = true) => pick(level, candidates, required);
    const courseTeacherId = c(['enseignant_id', 'id_enseignant']);
    const courseLevelId = c(['niveau_id', 'id_niveau']);
    const teacherName = t(['nom_complet', 'nom_enseignant', 'nom', 'name']);
    const teacherFirstName = t(['prenom', 'first_name'], false);
    const fullTeacherName = teacherName && teacherFirstName
      ? `concat_ws(' ', t.${q(teacherFirstName)}, t.${q(teacherName)})`
      : teacherName ? `t.${q(teacherName)}` : `t.${q(t(['prenom', 'first_name'])!)}`;
    const levelId = n(['id']);
    const courseCode = c(['code_matiere', 'code', 'code_enseignement']);
    const courseName = c(['nom_matiere', 'intitule', 'libelle', 'nom']);
    const levelCode = n(['code_niveau', 'code', 'libelle', 'nom']);
    const mention = n(['mention_nom', 'mention', 'nom_mention'], false);
    const semester = c(['semestre_nom', 'code_semestre', 'semestre'], false);
    const count = n(['effectif_etudiants', 'effectif', 'nombre_etudiants'], false);
    const hours = c(['volume_horaire_total', 'volume_horaire', 'heures'], false);
    const id = c(['id']);
    const volume = hours ? `e.${q(hours)}` : '0';
    const result = await pool.query(`SELECT e.${q(id!)} AS id,
      e.${q(courseCode!)} AS code_matiere, e.${q(courseName!)} AS nom_matiere,
      t.${q(t(['id'])!)} AS enseignant_id, ${fullTeacherName} AS nom_enseignant,
      n.${q(levelId!)} AS niveau_id, n.${q(levelCode!)} AS code_niveau,
      ${mention ? `n.${q(mention)}` : "''"} AS mention_nom,
      ${semester ? `e.${q(semester)}` : "''"} AS semestre_nom,
      ${count ? `n.${q(count)}` : '0'} AS effectif_etudiants,
      ${volume} AS volume_horaire_total,
      COALESCE((SELECT SUM(ch.duree_minutes) / 60.0 FROM seance_planifiee sp
        JOIN creneau_horaire ch ON ch.id = sp.creneau_id
        WHERE sp.enseignement_id = e.${q(id!)} AND sp.statut <> 'ANNULE'), 0) AS heures_planifiees,
      COALESCE((SELECT SUM(ch.duree_minutes) / 60.0 FROM seance_planifiee sr
        JOIN creneau_horaire ch ON ch.id = sr.creneau_id
        WHERE sr.enseignement_id = e.${q(id!)} AND sr.statut = 'REALISE'), 0) AS heures_realisees,
      'SALLE_TD' AS type_salle_requis
      FROM enseignement e LEFT JOIN enseignant t ON t.${q(t(['id'])!)} = e.${q(courseTeacherId!)}
      LEFT JOIN niveau n ON n.${q(levelId!)} = e.${q(courseLevelId!)} ORDER BY e.${q(id!)}`);
    this.teachings = result.rows.map(row => camelCaseRow(row) as unknown as EnseignementReference);
  }
}
