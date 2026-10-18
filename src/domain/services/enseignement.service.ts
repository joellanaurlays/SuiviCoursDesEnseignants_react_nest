import { Enseignement, Seance, EnseignementStats, HistoriqueSeance } from '../entities/enseignement';
import { EtatEnseignement, StatutSeance } from '../enums/types';
import { IEnseignementRepository, ISeanceRepository } from '../repositories/interfaces';

export class EnseignementService {
  constructor(
    private enseignementRepo: IEnseignementRepository,
    private seanceRepo: ISeanceRepository
  ) {}

  /**
   * Calcule les statistiques d'un enseignement (heures réalisées, progression, état) - rétrocompatibilité
   */
  public obtenirSuivi(enseignement: Enseignement): EnseignementStats {
    const seances = enseignement.seances || [];
    return this.calculerStats(enseignement, seances);
  }

  /**
   * Retourne l'historique du contenu enseigné (uniquement pour les séances réalisées) - rétrocompatibilité
   */
  public obtenirHistoriqueContenu(enseignement: Enseignement): HistoriqueSeance[] {
    const seances = enseignement.seances || [];
    return seances
      .filter(seance => seance.statut === StatutSeance.REALISEE)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(seance => ({
        date: seance.date,
        duree: seance.duree,
        contenuEnseigne: seance.contenuEnseigne || 'Aucun contenu spécifié'
      }));
  }

  /**
   * Calcule les statistiques d'un enseignement à partir de son ID
   */
  public async getEnseignementStats(enseignementId: string): Promise<EnseignementStats> {
    const enseignement = await this.enseignementRepo.findById(enseignementId);
    if (!enseignement) {
      throw new Error(`Enseignement ${enseignementId} introuvable`);
    }
    
    const seances = await this.seanceRepo.findByEnseignementId(enseignementId);
    return this.calculerStats(enseignement, seances);
  }

  /**
   * Calcule les statistiques d'un enseignement (heures réalisées, progression, état)
   */
  public calculerStats(enseignement: Enseignement, seances: Seance[]): EnseignementStats {
    // Filtrer uniquement les séances réalisées
    const seancesRealisees = seances.filter(seance => seance.statut === StatutSeance.REALISEE);
    
    // Calcul des heures réalisées
    const heuresRealisees = seancesRealisees.reduce((total, seance) => total + seance.duree, 0);

    // Calcul de la progression (en pourcentage)
    let progression = 0;
    if (enseignement.volumePrevu > 0) {
      progression = (heuresRealisees / enseignement.volumePrevu) * 100;
      // Arrondir à 2 décimales
      progression = Math.round(progression * 100) / 100;
      // Limiter à 100%
      if (progression > 100) {
        progression = 100;
      }
    }

    // Détermination de l'état
    let etat = EtatEnseignement.NON_COMMENCE;
    
    if (heuresRealisees > 0 && heuresRealisees < enseignement.volumePrevu) {
      etat = EtatEnseignement.EN_COURS;
    } else if (heuresRealisees >= enseignement.volumePrevu) {
      etat = EtatEnseignement.TERMINE;
    }

    // Déterminer la dernière séance réalisée
    let derniereSeanceRealisee: Date | undefined = undefined;
    if (seancesRealisees.length > 0) {
      // Trier par date décroissante et prendre la première
      const seancesTriees = [...seancesRealisees].sort((a, b) => b.date.getTime() - a.date.getTime());
      derniereSeanceRealisee = seancesTriees[0].date;
    }

    return {
      volumePrevu: enseignement.volumePrevu,
      heuresRealisees,
      progression,
      etat,
      nombreSeancesRealisees: seancesRealisees.length,
      derniereSeanceRealisee
    };
  }

  /**
   * Retourne l'historique du contenu enseigné pour un enseignement
   */
  public async getHistoriqueContenu(enseignementId: string): Promise<HistoriqueSeance[]> {
    const seances = await this.seanceRepo.findByEnseignementId(enseignementId);
    
    return seances
      .filter(seance => seance.statut === StatutSeance.REALISEE)
      .sort((a, b) => a.date.getTime() - b.date.getTime()) // Trier par date croissante
      .map(seance => ({
        date: seance.date,
        duree: seance.duree,
        contenuEnseigne: seance.contenuEnseigne || 'Aucun contenu spécifié'
      }));
  }
}
