import { Router, Request, Response } from 'express';
import { ConstraintsService } from '../services/constraints.service.js';

export const constraintsRouter = Router();
const constraintsService = new ConstraintsService();

// GET /api/constraints - Récupère toutes les contraintes
constraintsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const list = await constraintsService.findAll();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/constraints - Création d'une nouvelle contrainte
constraintsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const created = await constraintsService.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/constraints/:id/toggle - Activation/désactivation d'une contrainte
constraintsRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const updated = await constraintsService.toggleActive(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// DELETE /api/constraints/:id - Suppression d'une contrainte
constraintsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await constraintsService.delete(id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});
