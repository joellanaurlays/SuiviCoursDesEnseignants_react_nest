import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/trim.decorator.js';
import { IsIsoDate } from '../../common/is-iso-date.decorator.js';

export class CreateMentionDto {
  @Trim()
  @IsString({ message: 'Le nom doit être un texte' })
  @IsNotEmpty({ message: 'Le nom de la mention est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères' })
  nom: string;

  /** Debut de l'annee universitaire (calendrier). Defaut : 1er octobre de l'annee en cours. */
  @IsOptional()
  @IsIsoDate()
  anneeDebut?: string;

  /** true (defaut) : Licence L1-L3 + Master M1-M2, annee et semestres S1..S10 sont crees automatiquement. */
  @IsOptional()
  @IsBoolean({ message: 'genererStructure doit être vrai ou faux' })
  genererStructure?: boolean;
}

export class GenererStructureDto {
  @IsOptional()
  @IsIsoDate()
  anneeDebut?: string;
}