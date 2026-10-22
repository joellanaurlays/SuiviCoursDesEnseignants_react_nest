import {
  ConflictDetail,
  ConflictSeverity,
  ContraintePlanificationEntity,
  SalleEntity,
  SeancePlanifieeEntity
} from '../types/schedule';

export interface ConflictCheckInput {
  seanceId?: number; // si modification d'une séance existante
  salleId: number;
  enseignantId: number;
  niveauId: number;
  codeNiveau: string;
  mentionNom: string;
  dateSeance: string; // YYYY-MM-DD
  creneauId: number;
  jourSemaine: string;
  heureDebut: string;
  heureFin: string;
  effectifPrevu?: number;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  hasBlockingError: boolean;
  canSave: boolean;
  conflicts: ConflictDetail[];
  alternativeRooms?: SalleEntity[];
  freeSlotsTeacher?: string[];
}

export class ConflictDetectorService {
  /**
   * Vérifie l'ensemble des règles de collision et de contraintes conformément
   * à l'algorithme UML (Diagramme d'activité 2.8 et Diagramme de séquence 2.5)
   */
  public static verifyConflicts(
    target: ConflictCheckInput,
    existingSessions: SeancePlanifieeEntity[],
    rooms: SalleEntity[],
    constraints: ContraintePlanificationEntity[] = []
  ): ConflictCheckResult {
    const conflicts: ConflictDetail[] = [];
    const targetRoom = rooms.find(r => r.id === target.salleId);

    // 1. Filtrer les séances qui ont lieu le même jour/date et qui ne sont pas celle en cours d'édition
    const sameTimeSessions = existingSessions.filter(s => {
      // Si c'est la même séance en édition, on l'ignore
      if (target.seanceId && s.id === target.seanceId) return false;
      // Ne pas prendre en compte les cours annulés
      if (s.statut === 'ANNULE') return false;

      // Correspondance date/créneau ou jour/heure
      const sameDateOrDay = (s.dateSeance && s.dateSeance === target.dateSeance) ||
                            (!target.dateSeance && s.jourSemaine === target.jourSemaine);

      const sameSlot = s.creneauId === target.creneauId ||
        (s.heureDebut === target.heureDebut && s.heureFin === target.heureFin);

      return sameDateOrDay && sameSlot;
    });

    // 2. CONTRÔLE 1 : Salle occupée simultanément ?
    const roomConflict = sameTimeSessions.find(s => s.salleId === target.salleId);
    if (roomConflict) {
      conflicts.push({
        id: `conf-salle-${roomConflict.id}`,
        type: 'SALLE_OCCUPEE',
        gravite: 'ERREUR_BLOQUANTE',
        titre: `Collision de Salle : ${roomConflict.nomSalle}`,
        message: `La salle "${roomConflict.nomSalle}" est déjà réservée sur ce créneau par le cours "${roomConflict.matiereNom}" (${roomConflict.codeNiveau} ${roomConflict.mentionNom}) assuré par ${roomConflict.nomEnseignant}.`,
        entitesEnConflit: {
          seanceIdExistante: roomConflict.id,
          matiereConflit: roomConflict.matiereNom,
          details: `Salle ${roomConflict.nomSalle} occupée`
        },
        resolutionSuggeree: `Sélectionner une autre salle disponible ou décaler le créneau horaire.`
      });
    }

    // 3. CONTRÔLE 2 : Enseignant disponible au même moment ?
    const teacherConflict = sameTimeSessions.find(s => s.enseignantId === target.enseignantId);
    if (teacherConflict) {
      conflicts.push({
        id: `conf-teacher-${teacherConflict.id}`,
        type: 'ENSEIGNANT_OCCUPE',
        gravite: 'ERREUR_BLOQUANTE',
        titre: `Enseignant Indisponible : ${teacherConflict.nomEnseignant}`,
        message: `L'enseignant ${teacherConflict.nomEnseignant} dispense déjà simultanément le cours "${teacherConflict.matiereNom}" en ${teacherConflict.nomSalle} pour la promotion ${teacherConflict.codeNiveau}.`,
        entitesEnConflit: {
          seanceIdExistante: teacherConflict.id,
          matiereConflit: teacherConflict.matiereNom,
          details: `Enseignant ${teacherConflict.nomEnseignant} déjà planifié`
        },
        resolutionSuggeree: `Déplacer la séance sur un créneau libre pour cet enseignant.`
      });
    }

    // 4. CONTRÔLE 3 : Promotion / Niveau ayant deux cours en même temps ?
    const classConflict = sameTimeSessions.find(s =>
      s.codeNiveau === target.codeNiveau && s.mentionNom === target.mentionNom
    );
    if (classConflict) {
      conflicts.push({
        id: `conf-class-${classConflict.id}`,
        type: 'NIVEAU_OCCUPE',
        gravite: 'ERREUR_BLOQUANTE',
        titre: `Double Emploi du Temps Étudiants : ${target.codeNiveau} ${target.mentionNom}`,
        message: `Les étudiants de ${target.codeNiveau} ${target.mentionNom} ont déjà le cours "${classConflict.matiereNom}" planifié en ${classConflict.nomSalle} à cet horaire.`,
        entitesEnConflit: {
          seanceIdExistante: classConflict.id,
          matiereConflit: classConflict.matiereNom,
          details: `Promotion ${target.codeNiveau} déjà en cours`
        },
        resolutionSuggeree: `Choisir un autre jour ou une autre tranche horaire sans cours pour ce niveau.`
      });
    }

    // 5. CONTRÔLE 4 : Vérification de la capacité de la salle
    if (targetRoom && target.effectifPrevu && target.effectifPrevu > targetRoom.capacite) {
      conflicts.push({
        id: `conf-capacity-${targetRoom.id}`,
        type: 'CAPACITE_DEPASSEE',
        gravite: 'AVERTISSEMENT',
        titre: `Capacité Insuffisante : ${targetRoom.nom}`,
        message: `La promotion compte ${target.effectifPrevu} étudiants alors que la salle "${targetRoom.nom}" ne dispose que de ${targetRoom.capacite} places assises (${target.effectifPrevu - targetRoom.capacite} places manquantes).`,
        entitesEnConflit: {
          details: `Effectif: ${target.effectifPrevu} / Capacité: ${targetRoom.capacite}`
        },
        resolutionSuggeree: `Privilégier un amphithéâtre plus grand (ex: Amphi A ou B).`
      });
    }

    // 6. CONTRÔLE 5 : Vérification des contraintes de planification actives (T25)
    for (const c of constraints.filter(x => x.active)) {
      if (c.typeContrainte === 'ENSEIGNANT' && c.cibleId === target.enseignantId) {
        if (c.regle.jourSemaine && c.regle.jourSemaine === target.jourSemaine) {
          if (!c.regle.creneauId || c.regle.creneauId === target.creneauId) {
            conflicts.push({
              id: `conf-rule-${c.id}`,
              type: 'CONTRAINTE_VIOLEE',
              gravite: c.niveauPriorite === 'BLOQUANTE' ? 'ERREUR_BLOQUANTE' : 'AVERTISSEMENT',
              titre: `Contrainte Enseignant : ${c.titre}`,
              message: `${c.cibleNom} a une contrainte : "${c.description}".`,
              entitesEnConflit: { details: c.description },
              resolutionSuggeree: `Respecter la disponibilité définie pour l'enseignant.`
            });
          }
        }
      }

      if (c.typeContrainte === 'SALLE' && c.cibleId === target.salleId) {
        if (targetRoom && targetRoom.statut === 'MAINTENANCE') {
          conflicts.push({
            id: `conf-salle-maint-${targetRoom.id}`,
            type: 'CONTRAINTE_VIOLEE',
            gravite: 'ERREUR_BLOQUANTE',
            titre: `Salle Indisponible : ${targetRoom.nom}`,
            message: `La salle "${targetRoom.nom}" est actuellement marquée en maintenance.`,
            entitesEnConflit: { details: 'Statut MAINTENANCE' },
            resolutionSuggeree: `Choisir une autre salle active.`
          });
        }
      }
    }

    // Suggestions de salles alternatives libres sur ce même créneau
    const busyRoomIds = new Set(sameTimeSessions.map(s => s.salleId));
    const alternativeRooms = rooms.filter(r =>
      r.id !== target.salleId &&
      r.statut === 'ACTIF' &&
      !busyRoomIds.has(r.id) &&
      (!target.effectifPrevu || r.capacite >= target.effectifPrevu)
    );

    const hasBlockingError = conflicts.some(c => c.gravite === 'ERREUR_BLOQUANTE');

    return {
      hasConflict: conflicts.length > 0,
      hasBlockingError,
      canSave: !hasBlockingError,
      conflicts,
      alternativeRooms
    };
  }

  /**
   * Effectue un audit complet de toutes les séances d'un planning pour identifier
   * tous les conflits existants (ex: lors d'import ou de recalcul global)
   */
  public static auditFullSchedule(
    sessions: SeancePlanifieeEntity[],
    rooms: SalleEntity[],
    constraints: ContraintePlanificationEntity[] = []
  ): Map<number, ConflictDetail[]> {
    const resultMap = new Map<number, ConflictDetail[]>();

    for (let i = 0; i < sessions.length; i++) {
      const s1 = sessions[i];
      if (s1.statut === 'ANNULE') continue;

      const currentConflicts: ConflictDetail[] = [];

      for (let j = 0; j < sessions.length; j++) {
        if (i === j) continue;
        const s2 = sessions[j];
        if (s2.statut === 'ANNULE') continue;

        const sameTime = (
          (s1.dateSeance === s2.dateSeance || s1.jourSemaine === s2.jourSemaine) &&
          (s1.creneauId === s2.creneauId || (s1.heureDebut === s2.heureDebut && s1.heureFin === s2.heureFin))
        );

        if (!sameTime) continue;

        // Même salle
        if (s1.salleId === s2.salleId) {
          currentConflicts.push({
            id: `audit-room-${s1.id}-${s2.id}`,
            type: 'SALLE_OCCUPEE',
            gravite: 'ERREUR_BLOQUANTE',
            titre: `Conflit de Salle : ${s1.nomSalle}`,
            message: `Occupée en simultané par "${s2.matiereNom}" (${s2.codeNiveau} ${s2.mentionNom}).`,
            entitesEnConflit: { seanceIdExistante: s2.id, matiereConflit: s2.matiereNom }
          });
        }

        // Même enseignant
        if (s1.enseignantId === s2.enseignantId) {
          currentConflicts.push({
            id: `audit-teacher-${s1.id}-${s2.id}`,
            type: 'ENSEIGNANT_OCCUPE',
            gravite: 'ERREUR_BLOQUANTE',
            titre: `Conflit Enseignant : ${s1.nomEnseignant}`,
            message: `Enseigne en même temps le cours "${s2.matiereNom}" en ${s2.nomSalle}.`,
            entitesEnConflit: { seanceIdExistante: s2.id, matiereConflit: s2.matiereNom }
          });
        }

        // Même classe / promo
        if (s1.codeNiveau === s2.codeNiveau && s1.mentionNom === s2.mentionNom) {
          currentConflicts.push({
            id: `audit-class-${s1.id}-${s2.id}`,
            type: 'NIVEAU_OCCUPE',
            gravite: 'ERREUR_BLOQUANTE',
            titre: `Double cours : ${s1.codeNiveau} ${s1.mentionNom}`,
            message: `Les étudiants ont déjà le cours "${s2.matiereNom}".`,
            entitesEnConflit: { seanceIdExistante: s2.id, matiereConflit: s2.matiereNom }
          });
        }
      }

      if (currentConflicts.length > 0) {
        resultMap.set(s1.id, currentConflicts);
      }
    }

    return resultMap;
  }
}
