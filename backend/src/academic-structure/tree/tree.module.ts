import { Module } from '@nestjs/common';
import { TreeController } from './tree.controller.js';
import { TreeService } from './tree.service.js';
import { StructureGeneratorService } from './structure-generator.service.js';

@Module({
  controllers: [TreeController],
  providers: [TreeService, StructureGeneratorService],
  exports: [TreeService, StructureGeneratorService],
})
export class TreeModule {}