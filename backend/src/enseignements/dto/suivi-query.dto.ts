import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EtatEnseignement, FiltreCloture } from '../domain/calcul-suivi.js';

/**
 * Filtres du module "suivi des enseignements".
 * Les noms "humains" (enseignant, matiere, mention...) sont mappés côté
 * use-case vers les colonnes réelles (enseignantId, matiereId, mentionId...).
 * Les variantes "*Id" sont acceptées en alias.
 */
export class SuiviQueryDto {
  @IsOptional()
  @IsString()
  enseignant?: string;

  @IsOptional()
  @IsString()
  enseignantId?: string;

  @IsOptional()
  @IsString()
  matiere?: string;

  @IsOptional()
  @IsString()
  matiereId?: string;

  @IsOptional()
  @IsString()
  mention?: string;

  @IsOptional()
  @IsString()
  mentionId?: string;

  @IsOptional()
  @IsString()
  parcours?: string;

  @IsOptional()
  @IsString()
  cycle?: string;

  @IsOptional()
  @IsString()
  niveau?: string;

  @IsOptional()
  @IsString()
  niveauId?: string;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  semestreId?: string;

  @IsOptional()
  @IsString()
  anneeUniversitaire?: string;

  @IsOptional()
  @IsString()
  anneeUniversitaireId?: string;

  @IsOptional()
  @IsEnum(EtatEnseignement)
  etat?: EtatEnseignement;

  /**
   * Filtre de clôture : NORMALE (volume atteint) ou ANTICIPEE (clôture par
   * l'enseignant avec motif). Appliqué sur la colonne `clotureAnticipee`.
   */
  @IsOptional()
  @IsEnum(FiltreCloture)
  cloture?: FiltreCloture;

  @IsOptional()
  @IsString()
  search?: string;
}