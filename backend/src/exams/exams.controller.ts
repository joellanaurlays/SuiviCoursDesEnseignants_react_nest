import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateSessionDto, UpdateSessionDto, CreateExamenDto, UpdateStatutDto, CreateAlerteDto, CreateMessageDto } from './dto/exams.dto.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AuthContext } from '../auth/auth-context.js';

@Controller('exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  // T26
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
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

  // Messagerie Scolarité ↔ Enseignant (associée à un examen).
  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  @Get('messages/non-lus')
  messagesNonLus(@CurrentUser() context: AuthContext) { return this.service.compterNonLus(context); }

  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  @Get('conversations')
  getConversations(@CurrentUser() context: AuthContext) { return this.service.listerConversations(context); }

  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() context: AuthContext) { return this.service.listerMessages(id, context); }

  @Roles(Role.SCOLARITE, Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  @Post(':id/messages')
  postMessage(@Param('id') id: string, @Body() dto: CreateMessageDto, @CurrentUser() context: AuthContext) { return this.service.creerMessage(id, dto.contenu, context); }

  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  @Patch('messages/:id/lue')
  patchMessageLu(@Param('id') id: string, @CurrentUser() context: AuthContext) { return this.service.marquerLu(id, context); }

  // Modification d'une session ouverte (rattachements des examens préservés).
  @Roles(Role.SCOLARITE)
  @Patch('sessions/:id')
  patchSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) { return this.service.updateSession(id, dto); }

  // T27/T28
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
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
  @Roles(Role.SCOLARITE, Role.RESPONSABLE_MENTION)
  @Get('alertes/all')
  getAlertes(@Query('nonLues') nonLues?: string, @CurrentUser() context?: AuthContext) {
    return this.service.findAlertes(nonLues === 'true', context);
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
