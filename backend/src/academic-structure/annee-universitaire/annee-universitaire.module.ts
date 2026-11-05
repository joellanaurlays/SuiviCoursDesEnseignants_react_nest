import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnneeUniversitaire } from './annee-universitaire.entity.js';
import { AnneeUniversitaireService } from './annee-universitaire.service.js';
import { AnneeUniversitaireController } from './annee-universitaire.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AnneeUniversitaire])],
  controllers: [AnneeUniversitaireController],
  providers: [AnneeUniversitaireService],
  exports: [AnneeUniversitaireService],
})
export class AnneeUniversitaireModule {}
