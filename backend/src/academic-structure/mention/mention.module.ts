import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './mention.entity.js';
import { MentionService } from './mention.service.js';
import { MentionController } from './mention.controller.js';
import { TreeModule } from '../tree/tree.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mention]), TreeModule],
  controllers: [MentionController],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}