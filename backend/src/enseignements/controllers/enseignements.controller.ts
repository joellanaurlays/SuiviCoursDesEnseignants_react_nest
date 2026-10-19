import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { EnseignementsService } from '../services/enseignements.service';
import { CreateEnseignementDto } from '../dto/create-enseignement.dto';
import { UpdateEnseignementDto } from '../dto/update-enseignement.dto';
import { CreateSeanceDto } from '../dto/create-seance.dto';
import { UpdateSeanceDto } from '../dto/update-seance.dto';
import { SupprimerSeanceDto } from '../dto/supprimer-seance.dto';
import { JournalAuditQueryDto } from '../dto/journal-audit-query.dto';
import { SuiviQueryDto } from '../dto/suivi-query.dto';
import { GetTeacherDashboardUseCase } from '../use-cases/get-teacher-dashboard.use-case';
import { GetSuiviStatistiquesUseCase } from '../use-cases/get-suivi-statistiques.use-case';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';

import { AuthGuard } from '../../auth/auth.guard';

@Controller('enseignants')
@UseGuards(AuthGuard)
export class EnseignantsController {
  constructor(private readonly getTeacherDashboardUseCase: GetTeacherDashboardUseCase) {}

  @Get(':enseignantId/dashboard')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getDashboard(
    @Param('enseignantId') enseignantId: string,
    @CurrentUser() context: AuthContext,
  ) {
    return this.getTeacherDashboardUseCase.execute(enseignantId, context);
  }
}

@Controller('enseignements')
@UseGuards(AuthGuard)
export class EnseignementsController {
  constructor(private readonly enseignementsService: EnseignementsService) {}

  @Post()
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  create(@Body() createDto: CreateEnseignementDto) {
    return this.enseignementsService.create(createDto);
  }

  @Get()
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  findAll(@CurrentUser() context: AuthContext) {
    return this.enseignementsService.findAll(context);
  }

  @Get(':id/suivi')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getSuiviById(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getSuiviById(id, context);
  }

  @Get(':id')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  findOne(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.findOne(id, context);
  }

  @Patch(':id')
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  update(@Param('id') id: string, @Body() updateDto: UpdateEnseignementDto, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.update(id, updateDto, context);
  }

  @Delete(':id')
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  remove(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.remove(id, context);
  }

  // ---------------------------------------------------------- Séances imbriquées

  @Post(':id/seances')
  @Roles(Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  createSeance(@Param('id') id: string, @Body() createDto: CreateSeanceDto, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.createSeance(id, createDto, context);
  }

  @Get(':id/seances')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getSeances(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getSeances(id, context);
  }

  @Patch(':enseignementId/seances/:seanceId')
  @Roles(Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  updateSeance(
    @Param('enseignementId') enseignementId: string,
    @Param('seanceId') seanceId: string,
    @Body() updateDto: UpdateSeanceDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.enseignementsService.updateSeance(seanceId, enseignementId, updateDto, context);
  }

  @Delete(':enseignementId/seances/:seanceId')
  @Roles(Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  removeSeance(
    @Param('enseignementId') enseignementId: string,
    @Param('seanceId') seanceId: string,
    @Body() dto: SupprimerSeanceDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.enseignementsService.removeSeance(seanceId, enseignementId, context, dto?.motif);
  }
}

@Controller('suivi')
@UseGuards(AuthGuard)
export class SuiviController {
  constructor(
    private readonly enseignementsService: EnseignementsService,
    private readonly getSuiviStatistiquesUseCase: GetSuiviStatistiquesUseCase,
  ) {}

  @Get('enseignements')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getSuivi(@Query() filters: SuiviQueryDto, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getSuivi(filters, context);
  }

  @Get('enseignements/:id')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getSuiviById(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getSuiviById(id, context);
  }

  /**
   * Statistiques du périmètre de l'utilisateur (états, volumes, clôtures
   * anticipées). Le périmètre provient du rôle authentifié, jamais du client.
   * Les filtres du tableau de bord sont appliqués par-dessus ce périmètre, en
   * AND : ils ne peuvent donc pas l'élargir.
   */
  @Get('statistiques')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getStatistiques(@Query() filters: SuiviQueryDto, @CurrentUser() context: AuthContext) {
    return this.getSuiviStatistiquesUseCase.execute(context, filters);
  }
}

/**
 * Consultation du journal d'audit des séances.
 *
 * Le journal est en LECTURE SEULE : aucun endpoint d'écriture n'est exposé.
 * Le périmètre est déduit du contexte authentifié (enseignant → ses séances,
 * responsable → son parcours, scolarité/admin → global).
 */
@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly enseignementsService: EnseignementsService) {}

  @Get('seances')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  getJournal(@Query() query: JournalAuditQueryDto, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getJournalAudit(
      { seanceId: query.seanceId, enseignementId: query.enseignementId, limit: query.limit },
      context,
    );
  }
}