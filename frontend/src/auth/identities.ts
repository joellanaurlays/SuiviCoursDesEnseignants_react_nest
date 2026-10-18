import { Cycle, Parcours, RoleProfile } from '../types/enseignement';

const LICENCE: Cycle = 'LICENCE';
const MASTER: Cycle = 'MASTER';

const PARCOURS_OFFICIELS: Parcours[] = ['Informatique', 'Management', 'ICM'];

/**
 * Les six responsables de parcours de l'EMIT : (Licence|Master) × (Informatique|
 * Management|ICM). Le périmètre n'est plus la mention générique : chaque
 * responsable est rattaché à UN parcours précis, imposé côté backend.
 */
function responsablesDeParcours(): RoleProfile[] {
  const profils: RoleProfile[] = [];
  for (const cycle of [LICENCE, MASTER] as Cycle[]) {
    for (const parcours of PARCOURS_OFFICIELS) {
      const cycleLabel = cycle === LICENCE ? 'Licence' : 'Master';
      profils.push({
        key: `responsable-${cycleLabel.toLowerCase()}-${parcours.toLowerCase()}`,
        label: `Responsable ${cycleLabel} ${parcours}`,
        role: 'RESPONSABLE_MENTION',
        userId: `Responsable ${cycleLabel} ${parcours}`,
        cycles: [cycle],
        parcours,
        description: `Périmètre : parcours ${cycleLabel} ${parcours} uniquement`,
      });
    }
  }
  return profils;
}

export const ROLE_PROFILES: RoleProfile[] = [
  {
    key: 'enseignant-rakoto',
    label: 'Professeur Rakoto',
    role: 'ENSEIGNANT',
    userId: 'Professeur Rakoto',
    description: 'Enseignant — voit ses enseignements et saisit ses séances',
  },
  {
    key: 'scolarite',
    label: 'Chef de scolarité',
    role: 'SCOLARITE',
    userId: 'Chef de scolarité',
    description: 'Vision globale du suivi des enseignements',
  },
  ...responsablesDeParcours(),
  {
    key: 'admin',
    label: 'Administrateur',
    role: 'ADMINISTRATEUR',
    userId: 'Administrateur',
    description: 'Accès global selon les droits administrateur',
  },
];

export function defaultSessionUser() {
  return ROLE_PROFILES[0];
}

export function profileToSession(profile: RoleProfile) {
  return {
    userId: profile.userId,
    role: profile.role,
    mentionId: profile.mentionId,
    cycles: profile.cycles,
    parcours: profile.parcours,
  };
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'ENSEIGNANT':
      return 'Enseignant';
    case 'SCOLARITE':
      return 'Chef de scolarité';
    case 'RESPONSABLE_MENTION':
      return 'Responsable de mention';
    case 'ADMINISTRATEUR':
      return 'Administrateur';
    default:
      return role;
  }
}