import { Role } from './roles.enum';

export interface AuthContext {
  userId: string;
  role: Role;
  mentionId?: string;
  cycles?: string[];
  /**
   * Parcours auquel le responsable de parcours est affecté (XOR cycle) :
   * Informatique / Management / ICM. Le parcours seul n'est pas unique (il
   * existe en Licence et en Master), le périmètre est donc toujours
   * `cycle + parcours`.
   */
  parcours?: string;
}

export const AUTH_HEADERS = {
  userId: 'x-user-id',
  role: 'x-user-role',
  mentionId: 'x-user-mention',
  cycles: 'x-user-cycle',
  parcours: 'x-user-parcours',
} as const;