import { IsString, IsDateString, IsBoolean, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsString() libelle: string;
  @IsString() anneeUniversitaire: string;
  @IsString() semestre: string;
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
  @IsOptional() @IsString() heureDebut?: string;
  @IsOptional() @IsString() heureFin?: string;
  @IsOptional() @IsString() salle?: string;
  @IsOptional() @IsIn(['A_VENIR', 'EN_COURS', 'TERMINE']) statut?: string;
}

export class UpdateStatutDto {
  @IsIn(['A_VENIR', 'EN_COURS', 'TERMINE']) statut: string;
}

export class CreateAlerteDto {
  @IsOptional() @IsUUID() examenId?: string;
  @IsString() typeAlerte: string;
  @IsString() message: string;
}
