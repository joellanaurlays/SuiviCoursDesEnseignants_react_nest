import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { construireSuivi, EnseignementSuiviLigne } from '../domain/construire-suivi.js';

const includeSuivi = { seances: true } as const;

/**
 * État de clôture anticipée d'un enseignement (route GET /enseignements/:id/cloture).
 *
 * `peutCloturer` est calculé par le backend : le frontend n'affiche le bouton
 * que si l'enseignant est bien le titulaire ET que l'enseignement est encore
 * EN_COURS, mais la décision reste validée côté serveur à chaque appel.
 */
@Injectable()
export class GetClotureEnseignementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute(enseignementId: string, context?: AuthContext) {
    const enseignement = await this.charger(enseignementId);

    if (context && !this.permissionsService.canAccessEnseignement(context, enseignement)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à consulter cet enseignement");
    }

    const suivi = construireSuivi(enseignement);

    return {
      ...suivi,
      peutCloturer: Boolean(
        context &&
          this.permissionsService.canCloturer(context, enseignement) &&
          suivi.etat === 'EN_COURS',
      ),
    };
  }

  private async charger(enseignementId: string): Promise<EnseignementSuiviLigne> {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: enseignementId },
      include: includeSuivi,
    });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${enseignementId} introuvable`);
    }
    return enseignement;
  }
}
