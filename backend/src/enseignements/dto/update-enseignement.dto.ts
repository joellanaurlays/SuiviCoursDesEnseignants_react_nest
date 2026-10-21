import { PartialType } from '@nestjs/mapped-types';
import { CreateEnseignementDto } from './create-enseignement.dto.js';

export class UpdateEnseignementDto extends PartialType(CreateEnseignementDto) {}
