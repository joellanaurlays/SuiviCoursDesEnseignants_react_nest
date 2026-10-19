import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Filtres de consultation du journal d'audit des séances.
 * Le périmètre est TOUJOURS déduit du contexte authentifié : ces filtres ne
 * peuvent que restreindre, jamais élargir.
 */
export class JournalAuditQueryDto {
  @IsString()
  @IsOptional()
  seanceId?: string;

  @IsString()
  @IsOptional()
  enseignementId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
