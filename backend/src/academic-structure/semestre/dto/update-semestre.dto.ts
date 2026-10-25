import { PartialType } from '@nestjs/mapped-types';
import { CreateSemestreDto } from './create-semestre.dto.js';

export class UpdateSemestreDto extends PartialType(CreateSemestreDto) {}
