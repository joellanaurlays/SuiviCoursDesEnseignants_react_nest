import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateSeanceUseCase } from './create-seance.use-case';
import { PrismaService } from '../../prisma/prisma.service';
import { SuiviRecalculService } from '../services/suivi-recalcul.service';
import { AuditSeanceService } from '../services/audit-seance.service';
import { ActionAuditSeance } from '../domain/audit-seance';
import { StatutSeance } from '../dto/create-seance.dto';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';

const enseignant: AuthContext = { userId: 'ens1', role: Role.ENSEIGNANT };
const autreEnseignant: AuthContext = { userId: 'ens2', role: Role.ENSEIGNANT };

describe('CreateSeanceUseCase', () => {
  let useCase: CreateSeanceUseCase;
  let prismaService: PrismaService;
  let suiviRecalculService: SuiviRecalculService;
  let auditMock: { enregistrer: jest.Mock };
  let seancesExistantes: Array<{ heureDebut: string; heureFin: string }>;

  beforeEach(async () => {
    seancesExistantes = [];
    auditMock = { enregistrer: jest.fn().mockResolvedValue(undefined) };

    const prismaMock = {
      enseignement: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'ens-1',
          enseignantId: 'ens1',
          volumePrevu: 30,
        }),
      },
      seance: {
        findMany: jest.fn().mockImplementation(() => Promise.resolve(seancesExistantes)),
        create: jest.fn().mockResolvedValue({
          id: 'seance-1',
          enseignementId: 'ens-1',
          duree: 2,
          statut: StatutSeance.PLANIFIEE,
        }),
      },
      $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSeanceUseCase,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: SuiviRecalculService,
          useValue: {
            recalculerEtPersister: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditSeanceService,
          useValue: auditMock,
        },
      ],
    }).compile();

    useCase = module.get<CreateSeanceUseCase>(CreateSeanceUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    suiviRecalculService = module.get<SuiviRecalculService>(SuiviRecalculService);
  });

  it('should create a seance and recalculate the enseignement suivi', async () => {
    const createDto = {
      enseignementId: 'ens-1',
      dateSeance: '2023-10-10T10:00:00Z',
      heureDebut: '10:00',
      heureFin: '12:00',
      contenuEnseigne: 'Introduction',
      statut: StatutSeance.PLANIFIEE,
    };

    const result = await useCase.execute(createDto);
    expect(result).toBeDefined();
    expect(prismaService.seance.create).toHaveBeenCalledWith({
      data: {
        enseignementId: 'ens-1',
        dateSeance: expect.any(Date),
        heureDebut: '10:00',
        heureFin: '12:00',
        duree: 2,
        contenuEnseigne: 'Introduction',
        statut: StatutSeance.PLANIFIEE,
      },
    });
    expect(suiviRecalculService.recalculerEtPersister).toHaveBeenCalledWith('ens-1', expect.anything());
  });

  it('rejette un horaire invalide (heureFin <= heureDebut)', async () => {
    const createDto = {
      enseignementId: 'ens-1',
      dateSeance: '2023-10-10T10:00:00Z',
      heureDebut: '12:00',
      heureFin: '10:00',
      statut: StatutSeance.PLANIFIEE,
    };

    await expect(useCase.execute(createDto)).rejects.toThrow();
    expect(prismaService.seance.create).not.toHaveBeenCalled();
  });

  it("TEST 4 — déclare directement une séance REALISEE sans passer par PLANIFIEE", async () => {
    const createDto = {
      enseignementId: 'ens-1',
      dateSeance: '2023-10-10T10:00:00Z',
      heureDebut: '10:00',
      heureFin: '12:00',
      contenuEnseigne: 'Introduction',
      statut: StatutSeance.REALISEE,
    };

    await useCase.execute(createDto, enseignant);

    expect(prismaService.seance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ statut: StatutSeance.REALISEE }),
    });
  });

  it('refuse une séance REALISEE sans contenu enseigné', async () => {
    const createDto = {
      enseignementId: 'ens-1',
      dateSeance: '2023-10-10T10:00:00Z',
      heureDebut: '10:00',
      heureFin: '12:00',
      statut: StatutSeance.REALISEE,
    };

    await expect(useCase.execute(createDto, enseignant)).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaService.seance.create).not.toHaveBeenCalled();
  });

  it('refuse un chevauchement de séance sur le même créneau et le même jour', async () => {
    seancesExistantes = [{ heureDebut: '10:30', heureFin: '12:30' }];
    const createDto = {
      enseignementId: 'ens-1',
      dateSeance: '2023-10-10T09:00:00Z',
      heureDebut: '10:00',
      heureFin: '12:00',
      contenuEnseigne: 'Cours',
      statut: StatutSeance.REALISEE,
    };

    await expect(useCase.execute(createDto, enseignant)).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaService.seance.create).not.toHaveBeenCalled();
  });

  it('TEST 3 — refuse un enseignant non affecté à l’enseignement (403)', async () => {
    const createDto = {
      enseignementId: 'ens-1',
      dateSeance: '2023-10-10T10:00:00Z',
      heureDebut: '10:00',
      heureFin: '12:00',
      contenuEnseigne: 'Cours',
      statut: StatutSeance.REALISEE,
    };

    await expect(useCase.execute(createDto, autreEnseignant)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaService.seance.create).not.toHaveBeenCalled();
  });

  it('refuse un enseignement inexistant (404)', async () => {
    (prismaService.enseignement.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const createDto = {
      enseignementId: 'inconnu',
      dateSeance: '2023-10-10T10:00:00Z',
      heureDebut: '10:00',
      heureFin: '12:00',
      contenuEnseigne: 'Cours',
      statut: StatutSeance.REALISEE,
    };

    await expect(useCase.execute(createDto, enseignant)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('journalise une CREATION pour une séance planifiée', async () => {
    await useCase.execute(
      {
        enseignementId: 'ens-1',
        dateSeance: '2023-10-10T10:00:00Z',
        heureDebut: '10:00',
        heureFin: '12:00',
        contenuEnseigne: 'Introduction',
        statut: StatutSeance.PLANIFIEE,
      },
      enseignant,
    );

    expect(auditMock.enregistrer).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ActionAuditSeance.CREATION,
        statutApres: StatutSeance.PLANIFIEE,
      }),
      enseignant,
      expect.anything(),
    );
  });

  it('journalise une DECLARATION_REALISEE pour une réalisation directe', async () => {
    await useCase.execute(
      {
        enseignementId: 'ens-1',
        dateSeance: '2023-10-10T10:00:00Z',
        heureDebut: '10:00',
        heureFin: '12:00',
        contenuEnseigne: 'Introduction',
        statut: StatutSeance.REALISEE,
      },
      enseignant,
    );

    expect(auditMock.enregistrer).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ActionAuditSeance.DECLARATION_REALISEE,
        statutApres: StatutSeance.REALISEE,
      }),
      enseignant,
      expect.anything(),
    );
  });
});
