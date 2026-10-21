import { RoomStatus, RoomType } from '../entities/salle.entity.js';

export interface CreateSalleDto {
  nom: string;
  capacite: number;
  typeSalle: RoomType;
  batiment?: string;
  equipements?: string[];
  estDisponible?: boolean;
  statut?: RoomStatus;
  remarques?: string;
}

export interface UpdateSalleDto extends Partial<CreateSalleDto> {
  id?: number;
}
