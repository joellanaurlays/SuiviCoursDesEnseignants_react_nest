import { Cycle, Prisma } from '@prisma/client';
import { FiltreCloture } from './calcul-suivi';
import { SuiviQueryDto } from '../dto/suivi-query.dto';

/**
 * Construit la clause WHERE correspondant aux filtres du suivi.
 *
 * SOURCE DE VÉRITÉ UNIQUE des filtres du module « suivi des enseignements » :
 * le tableau de bord (liste) et les statistiques passent par cette même
 * fonction, afin que les agrégats correspondent toujours exactement aux lignes
 * affichées.
 *
 * Le périmètre d'accès (enseignant de l'utilisateur, mention, cycle) est
 * imposé séparément par `PermissionsService.buildEnseignementScope` à partir du
 * rôle authentifié et combiné en AND : aucun de ces filtres ne peut donc
 * élargir le périmètre.
 */
export function construireWhereSuivi(filters?: SuiviQueryDto): Prisma.EnseignementWhereInput {
  const where: Prisma.EnseignementWhereInput = {};
  if (!filters) {
    return where;
  }

  const contains = (value: string): Prisma.StringFilter => ({
    contains: value,
    mode: 'insensitive',
  });

  // Les noms "humains" et leurs alias "*Id" pointent vers les mêmes colonnes.
  when(filters.enseignant ?? filters.enseignantId, (v) => (where.enseignantId = contains(v)));
  when(filters.matiere ?? filters.matiereId, (v) => (where.matiereId = contains(v)));
  when(filters.mention ?? filters.mentionId, (v) => (where.mentionId = contains(v)));
  when(filters.parcours, (v) => (where.parcours = contains(v)));
  when(filters.cycle, (v) => (where.cycle = normaliserCycle(v)));
  when(filters.niveau ?? filters.niveauId, (v) => (where.niveauId = contains(v)));
  when(filters.semestre ?? filters.semestreId, (v) => (where.semestreId = contains(v)));
  when(
    filters.anneeUniversitaire ?? filters.anneeUniversitaireId,
    (v) => (where.anneeUniversitaireId = contains(v)),
  );

  // Clôture anticipée : colonne réelle sur Enseignement, donc filtrable en SQL.
  when(filters.cloture, (v) => (where.clotureAnticipee = v === (FiltreCloture.ANTICIPEE as string)));

  // L'état est un cache dénormalisé, resynchronisé par SuiviRecalculService
  // après chaque écriture : le filtrage SQL reste cohérent avec le calcul.
  when(filters.etat, (v) => (where.etat = v));

  if (filters.search) {
    const term: Prisma.StringFilter = { contains: filters.search, mode: 'insensitive' };
    where.OR = [
      { matiereId: term },
      { enseignantId: term },
      { mentionId: term },
      { parcours: term },
    ];
  }

  return where;
}

function normaliserCycle(value: string): Cycle {
  const upper = value.toUpperCase();
  if (upper === 'LICENCE' || upper === 'MASTER') {
    return upper as Cycle;
  }
  return value as Cycle;
}

function when<T>(value: T | undefined, apply: (v: T) => void): void {
  if (value !== undefined && value !== '') {
    apply(value);
  }
}
