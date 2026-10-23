import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './roles.enum';

/**
 * JWT minimal implémenté avec le module crypto natif de Node.js
 * (aucune dépendance supplémentaire requise).
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

function base64urlEncode(data: Buffer): string {
  return data
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function signToken(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number,
): string {
  const header = base64urlEncode(
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
  );
  const now = Math.floor(Date.now() / 1000);
  const payloadWithExp = { ...payload, iat: now, exp: now + expiresInSeconds };
  const payloadStr = base64urlEncode(Buffer.from(JSON.stringify(payloadWithExp)));
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payloadStr}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payloadStr}.${signature}`;
}

function verifyToken(
  token: string,
  secret: string,
): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerStr, payloadStr, signature] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verifyHash = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
}

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    isActive: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string): Promise<LoginResult['user'] | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;
    const passwordMatches = verifyPassword(password, user.password);
    if (!passwordMatches) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role as unknown as Role,
      isActive: user.isActive,
    };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const secret = process.env.JWT_SECRET ?? 'default-secret-change-me';
    const expiresInSeconds = 7 * 24 * 60 * 60; // 7 jours

    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role as unknown as Role };
    const accessToken = signToken(payload as unknown as Record<string, unknown>, secret, expiresInSeconds);

    return { accessToken, user };
  }
}