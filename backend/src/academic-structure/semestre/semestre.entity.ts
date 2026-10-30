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
  numero: number; // 1..10 : L1=S1,S2  L2=S3,S4  L3=S5,S6  M1=S7,S8  M2=S9,S10

  @Column({ type: 'date', nullable: true })
  dateDebut: string | null;

  @Column({ type: 'date', nullable: true })
  dateFin: string | null;

  @ManyToOne(() => AnneeUniversitaire, (annee) => annee.semestres, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'anneeUniversitaireId' })
  anneeUniversitaire: Relation<AnneeUniversitaire>;

  @Column()
  anneeUniversitaireId: number;

  @OneToMany(() => Matiere, (matiere) => matiere.semestre)
  matieres: Matiere[];
}