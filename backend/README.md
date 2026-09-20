# Module Utilisateurs, Authentification et Rôles

**Projet :** Conception et développement d'une application Web de suivi et de pilotage des enseignants à l'EMIT
**Membre responsable :** Membre 1
**Périmètre :** Backend, API, base de données, frontend, authentification, gestion des utilisateurs, rôles et permissions, profil, sécurité des sessions, tests, documentation.

---

## 1. Vue d'ensemble

Ce module fournit le socle transversal de l'application :

- L'**authentification** de tous les utilisateurs (connexion, session, déconnexion)
- La **gestion des comptes** utilisateurs (création, consultation, modification, désactivation)
- Le **système de rôles et permissions** utilisé par l'ensemble du projet
- La **gestion du profil personnel** de chaque utilisateur
- La **sécurité des sessions**

Les 5 rôles définis dans l'étude de besoins sont gérés nativement :

| Rôle (valeur technique) | Libellé |
|---|---|
| `CHEF_SCOLARITE` | Chef de scolarité |
| `ADMINISTRATEUR` | Administrateur |
| `RESPONSABLE_LICENCE` | Responsable de mention Licence |
| `RESPONSABLE_MASTER` | Responsable de mention Master |
| `ENSEIGNANT` | Enseignant |

---

## 2. Stack technique

| Composant | Technologie | Version validée |
|---|---|---|
| Runtime | Node.js | v24.14.1 |
| Backend | NestJS | 12.x |
| ORM | Prisma (ORM v7, driver adapters) | 7.10.0 |
| Base de données | PostgreSQL | localhost:5432 |
| Authentification | JWT (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`) | — |
| Hachage mots de passe | bcrypt | — |
| Validation | class-validator / class-transformer | — |
| Frontend | React + Vite | React 19.2.8 / Vite 8.x |
| Routing frontend | react-router-dom | — |
| Style | Tailwind CSS | v4 (plugin `@tailwindcss/vite`) |
| Tests backend | Vitest + Supertest (e2e) | — |
| Gestionnaire de paquets | Yarn | 1.22.22 (obligatoire — ne pas utiliser npm) |

> ⚠️ Le backend est un projet **ESM strict** (`"type": "module"`, `moduleResolution: "nodenext"`).
> Tout import relatif entre fichiers `.ts` doit se terminer par `.js` (ex. `from './users.service.js'`).

---

## 3. Architecture des dossiers

```
backend/
├── prisma/
│   ├── schema.prisma          # Modèles User, Role (enum RoleName)
│   ├── seed.ts                 # Seed des 5 rôles + compte admin de test
│   └── migrations/
├── prisma.config.ts             # Configuration Prisma v7 (URL de connexion, seed)
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts   # POST /auth/login, GET /auth/profile, POST /auth/logout
│   │   ├── auth.service.ts      # Vérification identifiants + génération JWT
│   │   ├── auth.module.ts
│   │   ├── dto/login.dto.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── guards/jwt-auth.guard.ts
│   │   ├── guards/roles.guard.ts
│   │   └── decorators/roles.decorator.ts
│   ├── users/
│   │   ├── users.controller.ts  # CRUD comptes + profil personnel (/me)
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/ (create-user, update-user, update-profile, change-password)
│   ├── roles/                    # GET /roles (liste des rôles pour les formulaires)
│   ├── prisma/                   # PrismaService (driver adapter pg)
│   └── generated/prisma/         # Client Prisma généré (ignoré par Git)
└── test/
    ├── app.e2e-spec.ts
    └── permissions.e2e-spec.ts   # Tests par rôle + accès interdits

docs/
    ├── security.md               # Stratégie de session et sécurité
    └── permissions-matrix.md     # Matrice complète des permissions

frontend/
├── src/
│   ├── context/AuthContext.jsx   # État global d'authentification
│   ├── services/                 # apiClient, authApi, usersApi, rolesApi
│   ├── components/ProtectedRoute.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── UsersListPage.jsx     # Liste + recherche + filtres + pagination
│   │   ├── UserFormPage.jsx      # Création / édition
│   │   └── DashboardPlaceholder.jsx
│   └── styles/index.css          # Charte graphique EMIT (Tailwind @theme)
```

---

## 4. Modèle de données

```prisma
enum RoleName {
  CHEF_SCOLARITE
  ADMINISTRATEUR
  RESPONSABLE_LICENCE
  RESPONSABLE_MASTER
  ENSEIGNANT
}

model Role {
  id          Int       @id @default(autoincrement())
  name        RoleName  @unique
  description String?
  users       User[]
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // haché avec bcrypt, jamais stocké en clair
  firstName String
  lastName  String
  phone     String?
  isActive  Boolean  @default(true)
  roleId    Int
  role      Role     @relation(fields: [roleId], references: [id])
}
```

---

## 5. Variables d'environnement

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET=une-cle-secrete-forte
JWT_EXPIRATION=24h
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

Les fichiers `.env` réels ne sont **jamais commités** (voir `.gitignore`) ; seuls `.env.example` le sont.

---

## 6. Installation et lancement

### Prérequis
- Node.js v24+, Yarn, PostgreSQL en cours d'exécution localement.

### Backend

```bash
cd backend
yarn install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
yarn start:dev
```
Le serveur écoute sur `http://localhost:3000`.

### Frontend

```bash
cd frontend
yarn install
yarn dev
```
L'application est disponible sur `http://localhost:5173`.

### Compte de test (créé par le seed)

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@emit.mg` | `Admin123!` | ADMINISTRATEUR |

⚠️ Compte de **développement uniquement** — à ne jamais utiliser tel quel en production.

---

## 7. Documentation API

### Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Vérifie email/mot de passe, retourne un JWT + infos utilisateur |
| GET | `/auth/profile` | Authentifié | Retourne les infos de l'utilisateur du token courant |
| POST | `/auth/logout` | Authentifié | Endpoint symbolique (JWT stateless, nettoyage côté client) |

### Profil personnel

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/users/me` | Authentifié | Consulter son propre profil |
| PATCH | `/users/me` | Authentifié | Modifier prénom / nom / téléphone |
| PATCH | `/users/me/password` | Authentifié | Changer son mot de passe (vérifie l'ancien) |

### Gestion des comptes (réservé Chef de scolarité / Administrateur)

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/users` | CHEF_SCOLARITE, ADMINISTRATEUR | Créer un compte |
| GET | `/users` | CHEF_SCOLARITE, ADMINISTRATEUR | Lister (query : `search`, `role`, `isActive`, `page`, `limit`) |
| GET | `/users/:id` | CHEF_SCOLARITE, ADMINISTRATEUR | Consulter un compte |
| PATCH | `/users/:id` | CHEF_SCOLARITE, ADMINISTRATEUR | Modifier / désactiver (`isActive: false`) |
| GET | `/roles` | CHEF_SCOLARITE, ADMINISTRATEUR | Liste des rôles disponibles |

La matrice complète (avec justification métier) est détaillée dans `backend/docs/permissions-matrix.md`.

---

## 8. Sécurité

- Mots de passe hachés avec **bcrypt** (jamais stockés ni retournés en clair).
- Authentification **JWT stateless**, signée avec `JWT_SECRET`, expiration configurable (`JWT_EXPIRATION`).
- `JwtAuthGuard` protège toute route sensible côté backend.
- `RolesGuard` + décorateur `@Roles(...)` restreignent l'accès par rôle, réutilisable par tous les modules du projet.
- Un compte désactivé (`isActive: false`) ne peut plus se connecter (vérifié dans `AuthService.login`).
- Côté frontend, `ProtectedRoute` redirige vers `/login` si non authentifié, et vers `/dashboard` si le rôle n'est pas autorisé pour une page donnée.
- Détection automatique de session expirée (`apiClient.js`) : toute réponse `401` supprime le token local et redirige vers `/login` avec un message explicite.
- Détail complet dans `backend/docs/security.md`.

---

## 9. Tests

```bash
cd backend
yarn test:e2e
```

Fichiers de tests :
- `test/app.e2e-spec.ts` — test de base (route racine)
- `test/permissions.e2e-spec.ts` — 8 scénarios : accès non authentifié refusé, accès administrateur autorisé, accès enseignant refusé sur la gestion des comptes, accès enseignant autorisé sur son propre profil, token invalide refusé

**Limite connue** : ces tests s'exécutent contre la base de données de développement réelle (pas de base de test isolée). Amélioration possible si demandée : base de données dédiée aux tests.

Tests manuels réalisés en complément (voir historique de développement) : connexion valide/invalide, CRUD complet, recherche/filtres/pagination, désactivation de compte, expiration de session, déconnexion.

---

## 10. Points ouverts / dépendances avec d'autres modules

- **`mentionId` sur `User`** : pour que les responsables de mention (Licence/Master) soient limités aux enseignements de leur propre mention, un lien entre `User` et une future entité `Mention` (propriété du module Structure académique, Membre 3) sera nécessaire. **Non implémenté à ce stade** — à définir en concertation avec Membre 3 et Membre 4 (Enseignements) une fois leur modèle de données stabilisé.
- **Pas de refresh token** : à l'expiration du JWT, l'utilisateur doit se reconnecter entièrement (choix simple, cohérent avec la portée du projet).
- Le rôle exposé dans le JWT (`payload.role`) est la donnée de référence que les autres modules doivent utiliser pour leurs propres contrôles d'accès (via leur propre usage de `JwtAuthGuard`/`RolesGuard`, déjà génériques et réutilisables).

---

## 11. Organisation Git

- `main` : branche stable
- `develop` : branche d'intégration
- `feature/auth-users` : branche de développement de ce module

Flux utilisé à chaque étape fonctionnelle : commit sur `feature/auth-users` → push → merge dans `develop`.