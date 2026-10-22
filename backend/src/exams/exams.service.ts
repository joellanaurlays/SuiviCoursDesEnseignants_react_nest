
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

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
    if (dto.dateFin.slice(0, 10) < dto.dateDebut.slice(0, 10)) {
      throw new BadRequestException('La date de fin doit être postérieure ou égale à la date de début.');
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

  // Examens

  findExamens(sessionId?: string) {
    return this.examens.find({
      where: sessionId ? { sessionId } : {},
      relations: { session: true },
      order: { dateExamen: 'ASC' },
    });
  }

  async createExamen(dto: CreateExamenDto) {
    if (dto.heureDebut && dto.heureFin && this.timeInSeconds(dto.heureFin) <= this.timeInSeconds(dto.heureDebut)) {
      throw new BadRequestException('L’heure de fin doit être postérieure à l’heure de début. Les examens ne peuvent pas traverser minuit.');
    }

    const session = await this.sessions.findOneBy({ id: dto.sessionId });
    if (!session) {
      throw new NotFoundException('Session introuvable');
    }
    if (session.estCloturee) {
      throw new BadRequestException('Impossible de planifier un examen dans une session clôturée.');
    }

    const examDate = dto.dateExamen.slice(0, 10);
    const sessionStart = session.dateDebut.slice(0, 10);
    const sessionEnd = session.dateFin.slice(0, 10);
    if (examDate < sessionStart || examDate > sessionEnd) {
      throw new BadRequestException('La date de l’examen doit être comprise dans la période de sa session.');
    }

    const roomKey = this.roomKey(dto.salle);
    if (roomKey && dto.heureDebut && dto.heureFin) {
      const examsOnDate = await this.examens.find({ where: { dateExamen: examDate } });
      const start = this.timeInSeconds(dto.heureDebut);
      const end = this.timeInSeconds(dto.heureFin);
      const conflicts = examsOnDate.some((existing) => {
        if (
          existing.dateExamen.slice(0, 10) !== examDate ||
          this.roomKey(existing.salle) !== roomKey ||
          !existing.heureDebut ||
          !existing.heureFin
        ) {
          return false;
        }

        const existingStart = this.timeInSeconds(existing.heureDebut);
        const existingEnd = this.timeInSeconds(existing.heureFin);
        return start < existingEnd && existingStart < end;
      });

      if (conflicts) {
        throw new BadRequestException('La salle est déjà occupée sur ce créneau horaire.');
      }
    }

    const examen = this.examens.create({ ...dto });
    return this.examens.save(examen);
  }

  private roomKey(room: string | null | undefined) {
    return room?.trim().toLocaleLowerCase('fr') ?? '';
  }

  private timeInSeconds(time: string) {
    const [hours, minutes, seconds = '0'] = time.split(':');
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }

  async changerStatut(
    id: string,
    statut: 'A_VENIR' | 'EN_COURS' | 'TERMINE',
  ) {
    const examen = await this.examens.findOneBy({ id });

    if (!examen) {
      throw new NotFoundException('Examen introuvable');
    }

    // Répéter le statut courant est une opération idempotente : aucun UPDATE.
    if (examen.statut === statut) {
      return examen;
    }

    const progression = ['A_VENIR', 'EN_COURS', 'TERMINE'];
    const currentIndex = progression.indexOf(examen.statut);
    const nextIndex = progression.indexOf(statut);
    if (currentIndex < 0 || nextIndex !== currentIndex + 1) {
      throw new BadRequestException(
        `Transition de statut refusée : progression attendue A_VENIR → EN_COURS → TERMINE (statut actuel : ${examen.statut}, demandé : ${statut}).`,
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
    if (examen.notesRemises || examen.dateRemiseNotes) {
      throw new ConflictException('Les notes de cet examen ont déjà été remises. La date de remise initiale est conservée.');
    }
    if (examen.statut !== 'TERMINE') {
      throw new BadRequestException('Les notes ne peuvent être remises que pour un examen terminé.');
    }

    const dateRemiseNotes = new Date();
    const result = await this.examens.update(
      {
        id,
        statut: 'TERMINE',
        notesRemises: false,
        dateRemiseNotes: IsNull(),
      },
      { notesRemises: true, dateRemiseNotes },
    );

    // L'UPDATE conditionnel rend la première remise gagnante, même si deux
    // demandes arrivent simultanément. Aucune date déjà enregistrée n'est écrasée.
    if (!result.affected) {
      const current = await this.examens.findOneBy({ id });
      if (!current) {
        throw new NotFoundException('Examen introuvable');
      }
      if (current.notesRemises || current.dateRemiseNotes) {
        throw new ConflictException('Les notes de cet examen ont déjà été remises. La date de remise initiale est conservée.');
      }
      if (current.statut !== 'TERMINE') {
        throw new BadRequestException('Les notes ne peuvent être remises que pour un examen terminé.');
      }
      throw new ConflictException('L’examen a été modifié pendant la remise des notes. Actualisez les données puis réessayez.');
    }

    examen.notesRemises = true;
    examen.dateRemiseNotes = dateRemiseNotes;

    const updated = await this.examens.findOneBy({ id });
    if (!updated) {
      throw new NotFoundException('Examen introuvable');
    }
    return updated;
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
    return this.createAlerteValidated(dto);
  }

  private async createAlerteValidated(dto: CreateAlerteDto) {
    if (dto.examenId) {
      const examen = await this.examens.findOneBy({ id: dto.examenId });
      if (!examen) {
        throw new NotFoundException('Examen associé introuvable');
      }

      const duplicate = await this.alertes.findOneBy({
        examenId: dto.examenId,
        typeAlerte: dto.typeAlerte,
      });
      if (duplicate) {
        throw new ConflictException('Une alerte de ce type existe déjà pour cet examen.');
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
