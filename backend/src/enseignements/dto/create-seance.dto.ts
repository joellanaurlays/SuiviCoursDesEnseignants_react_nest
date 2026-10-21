import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min, Matches } from 'class-validator';
import { StatutSeance } from '../domain/calcul-suivi.js';

// StatutSeance est défini dans le domaine (source de vérité unique).
export { StatutSeance };

export class CreateSeanceDto {
  @IsString()
  enseignementId: string;

  @IsDateString({ strict: false })
  dateSeance: string;

  @IsString()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'heureDebut doit respecter le format HH:mm',
  })
  heureDebut: string;

  @IsString()
  @Matches(/^([01]?\d|2[0-3]):[0-5]\d$/, {
    message: 'heureFin doit respecter le format HH:mm',
  })
  heureFin: string;

  // Durée ignorée côté serveur : toujours recalculée depuis heureDebut/heureFin.
  @IsNumber()
  @Min(0)
  @IsOptional()
  duree?: number;

  @IsString()
  @IsOptional()
  contenuEnseigne?: string;

  @IsEnum(StatutSeance)
  @IsOptional()
  statut?: StatutSeance;
}