import { NotFoundException } from '@nestjs/common';
import { toRelations } from './relations.js';
import type { DeepPartial, FindOptionsOrder, ObjectLiteral, Repository } from 'typeorm';

/**
 * Service CRUD generique reutilise par les 6 entites du module.
 * - `relations` : relations chargees pour l'affichage (chemin hierarchique).
 * - la mise a jour passe par `repo.update` afin que le changement d'une cle
 *   etrangere (ex: mentionId) soit toujours pris en compte.
 */
export abstract class BaseCrudService<T extends ObjectLiteral & { id: number }> {
  protected constructor(
    protected readonly repo: Repository<T>,
    private readonly label: string,
    relations: string[],
  ) {
    this.relations = toRelations(relations);
  }

  private readonly relations: Record<string, unknown>;

  findAll(): Promise<T[]> {
    return this.repo.find({
      relations: this.relations as never,
      order: { id: 'ASC' } as FindOptionsOrder<T>,
    });
  }

  async findOne(id: number): Promise<T> {
    const entity = await this.repo.findOne({
      where: { id } as never,
      relations: this.relations as never,
    });
    if (!entity) throw new NotFoundException(`${this.label} #${id} introuvable`);
    return entity;
  }

  async create(dto: DeepPartial<T>): Promise<T> {
    const saved = await this.repo.save(this.repo.create(dto));
    return this.findOne(saved.id);
  }

  async update(id: number, dto: DeepPartial<T>): Promise<T> {
    await this.findOne(id);
    if (Object.keys(dto).length > 0) {
      await this.repo.update(id, dto as never);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
