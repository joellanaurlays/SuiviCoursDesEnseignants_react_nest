import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SuiviQueryDto } from '../dto/suivi-query.dto';
import { AuthContext } from '../../auth/auth-context';
import { PermissionsService } from '../permissions/permissions.service';
import { construireSuivi, SuiviEnseignement } from '../domain/construire-suivi';
import { construireWhereSuivi } from '../domain/filtres-suivi';

const includeSuivi = { seances: true } as const;

@Injectable()
export class GetSuiviUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute(filters?: SuiviQueryDto, context?: AuthContext): Promise<SuiviEnseignement[]> {
    if (!context) {
      throw new ForbiddenException('Authentification requise');
    }

    const where = construireWhereSuivi(filters);
    const scope = this.permissionsService.buildEnseignementScope(context);

    const enseignements = await this.prisma.enseignement.findMany({
      where: { AND: [scope, where] },
      include: includeSuivi,
      orderBy: [{ anneeUniversitaireId: 'asc' }, { matiereId: 'asc' }],
    });

    return enseignements.map((enseignement) => construireSuivi(enseignement));
  }

  async getById(id: string, context?: AuthContext): Promise<SuiviEnseignement | null> {
    if (!context) {
      throw new ForbiddenException('Authentification requise');
    }

    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id },
      include: includeSuivi,
    });

    if (!enseignement) {
      return null;
    }

    if (!this.permissionsService.canAccessEnseignement(context, enseignement)) {
      return null;
    }

    return construireSuivi(enseignement);
  }
}
