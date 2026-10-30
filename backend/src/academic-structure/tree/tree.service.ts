import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Mention } from '../mention/mention.entity.js';
import { Cycle } from '../cycle/cycle.entity.js';
import { Niveau } from '../niveau/niveau.entity.js';
import { AnneeUniversitaire } from '../annee-universitaire/annee-universitaire.entity.js';
import { Semestre } from '../semestre/semestre.entity.js';
import { Matiere } from '../matiere/matiere.entity.js';

@Injectable()
export class TreeService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Nombre d'elements de chaque niveau de la hierarchie (pour le tableau de bord). */
  async stats() {
    const count = (entity: new () => object) => this.dataSource.getRepository(entity).count();
    const [mentions, cycles, niveaux, anneesUniversitaires, semestres, matieres] = await Promise.all([
      count(Mention),
      count(Cycle),
      count(Niveau),
      count(AnneeUniversitaire),
      count(Semestre),
      count(Matiere),
    ]);
    const volume = await this.dataSource
      .getRepository(Matiere)
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.volumeHoraire), 0)', 'total')
      .getRawOne<{ total: string }>();

    return {
      mentions,
      cycles,
      niveaux,
      anneesUniversitaires,
      semestres,
      matieres,
      volumeHoraireTotal: Number(volume?.total ?? 0),
    };
  }

  /** Arbre complet : Mention > Cycle > Niveau > Annee > Semestre > Matiere. */
  tree() {
    return this.dataSource.getRepository(Mention).find({
      relations: {
        cycles: { niveaux: { anneesUniversitaires: { semestres: { matieres: true } } } },
      },
      order: {
        id: 'ASC',
        cycles: {
          type: 'ASC',
          niveaux: {
            libelle: 'ASC',
            anneesUniversitaires: {
              libelle: 'ASC',
              semestres: { numero: 'ASC', matieres: { nom: 'ASC' } },
            },
          },
        },
      },
    });
  }
}
