# Backend — Suivi des enseignements

Backend NestJS + TypeScript + Prisma + PostgreSQL du module **Suivi des enseignements**.

## Démarrage

```bash
npm install
npx prisma generate          # génère le client Prisma
npm run start:dev            # ts-node backend/src/main.ts (port 3000)
```

Variables d'environnement (`.env`) : `DATABASE_URL` (PostgreSQL).

## Authentification (par headers)

Le backend applique les permissions dans NestJS. Chaque requête doit envoyer :

| Header           | Valeur                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `x-user-id`      | identifiant de l'utilisateur                                     |
| `x-user-role`    | `ENSEIGNANT` \| `SCOLARITE` \| `RESPONSABLE_MENTION` \| `ADMINISTRATEUR` |
| `x-user-mention` | obligatoire pour `RESPONSABLE_MENTION` (mention de l'utilisateur) |
| `x-user-cycle`   | pour `RESPONSABLE_MENTION` (ex. `LICENCE,MASTER`)                |

Absence/invalidité → `401`, rôle non autorisé → `403`, périmètre non autorisé → `403`.

## Endpoints (préfixe `/api`)

### Enseignements

| Méthode | Route                          | Rôles                        | Description                              |
| ------- | ------------------------------ | ----------------------------- | ---------------------------------------- |
| GET     | `/enseignements`               | ENSEIGNANT, SCOLARITE, RM, ADMIN | Liste (périmètre appliqué)             |
| GET     | `/enseignements/:id`           | idem                          | Détail                                  |
| POST    | `/enseignements`               | SCOLARITE, ADMIN              | Création                                |
| PATCH   | `/enseignements/:id`           | SCOLARITE, ADMIN              | Modification (recalcule le suivi)       |
| DELETE  | `/enseignements/:id`           | SCOLARITE, ADMIN              | Suppression (+ séances)                 |

### Suivi

| Méthode | Route                                                         | Rôles  | Description                                   |
| ------- | ------------------------------------------------------------ | ------ | --------------------------------------------- |
| GET     | `/enseignements/:id/suivi`                                   | 4 rôles | Suivi d'un enseignement                     |
| GET     | `/suivi/enseignements`                                       | 4 rôles | Suivi global (filtres)                      |
| GET     | `/suivi/enseignements/:id`                                   | 4 rôles | Suivi global d'un enseignement              |
| GET     | `/enseignants/:enseignantId/dashboard`                       | 4 rôles | Tableau de bord d'un enseignant (scopé)     |

Réponse du suivi d'un enseignement :

```json
{
  "enseignementId": "",
  "volumePrevu": 30,
  "heuresRealisees": 18,
  "heuresRestantes": 12,
  "progression": 60,
  "etat": "EN_COURS"
}
```

Filtres de `GET /suivi/enseignements` : `enseignant`, `matiere`, `mention`, `parcours`, `cycle`, `niveau`, `semestre`, `anneeUniversitaire`, `etat`, `search`. Les variantes `*Id` (`enseignantId`, `matiereId`, …) sont aussi acceptées. Exemple :
`?mention=Informatique&cycle=LICENCE&etat=EN_COURS`.

### Séances

| Méthode | Route                                        | Rôles           | Description                                        |
| ------- | -------------------------------------------- | --------------- | -------------------------------------------------- |
| GET     | `/seances`                                   | SCOLARITE, RM, ADMIN | Liste globale (périmètre appliqué)          |
| GET     | `/seances/:id`                               | 4 rôles         | Détail (propriétaire ou périmètre)                 |
| POST    | `/seances`                                   | ENSEIGNANT, ADMIN | Création (enseignant : seulement ses enseignements) |
| PATCH   | `/seances/:id`                               | ENSEIGNANT, ADMIN | Modification                                |
| DELETE  | `/seances/:id`                               | ENSEIGNANT, ADMIN | Suppression                                |
| GET     | `/enseignements/:id/seances`                 | 4 rôles         | Historique des séances (tri date/heure asc)        |
| POST    | `/enseignements/:id/seances`                 | ENSEIGNANT, ADMIN | Création rattachée à un enseignement              |
| PATCH   | `/enseignements/:enseignementId/seances/:seanceId` | ENSEIGNANT, ADMIN | Modification rattachée                   |
| DELETE  | `/enseignements/:enseignementId/seances/:seanceId` | ENSEIGNANT, ADMIN | Suppression rattachée                  |

Champs : `enseignementId`, `dateSeance`, `heureDebut`, `heureFin`, `duree`, `contenuEnseigne`, `statut` (`PLANIFIEE` | `REALISEE` | `ANNULEE`).

## Règles métier (source de vérité unique : `domain/calcul-suivi.ts`)

- **Durée** = `heureFin - heureDebut`, calculée côté serveur (la durée envoyée par le client est ignorée).
  - `heureFin <= heureDebut` ou format invalide → `400`.
- **Heures réalisées** = somme des durées des séances `REALISEE` (PLANIFIEE et ANNULEE exclues).
- **Heures restantes** = `max(volumePrevu - heuresRealisees, 0)`.
- **Progression** = `(heuresRealisees / volumePrevu) x 100`, bornée `0..100`.
- **État** : `0 h` → `NON_COMMENCE` ; `0 < h < volume` → `EN_COURS` ; `h >= volume` → `TERMINE`.

Toutes les réponses API recalculent ces valeurs depuis les séances en base. Les colonnes `heuresRealisees`, `progression`, `etat` sont un cache dénormalisé maintenu par `SuiviRecalculService` après chaque mutation.

## Permissions (périmètre : fichier `permissions/permissions.service.ts`)

| Rôle                | Lecture                                             | Écriture                                      |
| ------------------- | --------------------------------------------------- | --------------------------------------------- |
| ENSEIGNANT          | ses propres enseignements, séances, suivi           | créer/modifier/supprimer ses séances          |
| SCOLARITE           | tous les enseignements, séances, contenus, filtres  | créer/modifier/supprimer les enseignements    |
| RESPONSABLE_MENTION | uniquement sa mention (+ cycle(s))                  | aucune                                        |
| ADMINISTRATEUR      | tous les enseignements, séances, suivi              | gestion des enseignements et séances          |

Les restrictions sont appliquées dans le backend (guard + `PermissionsService`), jamais seulement côté frontend.

## Modèles Prisma (`prisma/schema.prisma`)

- **Enseignement** : `matiereId`, `enseignantId`, `mentionId`, `cycle` (enum), `niveauId`, `parcours`, `semestreId`, `anneeUniversitaireId`, `volumePrevu`, champs agrégés, `seances`.
  - Index : `(enseignantId)`, `(mentionId, cycle)`.
- **Seance** : `dateSeance`, `heureDebut`, `heureFin`, `duree`, `contenuEnseigne`, `statut` (enum), relation `enseignement`.
  - Index : `(enseignementId, dateSeance)`.

## Vérification

```bash
npm run build:backend                      # tsc
npm test                                   # tests unitaires (jest)
npx prisma validate && npx prisma generate
node backend/dist/main.js                  # démarrage serveur
npx ts-node -P backend/tsconfig.json backend/scripts/verify-suivi-e2e.ts   # E2E (serveur démarré, vraie base)
```

Seed de démonstration (volontaire, idempotent) : `npx prisma db seed`.