import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cycle } from '@prisma/client';
import {
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
} from 'typeorm';

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

const ALERT_TYPES = [
  'NOTES_NON_REMISES',
  'MISSING_DOCUMENTS',
  'EN_COURS',
  'A_VENIR',
] as const;

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

  /**
   * Retourne les identifiants des enseignements accessibles.
   * null signifie une consultation globale en lecture.
   */
  private async getEnseignementIdsForRead(
    context: AuthContext,
  ): Promise<string[] | null> {
    if (
      context.role === Role.SCOLARITE ||
      context.role === Role.ADMINISTRATEUR
    ) {
      return null;
    }

    if (context.role === Role.ENSEIGNANT) {
      const userId = context.userId?.trim();

      if (!userId) {
        throw new ForbiddenException('Identité enseignant manquante.');
      }

      const rows = await this.prisma.enseignement.findMany({
        where: { enseignantId: userId },
        select: { id: true },
      });

      return rows.map(row => row.id);
    }

    if (context.role !== Role.RESPONSABLE_MENTION) {
      throw new ForbiddenException('Consultation interdite.');
    }

    const mentionId = context.mentionId?.trim();
    const parcours = context.parcours?.trim();
    const cycles = [
      ...new Set(
        (context.cycles ?? []).map(c => c.trim().toUpperCase()),
      ),
    ];

    if (
      !mentionId ||
      !parcours ||
      !cycles.length ||
      cycles.some(c => c !== 'LICENCE' && c !== 'MASTER')
    ) {
      throw new ForbiddenException('Périmètre de mention incomplet.');
    }

    const rows = await this.prisma.enseignement.findMany({
      where: {
        mentionId,
        parcours,
        cycle: { in: cycles as Cycle[] },
      },
      select: { id: true },
    });

    return rows.map(row => row.id);
  }

  // T26 — Sessions

  async findSessions(context: AuthContext) {
    const ids = await this.getEnseignementIdsForRead(context);

    if (ids === null) {
      return this.sessions.find({
        order: { dateDebut: 'DESC' },
      });
    }

    if (!ids.length) return [];

    const examens = await this.examens.find({
      select: { sessionId: true },
      where: { enseignementId: In(ids) },
    });

    const sessionIds = [
      ...new Set(examens.map(e => e.sessionId).filter(Boolean)),
    ];

    if (!sessionIds.length) return [];

    return this.sessions.find({
      where: { id: In(sessionIds) },
      order: { dateDebut: 'DESC' },
    });
  }

  createSession(dto: CreateSessionDto) {
    if (
      dto.dateFin.slice(0, 10) <
      dto.dateDebut.slice(0, 10)
    ) {
      throw new BadRequestException(
        'La date de fin doit être postérieure ou égale à la date de début.',
      );
    }

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

  // T27/T28 — Examens

  async findExamens(
    sessionId: string | undefined,
    context: AuthContext,
  ) {
    const ids = await this.getEnseignementIdsForRead(context);

    const where: FindOptionsWhere<Examen> =
      sessionId ? { sessionId } : {};

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
    if (!dto.enseignementId?.trim()) {
      throw new BadRequestException(
        'Un enseignement valide est obligatoire.',
      );
    }

    // Vérification du véritable identifiant CUID dans Prisma.
    // Validation du créneau horaire.
    if (
      dto.heureDebut &&
      dto.heureFin &&
      this.timeInSeconds(dto.heureFin) <=
        this.timeInSeconds(dto.heureDebut)
    ) {
      throw new BadRequestException(
        'L’heure de fin doit être postérieure à l’heure de début. Les examens ne peuvent pas traverser minuit.',
      );
    }

    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: dto.enseignementId },
      select: { id: true },
    });

    if (!enseignement) {
      throw new NotFoundException('Enseignement introuvable.');
    }

    // Vérification de la session.
    const session = await this.sessions.findOneBy({
      id: dto.sessionId,
    });

    if (!session) {
      throw new NotFoundException('Session introuvable');
    }

    if (session.estCloturee) {
      throw new BadRequestException(
        'Impossible de planifier un examen dans une session clôturée.',
      );
    }

    const examDate = dto.dateExamen.slice(0, 10);
    const sessionStart = session.dateDebut.slice(0, 10);
    const sessionEnd = session.dateFin.slice(0, 10);

    if (examDate < sessionStart || examDate > sessionEnd) {
      throw new BadRequestException(
        'La date de l’examen doit être comprise dans la période de sa session.',
      );
    }

    // Détection des chevauchements dans une même salle.
    const roomKey = this.roomKey(dto.salle);

    if (roomKey && dto.heureDebut && dto.heureFin) {
      const examsOnDate = await this.examens.find({
        where: { dateExamen: examDate },
      });

      const start = this.timeInSeconds(dto.heureDebut);
      const end = this.timeInSeconds(dto.heureFin);

      const conflict = examsOnDate.some(existing => {
        if (
          existing.dateExamen.slice(0, 10) !== examDate ||
          this.roomKey(existing.salle) !== roomKey ||
          !existing.heureDebut ||
          !existing.heureFin
        ) {
          return false;
        }

        const existingStart = this.timeInSeconds(
          existing.heureDebut,
        );
        const existingEnd = this.timeInSeconds(
          existing.heureFin,
        );

        return start < existingEnd && existingStart < end;
      });

      if (conflict) {
        throw new ConflictException(
          'La salle est déjà occupée sur ce créneau horaire.',
        );
      }
    }

    const examen = this.examens.create({
      ...dto,
      enseignementId: enseignement.id,
    });

    return this.examens.save(examen);
  }

  private roomKey(room: string | null | undefined): string {
    return room?.trim().toLocaleLowerCase('fr') ?? '';
  }

  private timeInSeconds(time: string): number {
    const [hours, minutes, seconds = '0'] = time.split(':');

    return (
      Number(hours) * 3600 +
      Number(minutes) * 60 +
      Number(seconds)
    );
  }

  async changerStatut(
    id: string,
    statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE',
  ) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    // Répéter le statut courant est une opération sans modification.
    if (examen.statut === statut) {
      return examen;
    }

    // Progression stricte : A_VENIR -> EN_COURS -> TERMINE.
    const progression = ['A_VENIR', 'EN_COURS', 'TERMINE'];
    const currentIndex = progression.indexOf(examen.statut);
    const nextIndex = progression.indexOf(statut);

    if (currentIndex < 0 || nextIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Transition de statut refusée : ${examen.statut} -> ${statut}.`,
      );
    }

    examen.statut = statut;
    return this.examens.save(examen);
  }

  // T29 — Remise des notes

  async marquerNotesRemises(id: string) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    if (examen.notesRemises || examen.dateRemiseNotes) {
      throw new ConflictException(
        'Les notes de cet examen ont déjà été remises. La date initiale est conservée.',
      );
    }

    if (examen.statut !== 'TERMINE') {
      throw new BadRequestException(
        'Les notes ne peuvent être remises que pour un examen terminé.',
      );
    }

    const dateRemiseNotes = new Date();

    // UPDATE conditionnel : protège contre deux remises simultanées.
    const result = await this.examens.update(
      {
        id,
        statut: 'TERMINE',
        notesRemises: false,
        dateRemiseNotes: IsNull(),
      },
      {
        notesRemises: true,
        dateRemiseNotes,
      },
    );

    if (!result.affected) {
      const current = await this.examens.findOneBy({ id });

      if (!current) {
        throw new NotFoundException('Examen introuvable');
      }

      if (current.notesRemises || current.dateRemiseNotes) {
        throw new ConflictException(
          'Les notes de cet examen ont déjà été remises. La date initiale est conservée.',
        );
      }

      if (current.statut !== 'TERMINE') {
        throw new BadRequestException(
          'Les notes ne peuvent être remises que pour un examen terminé.',
        );
      }

      throw new ConflictException(
        'L’examen a été modifié pendant la remise des notes. Actualisez les données.',
      );
    }

    const updated = await this.examens.findOneBy({ id });

    if (!updated) {
      throw new NotFoundException('Examen introuvable');
    }

    return updated;
  }

  // T30 — Alertes

  findAlertes(nonLues = false) {
    return this.alertes.find({
      where: nonLues ? { estLue: false } : {},
      relations: { examen: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createAlerte(dto: CreateAlerteDto) {
    if (!(ALERT_TYPES as readonly string[]).includes(dto.typeAlerte)) {
      throw new BadRequestException('Type d’alerte invalide.');
    }

    if (dto.examenId) {
      const examen = await this.examens.findOneBy({
        id: dto.examenId,
      });

      if (!examen) {
        throw new NotFoundException('Examen associé introuvable');
      }

      const duplicate = await this.alertes.findOneBy({
        examenId: dto.examenId,
        typeAlerte: dto.typeAlerte,
      });

      if (duplicate) {
        throw new ConflictException(
          'Une alerte de ce type existe déjà pour cet examen.',
        );
      }
    }

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
    alerte.estLue = true;

    return this.alertes.save(alerte);
  }
}
