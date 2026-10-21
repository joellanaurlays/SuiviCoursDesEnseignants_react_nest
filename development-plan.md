# Development Plan: Suivi des enseignements

## 1. Prisma Schema Verification & Updates
- **Current State Analysis**: The `prisma/schema.prisma` file already contains the fundamental structure for `Enseignement` and `Seance` models, including enums for `Cycle` and `StatutSeance`. The relationships are correctly established.
- **Action Items**:
  - The schema already correctly models `Enseignement` (`matiereId`, `enseignantId`, `mentionId`, `parcours`, `cycle`, `niveauId`, `semestreId`, `anneeUniversitaireId`, `volumePrevu`) and `Seance` (`enseignementId`, `dateSeance`, `heureDebut`, `heureFin`, `duree`, `contenuEnseigne`, `statut`). No major Prisma schema migration is required right now, but verify constraints.

## 2. Backend Use Cases & Business Logic (NestJS)
- **Validation Rules**:
  - Ensure `heureDebut` is before `heureFin`.
  - Prevent overlapping sessions for the same `enseignantId`.
  - Ensure `dateSeance` doesn't fall on restricted days if applicable.
- **Duration Calculation (CalculateDuration Use Case)**:
  - Implement a reliable time calculation utility that parses `heureDebut` and `heureFin` (HH:mm strings) and outputs the difference as a float (hours).
- **Progression & State Recalculation (CalculateProgression Use Case)**:
  - Retrieve all `REALISEE` seances for a given `Enseignement`.
  - Sum the `duree` to calculate `heuresRealisees`.
  - Compute `progression` = `(heuresRealisees / volumePrevu) * 100`. Cap at 100%.
  - Determine state: 
    - `NON_COMMENCE` if `heuresRealisees == 0`.
    - `EN_COURS` if `0 < heuresRealisees < volumePrevu`.
    - `TERMINE` if `heuresRealisees >= volumePrevu`.

## 3. NestJS Controllers and DTOs
- **DTOs (`backend/src/enseignements/dto/`)**:
  - `CreateSeanceDto`: Add `class-validator` decorators (`@IsDateString()`, `@Matches()` for time format, `@IsString()`).
  - `UpdateSeanceDto`: Partial variant of `CreateSeanceDto`.
- **Controllers (`backend/src/enseignements/controllers/`)**:
  - `EnseignementsController`:
    - `GET /:id/suivi`: Returns aggregated `EnseignementStats` (progression, state, realized hours).
    - `POST /:id/seances`: Plan or create a new realized seance.
    - `GET /:id/seances`: History of seances for an enseignement.

## 4. Frontend React Components (Teacher & Chef de scolarité)
- **Teacher UI (`src/app/enseignant/`)**:
  - Implement UI to create, edit, and delete `Seance` records.
  - Implement form handling (React Hook Form) to capture `dateSeance`, `heureDebut`, `heureFin`, and `contenuEnseigne`.
  - Display current progression visually with a progress bar when a teacher views their `Enseignement`.
- **Scolarité UI (`src/app/scolarite/`)**:
  - Implement dashboard with historical and aggregated views of all `Enseignements`.
  - Display dynamic `EtatBadge` based on backend statistics (NON_COMMENCE, EN_COURS, TERMINE).
  - Add filtering/sorting based on State or Progression.

## 5. Integration & State Management
- Use Next.js API Routes (under `src/app/api/`) or directly call the NestJS backend API.
- Ensure state updates on the frontend are synchronized correctly (e.g., using SWR or React Query for fetching the latest tracking stats after creating a seance).