import { Role } from './roles.enum.js';

/**
 * Le modèle Prisma (RoleName) et le référentiel applicatif (Role) utilisés par
 * les modules Enseignements/Permissions n'ont pas les mêmes valeurs : le JWT
 * porte un RoleName, le AuthContext doit exposer un Role.
 */
const ROLE_NAME_TO_BACKEND_ROLE: Record<string, Role> = {
  CHEF_SCOLARITE: Role.SCOLARITE,
  ADMINISTRATEUR: Role.ADMINISTRATEUR,
  ENSEIGNANT: Role.ENSEIGNANT,
  RESPONSABLE_LICENCE: Role.RESPONSABLE_MENTION,
  RESPONSABLE_MASTER: Role.RESPONSABLE_MENTION,
};

export function toBackendRole(roleName: string): Role | undefined {
  return ROLE_NAME_TO_BACKEND_ROLE[roleName];
}
