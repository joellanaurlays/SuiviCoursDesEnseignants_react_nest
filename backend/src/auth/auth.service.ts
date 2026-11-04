import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

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

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role.name,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const issued = await this.usersService.issuePasswordResetCode(dto.email);

    if (!issued) {
      return {
        message: 'Si un compte est associé à cette adresse, un code de vérification a été généré.',
      };
    }

    // Aucun service email n'étant configuré, le code est renvoyé pour être
    // affiché à l'écran (démonstration).
    return {
      message: 'Un code de vérification a été généré pour cette adresse.',
      code: issued.code,
      expiresAt: issued.expiresAt.toISOString(),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.usersService.resetPasswordWithCode(dto.email, dto.code, dto.newPassword);
  }
}