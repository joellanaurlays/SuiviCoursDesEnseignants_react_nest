import { IEnseignementRepository, ISeanceRepository } from '../../domain/repositories/interfaces';
import { Enseignement, Seance } from '../../domain/entities/enseignement';
import { mockEnseignements } from '../../data/mockData';
import { StatutSeance } from '../../domain/enums/types';

export class MockEnseignementRepository implements IEnseignementRepository {
  async findById(id: string): Promise<Enseignement | null> {
    const mock = mockEnseignements.find(e => e.id.toString() === id);
    if (!mock) return null;
    
    // Map mock to Enseignement
    return {
      id: mock.id.toString(),
      matiereId: mock.matiere, // using matiere as ID for simplicity
      enseignantId: mock.enseignant,
      mentionId: mock.mention,
      cycle: mock.cycle,
      niveauId: mock.niveau,
      parcours: (mock as any).parcours || 'Général',
      semestreId: mock.semestre,
      anneeUniversitaireId: "2026",
      volumePrevu: mock.volumePrevu,
      seances: mock.seances.map(s => ({
        id: s.id.toString(),
        enseignementId: mock.id.toString(),
        date: new Date(s.date),
        heureDebut: s.heureDebut,
        heureFin: s.heureFin,
        duree: s.duree,
        statut: s.statut as StatutSeance,
        contenuEnseigne: s.contenu
      }))
    };
  }

  async findAll(): Promise<Enseignement[]> {
    return mockEnseignements.map(mock => ({
      id: mock.id.toString(),
      matiereId: mock.matiere,
      enseignantId: mock.enseignant,
      mentionId: mock.mention,
      cycle: mock.cycle,
      niveauId: mock.niveau,
      parcours: (mock as any).parcours || 'Général',
      semestreId: mock.semestre,
      anneeUniversitaireId: "2026",
      volumePrevu: mock.volumePrevu,
      seances: mock.seances.map(s => ({
        id: s.id.toString(),
        enseignementId: mock.id.toString(),
        date: new Date(s.date),
        heureDebut: s.heureDebut,
        heureFin: s.heureFin,
        duree: s.duree,
        statut: s.statut as StatutSeance,
        contenuEnseigne: s.contenu
      }))
    }));
  }
}

export class MockSeanceRepository implements ISeanceRepository {
  async create(data: Seance): Promise<Seance> {
    const enseignement = mockEnseignements.find(e => e.id.toString() === data.enseignementId);
    if (enseignement) {
      const newSeance = {
        id: Math.max(...enseignement.seances.map(s => s.id), 0) + 1,
        date: data.date.toISOString().split('T')[0],
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        duree: data.duree,
        statut: data.statut,
        contenu: data.contenuEnseigne
      };
      enseignement.seances.push(newSeance as any);
      return { ...data, id: newSeance.id.toString() };
    }
    throw new Error('Enseignement not found');
  }

  async findByEnseignementId(enseignementId: string): Promise<Seance[]> {
    const mock = mockEnseignements.find(e => e.id.toString() === enseignementId);
    if (!mock) return [];
    
    return mock.seances.map(s => ({
      id: s.id.toString(),
      enseignementId: mock.id.toString(),
      date: new Date(s.date),
      heureDebut: s.heureDebut,
      heureFin: s.heureFin,
      duree: s.duree,
      statut: s.statut as StatutSeance,
      contenuEnseigne: s.contenu
    }));
  }
}