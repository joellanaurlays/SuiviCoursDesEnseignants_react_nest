-- ====================================================================
-- APPLICATION DE SUIVI DES ENSEIGNEMENTS — EMIT (Université de Fianarantsoa)
-- MODULE 5 : GESTION DE L'EMPLOI DU TEMPS (feature/schedule)
-- Base de données : suivicours_db par défaut (configurable via DB_DATABASE)
-- ====================================================================

-- 1. Table des Salles et Locaux de l'EMIT (T21)
CREATE TABLE IF NOT EXISTS salle (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    capacite INT NOT NULL CHECK (capacite > 0),
    type_salle VARCHAR(50) NOT NULL CHECK (type_salle IN ('AMPHI', 'SALLE_TP', 'SALLE_TD', 'LABO')),
    batiment VARCHAR(150) NOT NULL,
    equipements TEXT[] DEFAULT '{}',
    est_disponible BOOLEAN DEFAULT TRUE,
    statut VARCHAR(30) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'MAINTENANCE', 'DESACTIVE')),
    remarques TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes de recherche de locaux disponibles
CREATE INDEX IF NOT EXISTS idx_salle_statut_dispo ON salle (statut, est_disponible);
CREATE INDEX IF NOT EXISTS idx_salle_type ON salle (type_salle);

-- 2. Table des Créneaux Horaires normalisés EMIT (T21)
CREATE TABLE IF NOT EXISTS creneau_horaire (
    id SERIAL PRIMARY KEY,
    jour_semaine VARCHAR(20) NOT NULL CHECK (jour_semaine IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi')),
    heure_debut VARCHAR(10) NOT NULL,
    heure_fin VARCHAR(10) NOT NULL,
    duree_minutes INT DEFAULT 120,
    plage VARCHAR(20) NOT NULL CHECK (plage IN ('Matin', 'Apres-midi')),
    libelle VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_jour_heure UNIQUE (jour_semaine, heure_debut, heure_fin)
);

-- 3. Table des Métadonnées d'Emploi du Temps (T22)
CREATE TABLE IF NOT EXISTS emploi_du_temps (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    semestre_nom VARCHAR(50) NOT NULL,
    mention_nom VARCHAR(50) DEFAULT 'Toutes',
    annee_universitaire VARCHAR(50) NOT NULL,
    semaine_du DATE NOT NULL,
    date_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    est_valide BOOLEAN DEFAULT FALSE,
    est_publie BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 1
);

-- 4. Table Centrale : Séances Planifiées (T22, T23, T24)
-- Garantit l'absence de chevauchement via des index UNIQUE spatio-temporels
CREATE TABLE IF NOT EXISTS seance_planifiee (
    id SERIAL PRIMARY KEY,
    emploi_du_temps_id INT REFERENCES emploi_du_temps(id) ON DELETE CASCADE,
    enseignement_id INT NOT NULL, -- Clé étrangère logique vers Enseignement (Membre 4)
    code_matiere VARCHAR(50) NOT NULL,
    matiere_nom VARCHAR(200) NOT NULL,
    type_seance VARCHAR(10) NOT NULL CHECK (type_seance IN ('CM', 'TD', 'TP')),
    enseignant_id INT NOT NULL,   -- Clé étrangère logique vers Enseignant (Membre 2)
    nom_enseignant VARCHAR(150) NOT NULL,
    niveau_id INT NOT NULL,       -- Clé étrangère logique vers Niveau (Membre 3)
    code_niveau VARCHAR(20) NOT NULL,
    mention_nom VARCHAR(50) NOT NULL,
    semestre_nom VARCHAR(20) NOT NULL,
    salle_id INT NOT NULL REFERENCES salle(id) ON DELETE RESTRICT,
    creneau_id INT NOT NULL REFERENCES creneau_horaire(id) ON DELETE RESTRICT,
    date_seance DATE NOT NULL,
    statut VARCHAR(30) DEFAULT 'BROUILLON' CHECK (statut IN ('BROUILLON', 'EN_CONFLIT', 'VALIDE', 'PLANIFIE', 'REALISE', 'REPROGRAMME', 'ANNULE')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Contrainte 1 : Une même salle ne peut pas accueillir deux cours en même temps
    CONSTRAINT uq_salle_collision UNIQUE (salle_id, creneau_id, date_seance),

    -- Contrainte 2 : Un enseignant ne peut pas être à deux endroits au même moment
    CONSTRAINT uq_enseignant_collision UNIQUE (enseignant_id, creneau_id, date_seance),

    -- Contrainte 3 : Une promotion d'étudiants ne peut pas avoir deux cours simultanés
    CONSTRAINT uq_promotion_collision UNIQUE (code_niveau, mention_nom, creneau_id, date_seance)
);

-- Index de recherche rapide
CREATE INDEX IF NOT EXISTS idx_seance_date ON seance_planifiee (date_seance);
CREATE INDEX IF NOT EXISTS idx_seance_enseignant ON seance_planifiee (enseignant_id);
CREATE INDEX IF NOT EXISTS idx_seance_niveau ON seance_planifiee (code_niveau, mention_nom);
CREATE INDEX IF NOT EXISTS idx_seance_salle ON seance_planifiee (salle_id);

-- 5. Table des Contraintes de Planification (T25)
CREATE TABLE IF NOT EXISTS contrainte_planification (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(150) NOT NULL,
    type_contrainte VARCHAR(50) NOT NULL CHECK (type_contrainte IN ('ENSEIGNANT', 'SALLE', 'NIVEAU', 'GLOBAL')),
    niveau_priorite VARCHAR(50) NOT NULL CHECK (niveau_priorite IN ('BLOQUANTE', 'PREFERENTIELLE')),
    cible_id INT,
    cible_nom VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    regle_json JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- État persistant du module, notamment pour les API de planification.
CREATE TABLE IF NOT EXISTS planning_app_state (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
