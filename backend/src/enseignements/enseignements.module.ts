import { Module } from '@nestjs/common';
import {
  EnseignementsController,
  SuiviController,
  EnseignantsController,
  AuditController,
} from './controllers/enseignements.controller';
import { SeancesController } from './controllers/seances.controller';
import { ClotureController } from './controllers/cloture.controller';
import { EnseignementsService } from './services/enseignements.service';
import { SuiviRecalculService } from './services/suivi-recalcul.service';
import { AuditSeanceService } from './services/audit-seance.service';
import { CreateSeanceUseCase } from './use-cases/create-seance.use-case';
import { GetSuiviUseCase } from './use-cases/get-suivi.use-case';
import { UpdateSeanceStatusUseCase } from './use-cases/update-seance-status.use-case';
import { GetTeacherDashboardUseCase } from './use-cases/get-teacher-dashboard.use-case';
import { GetSuiviStatistiquesUseCase } from './use-cases/get-suivi-statistiques.use-case';
import { CloturerEnseignementUseCase } from './use-cases/cloturer-enseignement.use-case';
import { GetClotureEnseignementUseCase } from './use-cases/get-cloture-enseignement.use-case';
import { PermissionsService } from './permissions/permissions.service';
import { PrismaModule } from '../prisma/prisma.module';

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
