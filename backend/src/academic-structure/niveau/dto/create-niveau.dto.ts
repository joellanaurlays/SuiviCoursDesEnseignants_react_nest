import { IsInt, IsNotEmpty, IsString, Matches, MaxLength, MinLength, Min } from 'class-validator';
import { Trim } from '../../common/trim.decorator.js';

export class CreateNiveauDto {
  @Trim()
  @IsString({ message: 'Le libellé doit être un texte' })
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MinLength(2, { message: 'Le libellé doit contenir au moins 2 caractères' })
  @MaxLength(30, { message: 'Le libellé ne doit pas dépasser 30 caractères' })
  @Matches(/^[\p{L}0-9 _-]+$/u, {
    message: 'Le libellé ne doit contenir que des lettres, chiffres, espaces ou tirets (ex : L1, M2)',
  })
  libelle: string;

  @IsInt({ message: 'Veuillez choisir un cycle' })
  @Min(1, { message: 'Veuillez choisir un cycle' })
  cycleId: number;
}
