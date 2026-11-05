import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Cycle } from '../cycle/cycle.entity.js';
import { AnneeUniversitaire } from '../annee-universitaire/annee-universitaire.entity.js';

@Entity('niveau')
@Unique(['cycleId', 'libelle'])
export class Niveau {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  libelle: string;

  @ManyToOne(() => Cycle, (cycle) => cycle.niveaux, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'cycleId' })
  cycle: Relation<Cycle>;

  @Column()
  cycleId: number;

  @OneToMany(() => AnneeUniversitaire, (annee) => annee.niveau)
  anneesUniversitaires: AnneeUniversitaire[];
}
