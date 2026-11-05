import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Mention } from '../mention/mention.entity.js';
import { Niveau } from '../niveau/niveau.entity.js';

export enum TypeCycle {
  LICENCE = 'Licence',
  MASTER = 'Master',
}

@Entity('cycle')
@Unique(['mentionId', 'type'])
export class Cycle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  type: TypeCycle;

  @ManyToOne(() => Mention, (mention) => mention.cycles, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'mentionId' })
  mention: Relation<Mention>;

  @Column()
  mentionId: number;

  @OneToMany(() => Niveau, (niveau) => niveau.cycle)
  niveaux: Niveau[];
}
