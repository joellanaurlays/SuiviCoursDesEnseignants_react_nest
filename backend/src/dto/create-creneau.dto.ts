import { DayOfWeek, TimeSlotPeriod } from '../entities/creneau-horaire.entity';

export interface CreateCreneauDto {
  jourSemaine: DayOfWeek;
  heureDebut: string;
  heureFin: string;
  dureeMinutes?: number;
  plage: TimeSlotPeriod;
  libelle?: string;
  actif?: boolean;
}

export interface ToggleCreneauDto {
  actif: boolean;
}
