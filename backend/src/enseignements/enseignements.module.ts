import { Module } from '@nestjs/common';
import {
  EnseignementsController,
  SuiviController,
  EnseignantsController,
  AuditController,
} from './controllers/enseignements.controller.js';
import { SeancesController } from './controllers/seances.controller.js';
import { ClotureController } from './controllers/cloture.controller.js';
import { EnseignementsService } from './services/enseignements.service.js';
import { SuiviRecalculService } from './services/suivi-recalcul.service.js';
import { AuditSeanceService } from './services/audit-seance.service.js';
import { CreateSeanceUseCase } from './use-cases/create-seance.use-case.js';
import { GetSuiviUseCase } from './use-cases/get-suivi.use-case.js';
import { UpdateSeanceStatusUseCase } from './use-cases/update-seance-status.use-case.js';
import { GetTeacherDashboardUseCase } from './use-cases/get-teacher-dashboard.use-case.js';
import { GetSuiviStatistiquesUseCase } from './use-cases/get-suivi-statistiques.use-case.js';
import { CloturerEnseignementUseCase } from './use-cases/cloturer-enseignement.use-case.js';
import { GetClotureEnseignementUseCase } from './use-cases/get-cloture-enseignement.use-case.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    EnseignementsController,
    SuiviController,
    SeancesController,
    EnseignantsController,
    ClotureController,
    AuditController,
  ],
  providers: [
    EnseignementsService,
    SuiviRecalculService,
    AuditSeanceService,
    CreateSeanceUseCase,
    GetSuiviUseCase,
    UpdateSeanceStatusUseCase,
    GetTeacherDashboardUseCase,
    GetSuiviStatistiquesUseCase,
    CloturerEnseignementUseCase,
    GetClotureEnseignementUseCase,
    PermissionsService,
  ],
  exports: [EnseignementsService],
})
export class EnseignementsModule {}
