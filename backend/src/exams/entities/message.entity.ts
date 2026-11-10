import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Examen } from './examen.entity.js';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Examen, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'examen_id' })
  examen: Examen;

  @Column({ name: 'examen_id', type: 'uuid' })
  examenId: string;

  @Column({ name: 'expediteur_id', type: 'int' })
  expediteurId: number;

  @Column({ name: 'destinataire_id', type: 'int' })
  destinataireId: number;

  @Column({ type: 'text' })
  contenu: string;

  @Column({ name: 'est_lu', default: false })
  estLu: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
