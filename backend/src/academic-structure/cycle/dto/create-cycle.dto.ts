import { IsEnum, IsInt, Min } from 'class-validator';
import { TypeCycle } from '../cycle.entity.js';

export class CreateCycleDto {
  @IsEnum(TypeCycle, { message: 'Le type doit être "Licence" ou "Master"' })
  type: TypeCycle;

  @IsInt({ message: 'Veuillez choisir une mention' })
  @Min(1, { message: 'Veuillez choisir une mention' })
  mentionId: number;
}
