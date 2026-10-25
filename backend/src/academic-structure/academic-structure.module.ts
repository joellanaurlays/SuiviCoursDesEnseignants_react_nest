import { Module } from '@nestjs/common';
import { MentionModule } from './mention/mention.module.js';
import { CycleModule } from './cycle/cycle.module.js';
import { NiveauModule } from './niveau/niveau.module.js';
import { AnneeUniversitaireModule } from './annee-universitaire/annee-universitaire.module.js';
import { SemestreModule } from './semestre/semestre.module.js';
import { MatiereModule } from './matiere/matiere.module.js';
import { TreeModule } from './tree/tree.module.js';

/**
 * Module 3 : structure académique (Mention → Cycle → Niveau → Année universitaire
 * → Semestre → Matière). Accès SQL via TypeORM (comme le module Exams) ; les
 * entités sont enregistrées par `autoLoadEntities` dans AppModule.
 */
@Module({
  imports: [
    MentionModule,
    CycleModule,
    NiveauModule,
    AnneeUniversitaireModule,
    SemestreModule,
    MatiereModule,
    TreeModule,
  ],
})
export class AcademicStructureModule {}
