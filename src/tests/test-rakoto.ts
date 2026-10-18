// @ts-nocheck
import { Enseignement, Seance } from '../domain/entities/enseignement';
import { EnseignementService } from '../domain/services/enseignement.service';
import { StatutSeance } from '../domain/enums/types';

async function runTest() {
  const enseignementService = new EnseignementService(null as any, null as any);

  // Préparation des données de test
  const enseignementRakoto: Enseignement = {
    id: 'ens-1',
    matiereId: 'mat-algo',
    enseignantId: 'prof-rakoto', // Professeur Rakoto
    mentionId: 'ment-info',
    cycle: 'Licence',
    niveauId: 'L2', // L2
    parcours: 'DA2I',
    semestreId: 'S1', // S1
    anneeUniversitaireId: 'au-2023-2024',
    volumePrevu: 30, // 30 heures
    seances: []
  };

  const seancesRakoto: Seance[] = [
    {
      id: 'seance-1',
      enseignementId: 'ens-1',
      date: new Date('2023-10-05'),
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2, // 2 h
      statut: StatutSeance.REALISEE, // REALISEE
      contenuEnseigne: 'Introduction'
    },
    {
      id: 'seance-2',
      enseignementId: 'ens-1',
      date: new Date('2023-10-12'),
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2, // 2 h
      statut: StatutSeance.REALISEE, // REALISEE
      contenuEnseigne: 'Chapitre 1'
    },
    {
      id: 'seance-3',
      enseignementId: 'ens-1',
      date: new Date('2023-10-19'),
      heureDebut: '08:00',
      heureFin: '11:00',
      duree: 3, // 3 h
      statut: StatutSeance.REALISEE, // REALISEE
      contenuEnseigne: 'Chapitre 2'
    }
  ];

  enseignementRakoto.seances = seancesRakoto;

  // Calcul des statistiques
  console.log('--- Test Enseignement Professeur Rakoto ---');
  console.log(`Volume prévu : ${enseignementRakoto.volumePrevu} heures`);
  
  const stats = enseignementService.obtenirSuivi(enseignementRakoto);
  
  console.log(`Heures réalisées : ${stats.heuresRealisees} heures`);
  console.log(`Progression : ${stats.progression}%`);
  console.log(`État actuel : ${stats.etat}`);
}

runTest().catch(console.error);
