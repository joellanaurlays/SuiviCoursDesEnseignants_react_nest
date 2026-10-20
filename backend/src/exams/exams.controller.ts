import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateSessionDto, CreateExamenDto, UpdateStatutDto, CreateAlerteDto } from './dto/exams.dto.js';

@Controller('exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // T26
  @Get('sessions')
  getSessions() { return this.service.findSessions(); }

  @Post('sessions')
  postSession(@Body() dto: CreateSessionDto) { return this.service.createSession(dto); }

  @Patch('sessions/:id/cloturer')
  cloturer(@Param('id') id: string) { return this.service.cloturerSession(id); }

  // T27/T28
  @Get()
  getExamens(@Query('sessionId') sessionId?: string) { return this.service.findExamens(sessionId); }

  @Post()
  postExamen(@Body() dto: CreateExamenDto) { return this.service.createExamen(dto); }

  @Patch(':id/statut')
  patchStatut(@Param('id') id: string, @Body() dto: UpdateStatutDto) {
    return this.service.changerStatut(id, dto.statut as 'A_VENIR' | 'EN_COURS' | 'TERMINE');
  }

  // T29
  @Patch(':id/notes-remises')
  patchNotes(@Param('id') id: string) { return this.service.marquerNotesRemises(id); }

  // T30
  @Get('alertes/all')
  getAlertes(@Query('nonLues') nonLues?: string) {
    return this.service.findAlertes(nonLues === 'true');
  }

  @Post('alertes')
  postAlerte(@Body() dto: CreateAlerteDto) { return this.service.createAlerte(dto); }

  @Patch('alertes/:id/lue')
  patchLue(@Param('id') id: string) { return this.service.marquerLue(id); }

  @Patch('alertes/:id/traitee')
  patchTraitee(@Param('id') id: string) { return this.service.marquerTraitee(id); }
}
