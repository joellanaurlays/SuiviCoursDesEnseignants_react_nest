
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Cycle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthContext } from '../auth/auth-context.js';
import { Role } from '../auth/roles.enum.js';

import { SessionExamen } from './entities/session-examen.entity.js';
import { Examen } from './entities/examen.entity.js';
import { Alerte } from './entities/alerte.entity.js';

import {
  CreateSessionDto,
  CreateExamenDto,
  CreateAlerteDto,
} from './dto/exams.dto.js';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(SessionExamen)
    private readonly sessions: Repository<SessionExamen>,

    @InjectRepository(Examen)
    private readonly examens: Repository<Examen>,

    @InjectRepository(Alerte)
    private readonly alertes: Repository<Alerte>,

    private readonly prisma: PrismaService,
  ) {}

  private async getEnseignementIdsForRead(context: AuthContext): Promise<string[] | null> {
    if (context.role === Role.SCOLARITE) return null;
    if (context.role !== Role.RESPONSABLE_MENTION) {
      throw new ForbiddenException('Consultation interdite.');
    }

    const mentionId = context.mentionId?.trim();
    const parcours = context.parcours?.trim();
    const cycles = [...new Set((context.cycles ?? []).map(c => c.trim().toUpperCase()))];

    if (!mentionId || !parcours || !cycles.length ||
        cycles.some(c => c !== 'LICENCE' && c !== 'MASTER')) {
      throw new ForbiddenException('Périmètre de mention incomplet.');
    }

    const rows = await this.prisma.enseignement.findMany({
      where: { mentionId, parcours, cycle: { in: cycles as Cycle[] } },
      select: { id: true },
    });
    return rows.map(row => row.id);
  }

  async findSessions(context: AuthContext) {
    const ids = await this.getEnseignementIdsForRead(context);
    if (ids === null) return this.sessions.find({ order: { dateDebut: 'DESC' } });
    if (!ids.length) return [];

    const examens = await this.examens.find({
      select: { sessionId: true },
      where: { enseignementId: In(ids) },
    });
    const sessionIds = [...new Set(examens.map(e => e.sessionId).filter(Boolean))];
    if (!sessionIds.length) return [];

    return this.sessions.find({
      where: { id: In(sessionIds) },
      order: { dateDebut: 'DESC' },
    });
  }
  createSession(dto: CreateSessionDto) {
    const session = this.sessions.create({ ...dto });
    return this.sessions.save(session);
  }

  async cloturerSession(id: string) {
    const session = await this.sessions.findOneBy({ id });

    if (!session) {
      throw new NotFoundException('Session introuvable');
    }

    session.estCloturee = true;

    return this.sessions.save(session);
  }

  // Examens

  async findExamens(sessionId: string | undefined, context: AuthContext) {
    const ids = await this.getEnseignementIdsForRead(context);
    const where: FindOptionsWhere<Examen> = sessionId ? { sessionId } : {};

    if (ids !== null) {
      if (!ids.length) return [];
      where.enseignementId = In(ids);
    }

    return this.examens.find({
      where,
      relations: { session: true },
      order: { dateExamen: 'ASC' },
    });
  }
  async createExamen(dto: CreateExamenDto) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
      select: { id: true },
    });

    if (!enseignement) {
      throw new NotFoundException('Enseignement introuvable.');
    }

    const examen = this.examens.create({
      ...dto,
      enseignementId: enseignement.id,
    });

    return this.examens.save(examen);
  }

  async changerStatut(
    id: string,
    statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE',
  ) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    // Progression autorisée : A_VENIR -> EN_COURS -> TERMINE.
    // Le passage direct A_VENIR -> TERMINE reste autorisé.
    // Aucun retour depuis TERMINE ou EN_COURS vers un statut antérieur.
    const transitionAutorisee =
      examen.statut === statut ||
      (examen.statut === 'A_VENIR' &&
        (statut === 'EN_COURS' || statut === 'TERMINE')) ||
      (examen.statut === 'EN_COURS' && statut === 'TERMINE');

    if (!transitionAutorisee) {
      throw new BadRequestException(
        `Transition de statut non autorisée : ${examen.statut} -> ${statut}`,
      );
    }

    examen.statut = statut;

    return this.examens.save(examen);
  }

  // Remise des notes : suivi du statut uniquement, sans gestion des notes individuelles

  async marquerNotesRemises(id: string) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    // La remise est interdite tant que l'examen n'est pas terminé.
    if (examen.statut !== 'TERMINE') {
      throw new BadRequestException(
        'Impossible de remettre des notes sur un examen non terminé',
      );
    }

    // Opération idempotente : ne pas modifier une remise déjà enregistrée.
    if (examen.notesRemises) {
      return examen;
    }

    examen.notesRemises = true;
    examen.dateRemiseNotes = new Date();

    return this.examens.save(examen);
  }

  // Alertes

  findAlertes(nonLues = false) {
    return this.alertes.find({
      where: nonLues ? { estLue: false } : {},
      relations: { examen: true },
      order: { createdAt: 'DESC' },
    });
  }

  createAlerte(dto: CreateAlerteDto) {
    const alerte = this.alertes.create({ ...dto });
    return this.alertes.save(alerte);
  }

  async marquerLue(id: string) {
    const alerte = await this.alertes.findOneBy({ id });

    if (!alerte) {
      throw new NotFoundException('Alerte introuvable');
    }

    alerte.estLue = true;

    return this.alertes.save(alerte);
  }

  async marquerTraitee(id: string) {
    const alerte = await this.alertes.findOneBy({ id });

    if (!alerte) {
      throw new NotFoundException('Alerte introuvable');
    }

    alerte.estTraitee = true;

    return this.alertes.save(alerte);
  }
}
