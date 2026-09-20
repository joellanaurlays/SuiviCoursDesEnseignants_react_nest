import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async getProfile(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return this.toSafeUser(user);
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { role: true },
    });
    return this.toSafeUser(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("Le nouveau mot de passe doit être différent de l'ancien.");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe mis à jour avec succès.' };
  }

  private toSafeUser(user: { password: string; role: { name: string }; [key: string]: unknown }) {
    const { password, ...safeUser } = user;
    return { ...safeUser, role: user.role.name };
  }
}