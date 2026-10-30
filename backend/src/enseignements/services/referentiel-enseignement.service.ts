import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Cycle, RoleName } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { Role } from '../../auth/roles.enum.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { CreateEnseignementDto } from '../dto/create-enseignement.dto.js';
import {
  anneeUniversitaireCourante,
  CYCLES_OFFICIELS,
  estAnneeUniversitaireValide,
  estCycle,
  NIVEAUX_PAR_CYCLE,
  PARCOURS_OFFICIELS,
  SEMESTRES_PAR_NIVEAU,
} from '../domain/referentiel-enseignement.js';

export interface NiveauOption {
  value: string;
  cycle: Cycle;
}

export interface SemestreOption {
  value: string;
  niveau: string;
}

export interface VerrousCreationEnseignement {
  cycle: Cycle | null;
  parcours: string | null;
  mention: string | null;
}

export interface ReferentielCreationEnseignement {
  matieres: string[];
  enseignants: string[];
  mentions: string[];
  parcours: string[];
  cycles: Cycle[];
  niveaux: NiveauOption[];
  semestres: SemestreOption[];
  anneesUniversitaires: string[];
  verrous: VerrousCreationEnseignement;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

@Injectable()
export class ReferentielEnseignementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Récupère le référentiel complet pour les dropdowns de création d'enseignement.
   * Nécessite un contexte utilisateur authentifié avec les rôles appropriés.
   *
   * @param context - Contexte utilisateur authentifié (requis: rôle + périmètre)
   * @returns Objet contenant les données pour les dropdowns : matieres, enseignants, mentions, parcours, cycles, niveaus, semestres, anneesUniversitaires
   * @throws {ForbiddenException} Si l'utilisateur n'est pas autorisé ou le périmètre est incomplet
   */
  async obtenir(context?: AuthContext): Promise<ReferentielCreationEnseignement> {
    if (!context) {
      throw new ForbiddenException('Contexte utilisateur requis');
    }

    const estResponsable = context.role === Role.RESPONSABLE_MENTION;
    if (estResponsable && (!context.parcours || !context.cycles?.length)) {
      throw new ForbiddenException('Votre périmètre académique est incomplet');
    }

    const scope = this.permissionsService.buildEnseignementScope(context);

    const [lignesPerimetre, lignesGlobales, comptesEnseignants] = await Promise.all([
      this.prisma.enseignement.findMany({
        where: scope,
        select: {
          matiereId: true,
          mentionId: true,
          parcours: true,
        },
      }),
      this.prisma.enseignement.findMany({
        select: {
          enseignantId: true,
          anneeUniversitaireId: true,
        },
      }),
      this.prisma.user.findMany({
        where: { isActive: true, role: { name: RoleName.ENSEIGNANT } },
        select: { firstName: true, lastName: true },
      }),
    ]);

    const cycles = estResponsable
      ? dedupe(context.cycles ?? []).filter(estCycle)
      : [...CYCLES_OFFICIELS];
    if (cycles.length === 0) {
      throw new ForbiddenException('Aucun cycle valide dans votre périmètre');
    }

    const verrouParcours = estResponsable ? context.parcours ?? null : null;
    const matieres = dedupe(lignesPerimetre.map((ligne) => ligne.matiereId));
    const enseignants = dedupe([
      ...lignesGlobales.map((ligne) => ligne.enseignantId).filter((id): id is string => id !== null),
      ...comptesEnseignants.map((compte) => `${compte.firstName} ${compte.lastName}`.trim()),
    ]);
    const mentions = verrouParcours
      ? [verrouParcours]
      : dedupe([...PARCOURS_OFFICIELS, ...lignesPerimetre.map((ligne) => ligne.mentionId)]);
    const parcours = verrouParcours
      ? [verrouParcours]
      : dedupe([...PARCOURS_OFFICIELS, ...lignesPerimetre.map((ligne) => ligne.parcours)]);
    const anneesUniversitaires = dedupe([
      ...lignesGlobales
        .map((ligne) => ligne.anneeUniversitaireId)
        .filter(estAnneeUniversitaireValide),
      anneeUniversitaireCourante(),
    ]).sort().reverse();

    const niveaux: NiveauOption[] = cycles.flatMap((cycle) =>
      (NIVEAUX_PAR_CYCLE[cycle] ?? []).map((value) => ({ value, cycle })),
    );
    const niveauxUniques = dedupe(niveaux.map((niveau) => niveau.value));
    const semestres: SemestreOption[] = niveauxUniques.flatMap((niveau) =>
      (SEMESTRES_PAR_NIVEAU[niveau] ?? []).map((value) => ({ value, niveau })),
    );

    return {
      matieres,
      enseignants,
      mentions,
      parcours,
      cycles,
      niveaux,
      semestres,
      anneesUniversitaires,
      verrous: {
        cycle: estResponsable && cycles.length === 1 ? cycles[0] : null,
        parcours: verrouParcours,
        mention: verrouParcours,
      },
    };
  }

  /**
   * Vérifie que la matière, la mention et le parcours soumis existent réellement.
   * La création ne comporte plus d'enseignant : l'affectation est une action distincte.
   */
  async verifierReferences(dto: CreateEnseignementDto): Promise<void> {
    const [matiere, mention, parcours] = await Promise.all([
      this.prisma.enseignement.findFirst({
        where: { matiereId: dto.matiereId },
        select: { id: true },
      }),
      this.prisma.enseignement.findFirst({
        where: { mentionId: dto.mentionId },
        select: { id: true },
      }),
      this.prisma.enseignement.findFirst({
        where: { parcours: dto.parcours },
        select: { id: true },
      }),
    ]);

    const mentionOfficielle = (PARCOURS_OFFICIELS as readonly string[]).includes(dto.mentionId);
    const parcoursOfficiel = (PARCOURS_OFFICIELS as readonly string[]).includes(dto.parcours);

    if (!matiere) {
      throw new BadRequestException(`La matière « ${dto.matiereId} » n'existe pas dans le référentiel.`);
    }
    // La création se fait SANS enseignant : l'affectation est une action
    // distincte réalisée par un RESPONSABLE_MENTION (PATCH :id/teacher).
    if (!mention && !mentionOfficielle) {
      throw new BadRequestException(`La mention « ${dto.mentionId} » n'existe pas dans le référentiel.`);
    }
    if (!parcours && !parcoursOfficiel) {
      throw new BadRequestException(`Le parcours « ${dto.parcours} » n'existe pas dans le référentiel.`);
    }
  }
}