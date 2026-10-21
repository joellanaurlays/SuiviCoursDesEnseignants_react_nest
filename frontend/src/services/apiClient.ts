import {
  ContraintePlanificationEntity,
  CreneauHoraireEntity,
  EmploiDuTempsEntity,
  EnseignementEntity,
  SalleEntity,
  SeancePlanifieeEntity,
  SeanceStatut
} from '../types/schedule';

export interface ConflictApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

export class ApiClient {
  private static baseUrl = import.meta.env.VITE_API_URL || '/api';

  private static async request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `Erreur HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  // --- 1. SALLES & CRÉNEAUX (T21) ---
  public static async getRooms(filters?: { typeSalle?: string; statut?: string }): Promise<SalleEntity[]> {
    const params = new URLSearchParams();
    if (filters?.typeSalle && filters.typeSalle !== 'TOUS') params.append('typeSalle', filters.typeSalle);
    if (filters?.statut && filters.statut !== 'TOUS') params.append('statut', filters.statut);
    return this.request(`${this.baseUrl}/rooms?${params.toString()}`);
  }

  public static getTeachings(): Promise<EnseignementEntity[]> {
    return this.request(`${this.baseUrl}/teachings`);
  }

  public static async createRoom(data: Partial<SalleEntity>): Promise<SalleEntity> {
    return this.request(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  public static async updateRoom(id: number, data: Partial<SalleEntity>): Promise<SalleEntity> {
    return this.request(`${this.baseUrl}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  public static async toggleRoomStatus(id: number): Promise<SalleEntity> {
    return this.request(`${this.baseUrl}/rooms/${id}/toggle`, { method: 'PATCH' });
  }

  public static async getTimeSlots(): Promise<CreneauHoraireEntity[]> {
    return this.request(`${this.baseUrl}/rooms/time-slots`);
  }

  public static createTimeSlot(data: Omit<CreneauHoraireEntity, 'id' | 'dureeMinutes'> & { dureeMinutes?: number }): Promise<CreneauHoraireEntity> {
    return this.request(`${this.baseUrl}/rooms/time-slots`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
  }

  public static async toggleTimeSlot(id: number, actif?: boolean): Promise<CreneauHoraireEntity> {
    return this.request(`${this.baseUrl}/rooms/time-slots/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif })
    });
  }

  // --- 2. EMPLOI DU TEMPS (T22 & T24) ---
  public static async getPlanning(filters?: Record<string, string>): Promise<{ metadata: EmploiDuTempsEntity; sessions: SeancePlanifieeEntity[] }> {
    const params = new URLSearchParams(filters);
    return this.request(`${this.baseUrl}/planning?${params.toString()}`);
  }

  public static async createSession(data: any): Promise<SeancePlanifieeEntity> {
    const res = await fetch(`${this.baseUrl}/planning/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.status === 409) {
      const errorJson = await res.json();
      const err: any = new Error(errorJson.message || 'Conflit de planification détecté');
      err.statusCode = 409;
      err.details = errorJson.details;
      throw err;
    }

    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    return await res.json();
  }

  public static updateSession(id: number, data: Partial<SeancePlanifieeEntity>): Promise<SeancePlanifieeEntity> {
    return this.request(`${this.baseUrl}/planning/session/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
  }

  public static async updateSessionStatus(id: number, statut: SeanceStatut, notes?: string): Promise<SeancePlanifieeEntity> {
    return this.request(`${this.baseUrl}/planning/session/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut, notes })
    });
  }

  public static async deleteSession(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.baseUrl}/planning/session/${id}`, { method: 'DELETE' });
  }

  public static async generateAutomaticPlanning(semaineDu?: string): Promise<any> {
    return this.request(`${this.baseUrl}/planning/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ semaineDu })
    });
  }

  public static async publishPlanning(): Promise<EmploiDuTempsEntity> {
    return this.request(`${this.baseUrl}/planning/publish`, { method: 'POST' });
  }

  // --- 3. DÉTECTION CONFLITS (T23) ---
  public static async checkConflict(data: any): Promise<any> {
    return this.request(`${this.baseUrl}/conflicts/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  // --- 4. CONTRAINTES (T25) ---
  public static async getConstraints(): Promise<ContraintePlanificationEntity[]> {
    return this.request(`${this.baseUrl}/constraints`);
  }

  public static async createConstraint(data: Partial<ContraintePlanificationEntity>): Promise<ContraintePlanificationEntity> {
    return this.request(`${this.baseUrl}/constraints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  public static async toggleConstraint(id: number, active?: boolean): Promise<ContraintePlanificationEntity> {
    return this.request(`${this.baseUrl}/constraints/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
  }

  public static async deleteConstraint(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.baseUrl}/constraints/${id}`, { method: 'DELETE' });
  }
}
