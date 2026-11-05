import { PartialType } from '@nestjs/mapped-types';
import { CreateNiveauDto } from './create-niveau.dto.js';

export class UpdateNiveauDto extends PartialType(CreateNiveauDto) {}
