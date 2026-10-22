import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateSeanceDto } from './create-seance.dto.js';

export class UpdateSeanceDto extends PartialType(CreateSeanceDto) {
  /**
   * Motif d'une correction exceptionnelle. Conservé dans le journal d'audit
   * (non stocké sur la séance elle-même).
   */
  @IsString()
  @IsOptional()
  motif?: string;
}
