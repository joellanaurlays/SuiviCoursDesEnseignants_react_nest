import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Semestre } from '../semestre/semestre.entity.js';

@Entity('matiere')
@Unique(['semestreId', 'nom'])
export class Matiere {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nom: string;

  @Column({ type: 'int' })
  volumeHoraire: number;

  @ManyToOne(() => Semestre, (semestre) => semestre.matieres, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'semestreId' })
  semestre: Relation<Semestre>;

  @Column()
  semestreId: number;
}
