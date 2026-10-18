import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeanceDto } from '../dto/create-seance.dto';
import { Seance } from '@prisma/client';
import { SuiviRecalculService } from '../services/suivi-recalcul.service';
import {
  calculerDureeSeance,
  plagesHorairesSeChevauchent,
  StatutSeance,
} from '../domain/calcul-suivi';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';
import { AuditSeanceService } from '../services/audit-seance.service';
import { ActionAuditSeance, instantaneSeance } from '../domain/audit-seance';

@Injectable()
export class CreateSeanceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suiviRecalculService: SuiviRecalculService,
    private readonly auditSeanceService: AuditSeanceService,
  ) {}

  async execute(createSeanceDto: CreateSeanceDto, context?: AuthContext): Promise<Seance> {
    const { enseignementId, dateSeance, heureDebut, heureFin, contenuEnseigne, statut } = createSeanceDto;

    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: enseignementId },
    });

    if (!enseignement) {
      throw new NotFoundException(`Enseignement with ID ${enseignementId} not found`);
    }

    if (context && context.role === Role.ENSEIGNANT) {
      if (enseignement.enseignantId !== context.userId) {
        throw new ForbiddenException('Vous ne pouvez pas créer une séance pour un enseignement qui ne vous appartient pas');
      }
    }

    const date = new Date(dateSeance);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('dateSeance invalide');
    }

    let duree: number;
    try {
      duree = calculerDureeSeance(heureDebut, heureFin);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Horaire invalide');
    }

    const statutFinal = (statut as StatutSeance | undefined) ?? StatutSeance.REALISEE;

    // Une séance déclarée comme réalisée doit décrire le contenu effectivement
    // enseigné et avoir une durée strictement positive (garantie par le calcul).
    if (statutFinal === StatutSeance.REALISEE) {
      this.verifierContenuRealise(contenuEnseigne);
    }

    // Doublons / chevauchements : contrôle sur le même enseignement et le même
    // jour, hors séances annulées.
    await this.verifierChevauchement(enseignementId, date, heureDebut, heureFin);

    const newSeance = await this.prisma.$transaction(async (tx) => {
      const seance = await tx.seance.create({
        data: {
          enseignementId,
          dateSeance: date,
          heureDebut,
          heureFin,
          duree,
          contenuEnseigne,
          statut: statutFinal,
        },
      });

      await this.suiviRecalculService.recalculerEtPersister(enseignementId, tx);

      // Trace de création : la déclaration directe d'une séance réalisée est
      // distinguée d'une simple planification.
      await this.auditSeanceService.enregistrer(
        {
          seanceId: seance.id,
          enseignementId,
          action:
            statutFinal === StatutSeance.REALISEE
              ? ActionAuditSeance.DECLARATION_REALISEE
              : ActionAuditSeance.CREATION,
          statutAvant: null,
          statutApres: statutFinal,
          valeursApres: instantaneSeance(seance),
          perimetre: {
            enseignantId: enseignement.enseignantId,
            mentionId: enseignement.mentionId,
            cycle: enseignement.cycle,
            parcours: enseignement.parcours,
          },
        },
        context,
        tx,
      );

      return seance;
    });

    return newSeance;
  }

  private verifierContenuRealise(contenuEnseigne?: string): void {
    if (!contenuEnseigne || contenuEnseigne.trim().length === 0) {
      throw new BadRequestException(
        'Le contenu enseigné est obligatoire pour déclarer une séance réalisée',
      );
    }
  }

  private async verifierChevauchement(
    enseignementId: string,
    date: Date,
    heureDebut: string,
    heureFin: string,
  ): Promise<void> {
    const debutJour = new Date(date);
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(debutJour);
    finJour.setDate(finJour.getDate() + 1);

    const seancesDuJour = await this.prisma.seance.findMany({
      where: {
        enseignementId,
        statut: { not: StatutSeance.ANNULEE },
        dateSeance: { gte: debutJour, lt: finJour },
      },
      select: { heureDebut: true, heureFin: true },
    });

    const chevauchement = seancesDuJour.some((s) =>
      plagesHorairesSeChevauchent(heureDebut, heureFin, s.heureDebut, s.heureFin),
    );

    if (chevauchement) {
      throw new BadRequestException(
        'Une séance de cet enseignement chevauche déjà ce créneau horaire',
      );
    }
  }
}
