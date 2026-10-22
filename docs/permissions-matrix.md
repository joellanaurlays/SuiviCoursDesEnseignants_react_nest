# Matrice des permissions — Module Utilisateurs / Authentification

Cette matrice couvre les ressources gérées par le module Utilisateurs/Auth
(`/auth`, `/users`, `/roles`). Les ressources des autres modules (enseignements,
emploi du temps, examens...) suivront leur propre matrice, définie par leurs
responsables respectifs, en réutilisant le même mécanisme (`@Roles()` + `RolesGuard`).

## Légende
- ✅ Autorisé
- ❌ Interdit (403 Forbidden)
- 🔓 Public (pas d'authentification requise)
- 🔐 Authentifié uniquement (peu importe le rôle)

## Endpoints d'authentification

| Endpoint | Chef de scolarité | Administrateur | Resp. Licence | Resp. Master | Enseignant | Non connecté |
|---|---|---|---|---|---|---|
| `POST /auth/login` | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 | 🔓 |
| `GET /auth/profile` | 🔐 | 🔐 | 🔐 | 🔐 | 🔐 | ❌ |
| `POST /auth/logout` | 🔐 | 🔐 | 🔐 | 🔐 | 🔐 | ❌ |

## Endpoints de profil personnel (chaque utilisateur gère le sien)

| Endpoint | Tous rôles authentifiés | Non connecté |
|---|---|---|
| `GET /users/me` | ✅ (ses propres données uniquement) | ❌ |
| `PATCH /users/me` | ✅ (ses propres données uniquement) | ❌ |
| `PATCH /users/me/password` | ✅ (nécessite le mot de passe actuel) | ❌ |

## Endpoints de gestion des comptes (administration)

| Endpoint | Chef de scolarité | Administrateur | Resp. Licence | Resp. Master | Enseignant | Non connecté |
|---|---|---|---|---|---|---|
| `POST /users` (créer un compte) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /users` (lister, rechercher, filtrer) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /users/:id` (consulter un compte) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /users/:id` (modifier, désactiver) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /roles` (liste des rôles disponibles) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Justification métier

- **Chef de scolarité / Administrateur** : seuls habilités à créer/gérer les comptes,
  conformément au rôle central de gestion académique et administrative attribué par
  l'étude de besoins.
- **Responsable de mention (Licence/Master) / Enseignant** : n'ont pas de droit
  d'administration des comptes. Ils gèrent uniquement leur propre profil
  (`/users/me`). Leur périmètre métier (accès restreint aux enseignements de leur
  mention pour les responsables, espace personnel pour les enseignants) est mis en
  œuvre par les modules Structure académique / Enseignements (Membres 3 et 4), qui
  s'appuient sur le rôle exposé dans le token JWT émis par ce module.

## Mécanisme technique (réutilisable par les autres modules)

1. Le JWT contient `{ sub, email, role }` (voir `AuthService.login`).
2. `JwtAuthGuard` vérifie la validité du token et peuple `req.user`.
3. `RolesGuard` + `@Roles('RÔLE_A', 'RÔLE_B')` restreint une route aux rôles listés.
   Sans `@Roles()`, la route est ouverte à tout utilisateur authentifié.
4. Un contrôleur applique les deux guards : `@UseGuards(JwtAuthGuard, RolesGuard)`.

## Dépendance ouverte (non résolue dans ce module)

Le filtrage des **enseignements par mention** pour `RESPONSABLE_LICENCE` /
`RESPONSABLE_MASTER` nécessite un lien entre `User` et une future entité `Mention`
(propriété du module Structure académique, Membre 3). Ce lien n'est **pas encore
implémenté** — à définir en concertation avec Membre 3 avant que son module ou celui
des Enseignements (Membre 4) n'en ait besoin.