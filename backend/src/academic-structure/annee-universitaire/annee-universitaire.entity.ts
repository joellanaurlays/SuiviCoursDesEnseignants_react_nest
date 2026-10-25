import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Niveau } from '../niveau/niveau.entity.js';
import { Semestre } from '../semestre/semestre.entity.js';

@Entity('annee_universitaire')
@Unique(['niveauId', 'libelle'])
export class AnneeUniversitaire {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 9 })
  libelle: string; // ex: "2025-2026"

  @ManyToOne(() => Niveau, (niveau) => niveau.anneesUniversitaires, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'niveauId' })
  niveau: Relation<Niveau>;

  @Column()
  niveauId: number;

  @OneToMany(() => Semestre, (semestre) => semestre.anneeUniversitaire)
  semestres: Semestre[];
}
