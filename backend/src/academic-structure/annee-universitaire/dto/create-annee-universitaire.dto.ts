import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Trim } from '../../common/trim.decorator.js';
import { IsAcademicYear } from '../../common/is-academic-year.decorator.js';
import { IsIsoDate } from '../../common/is-iso-date.decorator.js';

export class CreateAnneeUniversitaireDto {
  /** Debut de l'annee choisi dans le calendrier : le libelle "AAAA-AAAA" en est deduit. */
  @IsOptional()
  @IsIsoDate()
  dateDebut?: string;

  /** Fin de l'annee (calendrier). Par defaut : debut + 12 mois - 1 jour. */
  @IsOptional()
  @IsIsoDate()
  dateFin?: string;

  /** Facultatif si dateDebut est fourni (ex : 2025-2026). */
  @IsOptional()
  @Trim()
  @IsString({ message: 'Le libellé doit être un texte' })
  @IsAcademicYear()
  libelle?: string;

  @IsInt({ message: 'Veuillez choisir un niveau' })
  @Min(1, { message: 'Veuillez choisir un niveau' })
  niveauId: number;
}