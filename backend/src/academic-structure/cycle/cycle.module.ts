import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cycle } from './cycle.entity.js';
import { CycleService } from './cycle.service.js';
import { CycleController } from './cycle.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cycle])],
  controllers: [CycleController],
  providers: [CycleService],
  exports: [CycleService],
})
export class CycleModule {}
