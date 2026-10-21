import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Examen } from './examen.entity.js';

@Entity('alertes')
export class Alerte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Examen, (e) => e.alertes, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'examen_id' })
  examen: Examen | null;

  @Column({ name: 'examen_id', type: 'uuid', nullable: true })
  examenId: string | null;

  @Column({ name: 'type_alerte', length: 50 })
  typeAlerte: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'est_lue', default: false })
  estLue: boolean;

  @Column({ name: 'est_traitee', default: false })
  estTraitee: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
