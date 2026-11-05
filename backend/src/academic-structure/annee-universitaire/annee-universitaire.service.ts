import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { BaseCrudService } from '../common/base-crud.service.js';
import { finAnnee, libelleAnnee } from '../common/dates.js';
import { AnneeUniversitaire } from './annee-universitaire.entity.js';

@Injectable()
export class AnneeUniversitaireService extends BaseCrudService<AnneeUniversitaire> {
  constructor(@InjectRepository(AnneeUniversitaire) repo: Repository<AnneeUniversitaire>) {
    super(repo, 'Année universitaire', ['niveau', 'niveau.cycle', 'niveau.cycle.mention']);
  }

  /**
   * Calendrier : le libelle "AAAA-AAAA" est DEDUIT de la date de debut choisie.
   * Si seul le libelle est fourni, la date de debut est le 1er octobre de la 1re annee.
   */
  private normalize(dto: DeepPartial<AnneeUniversitaire>): DeepPartial<AnneeUniversitaire> {
    const out = { ...dto };
    if (out.dateDebut) {
      out.libelle = libelleAnnee(out.dateDebut);
      out.dateFin = out.dateFin ?? finAnnee(out.dateDebut);
    } else if (out.libelle) {
      out.dateDebut = `${out.libelle.slice(0, 4)}-10-01`;
      out.dateFin = out.dateFin ?? finAnnee(out.dateDebut);
    }
    if (out.dateDebut && out.dateFin && out.dateFin <= out.dateDebut) {
      throw new BadRequestException({
        message: ['La date de fin doit être postérieure à la date de début'],
        fieldErrors: { dateFin: ['La date de fin doit être postérieure à la date de début'] },
      });
    }
    return out;
  }

  override create(dto: DeepPartial<AnneeUniversitaire>) {
    if (!dto.dateDebut && !dto.libelle) {
      throw new BadRequestException({
        message: ["Choisissez la date de début de l'année dans le calendrier"],
        fieldErrors: { dateDebut: ["Choisissez la date de début de l'année dans le calendrier"] },
      });
    }
    return super.create(this.normalize(dto));
  }

  override update(id: number, dto: DeepPartial<AnneeUniversitaire>) {
    return super.update(id, this.normalize(dto));
  }
}