import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Trim } from '../../common/trim.decorator.js';
import { IsAcademicYear } from '../../common/is-academic-year.decorator.js';

export class CreateAnneeUniversitaireDto {
  @Trim()
  @IsString({ message: 'Le libellé doit être un texte' })
  @IsNotEmpty({ message: "Le libellé de l'année est obligatoire" })
  @IsAcademicYear()
  libelle: string;

  @IsInt({ message: 'Veuillez choisir un niveau' })
  @Min(1, { message: 'Veuillez choisir un niveau' })
  niveauId: number;
}
