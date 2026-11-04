import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum Cycle {
  LICENCE = 'LICENCE',
  MASTER = 'MASTER',
}

function trim({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateEnseignementDto {
  // L'affectation d'un enseignant ne se fait PAS à la création : elle est
  // réalisée ultérieurement par un RESPONSABLE_MENTION via PATCH /enseignements/:id/teacher.

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  matiereId: string;

  @Transform(trim)
  @IsString()
  @MaxLength(80)
  mentionId: string;

  @IsEnum(Cycle)
  cycle: Cycle;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  niveauId: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  parcours: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  semestreId: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, {
    message: "L'année universitaire doit respecter le format AAAA-AAAA",
  })
  anneeUniversitaireId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  volumePrevu: number;
}
