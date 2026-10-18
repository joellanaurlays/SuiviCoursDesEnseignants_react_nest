import { EtatEnseignement, StatutSeance, Cycle } from '../domain/enums/types';
import { EnseignementService } from '../domain/services/enseignement.service';

export const mockEnseignements = [
  {
    id: 1,
    matiere: "Base de données",
    enseignant: "Professeur Rakoto",
    mention: "Informatique",
    parcours: "DA2I",
    cycle: Cycle.LICENCE,
    niveau: "L2",
    semestre: "S1",
    volumePrevu: 30,
    heuresRealisees: 18,
    progression: 60,
    etat: EtatEnseignement.EN_COURS,
    seances: [
      { id: 1, date: "2026-08-26", heureDebut: "08:00", heureFin: "10:00", duree: 2, statut: StatutSeance.REALISEE, contenu: "Introduction aux BD" },
      { id: 2, date: "2026-08-28", heureDebut: "10:00", heureFin: "12:00", duree: 2, statut: StatutSeance.REALISEE, contenu: "Modèle relationnel" },
      { id: 3, date: "2026-08-30", heureDebut: "08:00", heureFin: "10:00", duree: 2, statut: StatutSeance.REALISEE, contenu: "Clés primaires et étrangères" },
      { id: 4, date: "2026-09-02", heureDebut: "14:00", heureFin: "16:00", duree: 2, statut: StatutSeance.PLANIFIEE, contenu: "SQL" }
    ]
  },
  {
    id: 2,
    matiere: "Réseaux",
    enseignant: "Professeur Rabe",
    mention: "Informatique",
    parcours: "Autre parcours",
    cycle: Cycle.LICENCE,
    niveau: "L3",
    semestre: "S1",
    volumePrevu: 30,
    heuresRealisees: 30,
    progression: 100,
    etat: EtatEnseignement.TERMINE,
    seances: []
  },
  {
    id: 3,
    matiere: "IA",
    enseignant: "Professeur Andry",
    mention: "Informatique",
    parcours: "Parcours Master",
    cycle: Cycle.MASTER,
    niveau: "M1",
    semestre: "S1",
    volumePrevu: 40,
    heuresRealisees: 0,
    progression: 0,
    etat: EtatEnseignement.NON_COMMENCE,
    seances: []
  },
  {
    id: 4,
    matiere: "Management",
    enseignant: "Professeur ICM",
    mention: "ICM",
    parcours: "Management",
    cycle: Cycle.LICENCE,
    niveau: "L1",
    semestre: "S1",
    volumePrevu: 20,
    heuresRealisees: 0,
    progression: 0,
    etat: EtatEnseignement.NON_COMMENCE,
    seances: []
  }
];

export const updateMockDataWithSeance = (enseignementId: number, nouvelleSeance: any) => {
    const ens = mockEnseignements.find(e => e.id === enseignementId);
    if (ens) {
        ens.seances.push(nouvelleSeance);
        
        // Recalcul based on domain logic
        let totalRealisees = 0;
        ens.seances.forEach(s => {
            if (s.statut === StatutSeance.REALISEE) {
                totalRealisees += s.duree;
            }
        });
        
        ens.heuresRealisees = totalRealisees;
        ens.progression = (ens.heuresRealisees / ens.volumePrevu) * 100;
        
        if (ens.heuresRealisees === 0) {
            ens.etat = EtatEnseignement.NON_COMMENCE;
        } else if (ens.heuresRealisees >= ens.volumePrevu) {
            ens.etat = EtatEnseignement.TERMINE;
        } else {
            ens.etat = EtatEnseignement.EN_COURS;
        }
    }
};
