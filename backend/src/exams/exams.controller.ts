import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateSessionDto, CreateExamenDto, UpdateStatutDto, CreateAlerteDto } from './dto/exams.dto.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AuthContext } from '../auth/auth-context.js';

@Controller('exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // T26
  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION)
  @Get('sessions')
  getSessions(@CurrentUser() authContext: AuthContext) {
    return this.service.findSessions(authContext);
  }

  @Roles(Role.SCOLARITE)
  @Post('sessions')
  postSession(@Body() dto: CreateSessionDto) { return this.service.createSession(dto); }

  @Roles(Role.SCOLARITE)
  @Patch('sessions/:id/cloturer')
  cloturer(@Param('id') id: string) { return this.service.cloturerSession(id); }

  // T27/T28
  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION)
  @Get()
  getExamens(
    @CurrentUser() authContext: AuthContext,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.service.findExamens(sessionId, authContext);
  }

  @Roles(Role.SCOLARITE)
  @Post()
  postExamen(@Body() dto: CreateExamenDto) { return this.service.createExamen(dto); }

  @Roles(Role.SCOLARITE)
  @Patch(':id/statut')
  patchStatut(@Param('id') id: string, @Body() dto: UpdateStatutDto) {
    return this.service.changerStatut(id, dto.statut as 'A_VENIR' | 'EN_COURS' | 'TERMINE');
  }

  // T29
  @Roles(Role.SCOLARITE)
  @Patch(':id/notes-remises')
  patchNotes(@Param('id') id: string) { return this.service.marquerNotesRemises(id); }

  // T30
  @Roles(Role.SCOLARITE)
  @Get('alertes/all')
  getAlertes(@Query('nonLues') nonLues?: string) {
    return this.service.findAlertes(nonLues === 'true');
  }

  @Roles(Role.SCOLARITE)
  @Post('alertes')
  postAlerte(@Body() dto: CreateAlerteDto) { return this.service.createAlerte(dto); }

  @Roles(Role.SCOLARITE)
  @Patch('alertes/:id/lue')
  patchLue(@Param('id') id: string) { return this.service.marquerLue(id); }

  @Roles(Role.SCOLARITE)
  @Patch('alertes/:id/traitee')
  patchTraitee(@Param('id') id: string) { return this.service.marquerTraitee(id); }
}
