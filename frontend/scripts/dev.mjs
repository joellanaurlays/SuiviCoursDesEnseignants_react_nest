import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = resolve(frontendDir, '..', 'backend');
const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
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

function start(label, args, cwd) {
  const child = spawn(yarnCommand, args, {
    cwd,
    env: process.env,
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

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

console.log('Démarrage du backend NestJS et du frontend Vite…');
console.log('Configurez backend/.env avec les identifiants PostgreSQL avant le démarrage.');
start('backend', ['start:dev'], backendDir);
start('frontend', ['dev:vite'], frontendDir);
