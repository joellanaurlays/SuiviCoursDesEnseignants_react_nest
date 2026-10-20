import { DataStore } from '../database/data-store';
import { CheckConflictDto, ConflictDetailDto, ConflictResponseDto } from '../dto/check-conflict.dto';

export class ConflictDetectorService {
  private store = DataStore.getInstance();

  /**
   * Vérification logique stricte des conflits
   * Renvoie un statut HTTP 409 si au moins un conflit bloquant est détecté.
   */
  async checkConflicts(dto: CheckConflictDto): Promise<ConflictResponseDto> {
    const conflicts: ConflictDetailDto[] = [];
    const targetRoom = this.store.rooms.find(r => r.id === dto.salleId);

    // Filtrer les séances existantes sur la même date et même tranche horaire
    const sameSlotSessions = this.store.sessions.filter(s => {
      if (dto.seanceId && s.id === dto.seanceId) return false;
      if (s.statut === 'ANNULE') return false;

      const sameDateOrDay = (s.dateSeance && s.dateSeance === dto.dateSeance) || 
                            (!dto.dateSeance && s.jourSemaine === dto.jourSemaine);
      
      const sameSlot = s.creneauId === dto.creneauId ||
        (s.heureDebut === dto.heureDebut && s.heureFin === dto.heureFin);

      return sameDateOrDay && sameSlot;
    });

    // 1. CONTRÔLE 1 : Salle occupée simultanément ?
    const roomConflict = sameSlotSessions.find(s => s.salleId === dto.salleId);
    if (roomConflict) {
      conflicts.push({
        id: `conf-salle-${roomConflict.id}`,
        type: 'SALLE_OCCUPEE',
        gravite: 'ERREUR_BLOQUANTE',
        titre: `Collision de Salle : ${roomConflict.nomSalle}`,
        message: `La salle "${roomConflict.nomSalle}" est déjà réservée par le cours "${roomConflict.matiereNom}" (${roomConflict.codeNiveau} ${roomConflict.mentionNom}) dispensé par ${roomConflict.nomEnseignant}.`,
        entitesEnConflit: {
          seanceIdExistante: roomConflict.id,
          matiereConflit: roomConflict.matiereNom,
          details: `Salle ${roomConflict.nomSalle} occupée`
        },
        resolutionSuggeree: `Sélectionner une autre salle disponible ou choisir une tranche horaire libre.`
      });
    }

    // 2. CONTRÔLE 2 : Enseignant indisponible au même moment ?
    const teacherConflict = sameSlotSessions.find(s => s.enseignantId === dto.enseignantId);
    if (teacherConflict) {
      conflicts.push({
        id: `conf-teacher-${teacherConflict.id}`,
        type: 'ENSEIGNANT_OCCUPE',
        gravite: 'ERREUR_BLOQUANTE',
        titre: `Enseignant Indisponible : ${teacherConflict.nomEnseignant}`,
        message: `L'enseignant ${teacherConflict.nomEnseignant} donne déjà en simultané le cours "${teacherConflict.matiereNom}" en ${teacherConflict.nomSalle} pour la promotion ${teacherConflict.codeNiveau}.`,
        entitesEnConflit: {
          seanceIdExistante: teacherConflict.id,
          matiereConflit: teacherConflict.matiereNom,
          details: `Enseignant ${teacherConflict.nomEnseignant} déjà en cours`
        },
        resolutionSuggeree: `Planifier sur un autre jour ou une heure où l'enseignant est libre.`
      });
    }

    // 3. CONTRÔLE 3 : Promotion / Niveau ayant deux cours en même temps ?
    const classConflict = sameSlotSessions.find(s => 
      s.codeNiveau === dto.codeNiveau && s.mentionNom === dto.mentionNom
    );
    if (classConflict) {
      conflicts.push({
        id: `conf-class-${classConflict.id}`,
        type: 'NIVEAU_OCCUPE',
        gravite: 'ERREUR_BLOQUANTE',
        titre: `Double Emploi du Temps Étudiants : ${dto.codeNiveau} ${dto.mentionNom}`,
        message: `Les étudiants de ${dto.codeNiveau} ${dto.mentionNom} ont déjà le cours "${classConflict.matiereNom}" en ${classConflict.nomSalle} à cet horaire.`,
        entitesEnConflit: {
          seanceIdExistante: classConflict.id,
          matiereConflit: classConflict.matiereNom,
          details: `Promotion ${dto.codeNiveau} déjà en cours`
        },
        resolutionSuggeree: `Décaler le cours sur un créneau sans cours pour cette classe.`
      });
    }

    // 4. CONTRÔLE 4 : Capacité de la salle
    if (targetRoom && dto.effectifPrevu && dto.effectifPrevu > targetRoom.capacite) {
      conflicts.push({
        id: `conf-capa-${targetRoom.id}`,
        type: 'CAPACITE_DEPASSEE',
        gravite: 'AVERTISSEMENT',
        titre: `Capacité Insuffisante : ${targetRoom.nom}`,
        message: `L'effectif prévu (${dto.effectifPrevu} étudiants) dépasse la capacité assise (${targetRoom.capacite} places) de la salle "${targetRoom.nom}".`,
        entitesEnConflit: {
          details: `Effectif: ${dto.effectifPrevu} / Capacité: ${targetRoom.capacite}`
        },
        resolutionSuggeree: `Privilégier un amphithéâtre plus grand (ex: Amphi A).`
      });
    }

    // 5. CONTRÔLE 5 : Contraintes métiers (T25)
    for (const c of this.store.constraints.filter(x => x.active)) {
      if (c.typeContrainte === 'ENSEIGNANT' && c.cibleId === dto.enseignantId) {
        if (c.regle.jourSemaine && c.regle.jourSemaine === dto.jourSemaine) {
          if (!c.regle.creneauId || c.regle.creneauId === dto.creneauId) {
            conflicts.push({
              id: `conf-cst-${c.id}`,
              type: 'CONTRAINTE_VIOLEE',
              gravite: c.niveauPriorite === 'BLOQUANTE' ? 'ERREUR_BLOQUANTE' : 'AVERTISSEMENT',
              titre: `Contrainte Enseignant : ${c.titre}`,
              message: `${c.cibleNom} a une contrainte déclarée : "${c.description}".`,
              entitesEnConflit: { details: c.description },
              resolutionSuggeree: `Respecter l'indisponibilité de l'enseignant.`
            });
          }
        }
      }
    }

    // Salles alternatives libres sur ce créneau
    const busyRoomIds = new Set(sameSlotSessions.map(s => s.salleId));
    const alternativeRooms = this.store.rooms
      .filter(r => r.id !== dto.salleId && r.statut === 'ACTIF' && !busyRoomIds.has(r.id))
      .map(r => ({ id: r.id, nom: r.nom, capacite: r.capacite, typeSalle: r.typeSalle }));

    const hasBlockingError = conflicts.some(c => c.gravite === 'ERREUR_BLOQUANTE');

    return {
      hasConflict: conflicts.length > 0,
      hasBlockingError,
      canSave: !hasBlockingError,
      conflicts,
      alternativeRooms
    };
  }
}
