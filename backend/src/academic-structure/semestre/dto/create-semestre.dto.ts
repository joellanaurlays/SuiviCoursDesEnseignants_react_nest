import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { IsIsoDate } from '../../common/is-iso-date.decorator.js';

export class CreateSemestreDto {
  @IsInt({ message: 'Le numéro doit être un nombre entier' })
  @Min(1, { message: 'Le numéro doit être compris entre 1 et 10' })
  @Max(10, { message: 'Le numéro doit être compris entre 1 et 10' })
  numero: number;

  @IsInt({ message: 'Veuillez choisir une année universitaire' })
  @Min(1, { message: 'Veuillez choisir une année universitaire' })
  anneeUniversitaireId: number;

  /** Calendrier du semestre ; calcule depuis l'annee si omis. */
  @IsOptional()
  @IsIsoDate()
  dateDebut?: string;

  @IsOptional()
  @IsIsoDate()
  dateFin?: string;
}