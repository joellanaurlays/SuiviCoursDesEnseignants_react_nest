import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionExamen } from './entities/session-examen.entity.js';
import { Examen } from './entities/examen.entity.js';
import { Alerte } from './entities/alerte.entity.js';
import { CreateSessionDto, CreateExamenDto, CreateAlerteDto } from './dto/exams.dto.js';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(SessionExamen) private sessions: Repository<SessionExamen>,
    @InjectRepository(Examen) private examens: Repository<Examen>,
    @InjectRepository(Alerte) private alertes: Repository<Alerte>,
  ) {}

  // T26 — Sessions
  findSessions() { return this.sessions.find({ order: { dateDebut: 'DESC' } }); }
  createSession(dto: CreateSessionDto) {
    const s = this.sessions.create({ ...dto });
    return this.sessions.save(s);
  }
  async cloturerSession(id: string) {
    const s = await this.sessions.findOneBy({ id });
    if (!s) throw new NotFoundException('Session introuvable');
    s.estCloturee = true;
    return this.sessions.save(s);
  }

  // T27/T28 — Examens
  findExamens(sessionId?: string) {
    return this.examens.find({
      where: sessionId ? { sessionId } : {},
      relations: { session: true },
      order: { dateExamen: 'ASC' },
    });
  }
  createExamen(dto: CreateExamenDto) {
    const e = this.examens.create({ ...dto });
    return this.examens.save(e);
  }
  async changerStatut(id: string, statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE') {
    const e = await this.examens.findOneBy({ id });
    if (!e) throw new NotFoundException('Examen introuvable');
    e.statut = statut;
    return this.examens.save(e);
  }
  // T29 — Remise des notes (boolean uniquement, pas de notes individuelles)
  async marquerNotesRemises(id: string) {
    const e = await this.examens.findOneBy({ id });
    if (!e) throw new NotFoundException('Examen introuvable');
    e.notesRemises = true;
    e.dateRemiseNotes = new Date();
    return this.examens.save(e);
  }

  // T30 — Alertes
  findAlertes(nonLues = false) {
    return this.alertes.find({
      where: nonLues ? { estLue: false } : {},
      relations: { examen: true },
      order: { createdAt: 'DESC' },
    });
  }
  createAlerte(dto: CreateAlerteDto) {
    const a = this.alertes.create({ ...dto });
    return this.alertes.save(a);
  }
  async marquerLue(id: string) {
    const a = await this.alertes.findOneBy({ id });
    if (!a) throw new NotFoundException('Alerte introuvable');
    a.estLue = true;
    return this.alertes.save(a);
  }
  async marquerTraitee(id: string) {
    const a = await this.alertes.findOneBy({ id });
    if (!a) throw new NotFoundException('Alerte introuvable');
    a.estTraitee = true;
    return this.alertes.save(a);
  }
}
