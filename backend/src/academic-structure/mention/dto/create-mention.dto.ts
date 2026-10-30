import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/trim.decorator.js';

export class CreateMentionDto {
  @Trim()
  @IsString({ message: 'Le nom doit être un texte' })
  @IsNotEmpty({ message: 'Le nom de la mention est obligatoire' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères' })
  nom: string;
}
