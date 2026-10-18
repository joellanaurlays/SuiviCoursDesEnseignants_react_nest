import { IsOptional, IsString } from 'class-validator';

/** Motif facultatif d'une suppression exceptionnelle de séance (tracé). */
export class SupprimerSeanceDto {
  @IsString()
  @IsOptional()
  motif?: string;
}
