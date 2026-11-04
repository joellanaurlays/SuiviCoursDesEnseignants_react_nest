/**
 * MODE DE PRÉVISUALISATION LOCAL DU MODULE « SUIVI DES ENSEIGNEMENTS ».
 *
 * OBJECTIF
 * Permettre de développer et de tester son interface sans dépendre de
 * l'authentification, dont la résolution est encore en cours par un autre
 * membre de l'équipe.
 *
 * GARANTIES (volontairement strictes)
 * 1. Le mode n'existe QUE si Vite est en développement ET si la variable
 *    dédiée `VITE_ENABLE_LOCAL_PREVIEW` vaut exactement "true".
 *    `import.meta.env.DEV` est inliné par Vite à `false` dans un build de
 *    production : le mode y est donc structurellement INACTIVABLE.
 * 2. Aucun jeton JWT n'est fabriqué, ni stocké, ni envoyé au backend.
 *    Les guards NestJS restent actifs et inchangés.
 * 3. Aucune règle d'autorisation réelle n'est modifiée : les pages
 *    concernées (`/enseignant/seances`) restent celles de l'espace
 *    enseignant et exigent toujours le rôle ENSEIGNANT.
 * 4. Les écritures (déclarer/réaliser/annuler/corriger) ne touchent JAMAIS
 *    PostgreSQL : elles sont simulées en mémoire.
 * 5. Le comportement de connexion normal est strictement inchangé quand le
 *    mode est désactivé (absence de jeton => redirection vers /login).
 */

/** Variable d'environnement qui active explicitement le mode. */
export const LOCAL_PREVIEW_ENV_VAR = 'VITE_ENABLE_LOCAL_PREVIEW';

/** Route du module Suivi des enseignements visée par la prévisualisation. */
export const LOCAL_PREVIEW_ROUTE = '/enseignant/seances';

/**
 * Vrai UNIQUEMENT en développement ET sur activation explicite.
 * En production, `import.meta.env.DEV` vaut `false` : le mode est mort.
 */
export function isLocalPreviewEnabled(): boolean {
  return import.meta.env.DEV === true && import.meta.env.VITE_ENABLE_LOCAL_PREVIEW === 'true';
}

/**
 * Identité de démonstration.
 *
 * Le rôle reprend la nomenclature EXACTE du projet (`RoleName` côté
 * Prisma/JWT) : ENSEIGNANT est le seul rôle qui ouvre l'espace
 * `/enseignant/*`, où vit le module Suivi des enseignements.
 * Ce n'est PAS un jeton : c'est un objet d'affichage utilisé uniquement
 * côté frontend, jamais transmis comme autorisation au backend.
 */
export const LOCAL_PREVIEW_IDENTITY = {
  id: 'preview-local',
  firstName: 'Démo',
  lastName: 'Enseignant',
  role: 'ENSEIGNANT',
  mentionId: 'PREVIEW',
  cycles: [],
  parcours: null,
} as const;

/** Origine des données actuellement affichées. */
export type PreviewDataSource = 'reelle' | 'demonstration' | 'inconnu';

export interface PreviewStatus {
  /** Le mode est-il actif ? */
  enabled: boolean;
  /** Les données affichées proviennent-elles de l'API réelle ou de la démo ? */
  source: PreviewDataSource;
  /** Dernière erreur rencontrée en appelant l'API réelle (si any). */
  apiError: string | null;
  /** L'API réelle a-t-elle répondu au moins une fois ? */
  apiReachable: boolean;
  /**
   * L'API réelle a répondu mais n'a renvoyé AUCUNE donnée pour l'identité de
   * démonstration. C'est le cas normal : le backend filtre les séances sur
   * l'identifiant de l'enseignant, or l'identité de démonstration ne
   * correspond à aucune ligne de PostgreSQL.
   */
  apiEmpty: boolean;
}

let status: PreviewStatus = {
  enabled: isLocalPreviewEnabled(),
  source: 'inconnu',
  apiError: null,
  apiReachable: false,
  apiEmpty: false,
};

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function getPreviewStatus(): PreviewStatus {
  return status;
}

export function subscribePreviewStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Consigne que les données affichées proviennent du jeu de démonstration. */
export function markDemoSource(apiError?: string): void {
  status = {
    ...status,
    source: 'demonstration',
    apiError: apiError ?? status.apiError,
    apiEmpty: false,
  };
  emit();
}

/**
 * Consigne que l'API réelle a répondu mais sans aucune donnée exploitable
 * pour l'identité de démonstration : le jeu de démonstration prend le relais,
 * sans masquer le fait que l'API est joignable.
 */
export function markDemoSourceEmpty(): void {
  status = {
    ...status,
    source: 'demonstration',
    apiError: null,
    apiReachable: true,
    apiEmpty: true,
  };
  emit();
}

/** Consigne que les données affichées proviennent de l'API réelle. */
export function markRealSource(): void {
  status = {
    ...status,
    source: 'reelle',
    apiError: null,
    apiReachable: true,
    apiEmpty: false,
  };
  emit();
}

function errorMessage(error: unknown): string {
  const message = (error as { message?: string })?.message;
  return message && message.trim() ? message : 'Erreur inconnue';
}

/**
 * Exécute l'appel API réel et, en cas d'échec, bascule sur le jeu de
 * démonstration.
 *
 * L'erreur réelle n'est JAMAIS masquée : elle est conservée et affichée
 * dans le bandeau de prévisualisation, afin que le développeur voie
 * précisément pourquoi les données de démonstration sont affichées.
 *
 * `estVide` est optionnel : lorsqu'il est fourni et que l'API réelle
 * répond sans donnée (liste vide), le jeu de démonstration prend également
 * le relais. Ce cas est normal en prévisualisation, car le backend filtre
 * les séances sur l'identifiant de l'enseignant et l'identité de
 * démonstration ne correspond à aucun enseignant enregistré. L'API reste
 * signalée comme joignable : rien n'est masqué.
 */
export async function withPreviewFallback<T>(
  real: () => Promise<T>,
  fallback: () => T,
  estVide?: (valeur: T) => boolean,
): Promise<T> {
  try {
    const resultat = await real();
    if (estVide?.(resultat)) {
      markDemoSourceEmpty();
      return fallback();
    }
    markRealSource();
    return resultat;
  } catch (error) {
    markDemoSource(errorMessage(error));
    return fallback();
  }
}
