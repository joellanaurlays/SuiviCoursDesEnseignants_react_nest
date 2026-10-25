import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matiere } from './matiere.entity.js';
import { MatiereService } from './matiere.service.js';
import { MatiereController } from './matiere.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Matiere])],
  controllers: [MatiereController],
  providers: [MatiereService],
  exports: [MatiereService],
})
export class MatiereModule {}
