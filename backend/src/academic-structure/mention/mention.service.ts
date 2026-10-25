import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { Mention } from './mention.entity.js';

@Injectable()
export class MentionService extends BaseCrudService<Mention> {
  constructor(@InjectRepository(Mention) repo: Repository<Mention>) {
    super(repo, 'Mention', ['cycles']);
  }
}
