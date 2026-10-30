import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { semestresDuNiveau } from '../common/academic-rules.js';
import { datesSemestre } from '../common/dates.js';
import { AnneeUniversitaire } from '../annee-universitaire/annee-universitaire.entity.js';
import { Semestre } from './semestre.entity.js';

@Injectable()
export class SemestreService extends BaseCrudService<Semestre> {
  constructor(
    @InjectRepository(Semestre) repo: Repository<Semestre>,
    @InjectRepository(AnneeUniversitaire) private readonly annees: Repository<AnneeUniversitaire>,
  ) {
    super(repo, 'Semestre', [
      'anneeUniversitaire',
      'anneeUniversitaire.niveau',
      'anneeUniversitaire.niveau.cycle',
      'anneeUniversitaire.niveau.cycle.mention',
    ]);
  }

  /** Un niveau n'a que 2 semestres : L1 -> S1,S2 ; L2 -> S3,S4 ; ... ; M2 -> S9,S10. */
  private async prepare(dto: DeepPartial<Semestre>, current?: Semestre): Promise<DeepPartial<Semestre>> {
    const anneeId = (dto.anneeUniversitaireId ?? current?.anneeUniversitaireId) as number;
    const numero = (dto.numero ?? current?.numero) as number;
    const annee = await this.annees.findOne({ where: { id: anneeId }, relations: { niveau: true } });
    if (!annee) return dto; // la cle etrangere signalera l'erreur
    const permis = semestresDuNiveau(annee.niveau.libelle);
    if (permis.length && !permis.includes(numero)) {
      const msg = `Le niveau ${annee.niveau.libelle} ne comporte que ${permis.map((n) => 'S' + n).join(' et ')}`;
      throw new BadRequestException({ message: [msg], fieldErrors: { numero: [msg] } });
    }
    const out = { ...dto };
    if (!out.dateDebut && !out.dateFin && !current?.dateDebut && annee.dateDebut) {
      Object.assign(out, datesSemestre(annee.dateDebut, numero));
    }
    if (out.dateDebut && out.dateFin && out.dateFin <= out.dateDebut) {
      const msg = 'La date de fin doit être postérieure à la date de début';
      throw new BadRequestException({ message: [msg], fieldErrors: { dateFin: [msg] } });
    }
    return out;
  }

  override async create(dto: DeepPartial<Semestre>) {
    return super.create(await this.prepare(dto));
  }

  override async update(id: number, dto: DeepPartial<Semestre>) {
    const current = await this.findOne(id);
    return super.update(id, await this.prepare(dto, current));
  }
}