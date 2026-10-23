/**
 * SETUP DÉMO COMPLET — Branche feature/teaching-progress-auth
 *
 * Ce script prépare la base de données en une seule commande pour que
 * l'équipe puisse voir immédiatement des données dans le navigateur.
 *
 * Usage :   node prisma/setup-demo.cjs
 *
 * Ce qu'il fait :
 * 1. Crée le compte utilisateur scolarite@emit.mg / Scolarite123!
 * 2. Crée des enseignements et séances de test (via seed.js)
 * 3. Recalcule les agrégats de suivi (heures, progression, état)
 *
 * IDEMPOTENT : peut être relancé sans créer de doublons.
 */
require('fs').writeFileSync('.env', [
  'DATABASE_URL="postgresql://postgres:alphino@localhost:5432/suivi_enseignements?schema=public"',
  'JWT_SECRET="emit-suivi-secret-de-developpement-a-changer-en-production"',
  'JWT_EXPIRATION="7d"',
  'PORT=3000',
].join('\n') + '\n', { flag: 'a' });

const { execSync } = require('child_process');

console.log('🚀 Étape 1/3 — Création des tables (prisma db push)...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Échec de prisma db push :', e.message);
  process.exit(1);
}

console.log('');
console.log('🚀 Étape 2/3 — Création des comptes et données de test...');
try {
  execSync('node prisma/seed-comptes.cjs', { stdio: 'inherit' });
  execSync('node prisma/seed.js', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Échec du seed :', e.message);
  process.exit(1);
}

console.log('');
console.log('🚀 Étape 3/3 — Recalcul des agrégats de suivi...');
try {
  execSync('npx ts-node -P backend/tsconfig.json backend/src/maintenance/reparer-suivi.ts', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Échec du récalcul :', e.message);
  process.exit(1);
}

console.log('');
console.log('✅ TERMINÉ ! La base de données est peuplée.');
console.log('');
console.log('📋 Pour voir les données dans le navigateur :');
console.log('   1. Démarrer le backend :  npm run start:dev   (port 3000)');
console.log('   2. Démarrer le frontend : cd frontend && npm run dev   (port 5173)');
console.log('   3. Ouvrir http://localhost:5173/login');
console.log('   4. Se connecter avec : scolarite@emit.mg / Scolarite123!');