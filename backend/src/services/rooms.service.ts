import { DataStore } from '../database/data-store';
import { CreateSalleDto, UpdateSalleDto } from '../dto/create-salle.dto';
import { CreateCreneauDto, ToggleCreneauDto } from '../dto/create-creneau.dto';
import { SalleEntity } from '../entities/salle.entity';
import { CreneauHoraireEntity } from '../entities/creneau-horaire.entity';

export class RoomsService {
  private store = DataStore.getInstance();

  /**
   * Récupère la liste des salles avec filtres éventuels et calcul d'occupation
   */
  async findAllRooms(query?: { typeSalle?: string; statut?: string; minCapacite?: number }): Promise<Array<SalleEntity & { tauxOccupation: number; seancesCount: number }>> {
    let result = [...this.store.rooms];

    if (query?.typeSalle && query.typeSalle !== 'TOUS') {
      result = result.filter(r => r.typeSalle === query.typeSalle);
    }
    if (query?.statut && query.statut !== 'TOUS') {
      result = result.filter(r => r.statut === query.statut);
    }
    if (query?.minCapacite) {
      result = result.filter(r => r.capacite >= query.minCapacite!);
    }

    const activeSlots = this.store.timeSlots.filter(s => s.actif).length || 1;

    return result.map(room => {
      const roomSessions = this.store.sessions.filter(s => s.salleId === room.id && s.statut !== 'ANNULE');
      const taux = Math.min(100, Math.round((roomSessions.length / activeSlots) * 100));
      return Object.assign(new SalleEntity(room), {
        tauxOccupation: taux,
        seancesCount: roomSessions.length
      });
    });
  }

  async findRoomById(id: number): Promise<SalleEntity | null> {
    const room = this.store.rooms.find(r => r.id === id);
    return room ? new SalleEntity(room) : null;
  }

  async createRoom(dto: CreateSalleDto): Promise<SalleEntity> {
    const nextId = Math.max(10, ...this.store.rooms.map(r => r.id)) + 1;
    const newRoom = new SalleEntity({
      id: nextId,
      nom: dto.nom,
      capacite: Number(dto.capacite),
      typeSalle: dto.typeSalle,
      batiment: dto.batiment || 'Bâtiment Principal',
      equipements: dto.equipements || [],
      estDisponible: dto.statut ? dto.statut === 'ACTIF' : true,
      statut: dto.statut || 'ACTIF',
      remarques: dto.remarques || ''
    });

    this.store.rooms.push(newRoom);
    return newRoom;
  }

  async updateRoom(id: number, dto: UpdateSalleDto): Promise<SalleEntity> {
    const index = this.store.rooms.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Salle #${id} introuvable`);
    }

    const current = this.store.rooms[index];
    const updated = new SalleEntity({
      ...current,
      ...dto,
      id: current.id,
      estDisponible: dto.statut ? dto.statut === 'ACTIF' : current.estDisponible
    });

    this.store.rooms[index] = updated;
    return updated;
  }

  async toggleRoomStatus(id: number): Promise<SalleEntity> {
    const room = this.store.rooms.find(r => r.id === id);
    if (!room) throw new Error(`Salle #${id} introuvable`);

    const nextStatut = room.statut === 'ACTIF' ? 'MAINTENANCE' : (room.statut === 'MAINTENANCE' ? 'DESACTIVE' : 'ACTIF');
    room.statut = nextStatut;
    room.estDisponible = nextStatut === 'ACTIF';
    return room;
  }

  // --- CRÉNEAUX HORAIRES ---
  async findAllTimeSlots(): Promise<CreneauHoraireEntity[]> {
    return [...this.store.timeSlots];
  }

  async toggleTimeSlot(id: number, dto?: ToggleCreneauDto): Promise<CreneauHoraireEntity> {
    const slot = this.store.timeSlots.find(s => s.id === id);
    if (!slot) throw new Error(`Créneau #${id} introuvable`);

    slot.actif = dto ? dto.actif : !slot.actif;
    return slot;
  }
}
