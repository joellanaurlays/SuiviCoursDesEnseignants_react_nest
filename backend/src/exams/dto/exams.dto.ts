import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional, IsIn, IsUUID, Matches } from 'class-validator';

export class CreateSessionDto {
  @IsString() libelle: string;
  @IsString() anneeUniversitaire: string;
  @IsString() semestre: string;
  @IsDateString() dateDebut: string;
  @IsDateString() dateFin: string;
  @IsOptional() @IsBoolean() estCloturee?: boolean;
}

// Modification de session : estCloturee volontairement absent — la clôture a sa route dédiée et reste à sens unique.
export class UpdateSessionDto {
  @IsOptional() @IsString() libelle?: string;
  @IsOptional() @IsString() anneeUniversitaire?: string;
  @IsOptional() @IsString() semestre?: string;
  @IsOptional() @IsDateString() dateDebut?: string;
  @IsOptional() @IsDateString() dateFin?: string;
}

export class CreateExamenDto {
  @IsUUID() sessionId: string;
  @IsString() @IsNotEmpty() enseignementId: string;
  @IsOptional() @IsUUID() matiereId?: string;
  @IsOptional() @IsUUID() enseignantId?: string;
  @IsDateString() dateExamen: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "L'heure de début doit être au format HH:mm (ex. 08:15)." }) heureDebut?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "L'heure de fin doit être au format HH:mm (ex. 10:15)." }) heureFin?: string;
  @IsOptional() @IsString() salle?: string;
  @IsOptional() @IsIn(['A_VENIR', 'EN_COURS', 'TERMINE']) statut?: 'A_VENIR' | 'EN_COURS' | 'TERMINE';
}

export class UpdateStatutDto {
  @IsIn(['A_VENIR', 'EN_COURS', 'TERMINE']) statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE';
}

export class CreateAlerteDto {
  @IsOptional() @IsUUID() examenId?: string;
  @IsString() typeAlerte: string;
  @IsString() @IsNotEmpty() message: string;
}

export class CreateMessageDto {
  @IsOptional() @IsString() contenu?: string;
}
