import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Mention } from '../mention/mention.entity.js';
import { Cycle } from '../cycle/cycle.entity.js';
import { Niveau } from '../niveau/niveau.entity.js';
import { AnneeUniversitaire } from '../annee-universitaire/annee-universitaire.entity.js';
import { Semestre } from '../semestre/semestre.entity.js';
import { PLAN_STANDARD, semestresDuNiveau } from '../common/academic-rules.js';
import { datesSemestre, debutParDefaut, finAnnee, libelleAnnee } from '../common/dates.js';

export interface GenerationResult {
  cycles: number;
  niveaux: number;
  annees: number;
  semestres: number;
}

/**
 * Genere la structure standard d'une mention :
 *   Mention -> Cycle (Licence, Master) -> Niveau (L1-L3, M1-M2)
 *           -> Annee universitaire -> Semestres (L1: S1,S2 ... M2: S9,S10).
 * Les matieres sont ajoutees ensuite par la scolarite (leurs noms varient selon la mention).
 * L'operation est idempotente : relancee, elle ne cree que les elements manquants.
 */
@Injectable()
export class StructureGeneratorService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Cree la mention et toute sa structure dans UNE transaction (tout ou rien). */
  createMentionWithStructure(nom: string, anneeDebut?: string, generer = true) {
    return this.dataSource.transaction(async (em) => {
      const mention = await em.getRepository(Mention).save({ nom });
      const result = generer
        ? await this.generateIn(em, mention.id, anneeDebut ?? debutParDefaut())
        : null;
      return { mentionId: mention.id, generated: result };
    });
  }

  async generate(mentionId: number, anneeDebut?: string): Promise<GenerationResult> {
    return this.dataSource.transaction(async (em) => {
      const exists = await em.getRepository(Mention).exists({ where: { id: mentionId } });
      if (!exists) throw new NotFoundException(`Mention #${mentionId} introuvable`);
      return this.generateIn(em, mentionId, anneeDebut ?? debutParDefaut());
    });
  }

  private async generateIn(em: EntityManager, mentionId: number, debut: string): Promise<GenerationResult> {
    const result: GenerationResult = { cycles: 0, niveaux: 0, annees: 0, semestres: 0 };
    const libelle = libelleAnnee(debut);
    const fin = finAnnee(debut);

    for (const plan of PLAN_STANDARD) {
      let cycle = await em.getRepository(Cycle).findOneBy({ mentionId, type: plan.type });
      if (!cycle) {
        cycle = await em.getRepository(Cycle).save({ mentionId, type: plan.type });
        result.cycles++;
      }
      for (const nomNiveau of plan.niveaux) {
        let niveau = await em.getRepository(Niveau).findOneBy({ cycleId: cycle.id, libelle: nomNiveau });
        if (!niveau) {
          niveau = await em.getRepository(Niveau).save({ cycleId: cycle.id, libelle: nomNiveau });
          result.niveaux++;
        }
        let annee = await em.getRepository(AnneeUniversitaire).findOneBy({ niveauId: niveau.id, libelle });
        if (!annee) {
          annee = await em
            .getRepository(AnneeUniversitaire)
            .save({ niveauId: niveau.id, libelle, dateDebut: debut, dateFin: fin });
          result.annees++;
        }
        for (const numero of semestresDuNiveau(nomNiveau)) {
          const present = await em
            .getRepository(Semestre)
            .exists({ where: { anneeUniversitaireId: annee.id, numero } });
          if (!present) {
            await em
              .getRepository(Semestre)
              .save({ anneeUniversitaireId: annee.id, numero, ...datesSemestre(debut, numero) });
            result.semestres++;
          }
        }
      }
    }
    return result;
  }
}