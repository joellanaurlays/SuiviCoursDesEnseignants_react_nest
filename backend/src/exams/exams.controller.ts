import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';

import { ExamsService } from './exams.service.js';
import {
  CreateSessionDto,
  CreateExamenDto,
  UpdateStatutDto,
  CreateAlerteDto,
} from './dto/exams.dto.js';

import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AuthContext } from '../auth/auth-context.js';

@Controller('exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // T26 — Sessions

  @Get('sessions')
  @Roles(
    Role.SCOLARITE,
    Role.ADMINISTRATEUR,
    Role.RESPONSABLE_MENTION,
    Role.ENSEIGNANT,
  )
  getSessions(@CurrentUser() authContext: AuthContext) {
    return this.service.findSessions(authContext);
  }

  @Post('sessions')
  @Roles(Role.SCOLARITE)
  postSession(@Body() dto: CreateSessionDto) {
    return this.service.createSession(dto);
  }

  @Patch('sessions/:id/cloturer')
  @Roles(Role.SCOLARITE)
  cloturer(@Param('id') id: string) {
    return this.service.cloturerSession(id);
  }

  // T27/T28 — Examens

  @Get()
  @Roles(
    Role.SCOLARITE,
    Role.ADMINISTRATEUR,
    Role.RESPONSABLE_MENTION,
    Role.ENSEIGNANT,
  )
  getExamens(
    @CurrentUser() authContext: AuthContext,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.service.findExamens(sessionId, authContext);
  }

  @Post()
  @Roles(Role.SCOLARITE)
  postExamen(@Body() dto: CreateExamenDto) {
    return this.service.createExamen(dto);
  }

  @Patch(':id/statut')
  @Roles(Role.SCOLARITE)
  patchStatut(
    @Param('id') id: string,
    @Body() dto: UpdateStatutDto,
  ) {
    return this.service.changerStatut(id, dto.statut);
  }

  // T29 — Remise des notes

  @Patch(':id/notes-remises')
  @Roles(Role.SCOLARITE)
  patchNotes(@Param('id') id: string) {
    return this.service.marquerNotesRemises(id);
  }

  // T30 — Alertes

  @Get('alertes/all')
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  getAlertes(@Query('nonLues') nonLues?: string) {
    return this.service.findAlertes(nonLues === 'true');
  }

  @Post('alertes')
  @Roles(Role.SCOLARITE)
  postAlerte(@Body() dto: CreateAlerteDto) {
    return this.service.createAlerte(dto);
  }

  @Patch('alertes/:id/lue')
  @Roles(Role.SCOLARITE)
  patchLue(@Param('id') id: string) {
    return this.service.marquerLue(id);
  }

  @Patch('alertes/:id/traitee')
  @Roles(Role.SCOLARITE)
  patchTraitee(@Param('id') id: string) {
    return this.service.marquerTraitee(id);
  }
}