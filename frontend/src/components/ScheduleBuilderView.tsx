import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Building2, 
  User, 
  BookOpen, 
  RefreshCw, 
  ShieldAlert, 
  Send, 
  X,
  HelpCircle
} from 'lucide-react';
import { 
  ContraintePlanificationEntity, 
  CreneauHoraireEntity, 
  CurrentUserSession, 
  DayOfWeek, 
  EmploiDuTempsEntity, 
  EnseignementEntity, 
  SalleEntity, 
  SeancePlanifieeEntity, 
  ConflictDetail 
} from '../types/schedule';
import { ConflictDetectorService, ConflictCheckResult } from '../services/ConflictDetectorService';
import { ApiClient } from '../services/apiClient';

interface ScheduleBuilderViewProps {
  sessions: SeancePlanifieeEntity[];
  setSessions: React.Dispatch<React.SetStateAction<SeancePlanifieeEntity[]>>;
  rooms: SalleEntity[];
  timeSlots: CreneauHoraireEntity[];
  teachings: EnseignementEntity[];
  constraints: ContraintePlanificationEntity[];
  scheduleMeta: EmploiDuTempsEntity;
  setScheduleMeta: React.Dispatch<React.SetStateAction<EmploiDuTempsEntity | null>>;
  currentUser: CurrentUserSession;
  editingSession: SeancePlanifieeEntity | null;
  setEditingSession: (s: SeancePlanifieeEntity | null) => void;
}

export const ScheduleBuilderView: React.FC<ScheduleBuilderViewProps> = ({
  sessions,
  setSessions,
  rooms,
  timeSlots,
  teachings,
  constraints,
  scheduleMeta,
  setScheduleMeta,
  currentUser,
  editingSession,
  setEditingSession
}) => {
  // Form State for planning a new or editing a session
  const [selectedTeachingId, setSelectedTeachingId] = useState<number>(teachings[0]?.id ?? 0);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(timeSlots[0]?.id ?? 0);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id ?? 0);
  const [sessionType, setSessionType] = useState<'CM' | 'TD' | 'TP'>('CM');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Generation notification / feedback
  const [generationReport, setGenerationReport] = useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedTeachingId && teachings[0]) setSelectedTeachingId(teachings[0].id);
    if (!selectedSlotId && timeSlots[0]) setSelectedSlotId(timeSlots[0].id);
    if (!selectedRoomId && rooms[0]) setSelectedRoomId(rooms[0].id);
  }, [teachings, timeSlots, rooms, selectedTeachingId, selectedSlotId, selectedRoomId]);

  // Sync form when editingSession changes
  React.useEffect(() => {
    if (editingSession) {
      setSelectedTeachingId(editingSession.enseignementId);
      setSelectedSlotId(editingSession.creneauId);
      setSelectedRoomId(editingSession.salleId);
      setSessionType(editingSession.typeSeance);
      setSessionNotes(editingSession.notes || '');
      setSessionDate(editingSession.dateSeance || new Date().toISOString().slice(0, 10));
    }
  }, [editingSession]);

  const selectedTeaching = useMemo(() => 
    teachings.find(t => t.id === Number(selectedTeachingId)) || teachings[0],
    [teachings, selectedTeachingId]
  );

  const selectedSlot = useMemo(() => 
    timeSlots.find(s => s.id === Number(selectedSlotId)) || timeSlots[0],
    [timeSlots, selectedSlotId]
  );

  const selectedRoom = useMemo(() => 
    rooms.find(r => r.id === Number(selectedRoomId)) || rooms[0],
    [rooms, selectedRoomId]
  );

  // Real-time conflict detection on form inputs (T23)
  const conflictReport: ConflictCheckResult = useMemo(() => {
    if (!selectedTeaching || !selectedSlot || !selectedRoom) {
      return { hasConflict: false, hasBlockingError: false, canSave: true, conflicts: [] };
    }

    return ConflictDetectorService.verifyConflicts(
      {
        seanceId: editingSession ? editingSession.id : undefined,
        salleId: selectedRoom.id,
        enseignantId: selectedTeaching.enseignantId,
        niveauId: selectedTeaching.niveauId,
        codeNiveau: selectedTeaching.codeNiveau,
        mentionNom: selectedTeaching.mentionNom,
        dateSeance: sessionDate,
        creneauId: selectedSlot.id,
        jourSemaine: selectedSlot.jourSemaine,
        heureDebut: selectedSlot.heureDebut,
        heureFin: selectedSlot.heureFin,
        effectifPrevu: selectedTeaching.effectifEtudiants
      },
      sessions,
      rooms,
      constraints
    );
  }, [selectedTeaching, selectedSlot, selectedRoom, sessionDate, sessions, rooms, constraints, editingSession]);

  // Handle Save / Add Session
  const handleSaveSession = async (forceSaveWithConflict = false) => {
    if (!selectedTeaching || !selectedSlot || !selectedRoom) return;

    if (conflictReport.hasBlockingError && !forceSaveWithConflict) {
      return; // Block save if strict collision
    }

    const newStatut = conflictReport.hasConflict ? 'EN_CONFLIT' : 'VALIDE';

    const sessionData = {
            enseignementId: selectedTeaching.id,
            codeMatiere: selectedTeaching.codeMatiere,
            matiereNom: selectedTeaching.nomMatiere,
            typeSeance: sessionType,
            enseignantId: selectedTeaching.enseignantId,
            nomEnseignant: selectedTeaching.nomEnseignant,
            niveauId: selectedTeaching.niveauId,
            codeNiveau: selectedTeaching.codeNiveau,
            mentionNom: selectedTeaching.mentionNom,
            semestreNom: selectedTeaching.semestreNom,
            salleId: selectedRoom.id,
            nomSalle: selectedRoom.nom,
            creneauId: selectedSlot.id,
            jourSemaine: selectedSlot.jourSemaine,
            heureDebut: selectedSlot.heureDebut,
            heureFin: selectedSlot.heureFin,
            dateSeance: sessionDate,
            statut: newStatut,
            conflits: conflictReport.conflicts,
            notes: sessionNotes,
            forceSaveWithConflict,
            emploiDuTempsId: scheduleMeta.id,
    };

    try {
      const savedSession = editingSession
        ? await ApiClient.updateSession(editingSession.id, sessionData)
        : await ApiClient.createSession(sessionData);
      if (editingSession) {
        setSessions(prev => prev.map(session => session.id === savedSession.id ? savedSession : session));
        setEditingSession(null);
      } else {
        setSessions(prev => [...prev, savedSession]);
      }
      setSessionNotes('');
    } catch (error) {
      setGenerationReport(error instanceof Error ? error.message : 'Impossible d’enregistrer la séance.');
    }
  };

  // Run automated planning algorithm (T22)
  const handleAutoGenerate = async () => {
    try {
      const result = await ApiClient.generateAutomaticPlanning(scheduleMeta.semaineDu);
      const planning = await ApiClient.getPlanning();
      setSessions(planning.sessions);
      setGenerationReport(result.message);
    } catch (error) {
      setGenerationReport(error instanceof Error ? error.message : 'Impossible de générer le planning.');
    }
  };

  // Resolve conflict by moving to an available slot/room
  const handleAutoResolveConflict = async (sessionId: number) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (!targetSession) return;
    const requiredCapacity = teachings.find(teaching => teaching.id === targetSession.enseignementId)?.effectifEtudiants || 0;

    // Find first free slot & room
    for (const slot of timeSlots) {
      for (const room of rooms.filter(r => r.statut === 'ACTIF' && r.capacite >= requiredCapacity)) {
        const check = ConflictDetectorService.verifyConflicts(
          {
            seanceId: targetSession.id,
            salleId: room.id,
            enseignantId: targetSession.enseignantId,
            niveauId: targetSession.niveauId,
            codeNiveau: targetSession.codeNiveau,
            mentionNom: targetSession.mentionNom,
            dateSeance: targetSession.dateSeance,
            creneauId: slot.id,
            jourSemaine: slot.jourSemaine,
            heureDebut: slot.heureDebut,
            heureFin: slot.heureFin
          },
          sessions,
          rooms,
          constraints
        );

        if (!check.hasConflict) {
          // Resolved!
          try {
            const updated = await ApiClient.updateSession(sessionId, {
              salleId: room.id, creneauId: slot.id, statut: 'VALIDE',
              jourSemaine: slot.jourSemaine, heureDebut: slot.heureDebut, heureFin: slot.heureFin,
            });
            setSessions(prev => prev.map(session => session.id === sessionId ? updated : session));
            setGenerationReport(`Séance réaffectée en ${room.nom} le ${slot.jourSemaine} (${slot.heureDebut} - ${slot.heureFin}).`);
          } catch (error) {
            setGenerationReport(error instanceof Error ? error.message : 'Impossible de déplacer la séance.');
          }
          return;
        }
      }
    }
  };

  // Publication of timetable
  const handlePublishTimetable = async () => {
    try {
      const published = await ApiClient.publishPlanning();
      const planning = await ApiClient.getPlanning();
      setScheduleMeta(published);
      setSessions(planning.sessions);
      setGenerationReport('Emploi du temps publié.');
    } catch (error) {
      setGenerationReport(error instanceof Error ? error.message : 'Impossible de publier le planning.');
    }
  };

  // Find all current conflicts across the schedule
  const allCurrentConflicts = useMemo(() => {
    const list: { session: SeancePlanifieeEntity; conflicts: ConflictDetail[] }[] = [];
    sessions.forEach(s => {
      const check = ConflictDetectorService.verifyConflicts(
        {
          seanceId: s.id,
          salleId: s.salleId,
          enseignantId: s.enseignantId,
          niveauId: s.niveauId,
          codeNiveau: s.codeNiveau,
          mentionNom: s.mentionNom,
          dateSeance: s.dateSeance,
          creneauId: s.creneauId,
          jourSemaine: s.jourSemaine,
          heureDebut: s.heureDebut,
          heureFin: s.heureFin
        },
        sessions,
        rooms,
        constraints
      );
      if (check.hasConflict) {
        list.push({ session: s, conflicts: check.conflicts });
      }
    });
    return list;
  }, [sessions, rooms, constraints]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Workflow state & publication (T22) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0077B6]">Cycle de Vie du Planning</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold">
                Version {scheduleMeta.version}.0
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#03045E] mt-0.5">
              {scheduleMeta.titre}
            </h2>
            <p className="text-xs text-slate-500">
              Année universitaire {scheduleMeta.anneeUniversitaire} • Dernière mise à jour : {scheduleMeta.dateMiseAJour}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAutoGenerate}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
              title="Générer automatiquement les cours non encore planifiés sans collision"
            >
              <Sparkles className="w-4 h-4" />
              <span>Générateur Automatique</span>
            </button>

            {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
              <button
                onClick={handlePublishTimetable}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#03045E] hover:bg-[#0077B6] text-white text-xs font-bold shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00B4D8]" />
                <span>Publier le Planning Officiel</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow State Bar (Diagramme d'état 2.7 du PDF) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="font-bold text-slate-700 block">1. Saisie / Brouillon</span>
              <span className="text-[10px] text-slate-500">Création manuelle ou import</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${allCurrentConflicts.length > 0 ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
              <span className="font-bold block">2. Audit & Conflits</span>
              <span className="text-[10px]">{allCurrentConflicts.length > 0 ? `${allCurrentConflicts.length} conflit(s) à corriger` : '0 conflit (Vérifié)'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${scheduleMeta.estValide ? 'bg-[#CAF0F8] border-[#0077B6] text-[#03045E]' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <span className="font-bold block">3. Validation Scolarité</span>
              <span className="text-[10px]">{scheduleMeta.estValide ? 'Conforme aux maquettes' : 'En attente'}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${scheduleMeta.estPublie ? 'bg-[#03045E] text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <span className="font-bold block">4. Publication Publique</span>
              <span className="text-[10px]">{scheduleMeta.estPublie ? 'Diffusé aux étudiants' : 'Non publié'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Report Banner if any */}
      {generationReport && (
        <div className="p-4 rounded-2xl bg-[#CAF0F8] border border-[#0077B6]/30 text-xs text-[#03045E] flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#0077B6] shrink-0" />
            <span>{generationReport}</span>
          </div>
          <button 
            onClick={() => setGenerationReport(null)}
            className="text-slate-500 hover:text-slate-800 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Conflicts Alert Center (T23) */}
      {allCurrentConflicts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="text-sm font-bold text-rose-900">
                Centre de Résolution des Conflits ({allCurrentConflicts.length} séance(s) en anomalie)
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800">
              HTTP 409 Conflict Detector
            </span>
          </div>
          <p className="text-xs text-rose-700">
            Conformément aux spécifications UML (diagramme d'activité 2.8), ces séances ne peuvent être publiées car elles violent une ou plusieurs contraintes d'unicité spatio-temporelle.
          </p>

          <div className="space-y-2 mt-2">
            {allCurrentConflicts.map(({ session, conflicts }) => (
              <div key={session.id} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{session.matiereNom}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {session.codeNiveau} {session.mentionNom}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {session.jourSemaine} {session.heureDebut} - {session.heureFin} ({session.nomSalle})
                    </span>
                  </div>
                  {conflicts.map(c => (
                    <div key={c.id} className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>{c.message}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAutoResolveConflict(session.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#0077B6] hover:bg-[#03045E] text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Résoudre</span>
                  </button>
                  <button
                    onClick={() => setEditingSession(session)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Éditer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Builder Form & Real-time Conflict Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Planning Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#03045E] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#0077B6]" />
                {editingSession ? `Modifier la Séance #${editingSession.id}` : 'Planifier une Nouvelle Séance'}
              </h3>
              <p className="text-xs text-slate-500">
                Affectation d'un enseignement à un créneau horaire et une salle de cours.
              </p>
            </div>
            {editingSession && (
              <button
                onClick={() => setEditingSession(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
              >
                Annuler l'édition
              </button>
            )}
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Choix de l'Enseignement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Sélectionner l'Enseignement & Matière *
              </label>
              <select
                aria-label="Sélectionner l'enseignement et matière"
                value={selectedTeachingId}
                onChange={(e) => setSelectedTeachingId(Number(e.target.value))}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-800"
              >
                {teachings.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.codeNiveau} {t.mentionNom}] {t.codeMatiere} - {t.nomMatiere} ({t.nomEnseignant}) — {t.effectifEtudiants} étud.
                  </option>
                ))}
              </select>

              {selectedTeaching && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Enseignant :</span>
                    <span className="font-bold text-[#03045E]">{selectedTeaching.nomEnseignant}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Niveau / Promo :</span>
                    <span className="font-bold text-[#0077B6]">{selectedTeaching.codeNiveau} {selectedTeaching.mentionNom}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Effectif :</span>
                    <span className="font-bold text-slate-800">{selectedTeaching.effectifEtudiants} étudiants</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Type de salle requis :</span>
                    <span className="font-bold text-slate-800">{selectedTeaching.typeSalleRequis}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Choix de la Date & Créneau Horaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Créneau Horaire EMIT *
                </label>
                <select
                  aria-label="Sélectionner le créneau horaire"
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-800"
                >
                  {timeSlots.map(slot => (
                    <option key={slot.id} value={slot.id}>
                      {slot.jourSemaine} : {slot.heureDebut} - {slot.heureFin} ({slot.plage})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date de la Séance (Optionnel)
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* 3. Choix de la Salle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  3. Salle de Cours *
                </label>
                {selectedRoom && selectedTeaching && selectedRoom.capacite < selectedTeaching.effectifEtudiants && (
                  <span className="text-[11px] text-amber-600 font-semibold">
                    ⚠️ Capacité inférieure à l'effectif
                  </span>
                )}
              </div>
              <select
                aria-label="Sélectionner la salle de cours"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-800"
              >
                {rooms.map(room => (
                  <option key={room.id} value={room.id} disabled={room.statut === 'DESACTIVE'}>
                    {room.nom} ({room.capacite} places) — {room.typeSalle} {room.statut === 'MAINTENANCE' ? '[En Maintenance]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Type de séance & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Type de Séance</label>
                <select
                  aria-label="Sélectionner le type de séance"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as 'CM' | 'TD' | 'TP')}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-800"
                >
                  <option value="CM">Cours Magistral (CM)</option>
                  <option value="TD">Travaux Dirigés (TD)</option>
                  <option value="TP">Travaux Pratiques (TP)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Consignes / Notes (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Chapitre 4, matériel requis..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 text-slate-800"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {conflictReport.hasBlockingError ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Enregistrement bloqué (Collision détectée)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Créneau & salle validés sans collision
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {conflictReport.hasBlockingError && (
                  <button
                    type="button"
                    onClick={() => handleSaveSession(true)}
                    className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold"
                    title="Forcer l'enregistrement en tant que brouillon en conflit"
                  >
                    Forcer (Marquer en conflit)
                  </button>
                )}

                <button
                  type="button"
                  disabled={conflictReport.hasBlockingError}
                  onClick={() => handleSaveSession(false)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
                    conflictReport.hasBlockingError
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#03045E] hover:bg-[#0077B6] text-white shadow-md'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingSession ? 'Mettre à jour la séance' : 'Valider & Planifier la Séance'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Conflict Detector & Alternative Suggestions (T23) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-[#0077B6]" />
                <h3 className="text-sm font-bold text-[#03045E]">Détecteur de Conflits Temps Réel (T23)</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${conflictReport.hasConflict ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {conflictReport.hasConflict ? 'Collision Détectée' : 'Vérification OK'}
              </span>
            </div>

            {/* Checklist des 3 conditions du diagramme d'activités 2.8 du PDF */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase text-slate-400">Contrôles UML obligatoires :</div>

              {/* 1. Salle libre */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                conflictReport.conflicts.some(c => c.type === 'SALLE_OCCUPEE')
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {conflictReport.conflicts.some(c => c.type === 'SALLE_OCCUPEE') ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-semibold">La salle est-elle libre ?</span>
                </div>
                <span className="text-[10px] font-bold">
                  {conflictReport.conflicts.some(c => c.type === 'SALLE_OCCUPEE') ? 'OCCUPÉE' : 'LIBRE'}
                </span>
              </div>

              {/* 2. Enseignant disponible */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                conflictReport.conflicts.some(c => c.type === 'ENSEIGNANT_OCCUPE')
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {conflictReport.conflicts.some(c => c.type === 'ENSEIGNANT_OCCUPE') ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-semibold">L'enseignant est-il disponible ?</span>
                </div>
                <span className="text-[10px] font-bold">
                  {conflictReport.conflicts.some(c => c.type === 'ENSEIGNANT_OCCUPE') ? 'INDISPONIBLE' : 'DISPONIBLE'}
                </span>
              </div>

              {/* 3. Groupe / Niveau libre */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                conflictReport.conflicts.some(c => c.type === 'NIVEAU_OCCUPE')
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center space-x-2">
                  {conflictReport.conflicts.some(c => c.type === 'NIVEAU_OCCUPE') ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-semibold">Le niveau n'a pas d'autre cours ?</span>
                </div>
                <span className="text-[10px] font-bold">
                  {conflictReport.conflicts.some(c => c.type === 'NIVEAU_OCCUPE') ? 'DÉJÀ EN COURS' : 'LIBRE'}
                </span>
              </div>
            </div>

            {/* Error Message Details (HTTP 409 simulation) */}
            {conflictReport.conflicts.length > 0 && (
              <div className="space-y-2 pt-2">
                {conflictReport.conflicts.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{c.titre}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{c.message}</p>
                    {c.resolutionSuggeree && (
                      <p className="text-[10px] text-rose-700 italic pt-1 border-t border-rose-200">
                        💡 Recommandation : {c.resolutionSuggeree}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Salles Alternatives Libres en 1 Clic */}
            {conflictReport.alternativeRooms && conflictReport.alternativeRooms.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  Salles Libres Compatibles sur ce créneau :
                </span>
                <div className="space-y-1.5">
                  {conflictReport.alternativeRooms.slice(0, 3).map(altRoom => (
                    <button
                      key={altRoom.id}
                      type="button"
                      onClick={() => setSelectedRoomId(altRoom.id)}
                      className="w-full text-left p-2 rounded-xl bg-[#CAF0F8]/50 hover:bg-[#CAF0F8] border border-[#90E0EF] text-xs transition flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-[#03045E]">{altRoom.nom}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({altRoom.capacite} places)</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0077B6] bg-white px-2 py-0.5 rounded-full shadow-sm">
                        Sélectionner
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
