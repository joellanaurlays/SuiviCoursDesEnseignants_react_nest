/* eslint-disable */
// Vérification end-to-end du backend "Suivi des enseignements" contre la vraie
// base PostgreSQL. À lancer après avoir démarré le serveur (npm run start:dev).
// Crée un enseignement temporaire (30h) puis vérifie les scénarios 1 à 8,
// les validations et les règles de rôle. Nettoie ses données à la fin.

const BASE = process.env.BASE_URL ?? 'http://localhost:3000/api';

let failures = 0;
const passed: string[] = [];

function check(label: string, actual: unknown, expected?: unknown) {
  const equal = expected === undefined || JSON.stringify(actual) === JSON.stringify(expected);
  if (equal) {
    passed.push(label);
    console.log(`  ✅ ${label}`);
  } else {
    failures++;
    console.log(`  ❌ ${label}\n     attendu: ${JSON.stringify(expected)}\n     réel:    ${JSON.stringify(actual)}`);
  }
}

function auth(role: string, overrides: Record<string, string> = {}): Record<string, string> {
  return { 'x-user-role': role, 'x-user-id': 'test-user', ...overrides };
}

const scolarite = auth('SCOLARITE', { 'x-user-id': 'sec' });
const admin = auth('ADMINISTRATEUR', { 'x-user-id': 'admin' });
const rakoto = auth('ENSEIGNANT', { 'x-user-id': 'Professeur Rakoto' });
const autreEnseignant = auth('ENSEIGNANT', { 'x-user-id': 'Professeur Autre' });
const rmMaster = auth('RESPONSABLE_MENTION', { 'x-user-id': 'rm-ma-info', 'x-user-parcours': 'Informatique', 'x-user-cycle': 'MASTER' });
const rmLicence = auth('RESPONSABLE_MENTION', { 'x-user-id': 'rm-li-info', 'x-user-parcours': 'Informatique', 'x-user-cycle': 'LICENCE' });
const rmLicenceMgt = auth('RESPONSABLE_MENTION', { 'x-user-id': 'rm-li-mgt', 'x-user-parcours': 'Management', 'x-user-cycle': 'LICENCE' });
const rmSansParcours = auth('RESPONSABLE_MENTION', { 'x-user-id': 'rm-na', 'x-user-cycle': 'LICENCE' });

async function req(method: string, path: string, headers: Record<string, string> = {}, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* corps vide */
  }
  return { status: res.status, data: data as Record<string, unknown> };
}

async function suiviDe(id: string, headers: Record<string, string>) {
  const r = await req('GET', `/enseignements/${id}/suivi`, headers);
  return r.data as Record<string, unknown>;
}

async function creerSeance(body: Record<string, unknown>, headers: Record<string, string>) {
  return req('POST', '/seances', headers, body);
}

async function main() {
  let ensId = '';

  try {
    console.log('\n-- Cas de validation de rôle --');
    let r = await req('GET', '/suivi/enseignements', {});
    check('sans identité → 401', r.status, 401);
    r = await req('GET', '/suivi/enseignements', auth('ROLE_INCONNU'));
    check('rôle invalide → 401', r.status, 401);

    console.log('\n-- Création enseignement 30h (scolarité) --');
    r = await req('POST', '/enseignements', scolarite, {
      matiereId: 'Reseaux',
      enseignantId: 'Professeur Rakoto',
      mentionId: 'Informatique',
      parcours: 'Informatique',
      cycle: 'LICENCE',
      niveauId: 'L3',
      semestreId: 'S5',
      anneeUniversitaireId: '2026-2027',
      volumePrevu: 30,
    });
    check('POST /enseignements → 201', r.status, 201);
    ensId = r.data['id'] as string;
    if (!ensId) throw new Error('Échec création enseignement');

    console.log('\n-- Scénario 1 : 0h / 0% / NON_COMMENCE / 30 restantes --');
    let suivi = await suiviDe(ensId, scolarite);
    check('heuresRealisees = 0', suivi['heuresRealisees'], 0);
    check('progression = 0', suivi['progression'], 0);
    check('etat = NON_COMMENCE', suivi['etat'], 'NON_COMMENCE');
    check('heuresRestantes = 30', suivi['heuresRestantes'], 30);

    console.log('\n-- Scénario 6 + 2 : 3h réalisées → 3h / 10% / EN_COURS / 27 --');
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-01T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', contenuEnseigne: 'TD 1', statut: 'REALISEE' }, rakoto);
    check('création séance réalisee par l’enseignant → 201', r.status, 201);
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-01T10:00:00.000Z', heureDebut: '10:00', heureFin: '11:00', contenuEnseigne: 'TD 2', statut: 'REALISEE' }, rakoto);
    check('création séance réalisee (2) → 201', r.status, 201);
    suivi = await suiviDe(ensId, scolarite);
    check('sc2: 3h réalisées', suivi['heuresRealisees'], 3);
    check('sc2: progression 10', suivi['progression'], 10);
    check('sc2: etat EN_COURS', suivi['etat'], 'EN_COURS');
    check('sc2: 27 restantes', suivi['heuresRestantes'], 27);

    console.log('\n-- Scénario 7 : PLANIFIEE non comptée --');
    const planif = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-10T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', contenuEnseigne: 'Séance prévue', statut: 'PLANIFIEE' }, rakoto);
    check('création PLANIFIEE → 201', planif.status, 201);
    suivi = await suiviDe(ensId, scolarite);
    check('sc7: toujours 3h réalisées', suivi['heuresRealisees'], 3);

    console.log('\n-- Scénario 8 : ANNULEE non comptée --');
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-11T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', statut: 'ANNULEE' }, rakoto);
    check('création ANNULEE → 201', r.status, 201);
    suivi = await suiviDe(ensId, scolarite);
    check('sc8: toujours 3h réalisées', suivi['heuresRealisees'], 3);

    console.log('\n-- Mise à jour partielle d’une séance (recalcul durée) --');
    const planifId = planif.data['id'] as string;
    r = await req('PATCH', `/seances/${planifId}`, rakoto, { heureFin: '10:30' });
    check('PATCH partiel → 200', r.status, 200);
    check('durée recalculée = 2.5', r.data['duree'], 2.5);
    suivi = await suiviDe(ensId, scolarite);
    check('suivi inchangé après PATCH planifiée', suivi['heuresRealisees'], 3);

    console.log('\n-- Scénario 3 : 18h → 60% / EN_COURS / 12 --');
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-02T08:00:00.000Z', heureDebut: '08:00', heureFin: '18:00', contenuEnseigne: 'Cours 10h', statut: 'REALISEE' }, rakoto);
    check('séance 10h → 201', r.status, 201);
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-03T08:00:00.000Z', heureDebut: '08:00', heureFin: '13:00', contenuEnseigne: 'Cours 5h', statut: 'REALISEE' }, rakoto);
    check('séance 5h → 201', r.status, 201);
    suivi = await suiviDe(ensId, scolarite);
    check('sc3: 18h réalisées', suivi['heuresRealisees'], 18);
    check('sc3: progression 60', suivi['progression'], 60);
    check('sc3: etat EN_COURS', suivi['etat'], 'EN_COURS');
    check('sc3: 12 restantes', suivi['heuresRestantes'], 12);

    console.log('\n-- Scénario 4 : 30h → 100% / TERMINE / 0 --');
    await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-04T08:00:00.000Z', heureDebut: '08:00', heureFin: '20:00', contenuEnseigne: 'Cours 12h', statut: 'REALISEE' }, rakoto);
    suivi = await suiviDe(ensId, scolarite);
    check('sc4: 30h réalisées', suivi['heuresRealisees'], 30);
    check('sc4: progression 100', suivi['progression'], 100);
    check('sc4: etat TERMINE', suivi['etat'], 'TERMINE');
    check('sc4: 0 restantes', suivi['heuresRestantes'], 0);

    console.log('\n-- Scénario 5 : 32h → 100% / TERMINE / 0 (plafonnement) --');
    await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-05T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', contenuEnseigne: 'Cours 2h', statut: 'REALISEE' }, rakoto);
    suivi = await suiviDe(ensId, scolarite);
    check('sc5: 32h réalisées', suivi['heuresRealisees'], 32);
    check('sc5: progression plafonnée 100', suivi['progression'], 100);
    check('sc5: etat TERMINE', suivi['etat'], 'TERMINE');
    check('sc5: 0 restantes', suivi['heuresRestantes'], 0);

    console.log('\n-- Contenu enseigné consultable --');
    r = await req('GET', `/enseignements/${ensId}/seances`, scolarite);
    const liste: Array<Record<string, unknown>> = r.data as unknown as Array<Record<string, unknown>>;
    check('historique ordonné asc (date/heure)', liste[0]['heureDebut'], '08:00');
    check('contenu présent', (liste[1] as Record<string, unknown>)['contenuEnseigne'] !== null, true);

    console.log('\n-- Validations métier --');
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-06T08:00:00.000Z', heureDebut: '20:00', heureFin: '08:00', statut: 'REALISEE' }, rakoto);
    check('heureFin < heureDebut → 400', r.status, 400);
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-06T08:00:00.000Z', heureDebut: '08:00', heureFin: '08:00', statut: 'REALISEE' }, rakoto);
    check('heureDebut == heureFin → 400', r.status, 400);
    r = await creerSeance({ enseignementId: 'inconnu', dateSeance: '2026-09-06T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', statut: 'REALISEE' }, rakoto);
    check('enseignement inexistant → 404', r.status, 404);
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-06T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', statut: 'DUREE_INVALIDE' }, rakoto);
    check('statut invalide → 400', r.status, 400);
    r = await req('POST', '/enseignements', scolarite, { matiereId: 'x', enseignantId: 'y', mentionId: 'z', parcours: 'p', cycle: 'LICENCE', niveauId: 'n', semestreId: 's', anneeUniversitaireId: 'a', volumePrevu: 0 });
    check('volumePrevu = 0 → 400', r.status, 400);

    console.log('\n-- Permissions par rôle --');
    r = await req('GET', `/enseignements/${ensId}`, autreEnseignant);
    check('enseignant autre → 403', r.status, 403);
    r = await creerSeance({ enseignementId: ensId, dateSeance: '2026-09-07T08:00:00.000Z', heureDebut: '08:00', heureFin: '10:00', statut: 'REALISEE' }, autreEnseignant);
    check('autre enseignant crée une séance → 403', r.status, 403);
    r = await req('PATCH', `/enseignements/${ensId}`, rakoto, { volumePrevu: 30 });
    check('enseignant modifie un enseignement → 403', r.status, 403);
    r = await req('GET', '/seances', rakoto);
    check('enseignant liste toutes les séances → 403', r.status, 403);
    r = await req('GET', '/suivi/enseignements', rmMaster);
    const maitres = r.data as unknown as Array<Record<string, unknown>>;
    check('RM MASTER ne voit pas l’enseignement LICENCE', maitres.some((e) => e['id'] === ensId), false);
    r = await req('GET', '/suivi/enseignements', rmLicence);
    const lic = r.data as unknown as Array<Record<string, unknown>>;
    check('RM LICENCE voit l’enseignement', lic.some((e) => e['id'] === ensId), true);
    r = await req('GET', '/suivi/enseignements', rmLicenceMgt);
    const licMgt = r.data as unknown as Array<Record<string, unknown>>;
    check('RM LICENCE Management ne voit PAS l’enseignement Informatique', licMgt.some((e) => e['id'] === ensId), false);
    r = await req('GET', `/enseignements/${ensId}`, rmLicenceMgt);
    check('accès direct RM Management à un enseignement Informatique → 403', r.status, 403);
    r = await req('GET', '/suivi/enseignements', rmSansParcours);
    check('responsable sans parcours → 401', r.status, 401);

    console.log('\n-- Filtres backend --');
    r = await req('GET', `/suivi/enseignements?etat=${encodeURIComponent('TERMINE')}&mention=${encodeURIComponent('Informatique')}&cycle=LICENCE`, rmLicence);
    const avecFiltres = r.data as unknown as Array<Record<string, unknown>>;
    check('filtre etat+mention+cycle', avecFiltres.some((e) => e['id'] === ensId), true);
    r = await req('GET', `/suivi/enseignements?search=${encodeURIComponent('Reseaux')}`, scolarite);
    const parSearch = r.data as unknown as Array<Record<string, unknown>>;
    check('recherche "Reseaux"', parSearch.some((e) => e['id'] === ensId), true);

    console.log('\n-- Suivi liste globale (scolarité) --');
    r = await req('GET', '/suivi/enseignements', scolarite);
    const global = r.data as unknown as Array<Record<string, unknown>>;
    check('scolarité voit tous les enseignements', global.length >= 5, true);

    console.log('\n-- Nettoyage --');
    r = await req('DELETE', `/enseignements/${ensId}`, scolarite);
    check('DELETE enseignement + séances → 200', r.status, 200);
    ensId = '';
  } finally {
    if (ensId) {
      await req('DELETE', `/enseignements/${ensId}`, scolarite);
      console.log('Nettoyage effectué');
    }
  }

  console.log(`\nRésultat : ${passed.length} tests OK, ${failures} échec(s)`);
  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERREUR SCRIPT:', err);
  process.exit(1);
});