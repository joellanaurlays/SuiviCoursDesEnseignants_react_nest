import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculerSuivi, StatutSeance, TypeCloture } from '../domain/calcul-suivi';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';
import { PermissionsService } from '../permissions/permissions.service';

export interface DashboardResponse {
  stats: {
    totalEnseignements: number;
    totalSeancesRealisees: number;
    totalSeancesPreves: number;
    totalHeuresRealisees: number;
    totalVolumePrevu: number;
    averageProgression: number;
    /** Enseignements terminés parce que le volume prévu est atteint. */
    terminesParVolumeAtteint: number;
    /** Enseignements terminés par l'enseignant avant le volume prévu. */
    terminesParClotureAnticipee: number;
  };
  prochainesSeances: {
    id: string;
    matiereId: string;
    dateSeance: Date;
    heureDebut: string;
    heureFin: string;
  }[];
  progressionParMatiere: {
    matiereId: string;
    progression: number;
  }[];
}

@Injectable()
export class GetTeacherDashboardUseCase {
  constructor(
    private prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute(enseignantId: string, context?: AuthContext): Promise<DashboardResponse> {
    if (context && context.role === Role.ENSEIGNANT && context.userId !== enseignantId) {
      throw new ForbiddenException('Vous ne pouvez consulter que votre propre tableau de bord');
    }

    const enseignements = await this.prisma.enseignement.findMany({
      where: { enseignantId },
      include: { seances: true },
    });

    const enseignementsAutorises = context
      ? enseignements.filter((ens) => this.permissionsService.canAccessEnseignement(context, ens))
      : enseignements;

    const stats = {
      totalEnseignements: enseignementsAutorises.length,
      totalSeancesRealisees: 0,
      totalSeancesPreves: 0,
      totalHeuresRealisees: 0,
      totalVolumePrevu: 0,
      totalProgression: 0,
      terminesParVolumeAtteint: 0,
      terminesParClotureAnticipee: 0,
    };

    const progressionParMatiere: DashboardResponse['progressionParMatiere'] = [];
    const prochainesSeancesRaw: DashboardResponse['prochainesSeances'] = [];

    const now = new Date();

    for (const ens of enseignementsAutorises) {
      const suivi = calculerSuivi(ens.volumePrevu, ens.seances, ens.clotureAnticipee);

      stats.totalVolumePrevu += ens.volumePrevu;
      stats.totalHeuresRealisees += suivi.heuresRealisees;
      stats.totalProgression += suivi.progression;

      stats.totalSeancesPreves += ens.seances.length;
      stats.totalSeancesRealisees += ens.seances.filter(
        (s) => s.statut === StatutSeance.REALISEE,
      ).length;

      if (suivi.typeCloture === TypeCloture.ANTICIPEE) {
        stats.terminesParClotureAnticipee += 1;
      } else if (suivi.typeCloture === TypeCloture.NORMALE) {
        stats.terminesParVolumeAtteint += 1;
      }


      progressionParMatiere.push({
        matiereId: ens.matiereId,
        progression: suivi.progression,
      });

      const upcoming = ens.seances.filter(
        (s) => s.dateSeance >= now && s.statut === StatutSeance.PLANIFIEE,
      );

      for (const s of upcoming) {
        prochainesSeancesRaw.push({
          id: s.id,
          matiereId: ens.matiereId,
          dateSeance: s.dateSeance,
          heureDebut: s.heureDebut,
          heureFin: s.heureFin,
        });
      }
    }

    const averageProgression =
      stats.totalEnseignements > 0 ? stats.totalProgression / stats.totalEnseignements : 0;

    prochainesSeancesRaw.sort((a, b) => {
      const dateDiff = a.dateSeance.getTime() - b.dateSeance.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.heureDebut.localeCompare(b.heureDebut);
    });

    return {
      stats: {
        totalEnseignements: stats.totalEnseignements,
        totalSeancesRealisees: stats.totalSeancesRealisees,
        totalSeancesPreves: stats.totalSeancesPreves,
        totalHeuresRealisees: stats.totalHeuresRealisees,
        totalVolumePrevu: stats.totalVolumePrevu,
        averageProgression,
        terminesParVolumeAtteint: stats.terminesParVolumeAtteint,
        terminesParClotureAnticipee: stats.terminesParClotureAnticipee,
      },
      prochainesSeances: prochainesSeancesRaw.slice(0, 10),
      progressionParMatiere,
    };
  }
}
