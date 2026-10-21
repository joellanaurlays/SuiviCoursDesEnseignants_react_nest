import { DataStore } from '../database/data-store.js';
import { CreateSeanceDto, UpdateSeanceStatusDto } from '../dto/create-seance.dto.js';
import { GeneratePlanningDto, GenerationSummaryDto } from '../dto/generate-planning.dto.js';
import { SeancePlanifieeEntity, SeanceStatut } from '../entities/seance-planifiee.entity.js';
import { EmploiDuTempsEntity } from '../entities/emploi-du-temps.entity.js';
import { ConflictDetectorService } from './conflict-detector.service.js';

export class ConflictException extends Error {
  public statusCode = 409;
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ConflictException';
    this.details = details;
  }
}

export class PlanningService {
  private store = DataStore.getInstance();
  private conflictDetector = new ConflictDetectorService();

  /**
   * Consultation de l'Emploi du Temps (T24)
   * Filtres dynamiques par niveau, enseignant, salle, mention, semestre
   */
  async getPlanning(filters?: {
    niveauId?: number;
    codeNiveau?: string;
    mentionNom?: string;
    enseignantId?: number;
    nomEnseignant?: string;
    salleId?: number;
    semestreNom?: string;
    statut?: string;
  }): Promise<{ metadata: EmploiDuTempsEntity; sessions: SeancePlanifieeEntity[] }> {
    let list = [...this.store.sessions];

    if (filters?.codeNiveau && filters.codeNiveau !== 'Tous') {
      list = list.filter(s => s.codeNiveau === filters.codeNiveau);
    }
    if (filters?.mentionNom && filters.mentionNom !== 'Toutes') {
      list = list.filter(s => s.mentionNom === filters.mentionNom);
    }
    if (filters?.nomEnseignant && filters.nomEnseignant !== 'Tous') {
      list = list.filter(s => s.nomEnseignant === filters.nomEnseignant);
    }
    if (filters?.salleId) {
      list = list.filter(s => s.salleId === Number(filters.salleId));
    }
    if (filters?.statut && filters.statut !== 'Tous') {
      list = list.filter(s => s.statut === filters.statut);
    }

    await this.store.save();
    return {
      metadata: this.store.scheduleMeta,
      sessions: list
    };
  }

  /**
   * Création / Planification d'une séance avec vérification des conflits (T22 & T23)
   */
  async createSession(dto: CreateSeanceDto): Promise<SeancePlanifieeEntity> {
    const conflictResult = await this.conflictDetector.checkConflicts({
      salleId: dto.salleId,
      enseignantId: dto.enseignantId,
      niveauId: dto.niveauId,
      codeNiveau: dto.codeNiveau,
      mentionNom: dto.mentionNom,
      dateSeance: dto.dateSeance,
      creneauId: dto.creneauId,
      jourSemaine: dto.jourSemaine,
      heureDebut: dto.heureDebut,
      heureFin: dto.heureFin
    });

    if (conflictResult.hasBlockingError && !dto.forceSaveWithConflict) {
      throw new ConflictException(
        `Impossible d'enregistrer la séance : un conflit bloquant a été détecté.`,
        conflictResult
      );
    }

    const room = this.store.rooms.find(r => r.id === dto.salleId);
    const nextId = Math.max(0, ...this.store.sessions.map(s => s.id)) + 1;

    const newSession = new SeancePlanifieeEntity({
      id: nextId,
      emploiDuTempsId: dto.emploiDuTempsId || this.store.scheduleMeta.id,
      enseignementId: dto.enseignementId,
      codeMatiere: dto.codeMatiere,
      matiereNom: dto.matiereNom,
      typeSeance: dto.typeSeance,
      enseignantId: dto.enseignantId,
      nomEnseignant: dto.nomEnseignant,
      niveauId: dto.niveauId,
      codeNiveau: dto.codeNiveau,
      mentionNom: dto.mentionNom,
      semestreNom: dto.semestreNom || this.store.scheduleMeta.semestreNom,
      salleId: dto.salleId,
      nomSalle: room ? room.nom : dto.nomSalle || 'Salle',
      creneauId: dto.creneauId,
      jourSemaine: dto.jourSemaine,
      heureDebut: dto.heureDebut,
      heureFin: dto.heureFin,
      dateSeance: dto.dateSeance,
      statut: conflictResult.hasConflict ? 'EN_CONFLIT' : (dto.statut || 'VALIDE'),
      notes: dto.notes || ''
    });

    this.store.sessions.push(newSession);
    await this.store.save();
    return newSession;
  }

  /**
   * Mise à jour du statut dans le cycle de vie d'une séance (T24)
   */
  async updateSessionStatus(id: number, dto: UpdateSeanceStatusDto): Promise<SeancePlanifieeEntity> {
    const session = this.store.sessions.find(s => s.id === id);
    if (!session) throw new Error(`Séance #${id} introuvable`);

    session.statut = dto.statut;
    if (dto.notes !== undefined) {
      session.notes = dto.notes;
    }
    await this.store.save();
    return session;
  }

  async updateSession(id: number, changes: Partial<SeancePlanifieeEntity>): Promise<SeancePlanifieeEntity> {
    const current = this.store.sessions.find(item => item.id === id);
    if (!current) throw new Error(`Séance #${id} introuvable`);
    const session = { ...current, ...changes, id };
    const room = this.store.rooms.find(item => item.id === session.salleId);
    const slot = this.store.timeSlots.find(item => item.id === session.creneauId);
    if (room) session.nomSalle = room.nom;
    if (slot) {
      session.jourSemaine = slot.jourSemaine;
      session.heureDebut = slot.heureDebut;
      session.heureFin = slot.heureFin;
    }
    const teaching = this.store.teachings.find(item => item.id === session.enseignementId);
    const conflict = await this.conflictDetector.checkConflicts({
      seanceId: id, salleId: session.salleId, enseignantId: session.enseignantId,
      niveauId: session.niveauId, codeNiveau: session.codeNiveau, mentionNom: session.mentionNom,
      dateSeance: session.dateSeance, creneauId: session.creneauId, jourSemaine: session.jourSemaine,
      heureDebut: session.heureDebut, heureFin: session.heureFin, effectifPrevu: teaching?.effectifEtudiants,
    });
    if (conflict.hasBlockingError) throw new ConflictException('La modification crée un conflit bloquant.', conflict);
    Object.assign(current, session);
    await this.store.save();
    return current;
  }

  /**
   * Suppression d'une séance
   */
  async deleteSession(id: number): Promise<{ success: boolean; message: string }> {
    const index = this.store.sessions.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Séance #${id} introuvable`);

    this.store.sessions.splice(index, 1);
    await this.store.save();
    return { success: true, message: `Séance #${id} supprimée avec succès.` };
  }

  /**
   * Génération automatique de l'emploi du temps sans conflit (T22)
   */
  async generateAutomaticPlanning(dto: GeneratePlanningDto): Promise<GenerationSummaryDto> {
    await this.store.refreshTeachings();
    const baseDateWeek = dto.semaineDu || this.store.scheduleMeta.semaineDu;
    const dayOffsets: Record<string, number> = {
      'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4, 'Samedi': 5
    };

    let generatedCount = 0;
    let generatedHours = 0;
    const skippedCourses: Array<{ codeMatiere: string; nomMatiere: string; motif: string }> = [];
    let nextId = Math.max(0, ...this.store.sessions.map(s => s.id)) + 1;

    for (const teaching of this.store.teachings) {
      const remainingHours = teaching.volumeHoraireTotal - teaching.heuresPlanifiees;
      if (remainingHours <= 0) continue;

      // Chercher une salle compatible
      const suitableRooms = this.store.rooms
        .filter(r => r.statut === 'ACTIF' && r.capacite >= teaching.effectifEtudiants)
        .sort((a, b) => {
          if (a.typeSalle === teaching.typeSalleRequis && b.typeSalle !== teaching.typeSalleRequis) return -1;
          if (b.typeSalle === teaching.typeSalleRequis && a.typeSalle !== teaching.typeSalleRequis) return 1;
          return a.capacite - b.capacite;
        });

      if (suitableRooms.length === 0) {
        skippedCourses.push({
          codeMatiere: teaching.codeMatiere,
          nomMatiere: teaching.nomMatiere,
          motif: `Capacité insuffisante pour ${teaching.effectifEtudiants} étudiants.`
        });
        continue;
      }

      let placed = false;
      for (const slot of this.store.timeSlots.filter(s => s.actif)) {
        if (placed) break;

        const offset = dayOffsets[slot.jourSemaine] ?? 0;
        const sessionDate = new Date(`${baseDateWeek}T00:00:00Z`);
        sessionDate.setDate(sessionDate.getDate() + offset);
        const dateStr = sessionDate.toISOString().split('T')[0];

        for (const room of suitableRooms) {
          const conflict = await this.conflictDetector.checkConflicts({
            salleId: room.id,
            enseignantId: teaching.enseignantId,
            niveauId: teaching.niveauId,
            codeNiveau: teaching.codeNiveau,
            mentionNom: teaching.mentionNom,
            dateSeance: dateStr,
            creneauId: slot.id,
            jourSemaine: slot.jourSemaine,
            heureDebut: slot.heureDebut,
            heureFin: slot.heureFin,
            effectifPrevu: teaching.effectifEtudiants
          });

          if (!conflict.hasConflict) {
            this.store.sessions.push(new SeancePlanifieeEntity({
              id: nextId++,
              emploiDuTempsId: this.store.scheduleMeta.id,
              enseignementId: teaching.id,
              codeMatiere: teaching.codeMatiere,
              matiereNom: teaching.nomMatiere,
              typeSeance: teaching.typeSalleRequis === 'SALLE_TP' ? 'TP' : 'CM',
              enseignantId: teaching.enseignantId,
              nomEnseignant: teaching.nomEnseignant,
              niveauId: teaching.niveauId,
              codeNiveau: teaching.codeNiveau,
              mentionNom: teaching.mentionNom,
              semestreNom: teaching.semestreNom,
              salleId: room.id,
              nomSalle: room.nom,
              creneauId: slot.id,
              jourSemaine: slot.jourSemaine,
              heureDebut: slot.heureDebut,
              heureFin: slot.heureFin,
              dateSeance: dateStr,
              statut: 'VALIDE',
              notes: 'Généré automatiquement par le moteur sans conflit'
            }));
            teaching.heuresPlanifiees += slot.dureeMinutes / 60;
            generatedCount++;
            generatedHours += slot.dureeMinutes / 60;
            await this.store.save();
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        skippedCourses.push({
          codeMatiere: teaching.codeMatiere,
          nomMatiere: teaching.nomMatiere,
          motif: `Créneau sans conflit introuvable pour ${teaching.nomEnseignant}.`
        });
      }
    }

    return {
      success: generatedCount > 0,
      generatedSessionsCount: generatedCount,
      totalPlannedHours: generatedHours,
      message: `${generatedCount} séances générées (${generatedHours} heures).`,
      skippedCourses
    };
  }

  /**
   * Publication officielle de l'emploi du temps
   */
  async publishPlanning(): Promise<EmploiDuTempsEntity> {
    this.store.scheduleMeta.publish();
    // Passer toutes les séances validées à PLANIFIE
    this.store.sessions.forEach(s => {
      if (s.statut === 'VALIDE' || s.statut === 'BROUILLON') {
        s.statut = 'PLANIFIE';
      }
    });
    await this.store.save();
    return this.store.scheduleMeta;
  }
}
