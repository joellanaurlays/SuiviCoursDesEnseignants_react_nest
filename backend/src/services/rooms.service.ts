import { DataStore } from '../database/data-store.js';
import { CreateSalleDto, UpdateSalleDto } from '../dto/create-salle.dto.js';
import { CreateCreneauDto, ToggleCreneauDto } from '../dto/create-creneau.dto.js';
import { SalleEntity } from '../entities/salle.entity.js';
import { CreneauHoraireEntity } from '../entities/creneau-horaire.entity.js';

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
    const nextId = Math.max(0, ...this.store.rooms.map(r => r.id)) + 1;
    const newRoom = new SalleEntity({
      id: nextId,
      nom: dto.nom,
      capacite: Number(dto.capacite),
      typeSalle: dto.typeSalle,
      batiment: dto.batiment || '',
      equipements: dto.equipements || [],
      estDisponible: dto.statut ? dto.statut === 'ACTIF' : true,
      statut: dto.statut || 'ACTIF',
      remarques: dto.remarques || ''
    });

    this.store.rooms.push(newRoom);
    await this.store.save();
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
    await this.store.save();
    return updated;
  }

  async toggleRoomStatus(id: number): Promise<SalleEntity> {
    const room = this.store.rooms.find(r => r.id === id);
    if (!room) throw new Error(`Salle #${id} introuvable`);

    const nextStatut = room.statut === 'ACTIF' ? 'MAINTENANCE' : (room.statut === 'MAINTENANCE' ? 'DESACTIVE' : 'ACTIF');
    room.statut = nextStatut;
    room.estDisponible = nextStatut === 'ACTIF';
    await this.store.save();
    return room;
  }

  // --- CRÉNEAUX HORAIRES ---
  async findAllTimeSlots(): Promise<CreneauHoraireEntity[]> {
    return [...this.store.timeSlots];
  }

  async createTimeSlot(dto: CreateCreneauDto): Promise<CreneauHoraireEntity> {
    const id = Math.max(0, ...this.store.timeSlots.map(slot => slot.id)) + 1;
    const start = dto.heureDebut.split(':').map(Number);
    const end = dto.heureFin.split(':').map(Number);
    const duration = dto.dureeMinutes ?? (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
    if (duration <= 0) throw new Error('L’heure de fin doit être après l’heure de début.');
    if (this.store.timeSlots.some(slot => slot.jourSemaine === dto.jourSemaine && slot.heureDebut === dto.heureDebut && slot.heureFin === dto.heureFin)) {
      throw new Error('Ce créneau existe déjà.');
    }
    const slot = new CreneauHoraireEntity({ ...dto, id, dureeMinutes: duration, libelle: dto.libelle || `${dto.jourSemaine} ${dto.heureDebut}–${dto.heureFin}`, actif: dto.actif ?? true });
    this.store.timeSlots.push(slot);
    await this.store.save();
    return slot;
  }

  async toggleTimeSlot(id: number, dto?: ToggleCreneauDto): Promise<CreneauHoraireEntity> {
    const slot = this.store.timeSlots.find(s => s.id === id);
    if (!slot) throw new Error(`Créneau #${id} introuvable`);

    slot.actif = dto ? dto.actif : !slot.actif;
    await this.store.save();
    return slot;
  }
}
