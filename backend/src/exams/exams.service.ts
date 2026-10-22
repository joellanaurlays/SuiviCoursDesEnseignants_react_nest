
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
  ) {}

  // Sessions d'examen

  findSessions() {
    return this.sessions.find({
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

  findExamens(sessionId?: string) {
    return this.examens.find({
      where: sessionId ? { sessionId } : {},
      relations: { session: true },
      order: { dateExamen: 'ASC' },
    });
  }

  createExamen(dto: CreateExamenDto) {
    const examen = this.examens.create({ ...dto });
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

    examen.statut = statut;

    return this.examens.save(examen);
  }

  // Remise des notes : suivi du statut uniquement, sans gestion des notes individuelles

  async marquerNotesRemises(id: string) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
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
