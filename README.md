# APPLICATION DE SUIVI DES ENSEIGNEMENTS — EMIT

Application web permettant à l'administration de l'EMIT de gérer et suivre les enseignements, les enseignants, la structure académique, les séances, la progression des cours, les emplois du temps, les examens et les alertes.

---

## 1. Présentation du projet

L'application a pour objectif de centraliser le suivi des enseignements au sein de l'EMIT.

Elle permet notamment :

* la gestion des utilisateurs et de leurs rôles ;
* la gestion des enseignants ;
* la gestion de la structure académique ;
* la gestion des enseignements et des séances ;
* le suivi de la progression des enseignements ;
* la génération et la consultation des emplois du temps ;
* la gestion des sessions et examens ;
* le suivi de la remise des notes ;
* la gestion des alertes et opérations en attente.

L'application est organisée en modules indépendants mais interconnectés.

---

# 2. Technologies utilisées

## Frontend

* React
* JavaScript / JSX
* Yarn

## Backend

* NestJS
* Node.js
* TypeScript
* Yarn

## Base de données

* PostgreSQL

## Gestion de version

* Git
* GitHub

---

# 3. Architecture du projet

```text
STAGE EMIT L3/
│
├── frontend/                    # Application React
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/                     # API NestJS
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── ...
│
├── database/                    # Scripts PostgreSQL
│   ├── migrations/
│   ├── seed/
│   └── README.md
│
├── docs/                        # Documentation technique
│
├── .gitignore
└── README.md
```

---

# 4. Base de données PostgreSQL

## Nom de la base de données

```text
suivi_enseignements_db
```

Tous les membres doivent utiliser cette même base de données pour le développement du projet.

### Création de la base

Dans PostgreSQL :

```sql
CREATE DATABASE suivi_enseignements_db;
```

Pour vérifier :

```sql
\l
```

Pour se connecter à la base :

```sql
\c suivi_enseignements_db
```

Pour vérifier les tables :

```sql
\dt
```

---

# 5. Configuration de la base de données

Chaque développeur doit configurer son environnement local avec les informations de connexion PostgreSQL.

Exemple :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=suivi_enseignements_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

***Ne jamais envoyer le vrai mot de passe PostgreSQL sur GitHub.

Le fichier `.env` doit rester ignoré par Git.

Utiliser plutôt un fichier :

```text
.env.example
```

Exemple :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=suivi_enseignements_db
DB_USER=postgres
DB_PASSWORD=
```

---

# 6. Organisation Git

Le projet utilise une organisation basée sur deux branches principales :

```text
main
│
└── develop
     │
     ├── feature/auth-users (membre 1)
     ├── feature/teachers-dashboard (membre 2)
     ├── feature/academic-structure (membre 3)
     ├── feature/teaching-progress (membre 4)
     ├── feature/schedule (membre 5)
     └── feature/exams-alerts (membre 6)
```

## Branche `main`

La branche `main` contient uniquement les versions stables du projet.

Les développeurs ne doivent pas travailler directement sur `main`.

## Branche `develop`

La branche `develop` est la branche d'intégration.

Les différents modules sont intégrés et testés sur `develop` avant leur passage vers `main`.

---

# 7. Branches des membres

| Branche                      | Module                                  | Responsable |
| ---------------------------- | --------------------------------------- | ----------- |
| `feature/auth-users`         | Utilisateurs, authentification et rôles | Membre 1    |
| `feature/teachers-dashboard` | Enseignants et dashboard enseignant     | Membre 2    |
| `feature/academic-structure` | Structure académique                    | Membre 3    |
| `feature/teaching-progress`  | Enseignements, séances et progression   | Membre 4    |
| `feature/schedule`           | Emploi du temps                         | Membre 5    |
| `feature/exams-alerts`       | Examens, remise des notes et alertes    | Membre 6    |

Chaque membre travaille principalement sur **sa propre branche**.

---

# 8. Règle importante de collaboration

Chaque membre est responsable de son module **de bout en bout** :

```text
Analyse
   ↓
Conception
   ↓
Base de données
   ↓
Backend / API
   ↓
Frontend
   ↓
Tests
   ↓
Documentation
```

Un membre ne doit pas développer le module attribué à un autre membre.

Les modules peuvent cependant communiquer entre eux lorsque cela est nécessaire pour respecter les dépendances fonctionnelles.

---

# 9. Module 1 — Utilisateurs, authentification et rôles

### Branche

```text
feature/auth-users
```

### Responsabilités

* T01 — Authentification / Connexion
* T02 — Gestion des utilisateurs
* T03 — Gestion des rôles et permissions
* T04 — Profil utilisateur
* T05 — Sécurité des sessions / déconnexion

Le module comprend donc :

```text
Authentification
Utilisateurs
Rôles
Permissions
Profils
Sessions
Déconnexion
Sécurité
```

Le membre 1 doit réaliser l'analyse, la conception, la BDD, le backend, le frontend, les tests et la documentation de ce module.

---

# 10. Module 2 — Enseignants et dashboard enseignant

### Branche

```text
feature/teachers-dashboard
```

### Responsabilités

* T06 — Gestion des enseignants
* T07 — Affectations pédagogiques
* T08 — Dashboard enseignant
* T09 — Informations personnelles et pédagogiques
* T10 — Activités enseignant

Le module permet notamment de retrouver les informations pédagogiques et les activités associées à un enseignant.

---

# 11. Module 3 — Structure académique

### Branche

```text
feature/academic-structure
```

### Responsabilités

* T11 — Mentions
* T12 — Cycles Licence / Master
* T13 — Niveaux L1 / L2 / L3 / M1 / M2
* T14 — Années universitaires
* T15 — Semestres et matières

Structure concernée :

```text
Mention
   │
   └── Cycle
        │
        └── Niveau
             │
             └── Année universitaire
                  │
                  └── Semestre
                       │
                       └── Matières
```

Ces éléments constituent notamment les données nécessaires aux modules d'enseignement et d'emploi du temps.

---

# 12. Module 4 — Enseignements, séances et progression

### Branche

```text
feature/teaching-progress
```

### Responsabilités

* T16 — Enseignements
* T17 — Séances
* T18 — Suivi de progression
* T19 — États des enseignements
* T20 — Heures réalisées / contenu enseigné

Les états d'un enseignement sont :

```text
Non commencé
      ↓
   En cours
      ↓
    Terminé
```

Le module dépend notamment des enseignants et de la structure académique.

Le membre 4 doit également gérer les séances, la progression, les heures réalisées et le contenu enseigné.

---

# 13. Module 5 — Emploi du temps

### Branche

```text
feature/schedule
```

### Responsabilités

* T21 — Salles et créneaux
* T22 — Construction / génération de l'emploi du temps
* T23 — Détection des conflits
* T24 — Consultation de l'emploi du temps
* T25 — Contraintes de planification

Le système doit notamment prendre en compte :

```text
Enseignant
Matière
Salle
Créneau
Classe / niveau
Séance
Contraintes
```

Il doit également permettre la détection des conflits de planification.

Le module dépend notamment des enseignants, de la structure académique et des enseignements.

---

# 14. Module 6 — Examens, remise des notes et alertes

### Branche

```text
feature/exams-alerts
```

### Responsabilités

* T26 — Sessions d'examen
* T27 — Examens
* T28 — État des examens
* T29 — Suivi de remise des notes
* T30 — Alertes / opérations en attente

États possibles d'un examen :

```text
À venir
En cours
Terminé
```

Le suivi de remise des notes concerne principalement le fait de savoir si les notes ont été remises.

Ce module ne constitue pas un module complet de calcul des moyennes, de bulletins ou de gestion détaillée des notes individuelles.

---

# 15. Ordre recommandé de développement

Les modules possèdent des dépendances.

L'ordre recommandé est :

```text
1. M1 — Authentification / Utilisateurs / Rôles
             ↓
2. M3 — Structure académique
             ↓
3. M2 — Enseignants
             ↓
4. M4 — Enseignements / Séances / Progression
             ↓
5. M5 — Emploi du temps
             ↓
6. M6 — Examens / Alertes
```

Cela permet d'éviter de développer certaines fonctionnalités avant que leurs données de base existent.

---

# 16. Installation du projet

Après avoir cloné le projet :

```bash
git clone git@github.com:joellanaurlays/SuiviCoursDesEnseignants_react_nest.git
```

Entrer dans le projet :

```bash
cd SuiviCoursDesEnseignants_react_nest
```

---

# 17. Récupérer les branches

```bash
git fetch --all
```

Voir les branches :

```bash
git branch -a
```

---

# 18. Choisir sa branche

Exemple pour le membre 1 :

```bash
git switch feature/auth-users
```

Membre 2 :

```bash
git switch feature/teachers-dashboard
```

Membre 3 :

```bash
git switch feature/academic-structure
```

Membre 4 :

```bash
git switch feature/teaching-progress
```

Membre 5 :

```bash
git switch feature/schedule
```

Membre 6 :

```bash
git switch feature/exams-alerts
```

---

# 19. Avant de commencer à travailler

Toujours récupérer les dernières modifications de `develop`.

```bash
git switch develop
git pull origin develop
```

Puis retourner sur sa branche :

```bash
git switch feature/ma-branche
```

Si nécessaire, synchroniser sa branche avec `develop` :

```bash
git merge develop
```

Résoudre les éventuels conflits avant de continuer.

---

# 20. Installation du frontend

Entrer dans le frontend :

```bash
cd frontend
```

Installer les dépendances :

```bash
yarn install
```

Lancer React :

```bash
yarn dev
```

---

# 21. Installation du backend

Entrer dans le backend :

```bash
cd backend
```

Installer les dépendances :

```bash
yarn install
```

Lancer le serveur NestJS en développement :

```bash
yarn start:dev
```

---

# 22. Base de données

Créer la base PostgreSQL :

```sql
CREATE DATABASE suivi_enseignements_db;
```

Puis se connecter :

```bash
psql -U postgres -d suivi_enseignements_db
```

Vérifier :

```sql
SELECT current_database();
```

Le résultat attendu :

```text
suivi_enseignements_db
```

---

# 23. Gestion des modifications Git

Avant de commencer :

```bash
git status
```

Après avoir travaillé :

```bash
git status
```

Ajouter les fichiers :

```bash
git add .
```

Créer un commit :

```bash
git commit -m "feat(module): description de la fonctionnalité"
```

Envoyer sur GitHub :

```bash
git push
```

---

# 24. Convention des commits

Utiliser des commits explicites et professionnels.

### Nouvelle fonctionnalité

```bash
git commit -m "feat(auth): add login functionality"
```

### Correction

```bash
git commit -m "fix(auth): handle invalid credentials"
```

### Frontend

```bash
git commit -m "feat(ui): add teacher dashboard"
```

### Base de données

```bash
git commit -m "feat(db): add teacher tables"
```

### Tests

```bash
git commit -m "test(auth): add authentication tests"
```

### Documentation

```bash
git commit -m "docs(auth): document authentication API"
```

### Configuration

```bash
git commit -m "chore: configure project environment"
```

---

# 25. Pull Request

Un membre ne doit pas fusionner directement sa branche dans `main`.

Workflow :

```text
feature/mon-module
        │
        │ push
        ▼
     GitHub
        │
        │ Pull Request
        ▼
     develop
        │
        │ tests / review
        ▼
      main
```

Exemple :

```bash
git push -u origin feature/auth-users
```

Puis créer une Pull Request :

```text
feature/auth-users → develop
```

Après validation et tests, le module peut être intégré.

---

# 26. Règles importantes

## Ne jamais travailler directement sur `main`

```bash
git switch main
```

est réservé principalement à la consultation et aux versions stables.

##Ne jamais faire

```bash
git push --force
```

sur `main` ou `develop` sans accord de l'équipe.

## Ne jamais committer

```text
.env
node_modules/
dist/
build/
logs/
```

## Ne jamais mettre les mots de passe PostgreSQL dans GitHub.

## Toujours vérifier sa branche

```bash
git branch --show-current
```

## Toujours vérifier son état Git

```bash
git status
```

---

# 27. Avant chaque session de travail

Faire :

```bash
git switch develop
git pull origin develop
```

Puis :

```bash
git switch feature/ma-branche
```

Puis :

```bash
git status
```

---

# 28. Avant de terminer une session

```bash
git status
```

Puis :

```bash
git add .
```

```bash
git commit -m "feat(module): description"
```

Puis :

```bash
git push
```

---

# 29. Tests avant Pull Request

Avant de demander l'intégration dans `develop`, vérifier :

### Frontend

```bash
cd frontend
yarn build
```

### Backend

```bash
cd backend
yarn build
```

Puis lancer les tests disponibles :

```bash
yarn test
```

Chaque membre doit vérifier que son module fonctionne correctement avant de créer sa Pull Request.

---

# 30. Documentation de chaque module

Chaque membre doit documenter son module.

La documentation doit notamment présenter :

```text
1. Description du module
2. Analyse des besoins
3. Cas d'utilisation
4. Diagrammes UML
5. Modèle de données
6. Tables utilisées
7. API développées
8. Interfaces frontend
9. Tests réalisés
10. Difficultés rencontrées
11. Solutions apportées
```

---

# 31. Principe général du projet

Le projet doit respecter le principe suivant :

```text
                    APPLICATION
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   UTILISATEURS      ENSEIGNANTS       STRUCTURE
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                  ENSEIGNEMENTS
                         │
              ┌──────────┴──────────┐
              │                     │
         PROGRESSION           EMPLOI DU TEMPS
              │                     │
              └──────────┬──────────┘
                         │
                      EXAMENS
                         │
                      ALERTES
```

Les modules doivent rester clairement séparés tout en respectant leurs relations et dépendances.

---

# 32. Résumé du workflow de l'équipe

```text
1. Mettre à jour develop
        ↓
2. Travailler sur sa branche
        ↓
3. Développer son module
        ↓
4. Tester
        ↓
5. Commit
        ↓
6. Push
        ↓
7. Pull Request → develop
        ↓
8. Review
        ↓
9. Tests d'intégration
        ↓
10. Merge dans develop
        ↓
11. Version stable → main
```

---

# 33. Commandes Git essentielles

### Voir la branche actuelle

```bash
git branch --show-current
```

### Voir le statut

```bash
git status
```

### Voir toutes les branches

```bash
git branch -a
```

### Récupérer les modifications

```bash
git fetch --all
```

### Mettre à jour develop

```bash
git switch develop
git pull origin develop
```

### Changer de branche

```bash
git switch feature/nom-de-la-branche
```

### Ajouter les fichiers

```bash
git add .
```

### Commit

```bash
git commit -m "feat(module): description"
```

### Push

```bash
git push
```

---

# 34. État initial du repository

Branches principales :

```text
main
develop
```

Branches des modules :

```text
feature/auth-users
feature/teachers-dashboard
feature/academic-structure
feature/teaching-progress
feature/schedule
feature/exams-alerts
```

Architecture :

```text
frontend/     → React
backend/      → NestJS
database/     → PostgreSQL
docs/         → Documentation
```

Base PostgreSQL :

```text
suivi_enseignements_db
```

---

# 35. Objectif final

L'objectif est de construire une application complète permettant à l'administration de gérer les enseignements et aux enseignants de consulter et suivre leurs activités pédagogiques.

Chaque membre doit rester propriétaire de son module tout en respectant les interfaces, les dépendances et les conventions communes du projet.

**Un projet propre, modulaire, testé, documenté et versionné avec Git/GitHub est attendu.**

