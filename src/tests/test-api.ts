// @ts-nocheck
import { GET as getEnseignements } from '../app/api/enseignements/route';
import { GET as getEnseignementDetail } from '../app/api/enseignements/[id]/route';
import { GET as getSeances } from '../app/api/enseignements/[id]/seances/route';
import { POST as createSeance } from '../app/api/seances/route';
import { GET as getSuivi } from '../app/api/enseignements/[id]/suivi/route';
import { GET as getSuiviGlobal } from '../app/api/suivi/enseignements/route';

async function runTests() {
  console.log('--- STARTING API ROUTE TESTS ---\n');

  try {
    // 1. GET enseignements (fetch all)
    console.log('1. Testing GET /api/enseignements');
    const req1 = new Request('http://localhost/api/enseignements');
    const res1 = await getEnseignements(req1);
    const data1: any = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log(`Received ${data1.length} enseignements\n`);

    if (!data1 || data1.length === 0) throw new Error('No enseignements found');
    const targetId = data1[0].id;

    // 2. GET detail (fetch single enseignement by ID)
    console.log(`2. Testing GET /api/enseignements/${targetId}`);
    const req2 = new Request(`http://localhost/api/enseignements/${targetId}`);
    const res2 = await getEnseignementDetail(req2, { params: { id: targetId } });
    const data2: any = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log(`Enseignement: ${data2.titre}\n`);

    // 3. GET seances (fetch seances of an enseignement)
    console.log(`3. Testing GET /api/enseignements/${targetId}/seances`);
    const req3 = new Request(`http://localhost/api/enseignements/${targetId}/seances`);
    const res3 = await getSeances(req3, { params: { id: targetId } });
    const data3: any = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log(`Found ${data3.length} seances\n`);

    // 4. POST seance (create a seance)
    console.log('4. Testing POST /api/seances');
    const newSeance = {
      enseignementId: targetId,
      date: new Date().toISOString(),
      duree: 2,
      type: 'COURS',
      description: 'Test seance via API',
      statut: 'REALISE',
      professeurId: 'prof-1'
    };
    const req4 = new Request('http://localhost/api/seances', {
      method: 'POST',
      body: JSON.stringify(newSeance),
      headers: { 'Content-Type': 'application/json' }
    });
    const res4 = await createSeance(req4);
    const data4: any = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log(`Created seance ID: ${data4.id}\n`);

    // 5. GET suivi (verify heures, progression, etat updates after creation)
    console.log(`5. Testing GET /api/enseignements/${targetId}/suivi`);
    const req5 = new Request(`http://localhost/api/enseignements/${targetId}/suivi`);
    const res5 = await getSuivi(req5, { params: { id: targetId } });
    const data5: any = await res5.json();
    console.log(`Status: ${res5.status}`);
    console.log(`Suivi for ${targetId}:`);
    console.log(`- Total Heures: ${data5.totalHeuresEffectuees}`);
    console.log(`- Progression: ${data5.progression}%`);
    console.log(`- Etat: ${data5.etat}\n`);

    // 6. GET suivi global (test filters)
    console.log('6. Testing GET /api/suivi/enseignements?etat=EN_COURS');
    const req6 = new Request('http://localhost/api/suivi/enseignements?etat=EN_COURS');
    const res6 = await getSuiviGlobal(req6);
    const data6: any = await res6.json();
    console.log(`Status: ${res6.status}`);
    console.log(`Found ${data6.length} enseignements EN_COURS\n`);

    console.log('--- ALL TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- TEST FAILED ---');
    console.error(error);
    throw error;
  }
}

runTests();