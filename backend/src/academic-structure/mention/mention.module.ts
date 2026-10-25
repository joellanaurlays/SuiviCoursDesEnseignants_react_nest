import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mention } from './mention.entity.js';
import { MentionService } from './mention.service.js';
import { MentionController } from './mention.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mention])],
  controllers: [MentionController],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
