import { Module } from '@nestjs/common';
import { TreeController } from './tree.controller.js';
import { TreeService } from './tree.service.js';

@Module({
  controllers: [TreeController],
  providers: [TreeService],
})
export class TreeModule {}
