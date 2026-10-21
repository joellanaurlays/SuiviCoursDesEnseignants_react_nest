import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';
import { CloturerEnseignementDto } from '../dto/cloturer-enseignement.dto';
import { CloturerEnseignementUseCase } from '../use-cases/cloturer-enseignement.use-case';
import { GetClotureEnseignementUseCase } from '../use-cases/get-cloture-enseignement.use-case';
import { AuthGuard } from '../../auth/auth.guard';

/**
 * Clôture anticipée d'un enseignement.
 *
 * L'enseignant affecté clôture lui-même son enseignement avec un motif
 * obligatoire. Il n'existe aucun circuit de validation : ces routes ne sont
 * donc accessibles qu'à l'enseignant titulaire.
 */
@Controller('enseignements')
@UseGuards(AuthGuard)
export class ClotureController {
  constructor(
    private readonly cloturerEnseignementUseCase: CloturerEnseignementUseCase,
    private readonly getClotureEnseignementUseCase: GetClotureEnseignementUseCase,
  ) {}

  /** Clôture anticipée : l'enseignement passe à TERMINE, la progression est inchangée. */
  @Post(':id/cloture')
  @Roles(Role.ENSEIGNANT)
  cloturer(
    @Param('id') id: string,
    @Body() dto: CloturerEnseignementDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.cloturerEnseignementUseCase.execute(id, dto, context);
  }

  /**
   * État de clôture et droit d'action. Réservé à l'enseignant titulaire : les
   * autres rôles consultent la clôture via la fiche de suivi (`clotureAnticipee`,
   * `typeCloture`, `motifCloture`), qui est commune à tous les tableaux de bord.
   */
  @Get(':id/cloture')
  @Roles(Role.ENSEIGNANT)
  getCloture(@Param('id') id: string, @CurrentUser() context: AuthContext) {
    return this.getClotureEnseignementUseCase.execute(id, context);
  }
}
