import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { niveauxAutorises } from '../common/academic-rules.js';
import { Cycle } from '../cycle/cycle.entity.js';
import { Niveau } from './niveau.entity.js';

@Injectable()
export class NiveauService extends BaseCrudService<Niveau> {
  constructor(
    @InjectRepository(Niveau) repo: Repository<Niveau>,
    @InjectRepository(Cycle) private readonly cycles: Repository<Cycle>,
  ) {
    super(repo, 'Niveau', ['cycle', 'cycle.mention']);
  }

  /** Licence : L1, L2, L3 — Master : M1, M2. */
  private async check(cycleId: number, libelle: string) {
    const cycle = await this.cycles.findOneBy({ id: cycleId });
    if (!cycle) return; // la cle etrangere signalera l'erreur
    const autorises = niveauxAutorises(cycle.type);
    if (!autorises.includes(libelle)) {
      throw new BadRequestException({
        message: [`Pour le cycle ${cycle.type}, le niveau doit être : ${autorises.join(', ')}`],
        fieldErrors: { libelle: [`Pour le cycle ${cycle.type}, choisissez : ${autorises.join(', ')}`] },
      });
    }
  }

  override async create(dto: DeepPartial<Niveau>) {
    await this.check(dto.cycleId as number, dto.libelle as string);
    return super.create(dto);
  }

  override async update(id: number, dto: DeepPartial<Niveau>) {
    const current = await this.findOne(id);
    await this.check((dto.cycleId ?? current.cycleId) as number, (dto.libelle ?? current.libelle) as string);
    return super.update(id, dto);
  }
}