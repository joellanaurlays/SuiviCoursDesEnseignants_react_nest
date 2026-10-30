import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/trim.decorator.js';

export class CreateMatiereDto {
  @Trim()
  @IsString({ message: 'Le nom doit être un texte' })
  @IsNotEmpty({ message: 'Le nom de la matière est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(150, { message: 'Le nom ne doit pas dépasser 150 caractères' })
  nom: string;

  @IsInt({ message: 'Le volume horaire doit être un nombre entier' })
  @Min(1, { message: 'Le volume horaire doit être compris entre 1 et 500 heures' })
  @Max(500, { message: 'Le volume horaire doit être compris entre 1 et 500 heures' })
  volumeHoraire: number;

  @IsInt({ message: 'Veuillez choisir un semestre' })
  @Min(1, { message: 'Veuillez choisir un semestre' })
  semestreId: number;
}
