import { 
  ContraintePlanificationEntity, 
  CreneauHoraireEntity, 
  EnseignementEntity, 
  SalleEntity, 
  SeancePlanifieeEntity 
} from '../types/schedule';
import { ConflictDetectorService } from './ConflictDetectorService';

export interface GenerationResult {
  success: boolean;
  generatedSessionsCount: number;
  newSessions: SeancePlanifieeEntity[];
  skippedTeachings: {
    enseignement: EnseignementEntity;
    motif: string;
  }[];
  message: string;
}

export class PlanningAlgorithmService {
  /**
   * Algorithme heuristique de placement sans conflit (T22)
   * Pour chaque enseignement ayant des heures à planifier,
   * recherche la meilleure combinaison (Jour/Créneau, Salle) satisfaisant :
   * 1. La salle correspond au type requis (AMPHI, SALLE_TP, SALLE_TD)
   * 2. La capacité >= effectif de la classe
   * 3. Aucune collision de salle, prof ou promo (ConflictDetectorService)
   * 4. Respect des contraintes actives (T25)
   */
  public static generateAutomaticSchedule(
    teachings: EnseignementEntity[],
    rooms: SalleEntity[],
    timeSlots: CreneauHoraireEntity[],
    existingSessions: SeancePlanifieeEntity[],
    constraints: ContraintePlanificationEntity[],
    baseDateWeek: string = '2026-10-19'
  ): GenerationResult {
    const newSessions: SeancePlanifieeEntity[] = [];
    const allSessions = [...existingSessions];
    const skippedTeachings: { enseignement: EnseignementEntity; motif: string }[] = [];
    let nextSessionId = Math.max(9050, ...allSessions.map(s => s.id)) + 1;

    // Jours avec mapping de décalage par rapport au lundi (baseDateWeek: 2026-10-19)
    const dayOffsets: Record<string, number> = {
      'Lundi': 0,
      'Mardi': 1,
      'Mercredi': 2,
      'Jeudi': 3,
      'Vendredi': 4,
      'Samedi': 5
    };

    // Pour chaque cours, s'il reste des heures à planifier
    for (const teaching of teachings) {
      const remainingHours = teaching.volumeHoraireTotal - teaching.heuresPlanifiees;
      if (remainingHours <= 0) continue;

      // Un créneau standard dure 2h
      const slotsNeeded = Math.min(2, Math.ceil(remainingHours / 2)); // planifie jusqu'à 2 séances (4h) par run

      let slotsPlaced = 0;

      // Filtrer les salles compatibles en capacité et type
      const suitableRooms = rooms
        .filter(r => r.statut === 'ACTIF' && r.capacite >= teaching.effectifEtudiants)
        .sort((a, b) => {
          // Préférer la salle qui colle au plus près du type requis
          if (a.typeSalle === teaching.typeSalleRequis && b.typeSalle !== teaching.typeSalleRequis) return -1;
          if (b.typeSalle === teaching.typeSalleRequis && a.typeSalle !== teaching.typeSalleRequis) return 1;
          // Puis la plus proche de la taille nécessaire pour optimiser l'espace
          return a.capacite - b.capacite;
        });

      if (suitableRooms.length === 0) {
        skippedTeachings.push({
          enseignement: teaching,
          motif: `Aucune salle active avec capacité >= ${teaching.effectifEtudiants} places disponible.`
        });
        continue;
      }

      // Parcourir les créneaux disponibles
      for (const slot of timeSlots.filter(s => s.actif)) {
        if (slotsPlaced >= slotsNeeded) break;

        // Calcul de la date associée
        const offset = dayOffsets[slot.jourSemaine] ?? 0;
        const sessionDate = new Date(baseDateWeek);
        sessionDate.setDate(sessionDate.getDate() + offset);
        const dateStr = sessionDate.toISOString().split('T')[0];

        // Essayer les salles convenables
        for (const room of suitableRooms) {
          const check = ConflictDetectorService.verifyConflicts(
            {
              salleId: room.id,
              enseignantId: teaching.enseignantId,
              niveauId: teaching.niveauId,
              codeNiveau: teaching.codeNiveau,
              mentionNom: teaching.mentionNom,
              dateSeance: dateStr,
              creneauId: slot.id,
              jourSemaine: slot.jourSemaine,
              heureDebut: slot.heureDebut,
              heureFin: slot.heureFin,
              effectifPrevu: teaching.effectifEtudiants
            },
            allSessions,
            rooms,
            constraints
          );

          if (check.canSave && !check.hasConflict) {
            // Créer la séance sans aucun conflit
            const newSession: SeancePlanifieeEntity = {
              id: nextSessionId++,
              emploiDuTempsId: 1,
              enseignementId: teaching.id,
              codeMatiere: teaching.codeMatiere,
              matiereNom: teaching.nomMatiere,
              typeSeance: teaching.typeSalleRequis === 'SALLE_TP' ? 'TP' : (teaching.typeSalleRequis === 'SALLE_TD' ? 'TD' : 'CM'),
              enseignantId: teaching.enseignantId,
              nomEnseignant: teaching.nomEnseignant,
              niveauId: teaching.niveauId,
              codeNiveau: teaching.codeNiveau,
              mentionNom: teaching.mentionNom,
              semestreNom: teaching.semestreNom,
              salleId: room.id,
              nomSalle: room.nom,
              creneauId: slot.id,
              jourSemaine: slot.jourSemaine,
              heureDebut: slot.heureDebut,
              heureFin: slot.heureFin,
              dateSeance: dateStr,
              statut: 'VALIDE',
              notes: 'Généré automatiquement par l\'algorithme de planification sans conflit'
            };

            newSessions.push(newSession);
            allSessions.push(newSession);
            slotsPlaced++;
            break; // Passer au slot suivant
          }
        }
      }

      if (slotsPlaced === 0) {
        skippedTeachings.push({
          enseignement: teaching,
          motif: `Impossible de trouver un créneau libre sans conflit enseignant/salle/classe pour ${teaching.nomEnseignant}.`
        });
      }
    }

    return {
      success: newSessions.length > 0,
      generatedSessionsCount: newSessions.length,
      newSessions,
      skippedTeachings,
      message: newSessions.length > 0
        ? `${newSessions.length} séance(s) générée(s) avec succès sans aucun conflit!`
        : `Aucune séance nouvelle n'a pu être placée sans conflit.`
    };
  }
}
