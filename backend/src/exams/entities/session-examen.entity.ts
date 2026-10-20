import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sessions_examen')
export class SessionExamen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  libelle: string;

  @Column({ name: 'annee_universitaire', length: 20 })
  anneeUniversitaire: string;

  @Column({ length: 10 })
  semestre: string;

  @Column({ name: 'date_debut', type: 'date' })
  dateDebut: string;

  @Column({ name: 'date_fin', type: 'date' })
  dateFin: string;

  @Column({ type: 'boolean', name: 'est_cloturee', default: false })
  estCloturee: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
