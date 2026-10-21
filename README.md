# SuiviCoursDesEnseignants_react_nest
Application Web de suivi et de pilotage des enseignants à l'EMIT

## Lancement local

1. Copier `backend/.env.example` vers `backend/.env` et renseigner les accès PostgreSQL à `suivicours_db`.
2. Installer les dépendances avec `yarn install` dans `backend` et `frontend`.
3. Depuis `frontend`, lancer `yarn dev`. Cette commande démarre le backend NestJS et Vite ensemble (API sur le port 3000, interface sur le port 5173). Pour des terminaux séparés, utilisez `yarn start:dev` dans `backend` et `yarn dev:vite` dans `frontend`.

Le frontend appelle `/api`; Vite relaie ces requêtes vers le backend. Les données de salles, créneaux, séances, planning et contraintes sont chargées et enregistrées via PostgreSQL. Les enseignements sont lus depuis les tables académiques `enseignement`, `enseignant` et `niveau`.
