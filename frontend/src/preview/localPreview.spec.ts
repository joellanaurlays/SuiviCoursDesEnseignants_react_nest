import { describe, expect, it, beforeEach } from 'vitest';
import {
  getPreviewStatus,
  isLocalPreviewEnabled,
  LOCAL_PREVIEW_IDENTITY,
  withPreviewFallback,
} from './localPreview';
import { previewStore } from './demoStore';

const env = import.meta.env as unknown as Record<string, unknown>;

/**
 * Le mode de prévisualisation doit rester strictement encadré :
 *  - inactif tant que la variable dédiée n'est pas positionnée ;
 *  - actif en développement quand elle vaut "true" ;
 *  - totalement mort en production (import.meta.env.DEV === false).
 */
describe('mode de prévisualisation local', () => {
  const devInitial = env.DEV;
  const variableInitiale = env.VITE_ENABLE_LOCAL_PREVIEW;

  beforeEach(() => {
    env.DEV = devInitial;
    env.VITE_ENABLE_LOCAL_PREVIEW = variableInitiale;
  });

  it('est inactif sans la variable dédiée', () => {
    env.DEV = true;
    env.VITE_ENABLE_LOCAL_PREVIEW = undefined;
    expect(isLocalPreviewEnabled()).toBe(false);
  });

  it('est inactif si la variable vaut autre chose que "true"', () => {
    env.DEV = true;
    env.VITE_ENABLE_LOCAL_PREVIEW = 'false';
    expect(isLocalPreviewEnabled()).toBe(false);

    env.VITE_ENABLE_LOCAL_PREVIEW = '1';
    expect(isLocalPreviewEnabled()).toBe(false);

    env.VITE_ENABLE_LOCAL_PREVIEW = 'TRUE';
    expect(isLocalPreviewEnabled()).toBe(false);
  });

  it('est actif en développement quand la variable vaut exactement "true"', () => {
    env.DEV = true;
    env.VITE_ENABLE_LOCAL_PREVIEW = 'true';
    expect(isLocalPreviewEnabled()).toBe(true);
  });

  it('reste inactif dans un build de production, même avec la variable dédiée', () => {
    // import.meta.env.DEV est inliné à false par Vite lors d'un build :
    // le mode est donc structurellement inactivable en production.
    env.DEV = false;
    env.VITE_ENABLE_LOCAL_PREVIEW = 'true';
    expect(isLocalPreviewEnabled()).toBe(false);
  });

  it('expose une identité de démonstration avec un rôle réel du projet', () => {
    expect(LOCAL_PREVIEW_IDENTITY.role).toBe('ENSEIGNANT');
    expect(LOCAL_PREVIEW_IDENTITY.id).toMatch(/^preview-/);
  });
});

describe('séparation données réelles / données de démonstration', () => {
  it('utilise les données réelles quand l’API répond avec des données', async () => {
    const resultat = await withPreviewFallback(
      async () => ['reelle'],
      () => ['demo'],
    );

    expect(resultat).toEqual(['reelle']);
    expect(getPreviewStatus().source).toBe('reelle');
  });

  it('bascule sur le jeu de démonstration quand l’API échoue, sans masquer l’erreur', async () => {
    const resultat = await withPreviewFallback(
      async () => {
        throw { status: 0, message: 'Connexion au serveur impossible.' };
      },
      () => ['demo'],
    );

    expect(resultat).toEqual(['demo']);
    expect(getPreviewStatus().source).toBe('demonstration');
    expect(getPreviewStatus().apiError).toBe('Connexion au serveur impossible.');
  });

  it('bascule sur le jeu de démonstration quand l’API répond sans donnée', async () => {
    const resultat = await withPreviewFallback(
      async () => [] as string[],
      () => ['demo'],
      (donnees) => donnees.length === 0,
    );

    expect(resultat).toEqual(['demo']);
    expect(getPreviewStatus().source).toBe('demonstration');
    // L'API reste signalée comme joignable et sans erreur : rien n'est masqué.
    expect(getPreviewStatus().apiReachable).toBe(true);
    expect(getPreviewStatus().apiEmpty).toBe(true);
    expect(getPreviewStatus().apiError).toBeNull();
  });
});

describe('magasin de démonstration', () => {
  beforeEach(() => {
    previewStore.reset();
  });

  it('expose des données fictives identifiables', () => {
    const seances = previewStore.listSeances();
    expect(seances.length).toBeGreaterThan(0);
    for (const seance of seances) {
      expect(seance.id.startsWith('demo-')).toBe(true);
    }
  });

  it('n’écrit jamais dans PostgreSQL : tout reste en mémoire', () => {
    const avant = previewStore.listSeances().length;
    const creee = previewStore.create({
      enseignementId: 'demo-ens-algo',
      dateSeance: '2026-10-23T08:00:00.000Z',
      heureDebut: '08:30',
      heureFin: '10:00',
      contenuEnseigne: 'Séance de démonstration',
      salle: 'B303',
      typeSeance: 'CM',
      statut: 'REALISEE',
    });
    expect(previewStore.listSeances().length).toBe(avant + 1);
    expect(creee.id.startsWith('demo-')).toBe(true);
  });

  it('trace les actions dans le journal d’audit de démonstration', () => {
    const planifiee = previewStore.listSeances().find((s) => s.statut === 'PLANIFIEE');
    expect(planifiee).toBeDefined();

    previewStore.realiser(planifiee!.id, {
      dateSeance: planifiee!.dateSeance,
      heureDebut: planifiee!.heureDebut,
      heureFin: planifiee!.heureFin,
      contenuEnseigne: 'Contenu de démonstration',
      salle: 'B303',
      typeSeance: 'CM',
    });

    const historique = previewStore.historique(planifiee!.id);
    expect(historique.some((e) => e.action === 'REALISATION')).toBe(true);
    expect(previewStore.getSeance(planifiee!.id).statut).toBe('REALISEE');
  });
});
