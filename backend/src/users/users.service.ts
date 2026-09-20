import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

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

  async create(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new BadRequestException('Le rôle spécifié n\'existe pas.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive,
      },
      include: { role: true },
    });

    return this.toSafeUser(user);
  }

  /**
   * Lister les utilisateurs avec recherche, filtres et pagination.
   *
   * @param search  — recherche dans email, prénom, nom
   * @param role    — filtre par nom de rôle (ex: ADMINISTRATEUR)
   * @param isActive — filtre par statut actif ('true' | 'false')
   * @param page    — numéro de page (défaut 1)
   * @param limit   — nombre d'éléments par page (défaut 10, max 100)
   */
  async findAll(params: {
    search?: string;
    role?: string;
    isActive?: string;
    page: number;
    limit: number;
  }) {
    const { search, role, isActive } = params;

    const page = Math.max(1, params.page);
    const limit = Math.min(Math.max(1, params.limit), 100);

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (isActive === 'true' || isActive === 'false') {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.toSafeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return this.toSafeUser(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (dto.email && dto.email !== existingUser.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailTaken) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà.');
      }
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role) {
        throw new BadRequestException('Le rôle spécifié n\'existe pas.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { role: true },
    });

    return this.toSafeUser(user);
  }

  private toSafeUser(user: { password: string; role: { name: string }; [key: string]: unknown }) {
    const { password, ...safeUser } = user;
    return { ...safeUser, role: user.role.name };
  }
}