import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { Cycle } from './cycle.entity.js';

@Injectable()
export class CycleService extends BaseCrudService<Cycle> {
  constructor(@InjectRepository(Cycle) repo: Repository<Cycle>) {
    super(repo, 'Cycle', ['mention']);
  }
}
