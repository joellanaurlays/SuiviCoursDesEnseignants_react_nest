import { Router } from 'express';
import { roomsRouter } from './rooms.controller.js';
import { planningRouter } from './planning.controller.js';
import { conflictsRouter } from './conflicts.controller.js';
import { constraintsRouter } from './constraints.controller.js';
import { DataStore } from '../database/data-store.js';

export const apiRouter = Router();

apiRouter.get('/teachings', async (_req, res) => {
  try {
    const store = DataStore.getInstance();
    await store.refreshTeachings();
    res.json(store.teachings);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur de lecture du référentiel académique.' });
  }
});

apiRouter.use('/rooms', roomsRouter);
apiRouter.use('/planning', planningRouter);
apiRouter.use('/conflicts', conflictsRouter);
apiRouter.use('/constraints', constraintsRouter);

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'EMIT Schedule Module (Member 5)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
