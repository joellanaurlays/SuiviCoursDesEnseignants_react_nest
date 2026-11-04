import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ExamsService } from './exams.service.js';
import { Role } from '../auth/roles.enum.js';
import { CreateExamenDto } from './dto/exams.dto.js';

function setup(ids: string[] = ['ens-1']) {
  const sessionsFind = vi.fn().mockResolvedValue([]);
  const examensFind = vi.fn().mockResolvedValue([{ id: 'exam-1' }]);
  const examensCreate = vi.fn((value) => value);
  const examensSave = vi.fn().mockImplementation(async (value) => value);
  const enseignementsFind = vi.fn().mockResolvedValue(ids.map(id => ({ id })));
  const enseignementsFindUnique = vi.fn().mockResolvedValue({ id: 'ens-1' });

  const service = new ExamsService(
    { find: sessionsFind } as never,
    { find: examensFind, create: examensCreate, save: examensSave } as never,
    {} as never,
    { enseignement: { findMany: enseignementsFind, findUnique: enseignementsFindUnique } } as never,
  );

  return { service, sessionsFind, examensFind, enseignementsFind, enseignementsFindUnique, examensCreate, examensSave };
}

describe('ExamsService - createExamen', () => {
  const dto: CreateExamenDto = {
    sessionId: 'session-1',
    enseignementId: 'ens-1',
    dateExamen: '2026-10-30',
  };

  it('vérifie et conserve le rattachement à un enseignement existant', async () => {
    const { service, enseignementsFindUnique, examensCreate, examensSave } = setup();

    await service.createExamen(dto);

    expect(enseignementsFindUnique).toHaveBeenCalledWith({
      where: { id: 'ens-1' },
      select: { id: true },
    });
    expect(examensCreate).toHaveBeenCalledWith(dto);
    expect(examensSave).toHaveBeenCalledOnce();
  });

  it('refuse la création si l’enseignement est introuvable', async () => {
    const { service, enseignementsFindUnique, examensSave } = setup();
    enseignementsFindUnique.mockResolvedValue(null);

    await expect(service.createExamen(dto)).rejects.toBeInstanceOf(NotFoundException);

    expect(examensSave).not.toHaveBeenCalled();
  });
});
const responsable = {
  userId: '3',
  role: Role.RESPONSABLE_MENTION,
  mentionId: 'INFORMATIQUE',
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};

describe('ExamsService — périmètre responsable', () => {
  it('filtre les examens par mention, cycle et parcours', async () => {
    const { service, examensFind, enseignementsFind } = setup();

    await service.findExamens(undefined, responsable);

    expect(enseignementsFind).toHaveBeenCalledWith({
      where: {
        mentionId: 'INFORMATIQUE',
        parcours: 'Informatique',
        cycle: { in: ['LICENCE'] },
      },
      select: { id: true },
    });
    expect(examensFind).toHaveBeenCalledOnce();
    expect(examensFind.mock.calls[0][0].where.enseignementId).toBeDefined();
  });

  it('refuse un responsable sans mention', async () => {
    const { service, enseignementsFind } = setup();

    await expect(
      service.findExamens(undefined, { ...responsable, mentionId: undefined }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(enseignementsFind).not.toHaveBeenCalled();
  });

  it('ne retourne aucun examen si aucun enseignement ne correspond', async () => {
    const { service, examensFind } = setup([]);
    const result = await service.findExamens(undefined, responsable);

    expect(result).toEqual([]);
    expect(examensFind).not.toHaveBeenCalled();
  });

  it('ne filtre pas les données globales de la scolarité par Prisma', async () => {
    const { service, examensFind, enseignementsFind } = setup();

    await service.findExamens(undefined, {
      userId: '1',
      role: Role.SCOLARITE,
    });

    expect(enseignementsFind).not.toHaveBeenCalled();
    expect(examensFind.mock.calls[0][0].where).toEqual({});
  });

  it('limite les sessions aux examens autorisés', async () => {
    const { service, sessionsFind, examensFind } = setup();

    examensFind.mockResolvedValue([{ sessionId: 'session-1' }]);

    await service.findSessions(responsable);

    expect(sessionsFind).toHaveBeenCalledOnce();
    expect(sessionsFind.mock.calls[0][0].where.id).toBeDefined();
  });
});
