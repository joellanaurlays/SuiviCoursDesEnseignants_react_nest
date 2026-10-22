import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { Repository, UpdateResult } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateAlerteDto, CreateExamenDto, CreateSessionDto, UpdateStatutDto } from './dto/exams.dto.js';
import { Alerte } from './entities/alerte.entity.js';
import { Examen } from './entities/examen.entity.js';
import { SessionExamen } from './entities/session-examen.entity.js';
import { ExamsService } from './exams.service.js';

const validSession = {
  libelle: 'Session Normale S1',
  anneeUniversitaire: '2025-2026',
  semestre: 'S1',
  dateDebut: '2026-01-12',
  dateFin: '2026-01-24',
};

const validExam = {
  sessionId: 'bf2c8348-d886-4bd2-a5bb-73b38fb7f1f1',
  dateExamen: '2026-01-15',
  heureDebut: '08:00',
  heureFin: '10:00',
  salle: 'Salle A',
};

describe('ExamsService session validations', () => {
  const sessions = {
    create: vi.fn((value: Partial<SessionExamen>) => value as SessionExamen),
    save: vi.fn(async (value: SessionExamen) => value),
    findOneBy: vi.fn<Repository<SessionExamen>['findOneBy']>(),
  };
  const examens = {
    create: vi.fn((value: Partial<Examen>) => value as Examen),
    save: vi.fn(async (value: Examen) => value),
    find: vi.fn(async () => [] as Examen[]),
    findOneBy: vi.fn<Repository<Examen>['findOneBy']>(),
    update: vi.fn(async () => ({ affected: 1 } as UpdateResult)),
  };
  const alertes = {
    create: vi.fn((value: Partial<Alerte>) => value as Alerte),
    save: vi.fn(async (value: Alerte) => value),
    findOneBy: vi.fn<Repository<Alerte>['findOneBy']>(),
  };
  const service = new ExamsService(
    sessions as unknown as Repository<SessionExamen>,
    examens as unknown as Repository<Examen>,
    alertes as unknown as Repository<Alerte>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuse une période inversée avant tout accès au repository', () => {
    expect(() => service.createSession({ ...validSession, dateDebut: '2026-01-25' }))
      .toThrow(BadRequestException);
    expect(sessions.create).not.toHaveBeenCalled();
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('accepte une session dont les dates sont égales', async () => {
    const singleDaySession = { ...validSession, dateDebut: '2026-01-12', dateFin: '2026-01-12' };

    await expect(service.createSession(singleDaySession)).resolves.toMatchObject(singleDaySession);
    expect(sessions.create).toHaveBeenCalledWith(singleDaySession);
    expect(sessions.save).toHaveBeenCalledOnce();
  });

  it.each([
    { field: 'libelle' as const, maxLength: 150 },
    { field: 'anneeUniversitaire' as const, maxLength: 20 },
    { field: 'semestre' as const, maxLength: 10 },
  ])('valide le champ $field et sa limite de $maxLength caractères', async ({ field, maxLength }) => {
    for (const value of ['', '   ', '\t\n']) {
      const dto = Object.assign(new CreateSessionDto(), { ...validSession, [field]: value });
      expect((await validate(dto)).some((error) => error.property === field)).toBe(true);
    }

    const withinLimit = Object.assign(new CreateSessionDto(), {
      ...validSession,
      [field]: 'x'.repeat(maxLength),
    });
    expect((await validate(withinLimit)).some((error) => error.property === field)).toBe(false);

    const overLimit = Object.assign(new CreateSessionDto(), {
      ...validSession,
      [field]: 'x'.repeat(maxLength + 1),
    });
    expect((await validate(overLimit)).some((error) => error.property === field)).toBe(true);
  });

  it('refuse de clôturer une session inexistante sans sauvegarder', async () => {
    sessions.findOneBy.mockResolvedValue(null);

    await expect(service.cloturerSession('8f5b3d42-3a77-4a1f-9b1c-6e0f7c19d842'))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('clôture et sauvegarde une session existante et ouverte', async () => {
    const session = { id: 'session-id', estCloturee: false } as SessionExamen;
    sessions.findOneBy.mockResolvedValue(session);

    await expect(service.cloturerSession(session.id)).resolves.toBe(session);
    expect(session.estCloturee).toBe(true);
    expect(sessions.save).toHaveBeenCalledWith(session);
  });

  it('conserve la sauvegarde d’une clôture répétée', async () => {
    const alreadyClosedSession = { id: 'session-id', estCloturee: true } as SessionExamen;
    sessions.findOneBy.mockResolvedValue(alreadyClosedSession);

    await expect(service.cloturerSession(alreadyClosedSession.id)).resolves.toBe(alreadyClosedSession);
    expect(sessions.save).toHaveBeenCalledWith(alreadyClosedSession);
  });

  it.each(['25:00', '08:60', '8:00', '08:00:60', '24:00'])('rejette le format horaire invalide %s', async (time) => {
    const dto = Object.assign(new CreateExamenDto(), { ...validExam, heureDebut: time });
    expect((await validate(dto)).some((error) => error.property === 'heureDebut')).toBe(true);
  });

  it.each(['08:00', '08:00:00'])('accepte le format horaire %s employé par le frontend ou PostgreSQL', async (time) => {
    const dto = Object.assign(new CreateExamenDto(), { ...validExam, heureDebut: time });
    expect((await validate(dto)).some((error) => error.property === 'heureDebut')).toBe(false);
  });

  it.each(['A_VENIR', 'EN_COURS', 'TERMINE'])('valide le statut existant %s', async (statut) => {
    const dto = Object.assign(new UpdateStatutDto(), { statut });
    expect((await validate(dto)).some((error) => error.property === 'statut')).toBe(false);
  });

  it('rejette les statuts hors des valeurs existantes', async () => {
    const dto = Object.assign(new UpdateStatutDto(), { statut: 'ANNULE' });
    expect((await validate(dto)).some((error) => error.property === 'statut')).toBe(true);
  });

  it.each(['10:00', '09:59'])('refuse une heure de fin égale ou antérieure à l’heure de début (%s)', async (heureFin) => {
    await expect(service.createExamen({ ...validExam, heureDebut: '10:00', heureFin })).rejects.toBeInstanceOf(BadRequestException);
    expect(sessions.findOneBy).not.toHaveBeenCalled();
    expect(examens.save).not.toHaveBeenCalled();
  });

  it('refuse un examen dont la session n’existe pas', async () => {
    sessions.findOneBy.mockResolvedValue(null);

    await expect(service.createExamen(validExam)).rejects.toBeInstanceOf(NotFoundException);
    expect(examens.save).not.toHaveBeenCalled();
  });

  it('refuse la création dans une session clôturée', async () => {
    sessions.findOneBy.mockResolvedValue({ id: validExam.sessionId, estCloturee: true } as SessionExamen);

    await expect(service.createExamen(validExam)).rejects.toBeInstanceOf(BadRequestException);
    expect(examens.find).not.toHaveBeenCalled();
    expect(examens.save).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'avant la période', dateExamen: '2026-01-11', allowed: false },
    { label: 'à la date de début', dateExamen: '2026-01-12', allowed: true },
    { label: 'dans la période', dateExamen: '2026-01-18', allowed: true },
    { label: 'à la date de fin', dateExamen: '2026-01-24', allowed: true },
    { label: 'après la période', dateExamen: '2026-01-25', allowed: false },
  ])('contrôle la date de l’examen $label', async ({ dateExamen, allowed }) => {
    sessions.findOneBy.mockResolvedValue({
      id: validExam.sessionId,
      dateDebut: validSession.dateDebut,
      dateFin: validSession.dateFin,
      estCloturee: false,
    } as SessionExamen);
    const dto = { ...validExam, dateExamen };

    if (allowed) {
      await expect(service.createExamen(dto)).resolves.toMatchObject(dto);
      expect(examens.save).toHaveBeenCalledOnce();
    } else {
      await expect(service.createExamen(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(examens.create).not.toHaveBeenCalled();
      expect(examens.save).not.toHaveBeenCalled();
    }
  });

  it.each([
    { name: 'chevauchement dans la même salle', date: '2026-01-15', start: '09:00', end: '11:00', salle: 'salle a', conflict: true },
    { name: 'horaires qui se suivent', date: '2026-01-15', start: '10:00', end: '12:00', salle: 'Salle A', conflict: false },
    { name: 'salles différentes', date: '2026-01-15', start: '09:00', end: '11:00', salle: 'Salle B', conflict: false },
    { name: 'dates différentes', date: '2026-01-16', start: '09:00', end: '11:00', salle: 'Salle A', conflict: false },
  ])('contrôle les conflits de salle : $name', async ({ date, start, end, salle, conflict }) => {
    sessions.findOneBy.mockResolvedValue({
      id: validExam.sessionId,
      dateDebut: validSession.dateDebut,
      dateFin: validSession.dateFin,
      estCloturee: false,
    } as SessionExamen);
    examens.find.mockResolvedValue([{
      id: 'existing-exam',
      dateExamen: '2026-01-15',
      heureDebut: '08:00:00',
      heureFin: '10:00:00',
      salle: 'Salle A',
    } as Examen]);
    const dto = { ...validExam, dateExamen: date, heureDebut: start, heureFin: end, salle };

    if (conflict) {
      await expect(service.createExamen(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(examens.save).not.toHaveBeenCalled();
    } else {
      await expect(service.createExamen(dto)).resolves.toMatchObject(dto);
      expect(examens.save).toHaveBeenCalledOnce();
    }
  });

  it('permet une création valide sans informations suffisantes pour tester un conflit de salle', async () => {
    sessions.findOneBy.mockResolvedValue({
      id: validExam.sessionId,
      dateDebut: validSession.dateDebut,
      dateFin: validSession.dateFin,
      estCloturee: false,
    } as SessionExamen);
    const dto = { ...validExam, salle: '', heureFin: undefined };

    await expect(service.createExamen(dto)).resolves.toMatchObject(dto);
    expect(examens.find).not.toHaveBeenCalled();
    expect(examens.save).toHaveBeenCalledOnce();
  });

  it('remet les notes d’un examen terminé et enregistre la date de la remise', async () => {
    const exam = { id: 'exam-id', statut: 'TERMINE', notesRemises: false } as Examen;
    const submittedAt = new Date('2026-10-22T10:00:00.000Z');
    examens.findOneBy.mockResolvedValue(exam);
    vi.useFakeTimers();
    vi.setSystemTime(submittedAt);

    try {
      await expect(service.marquerNotesRemises(exam.id)).resolves.toBe(exam);
      expect(exam.notesRemises).toBe(true);
      expect(exam.dateRemiseNotes).toEqual(submittedAt);
      expect(examens.update).toHaveBeenCalledOnce();
      expect(examens.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: exam.id,
          statut: 'TERMINE',
          notesRemises: false,
          dateRemiseNotes: expect.any(Object),
        }),
        expect.objectContaining({ notesRemises: true, dateRemiseNotes: submittedAt }),
      );
      expect(examens.save).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('refuse une seconde remise avec HTTP 409 et conserve exactement la date initiale', async () => {
    const exam = { id: 'exam-id', statut: 'TERMINE', notesRemises: true } as Examen;
    const firstSubmission = new Date('2026-10-22T10:00:00.000Z');
    exam.dateRemiseNotes = firstSubmission;
    examens.findOneBy.mockResolvedValue(exam);

    const initialState = { notesRemises: exam.notesRemises, dateRemiseNotes: exam.dateRemiseNotes };
    const error = await service.marquerNotesRemises(exam.id).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getStatus()).toBe(409);
    expect((error as Error).message).toContain('déjà été remises');
    expect(exam.notesRemises).toBe(initialState.notesRemises);
    expect(exam.dateRemiseNotes).toBe(initialState.dateRemiseNotes);
    expect(examens.update).not.toHaveBeenCalled();
    expect(examens.save).not.toHaveBeenCalled();
  });

  it('refuse la seconde demande concurrente après la mise à jour atomique initiale', async () => {
    const initialRead = { id: 'exam-id', statut: 'TERMINE', notesRemises: false, dateRemiseNotes: null } as Examen;
    const firstSubmission = new Date('2026-10-22T10:00:00.000Z');
    const currentState = { id: 'exam-id', statut: 'TERMINE', notesRemises: true, dateRemiseNotes: firstSubmission } as Examen;
    examens.findOneBy.mockResolvedValueOnce(initialRead).mockResolvedValueOnce(currentState);
    examens.update.mockResolvedValueOnce({ affected: 0 } as UpdateResult);

    await expect(service.marquerNotesRemises(initialRead.id)).rejects.toBeInstanceOf(ConflictException);
    expect(currentState.notesRemises).toBe(true);
    expect(currentState.dateRemiseNotes).toBe(firstSubmission);
    expect(examens.save).not.toHaveBeenCalled();
  });

  it.each(['A_VENIR', 'EN_COURS'])('refuse la remise des notes avec le statut %s', async (statut) => {
    const exam = { id: 'exam-id', statut, notesRemises: false, dateRemiseNotes: null } as Examen;
    const initialState = { notesRemises: exam.notesRemises, dateRemiseNotes: exam.dateRemiseNotes };
    examens.findOneBy.mockResolvedValueOnce(exam);

    await expect(service.marquerNotesRemises(exam.id)).rejects.toBeInstanceOf(BadRequestException);
    expect(exam.notesRemises).toBe(initialState.notesRemises);
    expect(exam.dateRemiseNotes).toBe(initialState.dateRemiseNotes);
    expect(examens.save).not.toHaveBeenCalled();
  });

  it('refuse la remise des notes pour un examen inexistant sans sauvegarde', async () => {
    examens.findOneBy.mockResolvedValueOnce(null);

    await expect(service.marquerNotesRemises('missing-exam')).rejects.toBeInstanceOf(NotFoundException);
    expect(examens.save).not.toHaveBeenCalled();
  });

  it.each([
    { from: 'A_VENIR', to: 'EN_COURS' },
    { from: 'EN_COURS', to: 'TERMINE' },
  ])('autorise la progression $from → $to', async ({ from, to }) => {
    const exam = { id: 'exam-id', statut: from, notesRemises: false, dateRemiseNotes: null } as Examen;
    examens.findOneBy.mockResolvedValueOnce(exam);

    await expect(service.changerStatut(exam.id, to as Examen['statut'])).resolves.toBe(exam);
    expect(exam.statut).toBe(to);
    expect(exam.notesRemises).toBe(false);
    expect(exam.dateRemiseNotes).toBeNull();
    expect(examens.save).toHaveBeenCalledWith(exam);
  });

  it.each([
    { from: 'EN_COURS', to: 'A_VENIR' },
    { from: 'TERMINE', to: 'EN_COURS' },
    { from: 'A_VENIR', to: 'TERMINE' },
  ])('refuse la transition $from → $to sans modifier l’examen', async ({ from, to }) => {
    const dateRemiseNotes = from === 'TERMINE' ? new Date('2026-10-20T10:00:00.000Z') : null;
    const exam = { id: 'exam-id', statut: from, notesRemises: from === 'TERMINE', dateRemiseNotes } as Examen;
    const initialState = {
      statut: exam.statut,
      notesRemises: exam.notesRemises,
      dateRemiseNotes: exam.dateRemiseNotes,
    };
    examens.findOneBy.mockResolvedValueOnce(exam);

    await expect(service.changerStatut(exam.id, to as Examen['statut'])).rejects.toBeInstanceOf(BadRequestException);
    expect(exam.statut).toBe(initialState.statut);
    expect(exam.notesRemises).toBe(initialState.notesRemises);
    expect(exam.dateRemiseNotes).toBe(initialState.dateRemiseNotes);
    expect(examens.save).not.toHaveBeenCalled();
  });

  it.each(['A_VENIR', 'EN_COURS', 'TERMINE'])('traite la répétition de %s comme un no-op explicite', async (statut) => {
    const dateRemiseNotes = statut === 'TERMINE' ? new Date('2026-10-20T10:00:00.000Z') : null;
    const exam = { id: 'exam-id', statut, notesRemises: statut === 'TERMINE', dateRemiseNotes } as Examen;
    examens.findOneBy.mockResolvedValueOnce(exam);

    await expect(service.changerStatut(exam.id, statut as Examen['statut'])).resolves.toBe(exam);
    expect(exam.statut).toBe(statut);
    expect(exam.notesRemises).toBe(statut === 'TERMINE');
    expect(exam.dateRemiseNotes).toBe(dateRemiseNotes);
    expect(examens.save).not.toHaveBeenCalled();
  });

  it.each(['NOTES_NON_REMISES', 'MISSING_DOCUMENTS', 'EN_COURS', 'A_VENIR'])('accepte le type d’alerte %s', async (typeAlerte) => {
    const dto = Object.assign(new CreateAlerteDto(), { typeAlerte, message: 'Alerte de test' });
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each(['AUTRE', '', '   ', 'X'.repeat(51)])('refuse le type d’alerte invalide %j', async (typeAlerte) => {
    const dto = Object.assign(new CreateAlerteDto(), { typeAlerte, message: 'Alerte de test' });
    expect((await validate(dto)).some((error) => error.property === 'typeAlerte')).toBe(true);
  });

  it('refuse une alerte du même type déjà liée au même examen avec HTTP 409', async () => {
    const examId = 'bf2c8348-d886-4bd2-a5bb-73b38fb7f1f1';
    examens.findOneBy.mockResolvedValueOnce({ id: examId } as Examen);
    alertes.findOneBy.mockResolvedValueOnce({ examenId: examId, typeAlerte: 'EN_COURS' } as Alerte);

    await expect(service.createAlerte({ examenId: examId, typeAlerte: 'EN_COURS', message: 'Alerte' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(alertes.create).not.toHaveBeenCalled();
    expect(alertes.save).not.toHaveBeenCalled();
  });

  it('autorise deux types différents pour le même examen', async () => {
    const examId = 'bf2c8348-d886-4bd2-a5bb-73b38fb7f1f1';
    examens.findOneBy.mockResolvedValue({ id: examId } as Examen);
    alertes.findOneBy.mockResolvedValue(null);

    await service.createAlerte({ examenId: examId, typeAlerte: 'EN_COURS', message: 'En cours' });
    await service.createAlerte({ examenId: examId, typeAlerte: 'A_VENIR', message: 'À venir' });

    expect(alertes.save).toHaveBeenCalledTimes(2);
  });

  it('autorise le même type pour deux examens différents', async () => {
    const firstExamId = '8f5b3d42-3a77-4a1f-9b1c-6e0f7c19d842';
    const secondExamId = 'bf2c8348-d886-4bd2-a5bb-73b38fb7f1f1';
    examens.findOneBy
      .mockResolvedValueOnce({ id: firstExamId } as Examen)
      .mockResolvedValueOnce({ id: secondExamId } as Examen);
    alertes.findOneBy.mockResolvedValue(null);

    await service.createAlerte({ examenId: firstExamId, typeAlerte: 'EN_COURS', message: 'Premier' });
    await service.createAlerte({ examenId: secondExamId, typeAlerte: 'EN_COURS', message: 'Second' });

    expect(alertes.save).toHaveBeenCalledTimes(2);
  });

  it('autorise plusieurs alertes sans examen associé sans rechercher d’examen ni de doublon', async () => {
    const dto = { typeAlerte: 'EN_COURS', message: 'Alerte sans examen' };

    await service.createAlerte(dto);
    await service.createAlerte(dto);

    expect(examens.findOneBy).not.toHaveBeenCalled();
    expect(alertes.findOneBy).not.toHaveBeenCalled();
    expect(alertes.save).toHaveBeenCalledTimes(2);
  });

  it('refuse une alerte associée à un examen inexistant sans sauvegarder', async () => {
    examens.findOneBy.mockResolvedValueOnce(null);

    await expect(service.createAlerte({
      examenId: 'bf2c8348-d886-4bd2-a5bb-73b38fb7f1f1',
      typeAlerte: 'EN_COURS',
      message: 'Alerte',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(alertes.findOneBy).not.toHaveBeenCalled();
    expect(alertes.create).not.toHaveBeenCalled();
    expect(alertes.save).not.toHaveBeenCalled();
  });

  it('marque une alerte comme lue sans la traiter', async () => {
    const alerte = { id: 'alert-id', estLue: false, estTraitee: false } as Alerte;
    alertes.findOneBy.mockResolvedValueOnce(alerte);

    await expect(service.marquerLue(alerte.id)).resolves.toBe(alerte);
    expect(alerte.estLue).toBe(true);
    expect(alerte.estTraitee).toBe(false);
    expect(alertes.save).toHaveBeenCalledWith(alerte);
  });

  it('marque une alerte traitée comme traitée et lue', async () => {
    const alerte = { id: 'alert-id', estLue: false, estTraitee: false } as Alerte;
    alertes.findOneBy.mockResolvedValueOnce(alerte);

    await expect(service.marquerTraitee(alerte.id)).resolves.toBe(alerte);
    expect(alerte.estTraitee).toBe(true);
    expect(alerte.estLue).toBe(true);
    expect(alertes.save).toHaveBeenCalledWith(alerte);
  });

  it('renvoie NotFoundException si marquerLue cible une alerte absente', async () => {
    alertes.findOneBy.mockResolvedValueOnce(null);

    await expect(service.marquerLue('missing-alert')).rejects.toBeInstanceOf(NotFoundException);
    expect(alertes.save).not.toHaveBeenCalled();
  });

  it('renvoie NotFoundException si marquerTraitee cible une alerte absente', async () => {
    alertes.findOneBy.mockResolvedValueOnce(null);

    await expect(service.marquerTraitee('missing-alert')).rejects.toBeInstanceOf(NotFoundException);
    expect(alertes.save).not.toHaveBeenCalled();
  });

  it('conserve le comportement idempotent des actions répétées sans ajouter d’horodatage métier', async () => {
    const readAlert = { id: 'read-alert', estLue: true, estTraitee: false } as Alerte;
    const treatedAlert = { id: 'treated-alert', estLue: true, estTraitee: true } as Alerte;
    alertes.findOneBy
      .mockResolvedValueOnce(readAlert)
      .mockResolvedValueOnce(treatedAlert);

    await service.marquerLue(readAlert.id);
    await service.marquerTraitee(treatedAlert.id);

    expect(alertes.save).toHaveBeenCalledTimes(2);
    expect(readAlert).not.toHaveProperty('dateLecture');
    expect(treatedAlert).not.toHaveProperty('dateTraitement');
  });
});
