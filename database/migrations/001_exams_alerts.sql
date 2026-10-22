-- ============================================================================
-- Module 6 (Membre 6 - feature/exams-alerts) : Sessions, Examens, Alertes
-- Base : suivi_enseignements_db (PostgreSQL)
-- T26 Sessions | T27 Examens | T28 Etat examens | T29 Remise notes | T30 Alertes
-- Dependances assumees (autres membres) : enseignants(id), matieres(id)
-- On utilise des UUID texte simples pour rester compatible sans FK strictes
-- vers les modules pas encore fusionnes (M2/M3/M4). Les FK seront resserrees
-- au moment de l'integration sur develop.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- T26 : Sessions d'examen (ex: Session Normale S1 2025-2026)
CREATE TABLE IF NOT EXISTS sessions_examen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle VARCHAR(150) NOT NULL,              -- ex: "Session Normale S1"
  annee_universitaire VARCHAR(20) NOT NULL,   -- ex: "2025-2026"
  semestre VARCHAR(10) NOT NULL,              -- S1 / S2
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  est_cloturee BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_session_dates CHECK (date_debut <= date_fin)
);
CREATE INDEX IF NOT EXISTS idx_sessions_annee_sem ON sessions_examen(annee_universitaire, semestre);

-- T27/T28 : Examens rattaches a une session (+ enseignement/matiere/enseignant)
CREATE TABLE IF NOT EXISTS examens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions_examen(id) ON DELETE CASCADE,
  -- Liens vers autres modules (texte/UUID souple en attendant l'integration) :
  enseignement_id UUID NULL,                  -- Module 4 (nullable pour demarrer seul)
  matiere_id UUID NULL,                       -- Module 3 (nullable)
  enseignant_id UUID NULL,                    -- Module 2 (nullable)
  -- Infos epreuve :
  date_examen DATE NOT NULL,
  heure_debut TIME NULL,
  heure_fin TIME NULL,
  salle VARCHAR(50) NULL,
  -- T28 : etat de l'examen
  statut VARCHAR(20) NOT NULL DEFAULT 'A_VENIR'
    CHECK (statut IN ('A_VENIR','EN_COURS','TERMINE')),
  -- T29 : suivi de remise des notes (PAS de notes individuelles ici)
  notes_remises BOOLEAN NOT NULL DEFAULT FALSE,
  date_remise_notes TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_examens_session ON examens(session_id);
CREATE INDEX IF NOT EXISTS idx_examens_date ON examens(date_examen);
CREATE INDEX IF NOT EXISTS idx_examens_statut ON examens(statut);
CREATE INDEX IF NOT EXISTS idx_examens_notes ON examens(notes_remises);

-- T30 : Alertes / operations en attente (ex: notes non remises, examen sans salle)
CREATE TABLE IF NOT EXISTS alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examen_id UUID NULL REFERENCES examens(id) ON DELETE CASCADE,
  type_alerte VARCHAR(50) NOT NULL,  -- NOTES_NON_REMISES | SALLE_MANQUANTE | EXAMEN_SANS_DATE | AUTRE
  message TEXT NOT NULL,
  est_lue BOOLEAN NOT NULL DEFAULT FALSE,
  est_traitee BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alertes_examen ON alertes(examen_id);
CREATE INDEX IF NOT EXISTS idx_alertes_lue ON alertes(est_lue, est_traitee);
