import { DataStore } from '../database/data-store.js';
import { CreateContrainteDto, ToggleContrainteDto } from '../dto/create-contrainte.dto.js';
import { ContraintePlanificationEntity } from '../entities/contrainte-planification.entity.js';

export class ConstraintsService {
  private store = DataStore.getInstance();

  async findAll(): Promise<ContraintePlanificationEntity[]> {
    return [...this.store.constraints];
  }

  async create(dto: CreateContrainteDto): Promise<ContraintePlanificationEntity> {
    const nextId = Math.max(0, ...this.store.constraints.map(c => c.id)) + 1;
    const newConstraint = new ContraintePlanificationEntity({
      id: nextId,
      titre: dto.titre,
      typeContrainte: dto.typeContrainte,
      niveauPriorite: dto.niveauPriorite,
      cibleId: dto.cibleId,
      cibleNom: dto.cibleNom,
      description: dto.description,
      regle: dto.regle || {},
      active: dto.active !== undefined ? dto.active : true
    });

    this.store.constraints.push(newConstraint);
    await this.store.save();
    return newConstraint;
  }

  async toggleActive(id: number, dto?: ToggleContrainteDto): Promise<ContraintePlanificationEntity> {
    const constraint = this.store.constraints.find(c => c.id === id);
    if (!constraint) throw new Error(`Contrainte #${id} introuvable`);

    constraint.active = dto !== undefined ? dto.active : !constraint.active;
    await this.store.save();
    return constraint;
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const index = this.store.constraints.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Contrainte #${id} introuvable`);

    this.store.constraints.splice(index, 1);
    await this.store.save();
    return { success: true, message: `Contrainte #${id} supprimée avec succès.` };
  }
}
