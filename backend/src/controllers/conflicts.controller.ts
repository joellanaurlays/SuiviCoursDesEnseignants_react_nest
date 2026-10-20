import { Router, Request, Response } from 'express';
import { ConflictDetectorService } from '../services/conflict-detector.service.js';

export const conflictsRouter = Router();
const conflictDetector = new ConflictDetectorService();

// POST /api/conflicts/check - Analyse en temps réel des collisions potentielles
conflictsRouter.post('/check', async (req: Request, res: Response) => {
  try {
    const result = await conflictDetector.checkConflicts(req.body);
    // Renvoie 409 si bloquant, sinon 200
    if (result.hasBlockingError) {
      res.status(409).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
