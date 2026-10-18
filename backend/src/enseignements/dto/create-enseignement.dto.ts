import { IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';

export enum Cycle {
  LICENCE = 'LICENCE',
  MASTER = 'MASTER',
}

export class CreateEnseignementDto {
  @IsString()
  matiereId: string;

  @IsString()
  enseignantId: string;

  @IsString()
  mentionId: string;

  @IsEnum(Cycle)
  cycle: Cycle;

  @IsString()
  niveauId: string;

  @IsString()
  parcours: string;

  @IsString()
  semestreId: string;

  @IsString()
  anneeUniversitaireId: string;

  @IsInt()
  @Min(1)
  volumePrevu: number;
}
