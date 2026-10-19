import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EnseignementsService } from '../services/enseignements.service';
import { CreateSeanceDto } from '../dto/create-seance.dto';
import { UpdateSeanceDto } from '../dto/update-seance.dto';
import { RealiserSeanceDto } from '../dto/realiser-seance.dto';
import { AnnulerSeanceDto } from '../dto/annuler-seance.dto';
import { SupprimerSeanceDto } from '../dto/supprimer-seance.dto';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('seances')
@UseGuards(AuthGuard)
export class SeancesController {
  constructor(private readonly enseignementsService: EnseignementsService) {}

  @Post()
  @Roles(Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  create(@Body() createDto: CreateSeanceDto, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.createSeance(createDto.enseignementId, createDto, context);
  }

  @Get()
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  findAll(@CurrentUser() context: AuthContext) {
    return this.enseignementsService.getAllSeances(context);
  }

  @Get(':id')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  findOne(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getSeanceById(id, context);
  }

  /**
   * Historique d'audit d'une séance (actions, auteur, dates, valeurs
   * avant/après, motifs). Consultation limitée aux rôles habilités à voir la
   * séance ; l'historique reste consultable après suppression de la séance.
   */
  @Get(':id/historique')
  @Roles(Role.ENSEIGNANT, Role.SCOLARITE, Role.RESPONSABLE_MENTION, Role.ADMINISTRATEUR)
  historique(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.getHistoriqueSeance(id, context);
  }

  /**
   * Réalisation d'une séance planifiée par son enseignant responsable.
   * Les informations observées (date, horaires, contenu) sont optionnelles :
   * la durée est recalculée côté serveur. Toute autre personne, y compris les
   * autres rôles autorisés à consulter, reçoit un 403.
   */
  @Post(':id/realiser')
  @Roles(Role.ENSEIGNANT)
  realiser(
    @Param('id') id: string,
    @Body() dto: RealiserSeanceDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.enseignementsService.realiserSeance(id, dto, context);
  }

  /**
   * Annulation d'une séance encore planifiée par son enseignant responsable.
   * La séance est conservée dans l'historique (statut ANNULEE), aucune heure
   * réalisée n'est comptabilisée.
   */
  @Post(':id/annuler')
  @Roles(Role.ENSEIGNANT)
  annuler(
    @Param('id') id: string,
    @Body() dto: AnnulerSeanceDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.enseignementsService.annulerSeance(id, dto.motif, context);
  }

  @Patch(':id')
  @Roles(Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  update(@Param('id') id: string, @Body() updateDto: UpdateSeanceDto, @CurrentUser() context: AuthContext) {
    return this.enseignementsService.updateSeance(id, undefined, updateDto, context);
  }

  @Delete(':id')
  @Roles(Role.ENSEIGNANT, Role.ADMINISTRATEUR)
  remove(
    @Param('id') id: string,
    @Body() dto: SupprimerSeanceDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.enseignementsService.removeSeance(id, undefined, context, dto?.motif);
  }
}