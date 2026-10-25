import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { Niveau } from './niveau.entity.js';

@Injectable()
export class NiveauService extends BaseCrudService<Niveau> {
  constructor(@InjectRepository(Niveau) repo: Repository<Niveau>) {
    super(repo, 'Niveau', ['cycle', 'cycle.mention']);
  }
}
