import { IsString, IsDateString, IsBoolean, IsOptional, IsIn, IsUUID, Matches, MaxLength } from 'class-validator';

const TIME_FORMAT = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/;
const ALERT_TYPES = ['NOTES_NON_REMISES', 'MISSING_DOCUMENTS', 'EN_COURS', 'A_VENIR'];

export class CreateSessionDto {
  @IsString() @Matches(/\S/) @MaxLength(150) libelle: string;
  @IsString() @Matches(/\S/) @MaxLength(20) anneeUniversitaire: string;
  @IsString() @Matches(/\S/) @MaxLength(10) semestre: string;
  @IsDateString() dateDebut: string;
  @IsDateString() dateFin: string;
  @IsOptional() @IsBoolean() estCloturee?: boolean;
}

export class CreateExamenDto {
  @IsUUID() sessionId: string;
  @IsOptional() @IsUUID() enseignementId?: string;
  @IsOptional() @IsUUID() matiereId?: string;
  @IsOptional() @IsUUID() enseignantId?: string;
  @IsDateString() dateExamen: string;
  @IsOptional() @IsString() @Matches(TIME_FORMAT) heureDebut?: string;
  @IsOptional() @IsString() @Matches(TIME_FORMAT) heureFin?: string;
  @IsOptional() @IsString() salle?: string;
  @IsOptional() @IsIn(['A_VENIR', 'EN_COURS', 'TERMINE']) statut?: 'A_VENIR' | 'EN_COURS' | 'TERMINE';
}

export class UpdateStatutDto {
  @IsIn(['A_VENIR', 'EN_COURS', 'TERMINE']) statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE';
}

export class CreateAlerteDto {
  @IsOptional() @IsUUID() examenId?: string;
  @IsString() @Matches(/\S/) @MaxLength(50) @IsIn(ALERT_TYPES) typeAlerte: string;
  @IsString() message: string;
}
