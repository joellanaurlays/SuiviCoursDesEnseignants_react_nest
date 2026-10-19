import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculerSuivi } from '../domain/calcul-suivi';

/**
 * Met à jour les colonnes agrégées d'un enseignement (heuresRealisees,
 * progression, etat) à partir de ses séances réelles et de son éventuel
 * drapeau de clôture anticipée, selon la règle métier unique.
 * À appeler après toute création, modification ou suppression d'une séance.
 *
 * Ces colonnes ne sont qu'un cache dénormalisé : toutes les réponses API
 * recalculent le suivi depuis les séances (source de vérité).
 */
@Injectable()
export class SuiviRecalculService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param client Client Prisma optionnel : passer le client transactionnel
   *   permet de modifier la séance et de recalculer le suivi dans une seule
   *   transaction, garantissant que les heures comptabilisées restent
   *   cohérentes avec le statut de la séance.
   */
  async recalculerEtPersister(
    enseignementId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const enseignement = await client.enseignement.findUnique({
      where: { id: enseignementId },
      select: {
        id: true,
        volumePrevu: true,
        clotureAnticipee: true,
        seances: { select: { duree: true, statut: true } },
      },
    });

    if (!enseignement) {
      return;
    }

    const suivi = calculerSuivi(
      enseignement.volumePrevu,
      enseignement.seances,
      enseignement.clotureAnticipee,
    );

    await client.enseignement.update({
      where: { id: enseignementId },
      data: {
        heuresRealisees: suivi.heuresRealisees,
        progression: suivi.progression,
        etat: suivi.etat,
      },
    });
  }
}
