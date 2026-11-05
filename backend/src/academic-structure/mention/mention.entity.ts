import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Cycle } from '../cycle/cycle.entity.js';

@Entity('mention')
export class Mention {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nom: string;

  // Une Mention possede jusqu'a 2 Cycles (Licence, Master)
  @OneToMany(() => Cycle, (cycle) => cycle.mention)
  cycles: Cycle[];
}
