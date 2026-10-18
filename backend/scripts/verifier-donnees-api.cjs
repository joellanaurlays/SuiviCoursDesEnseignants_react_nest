/* eslint-disable */
/**
 * Verification du module « Suivi des enseignements » via l'API, sur les donnees
 * restaurees par prisma/seed.js.
 *
 * - Lectures : uniquement sur les donnees du seed (aucune mutation).
 * - Ecritures : sur un enseignement TEMPORAIRE cree puis supprime par ce script.
 *   Le scenario « cloture anticipee » du seed (27 h / 30 h) reste donc
 *   re-testable, et aucune donnee du seed n'est alteree.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000/api';

let ok = 0;
let ko = 0;

function check(label, actual, expected) {
  const egal = JSON.stringify(actual) === JSON.stringify(expected);
  if (egal) {
    ok += 1;
    console.log(`  OK   ${label}`);
  } else {
    ko += 1;
    console.log(`  ECHEC ${label}\n         attendu : ${JSON.stringify(expected)}\n         reel    : ${JSON.stringify(actual)}`);
  }
}

function titre(t) {
  console.log(`\n-- ${t} --`);
}

const scolarite = { 'x-user-role': 'SCOLARITE', 'x-user-id': 'sec' };
const admin = { 'x-user-role': 'ADMINISTRATEUR', 'x-user-id': 'admin' };
const rakoto = { 'x-user-role': 'ENSEIGNANT', 'x-user-id': 'Professeur Rakoto' };
const andrianina = { 'x-user-role': 'ENSEIGNANT', 'x-user-id': 'Professeur Andrianina' };
const rmInfoLic = respParcours('LICENCE', 'Informatique');
const rmInfoMas = respParcours('MASTER', 'Informatique');
// Mention historique hors des 6 parcours officiels : le périmètre est aussi
// (cycle, parcours), le garde-fou reste identique.
const rmMathLic = respParcours('LICENCE', 'Mathematiques');
// Les six responsables de parcours EMIT : périmètre = (cycle, parcours) via
// x-user-cycle + x-user-parcours. Chacun ne doit voir QUE son parcours.
function respParcours(cycle, parcours) {
  return { 'x-user-role': 'RESPONSABLE_MENTION', 'x-user-id': `resp-${cycle}-${parcours}`, 'x-user-cycle': cycle, 'x-user-parcours': parcours };
}
const RESPONSABLES_EMIT = {
  liInfo: respParcours('LICENCE', 'Informatique'),
  liMgt: respParcours('LICENCE', 'Management'),
  liIcm: respParcours('LICENCE', 'ICM'),
  maInfo: respParcours('MASTER', 'Informatique'),
  maMgt: respParcours('MASTER', 'Management'),
  maIcm: respParcours('MASTER', 'ICM'),
};

async function req(method, path, headers, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, data };
}

const suivi = async (id, h = scolarite) => (await req('GET', `/enseignements/${id}/suivi`, h)).data;

async function main() {
  let tmpId = '';

  try {
    // Totals mesurés au démarrage : le script ne doit pas dépendre du nombre
    // exact de lignes en base (seeds historiques + 6 parcours EMIT).
    const listeInitiale = await req('GET', '/suivi/enseignements', scolarite);
    const TOTAL_ENSEIGNEMENTS = Array.isArray(listeInitiale.data) ? listeInitiale.data.length : -1;
    const seancesInitiales = await req('GET', '/seances', scolarite);
    const TOTAL_SEANCES = Array.isArray(seancesInitiales.data) ? seancesInitiales.data.length : -1;

    // ------------------------------------------------------------------ Lectures
    titre('API — Presence des donnees restaurees (lecture seule)');

    const liste = await req('GET', '/suivi/enseignements', scolarite);
    check('GET /suivi/enseignements (scolarite) → 200', liste.status, 200);
    check('nombre denseignements retournes = initial', Array.isArray(liste.data) ? liste.data.length : -1, TOTAL_ENSEIGNEMENTS);

    const ens = await req('GET', '/enseignements', scolarite);
    check('GET /enseignements → 200', ens.status, 200);
    check('GET /enseignements renvoie le meme nombre', Array.isArray(ens.data) ? ens.data.length : -1, TOTAL_ENSEIGNEMENTS);

    const seed = await req('GET', `/enseignements/seed-enseig-30h-60pct`, scolarite);
    check('GET /enseignements/:id → 200', seed.status, 200);
    check('matiere du seed', seed.data.matiere, 'Base de donnees');
    check('enseignant du seed', seed.data.enseignant, 'Professeur Rakoto');
    check('mention du seed', seed.data.mention, 'Informatique');
    check('niveau du seed', seed.data.niveau, 'L2');
    check('parcours du seed', seed.data.parcours, 'DA2I');
    check('semestre du seed', seed.data.semestre, 'S1');
    check('annee universitaire du seed', seed.data.anneeUniversitaire, '2026-2027');
    check('cycle du seed', seed.data.cycle, 'LICENCE');

    titre('Cas A — 0 h / 30 h');
    let s = await suivi('seed-enseig-30h-non-commence');
    check('heuresRealisees = 0', s.heuresRealisees, 0);
    check('heuresRestantes = 30', s.heuresRestantes, 30);
    check('progression = 0', s.progression, 0);
    check('etat = NON_COMMENCE', s.etat, 'NON_COMMENCE');
    check('typeCloture = null', s.typeCloture, null);
    check('clotureAnticipee = false', s.clotureAnticipee, false);
    check('nombreSeancesRealisees = 0', s.nombreSeancesRealisees, 0);

    titre('Cas B — 18 h / 30 h (seed-enseig-30h-60pct)');
    s = await suivi('seed-enseig-30h-60pct');
    check('heuresRealisees = 18', s.heuresRealisees, 18);
    check('heuresRestantes = 12', s.heuresRestantes, 12);
    check('progression = 60', s.progression, 60);
    check('etat = EN_COURS', s.etat, 'EN_COURS');
    check('typeCloture = null', s.typeCloture, null);
    check('nombreSeancesRealisees = 3', s.nombreSeancesRealisees, 3);

    titre('Cas D (avant cloture) — 27 h / 30 h (seed-enseig-30h-cloture-anticipee)');
    s = await suivi('seed-enseig-30h-cloture-anticipee');
    check('heuresRealisees = 27', s.heuresRealisees, 27);
    check('heuresRestantes = 3', s.heuresRestantes, 3);
    check('progression = 90', s.progression, 90);
    check('etat = EN_COURS', s.etat, 'EN_COURS');
    check('clotureAnticipee = false', s.clotureAnticipee, false);
    check('typeCloture = null', s.typeCloture, null);
    check('motifCloture = null', s.motifCloture, null);
    check('dateCloture = null', s.dateCloture, null);

    titre('Cas C — 30 h / 30 h (seed-enseig-30h-termine)');
    s = await suivi('seed-enseig-30h-termine');
    check('heuresRealisees = 30', s.heuresRealisees, 30);
    check('heuresRestantes = 0', s.heuresRestantes, 0);
    check('progression = 100', s.progression, 100);
    check('etat = TERMINE', s.etat, 'TERMINE');
    check('clotureAnticipee = false', s.clotureAnticipee, false);
    check('typeCloture = NORMALE', s.typeCloture, 'NORMALE');
    check('motifCloture = null', s.motifCloture, null);

    titre('Cas E — 32 h / 30 h (seed-enseig-30h-depasse)');
    s = await suivi('seed-enseig-30h-depasse');
    check('heuresRealisees = 32', s.heuresRealisees, 32);
    check('heuresRestantes = 0', s.heuresRestantes, 0);
    check('progression = 100 (plafonnee)', s.progression, 100);
    check('etat = TERMINE', s.etat, 'TERMINE');
    check('clotureAnticipee = false', s.clotureAnticipee, false);
    check('typeCloture = NORMALE', s.typeCloture, 'NORMALE');

    titre('Cas F — REALISEE / PLANIFIEE / ANNULEE (GET /enseignements/:id/seances)');
    const seances = await req('GET', '/enseignements/seed-enseig-30h-60pct/seances', scolarite);
    check('GET /enseignements/:id/seances → 200', seances.status, 200);
    check('nombre de seances', seances.data.length, 5);
    const parStatut = seances.data.reduce((acc, x) => ({ ...acc, [x.statut]: (acc[x.statut] ?? 0) + 1 }), {});
    check('3 REALISEE', parStatut.REALISEE, 3);
    check('1 PLANIFIEE', parStatut.PLANIFIEE, 1);
    check('1 ANNULEE', parStatut.ANNULEE, 1);
    const sommeToutes = seances.data.reduce((t, x) => t + x.duree, 0);
    const sommeRealisees = seances.data.filter((x) => x.statut === 'REALISEE').reduce((t, x) => t + x.duree, 0);
    check('duree totale = 24 h', sommeToutes, 24);
    check('duree REALISEE = 18 h (PLANIFIEE et ANNULEE exclus)', sommeRealisees, 18);
    const sB = await suivi('seed-enseig-30h-60pct');
    check('heuresRealisees de l API = somme des seules REALISEE', sB.heuresRealisees, 18);
    check('progression de l API = 18 / 30', sB.progression, 60);
    check('heuresRestantes de l API = 30 - 18', sB.heuresRestantes, 12);

    titre('API seances — GET /seances et GET /seances/:id');
    const toutes = await req('GET', '/seances', scolarite);
    check('GET /seances → 200', toutes.status, 200);
    check('GET /seances renvoie autant de seances qu au depart', toutes.data.length, TOTAL_SEANCES);
    const planifiee = seances.data.find((x) => x.statut === 'PLANIFIEE');
    const une = await req('GET', `/seances/${planifiee.id}`, scolarite);
    check('GET /seances/:id → 200', une.status, 200);
    check('statut de la seance lue', une.data.statut, 'PLANIFIEE');
    check('duree de la seance lue', une.data.duree, 3);
    check('GET /seances/:id inconnu → 404', (await req('GET', '/seances/inconnu', scolarite)).status, 404);

    titre('API statistiques et dashboard');
    const stat = await req('GET', '/suivi/statistiques', scolarite);
    check('GET /suivi/statistiques → 200', stat.status, 200);
    const dash = await req('GET', '/enseignants/Professeur Rakoto/dashboard', scolarite);
    check('GET /enseignants/:id/dashboard → 200', dash.status, 200);

    // ------------------------------------------------------------------ Permissions
    titre('Permissions — perimetres de lecture');

    const vusRakoto = await req('GET', '/suivi/enseignements', rakoto);
    check('GET /suivi/enseignements (Rakoto) → 200', vusRakoto.status, 200);
    check('Rakoto voit uniquement ses enseignements',
      vusRakoto.data.every((e) => e.enseignant === 'Professeur Rakoto'), true);
    check('Rakoto voit au moins un enseignement',
      vusRakoto.data.length > 0, true);
    check('Rakoto ne voit pas l enseignement d Andry',
      vusRakoto.data.some((e) => e.id === 'seed-enseig-30h-termine'), false);

    const vusAndrianina = await req('GET', '/suivi/enseignements', andrianina);
    check('Andrianina voit uniquement ses enseignements',
      vusAndrianina.data.every((e) => e.enseignant === 'Professeur Andrianina'), true);

    const vusScolarite = await req('GET', '/suivi/enseignements', scolarite);
    check('scolarite voit tous les enseignements (perimetre global)', vusScolarite.data.length, TOTAL_ENSEIGNEMENTS);

    const vusAdmin = await req('GET', '/suivi/enseignements', admin);
    check('administrateur voit tous les enseignements (perimetre global)', vusAdmin.data.length, TOTAL_ENSEIGNEMENTS);

    // Périmètre d'un responsable = parcours (Informatique) + cycle (LICENCE).
    const vusInfoLic = await req('GET', '/suivi/enseignements', rmInfoLic);
    check('RM Licence Informatique : scope respected',
      vusInfoLic.data.every((e) => e.parcours === 'Informatique' && e.cycle === 'LICENCE'), true);
    check('RM Licence Informatique voit l enseignement du parcours (seed EMIT)',
      vusInfoLic.data.some((e) => e.id === 'seed-emit-li-info-1'), true);
    // Le cas B (18 h) est en parcours DA2I : hors du périmètre Informatique.
    check('RM Licence Informatique ne voit pas le parcours DA2I (cas B 18 h)',
      vusInfoLic.data.some((e) => e.id === 'seed-enseig-30h-60pct'), false);
    check('RM Licence Informatique ne voit pas le cas C (MASTER/Mathematiques)',
      vusInfoLic.data.some((e) => e.id === 'seed-enseig-30h-termine'), false);

    const vusInfoMas = await req('GET', '/suivi/enseignements', rmInfoMas);
    check('RM Master Informatique : scope respecte',
      vusInfoMas.data.every((e) => e.parcours === 'Informatique' && e.cycle === 'MASTER'), true);
    check('RM Master Informatique voit le cas MASTER (10 h / 40 h)',
      vusInfoMas.data.some((e) => e.id === 'seed-enseig-master-info-40h'), true);
    check('RM Master Informatique ne voit aucun LICENCE',
      vusInfoMas.data.some((e) => e.cycle === 'LICENCE'), false);

    const vusMathLic = await req('GET', '/suivi/enseignements', rmMathLic);
    check('RM Licence Mathematiques : scope respecte',
      vusMathLic.data.every((e) => e.parcours === 'Mathematiques' && e.cycle === 'LICENCE'), true);
    check('RM Licence Mathematiques voit le cas A (0 h)',
      vusMathLic.data.some((e) => e.id === 'seed-enseig-30h-non-commence'), true);

    titre('Separation stricte des six parcours EMIT (header x-user-parcours)');
    for (const [nom, h] of Object.entries(RESPONSABLES_EMIT)) {
      const cycle = h['x-user-cycle'];
      const parcours = h['x-user-parcours'];
      const vus = await req('GET', '/suivi/enseignements', h);
      check(`GET /suivi/enseignements (${nom}) → 200`, vus.status, 200);
      check(`${nom} ne voit QUE le parcours ${parcours}/${cycle}`,
        vus.data.every((e) => e.parcours === parcours && e.cycle === cycle), true);
      check(`${nom} voit au moins un enseignement de son parcours`,
        vus.data.length > 0, true);
    }
    // Statistiques limitées au périmètre du responsable (jamais élargies par
    // un filtre parcours/cycle envoyé par le client).
    const statsLiInfo = await req('GET', '/suivi/statistiques?parcours=Management', RESPONSABLES_EMIT.liInfo);
    check('stats RM Lic Info avec filtre parcours=Management : still scoped à Informatique',
      statsLiInfo.status, 200);
    const vusLieFiltre = await req('GET', '/suivi/enseignements?parcours=Management', RESPONSABLES_EMIT.liInfo);
    check('RM Lic Info + filtre parcours=Management → aucune ligne', vusLieFiltre.data.length, 0);
    check('RM Lic Info + filtre parcours=Management : total enseignements = 0',
      statsLiInfo.data.totaux.enseignements, 0);

    titre('Permissions — refus');
    check('Rakoto lit l enseignement d Andry → 403',
      (await req('GET', '/enseignements/seed-enseig-30h-termine', rakoto)).status, 403);
    check('Rakoto lit le suivi d Andry → 404 (masque par la portee)',
      (await req('GET', '/enseignements/seed-enseig-30h-termine/suivi', rakoto)).status, 404);
    check('Rakoto liste toutes les seances → 403', (await req('GET', '/seances', rakoto)).status, 403);
    check('Rakoto modifie un enseignement → 403',
      (await req('PATCH', '/enseignements/seed-enseig-30h-60pct', rakoto, { volumePrevu: 31 })).status, 403);
    check('Rakoto cree un enseignement → 403',
      (await req('POST', '/enseignements', rakoto, {})).status, 403);
    check('RM ne peut pas cloturer → 403',
      (await req('POST', '/enseignements/seed-enseig-30h-cloture-anticipee/cloture', rmInfoLic, { motif: 'Tentative non autorisee' })).status, 403);
    check('RM ne peut pas ecrire un enseignement → 403',
      (await req('POST', '/enseignements', rmInfoLic, {})).status, 403);
    check('RM ne peut pas modifier un enseignement → 403',
      (await req('PATCH', '/enseignements/seed-emit-li-info-1', rmInfoLic, { volumePrevu: 99 })).status, 403);
    check('scolarite ne peut pas cloturer → 403',
      (await req('POST', '/enseignements/seed-enseig-30h-cloture-anticipee/cloture', scolarite, { motif: 'Tentative non autorisee' })).status, 403);
    check('administrateur ne peut pas cloturer → 403',
      (await req('POST', '/enseignements/seed-enseig-30h-cloture-anticipee/cloture', admin, { motif: 'Tentative non autorisee' })).status, 403);
    check('Andrianina ne peut pas cloturer celui de Rakoto → 403',
      (await req('POST', '/enseignements/seed-enseig-30h-cloture-anticipee/cloture', andrianina, { motif: 'Tentative non autorisee' })).status, 403);

    titre('Cloture refusee — garde-fous metier sur les donnees du seed');
    check('cloture sans motif → 400',
      (await req('POST', '/enseignements/seed-enseig-30h-cloture-anticipee/cloture', rakoto, {})).status, 400);
    check('cloture avec motif trop court → 400',
      (await req('POST', '/enseignements/seed-enseig-30h-cloture-anticipee/cloture', rakoto, { motif: 'ok' })).status, 400);
    check('cloture d un enseignement NON_COMMENCE → 400',
      (await req('POST', '/enseignements/seed-enseig-30h-non-commence/cloture', rakoto, { motif: 'Contenu entierement couvert' })).status, 400);
    check('cloture d un enseignement deja TERMINE (volume atteint) → 400',
      (await req('POST', '/enseignements/seed-enseig-30h-depasse/cloture', rakoto, { motif: 'Contenu entierement couvert' })).status, 400);

    s = await suivi('seed-enseig-30h-cloture-anticipee');
    check('le cas D est intact apres les tentatives refusees (27 h)',
      s.heuresRealisees, 27);
    check('le cas D est intact apres les tentatives refusees (90 %)',
      s.progression, 90);
    check('le cas D est intact apres les tentatives refusees (EN_COURS)',
      s.etat, 'EN_COURS');
    check('le cas D est intact apres les tentatives refusees (non cloture)',
      s.clotureAnticipee, false);

    // ------------------------------------------------------------------ Ecritures (clone temporaire)
    titre('POST /enseignements — clone temporaire pour ecriture');
    const create = await req('POST', '/enseignements', scolarite, {
      matiereId: 'Base de donnees',
      enseignantId: 'Professeur Rakoto',
      mentionId: 'Informatique',
      parcours: 'DA2I',
      cycle: 'LICENCE',
      niveauId: 'L2',
      semestreId: 'S1',
      anneeUniversitaireId: '2026-2027',
      volumePrevu: 30,
    });
    check('POST /enseignements → 201', create.status, 201);
    tmpId = create.data.id;

    const dates = ['01', '03', '08', '10', '15', '17', '22', '24', '29'];
    for (const d of dates) {
      const r = await req('POST', '/seances', rakoto, {
        enseignementId: tmpId,
        dateSeance: `2026-09-${d}T08:00:00.000Z`,
        heureDebut: '08:00',
        heureFin: '11:00',
        contenuEnseigne: `Seance du 2026-09-${d}`,
        statut: 'REALISEE',
      });
      if (r.status !== 201) check(`POST /seances (2026-09-${d}) → 201`, r.status, 201);
    }
    s = await suivi(tmpId);
    check('9 seances POST via l API → 27 h', s.heuresRealisees, 27);
    check('9 seances POST via l API → 90 %', s.progression, 90);
    check('9 seances POST via l API → EN_COURS', s.etat, 'EN_COURS');
    check('9 seances POST via l API → 3 h restantes', s.heuresRestantes, 3);

    const rPlan = await req('POST', '/seances', rakoto, {
      enseignementId: tmpId, dateSeance: '2026-10-06T08:00:00.000Z',
      heureDebut: '08:00', heureFin: '11:00', statut: 'PLANIFIEE',
    });
    const rAnn = await req('POST', '/seances', rakoto, {
      enseignementId: tmpId, dateSeance: '2026-10-07T08:00:00.000Z',
      heureDebut: '08:00', heureFin: '11:00', statut: 'ANNULEE',
    });
    check('POST /seances PLANIFIEE → 201', rPlan.status, 201);
    check('POST /seances ANNULEE → 201', rAnn.status, 201);
    s = await suivi(tmpId);
    check('PLANIFIEE et ANNULEE ne changent pas les heures (27 h)', s.heuresRealisees, 27);
    check('PLANIFIEE et ANNULEE ne changent pas la progression (90)', s.progression, 90);

    titre('POST /enseignements/:id/cloture — cloture anticipee a 90 %');
    const motif = 'Le contenu prevu dans le programme a ete entierement traite.';
    const cloture = await req('POST', `/enseignements/${tmpId}/cloture`, rakoto, { motif });
    check('POST /enseignements/:id/cloture → 201', cloture.status, 201);

    s = await suivi(tmpId);
    check('apres cloture : volumePrevu inchange = 30', s.volumePrevu, 30);
    check('apres cloture : heuresRealisees inchangees = 27', s.heuresRealisees, 27);
    check('apres cloture : heuresRestantes = 3', s.heuresRestantes, 3);
    check('apres cloture : progression toujours 90 (PAS 100)', s.progression, 90);
    check('apres cloture : etat = TERMINE', s.etat, 'TERMINE');
    check('apres cloture : clotureAnticipee = true', s.clotureAnticipee, true);
    check('apres cloture : typeCloture = ANTICIPEE', s.typeCloture, 'ANTICIPEE');
    check('apres cloture : motifCloture enregistre', s.motifCloture, motif);
    check('apres cloture : dateCloture renseignee', s.dateCloture !== null, true);
    check('la reponse de cloture renvoie le suivi', cloture.data.suivi.progression, 90);

    check('seconde cloture → 409', (await req('POST', `/enseignements/${tmpId}/cloture`, rakoto, { motif })).status, 409);
    const etatCloture = await req('GET', `/enseignements/${tmpId}/cloture`, rakoto);
    check('GET /enseignements/:id/cloture → 200', etatCloture.status, 200);
    check('GET cloture : clotureAnticipee = true', etatCloture.data.clotureAnticipee, true);

    const lectureCroisee = await suivi(tmpId, scolarite);
    check('scolarite voit la cloture anticipee du clone', lectureCroisee.clotureAnticipee, true);
    check('scolarite voit la progression 90 (pas 100)', lectureCroisee.progression, 90);
    const lectureCroiseeRm = await suivi(tmpId, rmInfoLic);
    check('responsable de mention voit la cloture anticipee', lectureCroiseeRm.clotureAnticipee, true);

    const filtree = await req('GET', '/suivi/enseignements?cloture=ANTICIPEE', scolarite);
    check('filtre cloture=ANTICIPEE renvoie le clone', filtree.data.some((e) => e.id === tmpId), true);
    const filtreeN = await req('GET', '/suivi/enseignements?cloture=NORMALE', scolarite);
    check('filtre cloture=NORMALE exclut le clone', filtreeN.data.some((e) => e.id === tmpId), false);

    titre('Nettoyage du clone temporaire');
    const suppr = await req('DELETE', `/enseignements/${tmpId}`, scolarite);
    check('DELETE /enseignements/:id → 200', suppr.status, 200);
    tmpId = '';
    const apres = await req('GET', '/suivi/enseignements', scolarite);
    check('retour au total initial apres nettoyage', apres.data.length, TOTAL_ENSEIGNEMENTS);

    s = await suivi('seed-enseig-30h-cloture-anticipee');
    check('le cas D du seed est toujours pret a etre cloture (27 h)', s.heuresRealisees, 27);
    check('le cas D du seed est toujours EN_COURS', s.etat, 'EN_COURS');
    check('le cas D du seed n est toujours pas cloture', s.clotureAnticipee, false);
  } finally {
    if (tmpId) {
      await req('DELETE', `/enseignements/${tmpId}`, scolarite);
      console.log('\nNettoyage de secours effectue.');
    }
  }

  console.log(`\nRESULTAT : ${ok} verification(s) OK, ${ko} echec(s)`);
  process.exit(ko > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('ERREUR SCRIPT:', e);
  process.exit(1);
});
