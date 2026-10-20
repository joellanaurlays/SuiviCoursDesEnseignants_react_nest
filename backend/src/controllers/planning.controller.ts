import { Router, Request, Response } from 'express';
import { PlanningService, ConflictException } from '../services/planning.service.js';

export const planningRouter = Router();
const planningService = new PlanningService();

// GET /api/planning - Consultation de l'emploi du temps avec filtres
planningRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { codeNiveau, mentionNom, nomEnseignant, salleId, statut, semestreNom } = req.query;
    const result = await planningService.getPlanning({
      codeNiveau: codeNiveau as string,
      mentionNom: mentionNom as string,
      nomEnseignant: nomEnseignant as string,
      salleId: salleId ? Number(salleId) : undefined,
      statut: statut as string,
      semestreNom: semestreNom as string
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/planning/session - Planification d'une séance avec détection conflit
planningRouter.post('/session', async (req: Request, res: Response) => {
  try {
    const session = await planningService.createSession(req.body);
    res.status(201).json(session);
  } catch (error: any) {
    if (error instanceof ConflictException) {
      res.status(409).json({
        statusCode: 409,
        error: 'Conflict',
        message: error.message,
        details: error.details
      });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// PUT /api/planning/session/:id/status - Mise à jour du statut dans le cycle de vie
planningRouter.put('/session/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await planningService.updateSessionStatus(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

planningRouter.put('/session/:id', async (req: Request, res: Response) => {
  try {
    res.json(await planningService.updateSession(Number(req.params.id), req.body));
  } catch (error: any) {
    if (error instanceof ConflictException) {
      res.status(409).json({ statusCode: 409, error: 'Conflict', message: error.message, details: error.details });
    } else {
      res.status(404).json({ error: error.message });
    }
  }
});

// DELETE /api/planning/session/:id - Suppression d'une séance
planningRouter.delete('/session/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await planningService.deleteSession(id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// POST /api/planning/generate - Algorithme de génération automatique (T22)
planningRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const summary = await planningService.generateAutomaticPlanning(req.body);
    res.status(200).json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/planning/publish - Publication officielle de l'emploi du temps
planningRouter.post('/publish', async (_req: Request, res: Response) => {
  try {
    const published = await planningService.publishPlanning();
    res.json(published);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
