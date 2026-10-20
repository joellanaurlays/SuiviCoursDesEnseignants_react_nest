import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculerDureeSeance, plagesHorairesSeChevauchent, StatutSeance } from '../domain/calcul-suivi';
import { SuiviRecalculService } from '../services/suivi-recalcul.service';
import { AuthContext } from '../../auth/auth-context';
import { PermissionsService } from '../permissions/permissions.service';
import { AuditSeanceService } from '../services/audit-seance.service';
import { ActionAuditSeance, instantaneSeance } from '../domain/audit-seance';

/** Informations réellement observées lors de la réalisation d'une séance. */
export interface RealisationSeanceOptions {
  dateSeance?: string;
  heureDebut?: string;
  heureFin?: string;
  contenuEnseigne?: string;
  salle?: string;
  typeSeance?: string;
  /** Motif de l'annulation (facultatif), conservé dans le journal d'audit. */
  motif?: string;
}

/**
 * Gère les transitions de statut d'une séance.
 *
 * Règles métier :
 * - Seul l'enseignant responsable de la séance peut la réaliser ou l'annuler.
 * - PLANIFIEE → REALISEE : autorisée, après validation des données observées
 *   (contenu enseigné, salle et type de séance obligatoires ; horaires
 *   recalculés côté serveur).
 * - PLANIFIEE → ANNULEE  : autorisée, aucune heure comptabilisée.
 * - REALISEE  → REALISEE : idempotente (aucun double comptage).
 * - ANNULEE   → ANNULEE  : idempotente (aucune nouvelle annulation).
 * - REALISEE  → ANNULEE  : interdite.
 * - ANNULEE   → REALISEE  : interdite (pas de réactivation prévue).
 *
 * La modification de statut et le recalcul des heures/progression sont
 * exécutés dans une même transaction : les heures réalisées restent toujours
 * cohérentes avec les séances réellement effectuées.
 */
@Injectable()
export class UpdateSeanceStatusUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly suiviRecalculService: SuiviRecalculService,
    private readonly permissionsService: PermissionsService,
    private readonly auditSeanceService: AuditSeanceService,
  ) {}

  async execute(
    seanceId: string,
    statut: StatutSeance,
    context?: AuthContext,
    options: RealisationSeanceOptions = {},
  ) {
    const seance = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        enseignement: {
          select: { id: true, enseignantId: true, mentionId: true, cycle: true, parcours: true },
        },
      },
    });

    if (!seance) {
      throw new NotFoundException(`Seance with ID ${seanceId} not found`);
    }

    // Les autres rôles ne disposent que de la consultation : toute tentative
    // de réalisation ou d'annulation est rejetée côté backend (403).
    if (!this.permissionsService.canRealiserOuAnnulerSeance(context, seance)) {
      throw new ForbiddenException(
        'Seul l\'enseignant responsable de la séance peut la réaliser ou l\'annuler',
      );
    }

    const statutActuel = seance.statut as StatutSeance;

    if (statutActuel === statut) {
      // Répétition de la requête : opération idempotente, aucun recalcul ni
      // double comptage. La séance est retournée dans son état courant.
      return seance;
    }

    if (statut === StatutSeance.REALISEE) {
      return this.realiser(seance, options, context);
    }

    if (statut === StatutSeance.ANNULEE) {
      return this.annuler(seance, options, context);
    }

    // Toute autre transition (par ex. REALISEE → PLANIFIEE) est refusée.
    throw new ConflictException(
      `Transition de statut interdite : ${statutActuel} → ${statut}`,
    );
  }

  private async realiser(
    seance: SeanceAvecEnseignement,
    options: RealisationSeanceOptions,
    context?: AuthContext,
  ) {
    if (seance.statut === StatutSeance.ANNULEE) {
      throw new ConflictException('Une séance annulée ne peut pas être réalisée');
    }

    const heureDebut = options.heureDebut ?? seance.heureDebut;
    const heureFin = options.heureFin ?? seance.heureFin;

    let duree: number;
    try {
      duree = calculerDureeSeance(heureDebut, heureFin);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Horaire invalide');
    }

    const contenuEnseigne = (options.contenuEnseigne ?? seance.contenuEnseigne ?? '').trim();
    if (contenuEnseigne.length === 0) {
      throw new BadRequestException(
        'Le contenu enseigné est obligatoire pour marquer une séance comme réalisée',
      );
    }

    // La salle et le type de séance sont obligatoires au moment de la
    // réalisation. À défaut de valeur fournie, la valeur déjà planifiée sur
    // la séance est réutilisée ; sinon la réalisation est refusée (400).
    const salle = this.premiereValeurRenseignee(options.salle, seance.salle);
    if (!salle) {
      throw new BadRequestException(
        'La salle est obligatoire pour marquer une séance comme réalisée',
      );
    }

    const typeSeance = this.premiereValeurRenseignee(options.typeSeance, seance.typeSeance);
    if (!typeSeance) {
      throw new BadRequestException(
        'Le type de séance est obligatoire pour marquer une séance comme réalisée',
      );
    }

    let dateSeance = seance.dateSeance;
    if (options.dateSeance !== undefined) {
      dateSeance = new Date(options.dateSeance);
      if (Number.isNaN(dateSeance.getTime())) {
        throw new BadRequestException('dateSeance invalide');
      }
    }

    await this.verifierChevauchement(seance, dateSeance, heureDebut, heureFin);

    const avant = instantaneSeance(seance);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.seance.update({
        where: { id: seance.id },
        data: {
          statut: StatutSeance.REALISEE,
          dateSeance,
          heureDebut,
          heureFin,
          duree,
          contenuEnseigne,
          salle,
          typeSeance,
        },
      });

      await this.suiviRecalculService.recalculerEtPersister(updated.enseignementId, tx);

      await this.auditSeanceService.enregistrer(
        {
          seanceId: updated.id,
          enseignementId: updated.enseignementId,
          action: ActionAuditSeance.REALISATION,
          statutAvant: seance.statut,
          statutApres: StatutSeance.REALISEE,
          valeursAvant: avant,
          valeursApres: instantaneSeance(updated),
          perimetre: this.perimetre(seance),
        },
        context,
        tx,
      );

      return updated;
    });
  }

  private async annuler(
    seance: SeanceAvecEnseignement,
    options: RealisationSeanceOptions,
    context?: AuthContext,
  ) {
    if (seance.statut === StatutSeance.REALISEE) {
      throw new ConflictException('Une séance déjà réalisée ne peut pas être annulée');
    }

    const motif = options.motif?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.seance.update({
        where: { id: seance.id },
        data: { statut: StatutSeance.ANNULEE },
      });

      // Aucune heure réalisée n'est comptabilisée pour une séance annulée :
      // le recalcul repart des séances réellement effectuées.
      await this.suiviRecalculService.recalculerEtPersister(updated.enseignementId, tx);

      await this.auditSeanceService.enregistrer(
        {
          seanceId: updated.id,
          enseignementId: updated.enseignementId,
          action: ActionAuditSeance.ANNULATION,
          motif,
          statutAvant: seance.statut,
          statutApres: StatutSeance.ANNULEE,
          valeursAvant: instantaneSeance(seance),
          valeursApres: instantaneSeance(updated),
          perimetre: this.perimetre(seance),
        },
        context,
        tx,
      );

      return updated;
    });
  }

  /** Première valeur non vide (après suppression des espaces) parmi les candidats. */
  private premiereValeurRenseignee(
    ...candidats: Array<string | null | undefined>
  ): string {
    for (const candidat of candidats) {
      if (typeof candidat === 'string' && candidat.trim() !== '') {
        return candidat.trim();
      }
    }
    return '';
  }

  private perimetre(seance: SeanceAvecEnseignement) {
    return {
      enseignantId: seance.enseignement.enseignantId,
      mentionId: seance.enseignement.mentionId,
      cycle: seance.enseignement.cycle,
      parcours: seance.enseignement.parcours,
    };
  }

  private async verifierChevauchement(
    seance: SeanceAvecEnseignement,
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
        enseignementId: seance.enseignementId,
        id: { not: seance.id },
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
        'Une autre séance de cet enseignement chevauche ce créneau horaire',
      );
    }
  }
}

interface SeanceAvecEnseignement {
  id: string;
  enseignementId: string;
  dateSeance: Date;
  heureDebut: string;
  heureFin: string;
  duree: number;
  contenuEnseigne: string | null;
  salle: string | null;
  typeSeance: string | null;
  statut: string;
  enseignement: {
    id: string;
    enseignantId: string;
    mentionId: string;
    cycle: string;
    parcours: string;
  };
}
