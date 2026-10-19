import { Router } from 'express';
import { roomsRouter } from './rooms.controller';
import { planningRouter } from './planning.controller';
import { conflictsRouter } from './conflicts.controller';
import { constraintsRouter } from './constraints.controller';

export const apiRouter = Router();

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
