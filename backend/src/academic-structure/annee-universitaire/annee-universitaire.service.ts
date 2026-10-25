import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { AnneeUniversitaire } from './annee-universitaire.entity.js';

@Injectable()
export class AnneeUniversitaireService extends BaseCrudService<AnneeUniversitaire> {
  constructor(@InjectRepository(AnneeUniversitaire) repo: Repository<AnneeUniversitaire>) {
    super(repo, 'Année universitaire', ['niveau', 'niveau.cycle', 'niveau.cycle.mention']);
  }
}
