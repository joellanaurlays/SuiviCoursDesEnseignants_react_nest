// Test script using fetch

async function runTests() {
  const BASE_URL = "http://localhost:3000/api";
  
  try {
    console.log("Creating enseignement 30h");
    const ensRes = await fetch(`${BASE_URL}/enseignements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matiereId: "Math", enseignantId: "e1", anneeUniversitaireId: "2024-2025", 
        semestreId: "S1", cycle: "Licence", niveauId: "L1", volumePrevu: 30,
        mentionId: "INFO", parcours: "GB"
      })
    });
    const ensData = await ensRes.json();
    console.log("ensData:", ensData);
    const ensId = (ensData as any).id;
    
    if (!ensId) throw new Error("Failed to create enseignement");

    // 0h
    let suiviRes = await fetch(`${BASE_URL}/enseignements/${ensId}/suivi`);
    let suivi = await suiviRes.json();
    console.log(`[TEST 1] 0h -> Progression: ${(suivi as any).progression}%, Etat: ${(suivi as any).etat}`);

    // 18h -> 60%
    await fetch(`${BASE_URL}/seances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignementId: ensId, date: "2024-01-01", heureDebut: "08:00", heureFin: "20:00", contenuEnseigne: "Long session"
      })
    });
    await fetch(`${BASE_URL}/seances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignementId: ensId, date: "2024-01-02", heureDebut: "08:00", heureFin: "14:00", contenuEnseigne: "Another session"
      })
    });
    suiviRes = await fetch(`${BASE_URL}/enseignements/${ensId}/suivi`);
    suivi = await suiviRes.json();
    console.log(`[TEST 2] 18h -> Progression: ${(suivi as any).progression}%, Etat: ${(suivi as any).etat}`);

    // 30h -> 100%
    await fetch(`${BASE_URL}/seances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignementId: ensId, date: "2024-01-03", heureDebut: "08:00", heureFin: "20:00", contenuEnseigne: "Session"
      })
    });
    suiviRes = await fetch(`${BASE_URL}/enseignements/${ensId}/suivi`);
    suivi = await suiviRes.json();
    console.log(`[TEST 3] 30h -> Progression: ${(suivi as any).progression}%, Etat: ${(suivi as any).etat}`);

    // heureFin < heureDebut
    const badRes1 = await fetch(`${BASE_URL}/seances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignementId: ensId, date: "2024-01-04", heureDebut: "20:00", heureFin: "08:00", contenuEnseigne: "Bad"
      })
    });
    console.log(`[TEST 4] heureFin < heureDebut -> Status: ${badRes1.status}`);

    // Enseignement inexistant
    const badRes2 = await fetch(`${BASE_URL}/seances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enseignementId: "unknown", date: "2024-01-04", heureDebut: "08:00", heureFin: "10:00", contenuEnseigne: "Bad"
      })
    });
    console.log(`[TEST 5] Inexistant -> Status: ${badRes2.status}`);

    console.log("Tests OK");

  } catch (e: any) {
    console.error("Test failed:", e.message);
  }
}

runTests();
