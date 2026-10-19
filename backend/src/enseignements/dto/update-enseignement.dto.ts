import { PartialType } from '@nestjs/mapped-types';
import { CreateEnseignementDto } from './create-enseignement.dto';

export class UpdateEnseignementDto extends PartialType(CreateEnseignementDto) {}
