
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import type { Relation } from 'typeorm';
import { SessionExamen } from './session-examen.entity.js';
import { Alerte } from './alerte.entity.js';

export type StatutExamen = 'A_VENIR' | 'EN_COURS' | 'TERMINE';

@Entity('examens')
export class Examen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionExamen, (session) => session.examens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  // Union explicite : emitDecoratorMetadata évalue design:type au chargement
  // du module ; un type simple créerait une référence circulaire TDZ.
  session: Relation<SessionExamen>;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'enseignement_id', type: 'text', nullable: true })
  enseignementId: string | null;

  @Column({ name: 'matiere_id', type: 'uuid', nullable: true })
  matiereId: string | null;

  @Column({ name: 'enseignant_id', type: 'uuid', nullable: true })
  enseignantId: string | null;

  @Column({ name: 'date_examen', type: 'date' })
  dateExamen: string;

  @Column({ name: 'heure_debut', type: 'time', nullable: true })
  heureDebut: string | null;

  @Column({ name: 'heure_fin', type: 'time', nullable: true })
  heureFin: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  salle: string | null;

  @Column({ type: 'varchar', length: 20, default: 'A_VENIR' })
  statut: StatutExamen;

  @Column({ name: 'notes_remises', default: false })
  notesRemises: boolean;

  @Column({ name: 'date_remise_notes', type: 'timestamptz', nullable: true })
  dateRemiseNotes: Date | null;

  @OneToMany(() => Alerte, (alerte) => alerte.examen)
  alertes: Relation<Alerte[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
