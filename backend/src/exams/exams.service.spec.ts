import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ExamsService } from './exams.service.js';
import { Role } from '../auth/roles.enum.js';
import { CreateExamenDto } from './dto/exams.dto.js';

function setup(ids: string[] = ['ens-1']) {
  const sessionsFind = vi.fn().mockResolvedValue([]);
  const sessionsFindOneBy = vi.fn().mockResolvedValue({ id: 'session-1', estCloturee: false, dateDebut: '2026-01-01', dateFin: '2026-12-31' });
  const examensFind = vi.fn().mockResolvedValue([{ id: 'exam-1' }]);
  const examensFindOneBy = vi.fn().mockResolvedValue({ id: 'exam-1', enseignementId: 'ens-1', dateExamen: '2026-10-30', salle: 'A1' });
  const examensCreate = vi.fn((value) => value);
  const examensSave = vi.fn().mockImplementation(async (value) => value);
  const enseignementsFind = vi.fn().mockResolvedValue(ids.map(id => ({ id })));
  const enseignementsFindUnique = vi.fn().mockResolvedValue({ id: 'ens-1' });
  const alertesFind = vi.fn().mockResolvedValue([]);
  const messagesFind = vi.fn().mockResolvedValue([]);
  const messagesFindOne = vi.fn().mockResolvedValue(null);
  const messagesFindOneBy = vi.fn().mockResolvedValue(null);
  const messagesCreate = vi.fn((value) => value);
  const messagesSave = vi.fn().mockImplementation(async (value) => value);
  const messagesCount = vi.fn().mockResolvedValue(0);
  const usersFindMany = vi.fn().mockResolvedValue([{ id: 2, role: { name: 'CHEF_SCOLARITE' } }]);
  const usersFindFirst = vi.fn().mockResolvedValue({ id: 5 });
  const usersFindUnique = vi.fn().mockImplementation((args: any) => {
    const id = args?.where?.id;
    if (id === 5) return Promise.resolve({ role: { name: 'ENSEIGNANT' } });
    return Promise.resolve({ role: { name: 'CHEF_SCOLARITE' } });
  });

  const service = new ExamsService(
    { find: sessionsFind, findOneBy: sessionsFindOneBy } as never,
    { find: examensFind, findOneBy: examensFindOneBy, create: examensCreate, save: examensSave } as never,
    { find: alertesFind } as never,
    { find: messagesFind, findOne: messagesFindOne, findOneBy: messagesFindOneBy, create: messagesCreate, save: messagesSave, count: messagesCount } as never,
    { enseignement: { findMany: enseignementsFind, findUnique: enseignementsFindUnique }, user: { findFirst: usersFindFirst, findMany: usersFindMany, findUnique: usersFindUnique } } as never,
  );

  return { service, sessionsFind, sessionsFindOneBy, examensFind, examensFindOneBy, enseignementsFind, enseignementsFindUnique, examensCreate, examensSave, alertesFind, messagesFind, messagesFindOne, messagesFindOneBy, messagesCreate, messagesSave, messagesCount, usersFindMany, usersFindFirst, usersFindUnique };
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
      select: { id: true, matiereId: true, enseignantId: true },
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
        mentionId: { equals: 'INFORMATIQUE', mode: 'insensitive' },
        parcours: { in: ['Informatique', 'DA2I', 'Science des donnees'] },
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

const scolariteContext = { userId: '5', role: Role.ENSEIGNANT } as const;

describe('ExamsService - messagerie', () => {
  const dtoExamen = 'exam-1';
  const enseignementRakoto = { id: 'ens-1', enseignantId: 'Professeur Rakoto', matiereId: 'Algebre' };

  function setupMsg(scolariteUsers: { id: number }[] = [{ id: 2 }]) {
    const ctx = setup();
    ctx.enseignementsFindUnique.mockResolvedValue(enseignementRakoto);
    ctx.usersFindMany.mockResolvedValue(scolariteUsers);
    ctx.usersFindFirst.mockResolvedValue({ id: 5 });
    return ctx;
  }

  it('1. une réponse enseignant est adressée à l\'expéditeur réel du dernier rappel Scolarité', async () => {
    const { service, messagesFindOne, messagesCreate } = setupMsg();
    messagesFindOne.mockResolvedValue({ id: 'msg-1', examenId: dtoExamen, expediteurId: 2, contenu: 'rappel', createdAt: new Date() });

    const created = await service.creerMessage(dtoExamen, 'Merci', { userId: '5', role: Role.ENSEIGNANT } as any);

    expect(messagesFindOne).toHaveBeenCalled();
    expect(messagesCreate).toHaveBeenCalled();
    expect((created as any).destinataireId).toBe(2);
  });

  it('2. plusieurs comptes Scolarité : la réponse revient au bon expéditeur', async () => {
    const { service, messagesFindOne, messagesCreate } = setupMsg([{ id: 2 }, { id: 99 }]);
    messagesFindOne.mockResolvedValue({ id: 'msg-2', examenId: dtoExamen, expediteurId: 99, contenu: 'rappel', createdAt: new Date() });

    const created = await service.creerMessage(dtoExamen, 'Merci', { userId: '5', role: Role.ENSEIGNANT } as any);

    expect((created as any).destinataireId).toBe(99);
  });

  it('3. absence de rappel Scolarité : réponse refusée', async () => {
    const { service, messagesFindOne, messagesSave } = setupMsg();
    messagesFindOne.mockResolvedValue(null);

    await expect(service.creerMessage(dtoExamen, 'Merci', { userId: '5', role: Role.ENSEIGNANT } as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(messagesSave).not.toHaveBeenCalled();
  });

  it('4. un enseignant ne peut pas consulter la conversation d\'un autre', async () => {
    const { service, usersFindFirst } = setupMsg();
    usersFindFirst.mockResolvedValue({ id: 5 });

    await expect(service.listerMessages(dtoExamen, { userId: '999', role: Role.ENSEIGNANT } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('5. seul le destinataire peut marquer un message comme lu', async () => {
    const { service, messagesFindOneBy } = setupMsg();
    messagesFindOneBy.mockResolvedValue({ id: 'm1', destinataireId: 5, estLu: false });

    const res = await service.marquerLu('m1', { userId: '5', role: Role.ENSEIGNANT } as any);
    expect((res as any).estLu).toBe(true);

    messagesFindOneBy.mockResolvedValue({ id: 'm1', destinataireId: 5, estLu: false });
    await expect(service.marquerLu('m1', { userId: '2', role: Role.SCOLARITE } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('6. l\'historique conserve l\'ordre chronologique', async () => {
    const { service, messagesFind } = setupMsg();
    const ordered = [
      { id: 'a', createdAt: new Date('2026-01-01T10:00:00Z') },
      { id: 'b', createdAt: new Date('2026-01-01T11:00:00Z') },
    ];
    messagesFind.mockResolvedValue(ordered);

    const result = await service.listerMessages(dtoExamen, { userId: '2', role: Role.SCOLARITE } as any);
    expect(result.map((r: any) => r.id)).toEqual(['a', 'b']);
    expect(messagesFind).toHaveBeenCalledWith(expect.objectContaining({ order: { createdAt: 'ASC' } }));
  });

  it('7. envoi Scolarité → enseignant : destinataire résolu côté serveur', async () => {
    const { service, messagesCreate } = setupMsg();
    const created = await service.creerMessage(dtoExamen, 'Rappel notes', { userId: '2', role: Role.SCOLARITE } as any);
    expect(messagesCreate).toHaveBeenCalled();
    expect((created as any).destinataireId).toBe(5);
  });

  it('8. examen orphelin (sans enseignement) : erreur explicite', async () => {
    const { service, examensFindOneBy } = setupMsg();
    examensFindOneBy.mockResolvedValue({ id: 'exam-1', enseignementId: null, dateExamen: '2026-10-30', salle: 'A1' });
    await expect(service.creerMessage(dtoExamen, 'Rappel', { userId: '2', role: Role.SCOLARITE } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('9. enseignant sans compte : erreur explicite', async () => {
    const { service, usersFindFirst } = setupMsg();
    usersFindFirst.mockResolvedValue(null);
    await expect(service.creerMessage(dtoExamen, 'Rappel', { userId: '2', role: Role.SCOLARITE } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('10. accès non autorisé à l\'examen d\'un enseignant sans compte : 403 générique', async () => {
    const { service, enseignementsFindUnique, usersFindFirst } = setupMsg();
    enseignementsFindUnique.mockResolvedValue({ id: 'ens-andry', enseignantId: 'Professeur Andry', matiereId: 'Probabilites' });
    usersFindFirst.mockResolvedValue(null);
    await expect(service.listerMessages(dtoExamen, { userId: '5', role: Role.ENSEIGNANT } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

const responsableMention = {
  userId: '3',
  role: Role.RESPONSABLE_MENTION,
  mentionId: 'INFORMATIQUE',
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};

describe('ExamsService - alertes périmètre RESPONSABLE_MENTION', () => {
  it('filtre les alertes par mention/cycle/parcours (uniquement les examens du périmètre)', async () => {
    const { service, examensFind, alertesFind, enseignementsFind } = setup();
    enseignementsFind.mockResolvedValue([{ id: 'ens-info' }]);
    examensFind.mockResolvedValue([{ id: 'exam-info' }]);
    alertesFind.mockResolvedValue([{ id: 'alert-info', examenId: 'exam-info' }]);

    const result = await service.findAlertes(false, responsableMention as any);

    expect(result).toHaveLength(1);
    expect(alertesFind).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ examenId: expect.anything() }),
    }));
  });

  it('un Responsable de Mention ne voit jamais les alertes d\'une autre mention', async () => {
    const { service, examensFind, alertesFind, enseignementsFind } = setup();
    enseignementsFind.mockResolvedValue([]);
    examensFind.mockResolvedValue([]);
    alertesFind.mockResolvedValue([{ id: 'alert-autre', examenId: 'exam-autre' }]);

    const result = await service.findAlertes(false, responsableMention as any);

    expect(result).toEqual([]);
  });

  it('le Chef de Scolarité conserve l\'accès global aux alertes', async () => {
    const { service, alertesFind } = setup();
    alertesFind.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);

    const result = await service.findAlertes(false, { userId: '2', role: Role.SCOLARITE } as any);

    expect(result).toHaveLength(2);
    expect(alertesFind).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.not.objectContaining({ examenId: expect.anything() }),
    }));
  });
});

describe('ExamsService - messagerie périmètre RESPONSABLE_MENTION', () => {
  const dtoExamen = 'exam-1';
  const enseignementInfo = { id: 'ens-info', enseignantId: 'Professeur X', matiereId: 'M' };

  it('consulte les messages d\'un examen de son périmètre', async () => {
    const { service, enseignementsFind, enseignementsFindUnique, examensFindOneBy, messagesFind } = setup();
    enseignementsFind.mockResolvedValue([{ id: 'ens-info' }]);
    enseignementsFindUnique.mockResolvedValue(enseignementInfo);
    examensFindOneBy.mockResolvedValue({ id: dtoExamen, enseignementId: 'ens-info', dateExamen: '2026-10-30', salle: 'A1' });
    messagesFind.mockResolvedValue([{ id: 'm1', contenu: 'hi', createdAt: new Date() }]);

    const result = await service.listerMessages(dtoExamen, { userId: '3', role: Role.RESPONSABLE_MENTION, mentionId: 'INFORMATIQUE', cycles: ['LICENCE'], parcours: 'Informatique' } as any);

    expect(result).toHaveLength(1);
  });

  it('ne peut pas consulter les messages d\'un examen hors périmètre', async () => {
    const { service, enseignementsFind, enseignementsFindUnique, examensFindOneBy } = setup();
    enseignementsFind.mockResolvedValue([{ id: 'ens-info' }]);
    enseignementsFindUnique.mockResolvedValue({ id: 'ens-other', enseignantId: 'Professeur Y', matiereId: 'M2' });
    examensFindOneBy.mockResolvedValue({ id: dtoExamen, enseignementId: 'ens-other', dateExamen: '2026-10-30', salle: 'A1' });

    await expect(service.listerMessages(dtoExamen, { userId: '3', role: Role.RESPONSABLE_MENTION, mentionId: 'INFORMATIQUE', cycles: ['LICENCE'], parcours: 'Informatique' } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('peut marquer comme lu un message d\'une conversation accessible', async () => {
    const { service, messagesFindOneBy, enseignementsFind, enseignementsFindUnique, examensFindOneBy } = setup();
    enseignementsFind.mockResolvedValue([{ id: 'ens-info' }]);
    enseignementsFindUnique.mockResolvedValue(enseignementInfo);
    examensFindOneBy.mockResolvedValue({ id: dtoExamen, enseignementId: 'ens-info', dateExamen: '2026-10-30', salle: 'A1' });
    messagesFindOneBy.mockResolvedValue({ id: 'm1', examenId: dtoExamen, destinataireId: 5, estLu: false });

    const res = await service.marquerLu('m1', { userId: '3', role: Role.RESPONSABLE_MENTION, mentionId: 'INFORMATIQUE', cycles: ['LICENCE'], parcours: 'Informatique' } as any);

    expect((res as any).estLu).toBe(true);
  });

  it('ne peut pas envoyer de message (écriture réservée)', async () => {
    const { service } = setup();
    await expect(service.creerMessage(dtoExamen, 'Bonjour', { userId: '3', role: Role.RESPONSABLE_MENTION, mentionId: 'INFORMATIQUE', cycles: ['LICENCE'], parcours: 'Informatique' } as any)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ExamsService - périmètre Responsable insensible à la casse', () => {
  it('associe INFORMATIQUE (majuscules, JWT) à Informatique (base) via mode insensible', async () => {
    const { service, enseignementsFind } = setup();
    const context = { userId: '3', role: Role.RESPONSABLE_MENTION, mentionId: 'INFORMATIQUE', cycles: ['LICENCE'], parcours: 'Informatique' };
    await service.getEnseignementIdsForRead(context as any).catch(() => null);
    expect(enseignementsFind).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        mentionId: { equals: 'INFORMATIQUE', mode: 'insensitive' },
        parcours: { in: ['Informatique', 'DA2I', 'Science des donnees'] },
        cycle: { in: ['LICENCE'] },
      }),
    }));
  });

  it('isole les mentions : Mathematiques ne voit pas les enseignements d\'Informatique', async () => {
    const { service, enseignementsFind } = setup();
    enseignementsFind.mockResolvedValue([]);
    const context = { userId: '9', role: Role.RESPONSABLE_MENTION, mentionId: 'MATHEMATIQUES', cycles: ['LICENCE'], parcours: 'Mathematiques' };
    const ids = await service.getEnseignementIdsForRead(context as any);
    expect(ids).toEqual([]);
    expect(enseignementsFind).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        mentionId: { equals: 'MATHEMATIQUES', mode: 'insensitive' },
        parcours: { in: ['Mathematiques'] },
      }),
    }));
  });
});
