import { PrismaClient, Enseignement, Seance } from '@prisma/client';

export class EnseignementRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findById(id: string): Promise<Enseignement | null> {
    return this.prisma.enseignement.findUnique({
      where: { id },
      include: { seances: true }
    });
  }

  async findAll(): Promise<Enseignement[]> {
    return this.prisma.enseignement.findMany({
      include: { seances: true }
    });
  }
}

export class SeanceRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async create(data: Omit<Seance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Seance> {
    return this.prisma.seance.create({
      data
    });
  }
}
