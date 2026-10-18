/**
 * Génère un journal d'audit complet en passant par l'API HTTP réelle
 * (aucune écriture directe en base) : les 7 types d'actions sont produits
 * par les use-cases du backend.
 *
 * Usage :
 *   npm run db:demo:audit            (ignore si le journal est déjà rempli)
 *   node prisma/seed-audit-demo.cjs --force
 *
 * Prérequis : backend démarré sur http://localhost:3000
 */

const BASE = process.env.API_URL || 'http://localhost:3000/api';

const SCOLARITE = { 'x-user-id': 'Chef de scolarit\u00e9', 'x-user-role': 'SCOLARITE' };

const force = process.argv.includes('--force');

async function api(path, { method = 'GET', body, headers = SCOLARITE } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const message = data && data.message ? data.message : text;
    throw new Error(`${method} ${path} -> ${res.status} : ${JSON.stringify(message)}`);
  }
  return data;
}

function enseignantHeaders(nom) {
  return { 'x-user-id': nom, 'x-user-role': 'ENSEIGNANT' };
}

async function main() {
  const dejaRempli = await api('/audit/seances?limit=50');
  if (dejaRempli.length >= 10 && !force) {
    console.log(`Journal deja alimente (${dejaRempli.length} entrees) — utilisez --force pour relancer.`);
    return;
  }

  const enseignements = await api('/suivi/enseignements?limit=200');
  const parEnseignant = new Map();
  for (const e of enseignements) {
    if (!parEnseignant.has(e.enseignantId)) parEnseignant.set(e.enseignantId, []);
    parEnseignant.get(e.enseignantId).push(e);
  }

  const traces = [];

  // --- Professeur Rakoto : les 7 actions du journal -------------------------
  const rakoto = enseignantHeaders('Professeur Rakoto');
  const rakotoEns = parEnseignant.get('Professeur Rakoto') ?? [];
  if (rakotoEns.length > 0) {
    const e1 = rakotoEns[0].id;

    // CREATION : simple planification
    const planifiee = await api('/seances', {
      method: 'POST',
      headers: rakoto,
      body: {
        enseignementId: e1,
        dateSeance: '2026-11-02T08:00:00.000Z',
        heureDebut: '08:00',
        heureFin: '10:00',
        statut: 'PLANIFIEE',
      },
    });
    traces.push('CREATION');

    // REALISATION : PLANIFIEE -> REALISEE avec horaires observés corrigés
    await api(`/seances/${planifiee.id}/realiser`, {
      method: 'POST',
      headers: rakoto,
      body: {
        heureFin: '09:30',
        contenuEnseigne: 'Normalisation, cl\u00e9s \u00e9trang\u00e8res et jointures',
      },
    });
    traces.push('REALISATION');

    // DECLARATION_REALISEE : séance saisie directement comme réalisée
    const declaree = await api('/seances', {
      method: 'POST',
      headers: rakoto,
      body: {
        enseignementId: e1,
        dateSeance: '2026-11-09T08:00:00.000Z',
        heureDebut: '08:00',
        heureFin: '10:00',
        statut: 'REALISEE',
        contenuEnseigne: 'Transactions et ACID',
      },
    });
    traces.push('DECLARATION_REALISEE');

    // ANNULATION : planification puis annulation motivée
    const annulable = await api('/seances', {
      method: 'POST',
      headers: rakoto,
      body: {
        enseignementId: e1,
        dateSeance: '2026-11-16T08:00:00.000Z',
        heureDebut: '08:00',
        heureFin: '10:00',
        statut: 'PLANIFIEE',
      },
    });
    await api(`/seances/${annulable.id}/annuler`, {
      method: 'POST',
      headers: rakoto,
      body: { motif: 'Emp\u00eachement m\u00e9dical de l\u2019enseignant' },
    });
    traces.push('ANNULATION');

    // MODIFICATION : changement d'horaire sans motif (simple modification)
    const modifiable = await api('/seances', {
      method: 'POST',
      headers: rakoto,
      body: {
        enseignementId: e1,
        dateSeance: '2026-11-23T08:00:00.000Z',
        heureDebut: '08:00',
        heureFin: '10:00',
        statut: 'PLANIFIEE',
      },
    });
    await api(`/seances/${modifiable.id}`, {
      method: 'PATCH',
      headers: rakoto,
      body: { heureDebut: '10:00', heureFin: '12:00' },
    });
    traces.push('MODIFICATION');

    // CORRECTION : ajustement motivé d'une séance réalisée
    await api(`/seances/${declaree.id}`, {
      method: 'PATCH',
      headers: rakoto,
      body: {
        motif: 'Dur\u00e9e r\u00e9elle observ\u00e9e en amphi',
        heureFin: '09:30',
      },
    });
    traces.push('CORRECTION');

    // SUPPRESSION : séance créée puis supprimée avec motif
    const supprimable = await api('/seances', {
      method: 'POST',
      headers: rakoto,
      body: {
        enseignementId: e1,
        dateSeance: '2026-12-07T08:00:00.000Z',
        heureDebut: '08:00',
        heureFin: '10:00',
        statut: 'PLANIFIEE',
      },
    });
    await api(`/seances/${supprimable.id}`, {
      method: 'DELETE',
      headers: rakoto,
      body: { motif: 'S\u00e9ance saisie en double' },
    });
    traces.push('SUPPRESSION');
  }

  // --- Autres enseignants : journal multi-auteurs --------------------------
  for (const [nom, actions] of [
    ['Professeur Andrianina', 2],
    ['Professeur Naina', 2],
    ['Professeur Rasoa', 1],
  ]) {
    const list = parEnseignant.get(nom) ?? [];
    if (list.length === 0) continue;
    const h = enseignantHeaders(nom);
    const ens = list[0].id;
    try {
      const s = await api('/seances', {
        method: 'POST',
        headers: h,
        body: {
          enseignementId: ens,
          dateSeance: '2026-11-05T08:00:00.000Z',
          heureDebut: '08:00',
          heureFin: '10:00',
          statut: 'PLANIFIEE',
        },
      });
      traces.push(`CREATION (${nom})`);
      if (actions >= 2) {
        await api(`/seances/${s.id}/realiser`, {
          method: 'POST',
          headers: h,
          body: { contenuEnseigne: 'Cours de d\u00e9monstration' },
        });
        traces.push(`REALISATION (${nom})`);
      }
    } catch (err) {
      console.warn(`  ! ${nom}: ${err.message}`);
    }
  }

  const apres = await api('/audit/seances?limit=300');
  console.log(`Actions tracees : ${traces.join(', ')}`);
  console.log(`Journal d'audit : ${apres.length} entree(s) disponible(s) sur le front.`);
}

main().catch((err) => {
  console.error(`Echec du seed d'audit : ${err.message}`);
  console.error('Verifiez que le backend est demarre (npm run start:dev).');
  process.exit(1);
});
