import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateMentionDto } from './create-mention.dto.js';

export class UpdateMentionDto extends PartialType(PickType(CreateMentionDto, ['nom'] as const)) {}