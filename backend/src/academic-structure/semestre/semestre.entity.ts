import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { AnneeUniversitaire } from '../annee-universitaire/annee-universitaire.entity.js';
import { Matiere } from '../matiere/matiere.entity.js';

@Entity('semestre')
@Unique(['anneeUniversitaireId', 'numero'])
export class Semestre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  numero: number;

  @ManyToOne(() => AnneeUniversitaire, (annee) => annee.semestres, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'anneeUniversitaireId' })
  anneeUniversitaire: Relation<AnneeUniversitaire>;

  @Column()
  anneeUniversitaireId: number;

  @OneToMany(() => Matiere, (matiere) => matiere.semestre)
  matieres: Matiere[];
}
