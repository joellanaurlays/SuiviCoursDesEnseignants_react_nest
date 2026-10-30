import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { Semestre } from './semestre.entity.js';

@Injectable()
export class SemestreService extends BaseCrudService<Semestre> {
  constructor(@InjectRepository(Semestre) repo: Repository<Semestre>) {
    super(repo, 'Semestre', [
      'anneeUniversitaire',
      'anneeUniversitaire.niveau',
      'anneeUniversitaire.niveau.cycle',
      'anneeUniversitaire.niveau.cycle.mention',
    ]);
  }
}
