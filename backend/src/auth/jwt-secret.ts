import { ConfigService } from '@nestjs/config';

/** Resolve one explicitly configured signing key for issuance and validation. */
export function resolveJwtSecret(config: ConfigService): string {
  const configuredSecret = config.get<string>('JWT_SECRET')?.trim();
  if (configuredSecret) return configuredSecret;

  throw new Error(
    'JWT_SECRET est absent. Ajoutez une clé stable dans backend/.env (voir backend/.env.example), puis redémarrez le backend.',
  );
}
