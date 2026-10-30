import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { Role } from '../../auth/roles.enum.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { Role as RoleName } from '@prisma/client';

interface AssignTeacherDto {
  enseignantId: string;
}

@Injectable()
export class AssignTeacherUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute(enseignementId: string, dto: AssignTeacherDto, context: AuthContext): Promise<void> {
    // Vérifier que l'utilisateur est RESPONSABLE_MENTION
    if (context.role !== Role.RESPONSABLE_MENTION) {
      throw new ForbiddenException('Seul un responsable de mention peut affecter un enseignant');
    }

    if (!dto?.enseignantId || typeof dto.enseignantId !== 'string') {
      throw new NotFoundException("L'enseignant spécifié n'existe pas");
    }

    // Vérifier que l'enseignement existe
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: enseignementId },
      select: {
        matiereId: true,
        mentionId: true,
        cycle: true,
        parcours: true,
      },
    });

    if (!enseignement) {
      throw new NotFoundException('Enseignement non trouvé');
    }

    // Périmètre du responsable : l'enseignement doit relever de SON
    // (cycle, parcours). Ce contrôle est fait à partir du contexte
    // d'authentification, jamais de données transmises par le client.
    if (!this.permissionsService.canAccessEnseignement(context, {
      enseignantId: null,
      mentionId: enseignement.mentionId,
      cycle: enseignement.cycle,
      parcours: enseignement.parcours,
    })) {
      throw new ForbiddenException('Cet enseignement ne relève pas de votre périmètre');
    }

    // Vérifier que l'enseignant existe (enseignantId est une string, User.id est number)
    const enseignant = await this.prisma.user.findUnique({
      where: { id: parseInt(dto.enseignantId) },
      select: { id: true, firstName: true, lastName: true, cycles: true, parcours: true },
    });

    if (!enseignant) {
      throw new NotFoundException("L'enseignant spécifié n'existe pas");
    }

    // L'enseignant peut intervenir dans une autre mention / parcours que son
    // rattachement administratif (jamais modifié par une affectation). Seule
    // contrainte pédagogique conservée : le cycle déclaré doit couvrir celui
    // de l'enseignement (si des cycles sont définis).
    if (enseignant.cycles && enseignant.cycles.length > 0 && !enseignant.cycles.includes(enseignement.cycle)) {
      throw new ForbiddenException(
        "Cet enseignant n'intervient pas dans le cycle de l'enseignement",
      );
    }

    // L'affectation stocke le NOM AFFICHÉ (prénom + nom) : le module identifie
    // un enseignant par cette chaîne (dashboards, filtres, périmètre).
    const nomAffiche = `${enseignant.firstName} ${enseignant.lastName}`.trim();

    const actuel = await this.prisma.enseignement.findUnique({
      where: { id: enseignementId },
      select: { enseignantId: true },
    });

    // Déjà affecté à ce même enseignant : retour idempotent, aucune mutation.
    if (actuel?.enseignantId === nomAffiche) {
      return;
    }

    // Un autre enseignant est déjà affecté : ne pas le remplacer silencieusement.
    if (actuel?.enseignantId) {
      throw new ConflictException(
        `Un enseignant est déjà affecté à cet enseignement : ${actuel.enseignantId}`,
      );
    }

    await this.prisma.enseignement.update({
      where: { id: enseignementId },
      data: { enseignantId: nomAffiche },
    });
  }
}