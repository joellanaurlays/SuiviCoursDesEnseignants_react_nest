import { PartialType } from '@nestjs/mapped-types';
import { CreateAnneeUniversitaireDto } from './create-annee-universitaire.dto.js';

export class UpdateAnneeUniversitaireDto extends PartialType(CreateAnneeUniversitaireDto) {}
