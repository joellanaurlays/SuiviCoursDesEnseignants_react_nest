import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Semestre } from './semestre.entity.js';
import { AnneeUniversitaire } from '../annee-universitaire/annee-universitaire.entity.js';
import { SemestreService } from './semestre.service.js';
import { SemestreController } from './semestre.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Semestre, AnneeUniversitaire])],
  controllers: [SemestreController],
  providers: [SemestreService],
  exports: [SemestreService],
})
export class SemestreModule {}