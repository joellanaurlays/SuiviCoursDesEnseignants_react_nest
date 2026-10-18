import { Enseignement, Seance } from '../entities/enseignement';

export interface IEnseignementRepository {
  findById(id: string): Promise<Enseignement | null>;
  findAll(): Promise<Enseignement[]>;
  updateStats?(id: string, heuresRealisees: number, progression: number, etat: string): Promise<void>;
}

export interface ISeanceRepository {
  create(data: Seance): Promise<Seance>;
  findByEnseignementId(enseignementId: string): Promise<Seance[]>;
}