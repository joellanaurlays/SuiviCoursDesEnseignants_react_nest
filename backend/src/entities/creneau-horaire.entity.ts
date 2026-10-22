export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
export type TimeSlotPeriod = 'Matin' | 'Apres-midi';

/**
 * Modélisation de l'entité CreneauHoraire (TypeORM / PostgreSQL)
 * Table: 'creneau_horaire'
 */
export class CreneauHoraireEntity {
  id!: number;
  jourSemaine!: DayOfWeek;
  heureDebut!: string; // Format 'HH:mm' ex: '08:00'
  heureFin!: string;   // Format 'HH:mm' ex: '10:00'
  dureeMinutes!: number; // Par défaut 120
  plage!: TimeSlotPeriod;
  libelle!: string;
  actif!: boolean;

  constructor(partial?: Partial<CreneauHoraireEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  getDuree(): number {
    return this.dureeMinutes;
  }
}
