/**
 * setup-demo.cjs
 * ==============
 * Script de préparation complète de la base de données en une seule commande.
 *
 * Prérequis : le fichier backend/.env doit déjà contenir DATABASE_URL.
 *
 * Usage :
 *   cd backend
 *   node ../prisma/setup-demo.cjs
 *
 * Ce qu'il fait :
 * 1. Crée les tables (prisma db push)
 * 2. Crée les rôles et comptes de base (seed.ts)
 * 3. Crée les enseignements et séances de test (seed.js)
 * 4. Crée les 6 parcours EMIT (seed-parcours.cjs)
 * 5. Crée les comptes utilisateurs enseignants (seed-comptes-suivi.cjs)
 * 6. Recalcule les agrégats de suivi (heures, progression, état)
 *
 * IDEMPOTENT : peut être relancé sans créer de doublons.
 */

require('fs').writeFileSync('.env', [
  'DATABASE_URL="postgresql://postgres:alphino@localhost:5432/suivi_enseignements_db?schema=public"',
  'JWT_SECRET="emit-suivi-secret-de-developpement-a-changer-en-production"',
  'JWT_EXPIRATION="7d"',
  'PORT=3000',
  'FRONTEND_URL=http://localhost:5173',
].join('\n') + '\n', { flag: 'a' });

const { execSync } = require('child_process');

function step(numero, total, message, commande) {
  console.log('');
  console.log(`🚀 Étape ${numero}/${total} — ${message}...`);
  try {
    execSync(commande, { stdio: 'inherit' });
  } catch (e) {
    console.error(`❌ Échec : ${e.message}`);
    process.exit(1);
  }
}

const total = 6;

step(1, total, 'Création des tables (prisma db push)', 'npx prisma db push');

step(2, total, 'Création des rôles et comptes de base (seed.ts)', 'npx tsx prisma/seed.ts');

step(3, total, 'Création des enseignements et séances (seed.js)', 'node -r dotenv/config prisma/seed.js');

step(4, total, 'Création des 6 parcours EMIT (seed-parcours.cjs)', 'node -r dotenv/config prisma/seed-parcours.cjs');

step(5, total, 'Création des comptes utilisateurs enseignants (seed-comptes-suivi.cjs)', 'node -r dotenv/config prisma/seed-comptes-suivi.cjs');

step(6, total, 'Recalcul des agrégats de suivi (reparer-suivi)', 'npx tsx backend/src/maintenance/reparer-suivi.ts');

console.log('');
console.log('✅ Installation terminée avec succès !');
console.log('');
console.log('Comptes de démonstration (mot de passe : Admin123!) :');
console.log('  - admin@emit.mg           (Administrateur)');
console.log('  - scolarite@emit.mg       (Chef de scolarité)');
console.log('  - resp.licence.info@emit.mg (Responsable Licence Informatique)');
console.log('  - resp.master.info@emit.mg  (Responsable Master Informatique)');
console.log('  - prof@emit.mg            (Enseignant)');
console.log('  - rakoto@emit.mg          (Enseignant)');
console.log('  - andry@emit.mg           (Enseignant)');
console.log('  - hery@emit.mg            (Enseignant)');
console.log('  - jaona@emit.mg           (Enseignant)');
console.log('  - naina@emit.mg           (Enseignant)');
console.log('  - andrianina@emit.mg      (Enseignant)');
console.log('  - rasoa@emit.mg           (Enseignant)');
console.log('');
console.log('Vous pouvez maintenant démarrer le backend et le frontend.');