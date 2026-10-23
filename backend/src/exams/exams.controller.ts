import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';
import { ExamsService } from './exams.service.js';
import { CreateSessionDto, CreateExamenDto, UpdateStatutDto, CreateAlerteDto } from './dto/exams.dto.js';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // T26
  @Get('sessions')
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  getSessions() { return this.service.findSessions(); }

  @Post('sessions')
  @Roles(Role.SCOLARITE)
  postSession(@Body() dto: CreateSessionDto) { return this.service.createSession(dto); }

  @Patch('sessions/:id/cloturer')
  @Roles(Role.SCOLARITE)
  cloturer(@Param('id') id: string) { return this.service.cloturerSession(id); }

  // T27/T28
  @Get()
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  getExamens(@Query('sessionId') sessionId?: string) { return this.service.findExamens(sessionId); }

  @Post()
  @Roles(Role.SCOLARITE)
  postExamen(@Body() dto: CreateExamenDto) { return this.service.createExamen(dto); }

  @Patch(':id/statut')
  @Roles(Role.SCOLARITE)
  patchStatut(@Param('id') id: string, @Body() dto: UpdateStatutDto) {
    return this.service.changerStatut(id, dto.statut as 'A_VENIR' | 'EN_COURS' | 'TERMINE');
  }

  // T29
  @Patch(':id/notes-remises')
  @Roles(Role.SCOLARITE)
  patchNotes(@Param('id') id: string) { return this.service.marquerNotesRemises(id); }

  // T30
  @Get('alertes/all')
  @Roles(Role.SCOLARITE, Role.ADMINISTRATEUR)
  getAlertes(@Query('nonLues') nonLues?: string) {
    return this.service.findAlertes(nonLues === 'true');
  }

  @Post('alertes')
  @Roles(Role.SCOLARITE)
  postAlerte(@Body() dto: CreateAlerteDto) { return this.service.createAlerte(dto); }

  @Patch('alertes/:id/lue')
  @Roles(Role.SCOLARITE)
  patchLue(@Param('id') id: string) { return this.service.marquerLue(id); }

  @Patch('alertes/:id/traitee')
  @Roles(Role.SCOLARITE)
  patchTraitee(@Param('id') id: string) { return this.service.marquerTraitee(id); }
}
