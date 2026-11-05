#!/usr/bin/env node
/**
 * LANCEUR DE LA PREVISUALISATION LOCALE - module "Suivi des enseignements".
 *
 * Une seule commande pour ouvrir directement l'interface de suivi des seances,
 * sans dependre de l'authentification (encore en cours de resolution par un
 * autre membre de l'equipe).
 *
 * CE QUE FAIT CE SCRIPT
 *  1. Verifie les prerequis (dependances installees, .env backend).
 *  2. Verifie si une instance du backend ecoute deja sur le port 3000.
 *     - si oui : elle est CONSERVEE et reutilisee, aucune seconde instance
 *       n'est demarree ;
 *     - si non : le backend est demarre par ce script, qui sera le seul a
 *       l'arreter (les processus des coequipiers ne sont jamais tues).
 *  3. Choisit un port frontend reellement libre : le port configure par le
 *     projet (5173) s'il est disponible, sinon un port de repli CONTROLE
 *     (5180, 5181, ...). Le port reellement utilise est affiche.
 *  4. Demarre Vite avec VITE_ENABLE_LOCAL_PREVIEW=true : le mode de
 *     previsualisation n'est actif que dans ce lancement.
 *  5. Affiche l'URL reelle a ouvrir, directement sur la route du module.
 *
 * AUCUN jeton JWT n'est cree, aucun guard n'est desactive, aucune donnee
 * PostgreSQL n'est ecrite : les actions de demonstration sont simulees en
 * memoire par le frontend.
 *
 * REMARQUE : ce fichier est volontairement en ASCII pur. La console Windows
 * (code page 850) ne sait pas afficher les accents ni les tirets cadratins.
 */

import { spawn } from 'node:child_process';
import { createConnection, createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(frontendDir, '..');
const backendDir = join(repoDir, 'backend');

/** Port frontend configure par le projet (frontend/vite.config.ts). */
const PORT_PAR_DEFAUT = 5173;
/** Port de repli CONTROLE (on ne suppose jamais 5174). */
const PORT_DE_REPLI = 5180;
const TENTATIVES_PORT = 10;
/** Port backend impose par le projet : jamais modifie. */
const PORT_BACKEND = 3000;
/** Route du module Suivi des enseignements visee. */
const ROUTE_SUIVI = '/enseignant/seances';

const VITE_BIN = join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

/** Le port est-il libre (aucun processus en ecoute) ? */
function portLibre(port) {
  return new Promise((resolvePort) => {
    const serveur = createServer();
    serveur.once('error', () => resolvePort(false));
    serveur.once('listening', () => serveur.close(() => resolvePort(true)));
    serveur.listen(port, '0.0.0.0');
  });
}

/** Un service repond-il deja sur ce port ? */
function portJoignable(port) {
  return new Promise((resolvePort) => {
    const client = createConnection({ port, host: '127.0.0.1' });
    const terminer = (resultat) => {
      client.destroy();
      resolvePort(resultat);
    };
    client.once('connect', () => terminer(true));
    client.once('error', () => terminer(false));
    client.setTimeout(2000, () => terminer(false));
  });
}

function ligne(txt = '') {
  console.log(txt);
}

function verifierPrerequis() {
  const manquants = [];

  if (!existsSync(join(frontendDir, 'node_modules'))) {
    manquants.push('frontend/node_modules : lancez yarn install dans le dossier frontend');
  } else if (!existsSync(VITE_BIN)) {
    manquants.push('frontend/node_modules/vite : lancez yarn install dans le dossier frontend');
  }

  if (manquants.length > 0) {
    ligne('PRE-REQUIS MANQUANTS :');
    for (const m of manquants) ligne(`  - ${m}`);
    process.exit(1);
  }

  const envBackend = join(backendDir, '.env');
  if (!existsSync(envBackend)) {
    ligne(`  [avertissement] ${envBackend} est absent : le backend ne pourra pas demarrer.`);
    ligne('  La previsualisation reste utilisable (donnees de demonstration).');
  }
}

async function choisirPortFrontend() {
  if (await portLibre(PORT_PAR_DEFAUT)) {
    return { port: PORT_PAR_DEFAUT, motif: 'port configure par le projet' };
  }

  for (let i = 0; i < TENTATIVES_PORT; i += 1) {
    const candidat = PORT_DE_REPLI + i;
    if (await portLibre(candidat)) {
      return {
        port: candidat,
        motif: `port ${PORT_PAR_DEFAUT} deja occupe - repli controle`,
      };
    }
  }

  ligne(
    `Aucun port libre trouve entre ${PORT_DE_REPLI} et ${PORT_DE_REPLI + TENTATIVES_PORT - 1}.`,
  );
  process.exit(1);
  return { port: PORT_PAR_DEFAUT, motif: '' };
}

async function demarrerBackendSiNecessaire() {
  if (await portJoignable(PORT_BACKEND)) {
    ligne(
      `  [backend] Instance DEJA en ecoute sur le port ${PORT_BACKEND} : conservee, aucune seconde instance lancee.`,
    );
    return null;
  }

  if (!existsSync(join(backendDir, 'node_modules'))) {
    ligne(
      '  [backend] Dependances backend absentes : backend non demarre (la previsualisation reste utilisable).',
    );
    return null;
  }

  ligne(
    `  [backend] Aucune instance sur le port ${PORT_BACKEND} : demarrage du backend NestJS...`,
  );
  const commande = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
  const enfant = spawn(commande, ['start:dev'], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  // Attente de l'ecoute effective du backend (max ~60 s).
  const demarrage = Date.now();
  while (Date.now() - demarrage < 60000) {
    if (await portJoignable(PORT_BACKEND)) {
      ligne(`  [backend] En ecoute sur le port ${PORT_BACKEND}.`);
      return enfant;
    }
    if (enfant.exitCode !== null) {
      ligne("  [backend] Le backend s'est arrete au demarrage (voir le journal ci-dessus).");
      return null;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  ligne(
    `  [backend] Le backend n'a pas repondu sur le port ${PORT_BACKEND} apres 60 s : poursuite sans lui.`,
  );
  return null;
}

async function main() {
  ligne('');
  ligne('=== Previsualisation locale - Suivi des enseignements ===');
  ligne('');

  verifierPrerequis();
  ligne('  [prerequis] Dependances frontend OK.');

  const backend = await demarrerBackendSiNecessaire();

  const { port, motif } = await choisirPortFrontend();
  const url = `http://localhost:${port}`;

  ligne('');
  ligne('  [frontend] Demarrage de Vite...');
  ligne('');

  const vite = spawn(
    process.execPath,
    [VITE_BIN, '--host', '0.0.0.0', '--port', String(port), '--strictPort'],
    {
      cwd: frontendDir,
      // Le mode n'est active QUE pour ce lancement.
      env: { ...process.env, VITE_ENABLE_LOCAL_PREVIEW: 'true' },
      stdio: 'inherit',
    },
  );

  let arretDemande = false;
  const arreter = () => {
    if (arretDemande) return;
    arretDemande = true;
    ligne('');
    ligne('  Arret... (seuls les processus lances par ce script sont fermes)');
    vite.kill();
    // On ne tue QUE le backend demarre par ce script.
    if (backend && backend.exitCode === null) backend.kill();
    setTimeout(() => process.exit(0), 400);
  };

  process.on('SIGINT', arreter);
  process.on('SIGTERM', arreter);

  vite.on('exit', (code) => {
    if (!arretDemande) {
      ligne('');
      ligne(`  [frontend] Vite s'est arrete (code ${code}).`);
      if (backend && backend.exitCode === null) backend.kill();
    }
  });

  // Le message d'ouverture est affiche une fois Vite pret.
  setTimeout(() => {
    ligne('');
    ligne('  ============================================================');
    ligne('   MODE PREVISUALISATION LOCAL ACTIF (VITE_ENABLE_LOCAL_PREVIEW=true)');
    ligne("   Identite et donnees de DEMONSTRATION - rien n'est ecrit en base.");
    ligne('  ============================================================');
    ligne('');
    ligne(`   URL de l'interface    : ${url}`);
    ligne(`   Module Suivi          : ${url}${ROUTE_SUIVI}`);
    ligne(`   Port frontend utilise : ${port} (${motif})`);
    ligne(`   Port backend          : ${PORT_BACKEND} (inchange)`);
    ligne('');
    ligne('   Ouvrez directement :');
    ligne(`     ${url}${ROUTE_SUIVI}`);
    ligne('');
    ligne('   Arret : Ctrl+C');
    ligne('');
  }, 2500);

  await new Promise((resolveExit) => vite.on('exit', resolveExit));
}

main().catch((error) => {
  console.error('Echec du lancement de la previsualisation :', error);
  process.exit(1);
});
