import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { apiRouter } from './controllers/api.router.js';
import { DataStore } from './database/data-store.js';

async function bootstrap() {
  await DataStore.getInstance().initialize();
  const app = await NestFactory.create(AppModule);
  app.use('/api', apiRouter);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error: unknown) => {
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === '28000' || code === '28P01') {
    console.error('Connexion PostgreSQL refusée. Vérifiez DB_USERNAME et DB_PASSWORD dans backend/.env.');
  } else {
    console.error('Échec du démarrage du backend :', error);
  }
  process.exitCode = 1;
});
