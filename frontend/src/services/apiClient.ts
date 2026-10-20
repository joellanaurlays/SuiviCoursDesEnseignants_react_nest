import { 
  ContraintePlanificationEntity, 
  CreneauHoraireEntity, 
  EmploiDuTempsEntity, 
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
  private static baseUrl = '/api';

  // --- 1. SALLES & CRÉNEAUX (T21) ---
  public static async getRooms(filters?: { typeSalle?: string; statut?: string }): Promise<SalleEntity[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.typeSalle && filters.typeSalle !== 'TOUS') params.append('typeSalle', filters.typeSalle);
      if (filters?.statut && filters.statut !== 'TOUS') params.append('statut', filters.statut);

      const res = await fetch(`${this.baseUrl}/rooms?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch rooms from backend, using fallback', err);
      return [];
    }
  }

  public static async createRoom(data: Partial<SalleEntity>): Promise<SalleEntity> {
    const res = await fetch(`${this.baseUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async updateRoom(id: number, data: Partial<SalleEntity>): Promise<SalleEntity> {
    const res = await fetch(`${this.baseUrl}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async toggleRoomStatus(id: number): Promise<SalleEntity> {
    const res = await fetch(`${this.baseUrl}/rooms/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async getTimeSlots(): Promise<CreneauHoraireEntity[]> {
    try {
      const res = await fetch(`${this.baseUrl}/rooms/time-slots`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch time slots', err);
      return [];
    }
  }

  public static async toggleTimeSlot(id: number, actif?: boolean): Promise<CreneauHoraireEntity> {
    const res = await fetch(`${this.baseUrl}/rooms/time-slots/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif })
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  // --- 2. EMPLOI DU TEMPS (T22 & T24) ---
  public static async getPlanning(filters?: Record<string, string>): Promise<{ metadata: EmploiDuTempsEntity; sessions: SeancePlanifieeEntity[] }> {
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`${this.baseUrl}/planning?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch planning', err);
      return { metadata: {} as any, sessions: [] };
    }
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

  public static async updateSessionStatus(id: number, statut: SeanceStatut, notes?: string): Promise<SeancePlanifieeEntity> {
    const res = await fetch(`${this.baseUrl}/planning/session/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut, notes })
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async deleteSession(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/planning/session/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async generateAutomaticPlanning(semaineDu?: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/planning/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ semaineDu })
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async publishPlanning(): Promise<EmploiDuTempsEntity> {
    const res = await fetch(`${this.baseUrl}/planning/publish`, { method: 'POST' });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  // --- 3. DÉTECTION CONFLITS (T23) ---
  public static async checkConflict(data: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/conflicts/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  // --- 4. CONTRAINTES (T25) ---
  public static async getConstraints(): Promise<ContraintePlanificationEntity[]> {
    try {
      const res = await fetch(`${this.baseUrl}/constraints`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch constraints', err);
      return [];
    }
  }

  public static async createConstraint(data: Partial<ContraintePlanificationEntity>): Promise<ContraintePlanificationEntity> {
    const res = await fetch(`${this.baseUrl}/constraints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async toggleConstraint(id: number, active?: boolean): Promise<ContraintePlanificationEntity> {
    const res = await fetch(`${this.baseUrl}/constraints/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }

  public static async deleteConstraint(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/constraints/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return await res.json();
  }
}
