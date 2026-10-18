import { IsOptional, IsString } from 'class-validator';

/**
 * Annulation d'une séance planifiée par l'enseignant responsable.
 *
 * La justification est facultative : le modèle de données actuel ne prévoit
 * pas de colonne dédiée à l'annulation, elle n'est donc pas persistée. Elle
 * permet uniquement de tracer l'intention côté interface.
 */
export class AnnulerSeanceDto {
  @IsString()
  @IsOptional()
  motif?: string;
}
