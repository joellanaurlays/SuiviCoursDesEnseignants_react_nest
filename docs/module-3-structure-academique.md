# Module 3 — Structure académique

Branche : `feature/academic-structure`
Responsable : Membre 3 (analyse des besoins, UML, module « Structure académique » — tâches T11 à T15)

## 1. Description du module

Ce module gère la structure académique de l'EMIT : mentions, cycles (Licence / Master), niveaux,
années universitaires, semestres et matières. Ces données servent de socle aux autres modules
(affectation des enseignants, emploi du temps, suivi des cours, examens). L'utilisateur peut créer,
consulter, modifier et supprimer chaque élément, rechercher dans les listes et visualiser toute la
hiérarchie sous forme d'arbre.

## 2. Analyse des besoins

| Tâche | Description | Réalisation |
|---|---|---|
| T11 | Gestion des mentions | CRUD + unicité du nom |
| T12 | Gestion des cycles (Licence / Master) | CRUD + un cycle de chaque type par mention |
| T13 | Gestion des niveaux (L1, L2, L3, M1, M2) | CRUD + unicité par cycle |
| T14 | Gestion des années universitaires | CRUD + format AAAA-AAAA consécutif |
| T15 | Gestion des semestres et des matières | CRUD + numéro 1–10, volume horaire 1–500 h |

Besoins non fonctionnels : contrôle de saisie, messages d'erreur clairs en français, interface
responsive, cohérence des données (pas de doublon, pas d'élément orphelin).

## 3. Modèle de données

```
Mention (id, nom)
   └── 1..2 → Cycle (id, type: Licence | Master, mentionId)
                 └── 1..* → Niveau (id, libelle, cycleId)
                              └── 1..* → AnneeUniversitaire (id, libelle, niveauId)
                                           └── 1..* → Semestre (id, numero, anneeUniversitaireId)
                                                        └── 1..* → Matiere (id, nom, volumeHoraire, semestreId)
```

Hiérarchie linéaire conforme au README général du projet. Chaque clé étrangère est
`NOT NULL` avec `ON DELETE CASCADE` : supprimer un élément supprime tout ce qui en dépend.

## 4. Tables PostgreSQL

`mention`, `cycle`, `niveau`, `annee_universitaire`, `semestre`, `matiere` — script complet dans
`database/schema.sql`.

| Table | Contraintes d'unicité |
|---|---|
| mention | `nom` |
| cycle | `(mentionId, type)` |
| niveau | `(cycleId, libelle)` |
| annee_universitaire | `(niveauId, libelle)` |
| semestre | `(anneeUniversitaireId, numero)` |
| matiere | `(semestreId, nom)` |

## 5. API développées

Base : `http://localhost:3000/api`

| Ressource | Endpoints |
|---|---|
| `/mentions`, `/cycles`, `/niveaux`, `/annees-universitaires`, `/semestres`, `/matieres` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/structure/stats` | `GET` — compteurs par entité + volume horaire total |
| `/structure/tree` | `GET` — arbre complet Mention → … → Matière |

Gestion d'erreurs : `400` données invalides (avec `fieldErrors` par champ), `404` introuvable,
`409` doublon, `400` parent inexistant (violation de clé étrangère PostgreSQL).

## 6. Interfaces frontend

- **Tableau de bord** : compteurs, volume horaire total, chaîne hiérarchique cliquable, guide « Pour commencer » si la base est vide.
- **Vue arborescente** : toute la structure, dépliable/repliable.
- **6 pages de gestion** : tableau avec libellés hiérarchiques (ex. « L1 — Licence Informatique »), recherche instantanée, formulaire latéral, erreurs affichées sous chaque champ, notifications de succès/erreur, confirmation modale avant suppression.
- **Ergonomie** : états de chargement, message clair si le serveur est injoignable (bouton « Réessayer »), invitation à créer l'élément parent quand une liste déroulante est vide, navigation clavier (Échap pour fermer), menu adapté au mobile.

## 7. Tests réalisés

**Backend (API, base PostgreSQL réelle)**
- Compilation `nest build` sans erreur ; démarrage et mapping de toutes les routes.
- Chaîne complète Mention → Cycle → Niveau → Année → Semestre → Matière créée via l'API.
- Validation : nom vide/trop court, champ inconnu, type de cycle invalide, année `2025-2027`, semestre 11, volume horaire 0.
- Intégrité : doublons (409), parent inexistant (400), identifiant non numérique (400), élément introuvable (404).
- Changement de parent via `PATCH` (matière déplacée vers un autre semestre) et suppression en cascade.
- Seed idempotent (exécuté deux fois : second passage ignoré).

**Frontend (navigateur automatisé Chromium, 25 vérifications)**
- Validation en direct, message de doublon renvoyé par le serveur, création / modification / suppression avec toasts.
- Liste déroulante hiérarchique, recherche (avec résultat vide), modale de suppression (confirmer / annuler), cascade visible.
- Vue arborescente, route inconnue, menu mobile, serveur arrêté, base vide, parent absent.

## 8. Difficultés rencontrées

- Incohérence initiale entre le premier schéma de classes (matière rattachée au niveau) et le README général (matière rattachée au semestre) → clarifiée, modèle linéaire retenu.
- Backend de l'équipe en **ESM** (`nodenext`, NestJS 12, TypeScript 6) : imports relatifs sans extension refusés (erreurs TS2307), relations circulaires TypeORM provoquant des erreurs d'initialisation.
- Incompatibilités d'environnement : version de Node exigée par Yarn, fichiers de configuration écrasés lors d'une copie.
- Avec TypeORM, modifier une clé étrangère sur une entité chargée avec sa relation peut ne pas être pris en compte.

## 9. Solutions apportées

- Hiérarchie linéaire Mention → Cycle → Niveau → Année → Semestre → Matière appliquée partout (modèle, API, interface, documentation).
- Tous les imports relatifs se terminent par `.js` ; relations typées `Relation<T>` (`import type`) ; projet autonome sans dépendance aux fichiers de l'équipe.
- Mise à jour via `repository.update` (la clé étrangère est toujours prise en compte).
- Service CRUD générique (`BaseCrudService`) et page CRUD pilotée par configuration (`entities.jsx`) : peu de duplication entre les 6 entités.
- Validation dupliquée côté client (retour immédiat) et serveur (sécurité), erreurs PostgreSQL traduites en messages français.


## 8. Intégration dans le dépôt de l'équipe (branche `develop`)

- **Backend** : dossier `backend/src/academic-structure/` (un sous-dossier par entité + `tree/` pour l'arbre et les
  statistiques), enregistré dans `AppModule` via `AcademicStructureModule`. Accès SQL en **TypeORM** (comme le module
  examens), sur la même base PostgreSQL que Prisma (`DATABASE_URL`) ; les 6 tables sont créées par `synchronize` en
  développement (script équivalent : `database/migrations/002_structure_academique.sql`).
- **Routes API** : `/api/mentions`, `/api/cycles`, `/api/niveaux`, `/api/annees-universitaires`, `/api/semestres`,
  `/api/matieres` (CRUD) + `GET /api/structure/stats` et `GET /api/structure/tree`.
- **Droits** : lecture pour tout compte authentifié ; création, modification et suppression réservées au
  **chef de scolarité** (`@Roles(Role.SCOLARITE)` → 403 sinon). Les boutons correspondants sont masqués côté interface.
- **Validation** : le `ValidationPipe` global de `main.ts` renvoie désormais, en plus de `message` (inchangé),
  un objet `fieldErrors` (champ → messages) utilisé par les formulaires. `DbExceptionFilter` convertit les erreurs
  PostgreSQL (23505 → 409, 23503 → 400).
- **Frontend** : dossier `frontend/src/structure/`, monté sur `/structure-academique/*` (lien « Structure académique »
  dans le menu « Autres modules »). CSS limité à la classe `.sa-root`.
- **Données de démonstration** : `cd backend && yarn seed:structure` (idempotent).
- **Tests manuels réalisés** : sans identité → 401 ; enseignant en écriture → 403 ; doublon → 409 ; année `2025-2027`
  refusée (400 + `fieldErrors`) ; parent inexistant → 400 ; suppression d'une mention → cascade sur toute la hiérarchie.
