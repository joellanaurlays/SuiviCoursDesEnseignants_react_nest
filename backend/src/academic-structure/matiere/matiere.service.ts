import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { Matiere } from './matiere.entity.js';

@Injectable()
export class MatiereService extends BaseCrudService<Matiere> {
  constructor(@InjectRepository(Matiere) repo: Repository<Matiere>) {
    super(repo, 'Matière', [
      'semestre',
      'semestre.anneeUniversitaire',
      'semestre.anneeUniversitaire.niveau',
      'semestre.anneeUniversitaire.niveau.cycle',
      'semestre.anneeUniversitaire.niveau.cycle.mention',
    ]);
  }
}
