import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(frontendDir, '..', 'backend');
const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
const preferredBackendPort = Number(process.env.BACKEND_PORT || process.env.PORT || 3000);
let backendPort = preferredBackendPort;
const children = [];
let stopping = false;

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 300).unref();
}

function start(label, args, cwd, extraEnv = {}) {
  const child = spawn(yarnCommand, args, {
    cwd,
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  children.push(child);
  child.on('error', error => {
    console.error(`[${label}] Impossible de démarrer Yarn : ${error.message}`);
    stopAll(1);
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`[${label}] Arrêt du processus (${signal || code}).`);
      stopAll(code || 1);
    }
  });
  return child;
}

function isPortOpen(port) {
  return new Promise(resolvePort => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = isOpen => {
      socket.destroy();
      resolvePort(isOpen);
    };
    socket.setTimeout(800);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function hasExpectedBackend(port) {
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(1200),
    });
    if (!health.ok || (await health.json())?.status !== 'ok') return false;

    // Vérifie aussi que ce serveur expose bien l'API d'auth du projet, pas
    // uniquement un ancien endpoint /health resté sur le port.
    const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(1200),
    });
    // Le DTO vide doit échouer en validation (400). Un 500 indique souvent
    // que l'ancienne instance a la route, mais pas encore les tables migrées.
    return login.status === 400 || login.status === 401;
  } catch {
    return false;
  }
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (!(await isPortOpen(port))) return port;
  }
  return undefined;
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

console.log('Démarrage du frontend Vite…');
if (await isPortOpen(backendPort)) {
  if (await hasExpectedBackend(backendPort)) {
    console.log(`Backend déjà actif sur le port ${backendPort} : démarrage de Vite uniquement.`);
  } else {
    console.warn(`Le service sur le port ${backendPort} n'est pas prêt (route de connexion absente ou erreur serveur).`);
    const freePort = await findFreePort(backendPort + 1);
    if (!freePort) {
      console.error(`Aucun port libre trouvé entre ${backendPort + 1} et ${backendPort + 20}.`);
      process.exit(1);
    }
    backendPort = freePort;
    console.log(`Démarrage du backend NestJS sur le port libre ${backendPort}…`);
    start('backend', ['start:dev'], backendDir, { PORT: String(backendPort) });
  }
} else {
  console.log(`Démarrage du backend NestJS sur le port ${backendPort}…`);
  console.log('Configurez backend/.env avec les identifiants PostgreSQL avant le démarrage.');
  start('backend', ['start:dev'], backendDir, { PORT: String(backendPort) });
}
start('frontend', ['dev:vite'], frontendDir, { BACKEND_PORT: String(backendPort) });
