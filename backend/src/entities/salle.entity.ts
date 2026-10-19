export type RoomType = 'AMPHI' | 'SALLE_TP' | 'SALLE_TD' | 'LABO';
export type RoomStatus = 'ACTIF' | 'MAINTENANCE' | 'DESACTIVE';

/**
 * Modélisation de l'entité Salle (TypeORM / PostgreSQL)
 * Table: 'salle'
 */
export class SalleEntity {
  id!: number;
  nom!: string;
  capacite!: number;
  typeSalle!: RoomType;
  batiment!: string;
  equipements!: string[];
  estDisponible!: boolean;
  statut!: RoomStatus;
  remarques?: string;

  constructor(partial?: Partial<SalleEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  isOperational(): boolean {
    return this.statut === 'ACTIF' && this.estDisponible;
  }
}
