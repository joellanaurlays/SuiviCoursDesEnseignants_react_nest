import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    // Les claims portent le rôle (RoleName Prisma) et le périmètre
    // responsable de mention pour que le guard reconstruise l'AuthContext
    // sans interpeller la base.
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      mentionId: user.mentionId ?? undefined,
      cycles: user.cycles ?? [],
      parcours: user.parcours ?? undefined,
    };

    const estResponsable =
      user.role.name === 'RESPONSABLE_LICENCE' || user.role.name === 'RESPONSABLE_MASTER';

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.name,
        ...(estResponsable
          ? {
              mentionId: user.mentionId,
              cycles: user.cycles ?? [],
              parcours: user.parcours,
            }
          : {}),
      },
    };
  }
}