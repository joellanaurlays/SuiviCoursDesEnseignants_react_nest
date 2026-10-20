import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleBuilderView } from './components/ScheduleBuilderView';
import { RoomManagementView } from './components/RoomManagementView';
import { ConstraintsManagementView } from './components/ConstraintsManagementView';
import { Member5DocumentationView } from './components/Member5DocumentationView';

import { 
  ContraintePlanificationEntity, 
  CreneauHoraireEntity, 
  CurrentUserSession, 
  EmploiDuTempsEntity, 
  EnseignementEntity, 
  SalleEntity, 
  SeancePlanifieeEntity, 
  SeanceStatut 
} from './types/schedule';
import { ConflictDetectorService } from './services/ConflictDetectorService';
import { ApiClient } from './services/apiClient';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'calendar' | 'builder' | 'rooms' | 'constraints' | 'docs'>('calendar');

  // Application Data States (Membre 5 scope)
  const [rooms, setRooms] = useState<SalleEntity[]>([]);
  const [timeSlots, setTimeSlots] = useState<CreneauHoraireEntity[]>([]);
  const [teachings, setTeachings] = useState<EnseignementEntity[]>([]);
  const [sessions, setSessions] = useState<SeancePlanifieeEntity[]>([]);
  const [constraints, setConstraints] = useState<ContraintePlanificationEntity[]>([]);
  const [scheduleMeta, setScheduleMeta] = useState<EmploiDuTempsEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        ApiClient.getRooms(),
        ApiClient.getTimeSlots(),
        ApiClient.getTeachings(),
        ApiClient.getPlanning(),
        ApiClient.getConstraints()
      ]);
      const [roomsResult, slotsResult, teachingsResult, planningResult, constraintsResult] = results;
      if (roomsResult.status === 'fulfilled') setRooms(roomsResult.value);
      if (slotsResult.status === 'fulfilled') setTimeSlots(slotsResult.value);
      if (teachingsResult.status === 'fulfilled') setTeachings(teachingsResult.value);
      if (planningResult.status === 'fulfilled') {
        setSessions(planningResult.value.sessions);
        setScheduleMeta(planningResult.value.metadata);
      }
      if (constraintsResult.status === 'fulfilled') setConstraints(constraintsResult.value);
      const failed = results.find(result => result.status === 'rejected');
      if (failed?.status === 'rejected') {
        throw failed.reason;
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de charger les données du serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refreshData(); }, []);

  // Active User session simulation
  const [currentUser] = useState<CurrentUserSession>({
    id: Number(import.meta.env.VITE_USER_ID || 0),
    nom: import.meta.env.VITE_USER_NAME || 'Utilisateur',
    role: (import.meta.env.VITE_USER_ROLE || 'CHEF_SCOLARITE') as CurrentUserSession['role'],
  });

  // Session being edited in builder
  const [editingSession, setEditingSession] = useState<SeancePlanifieeEntity | null>(null);

  // Total active conflicts count
  const conflictCount = useMemo(() => {
    let count = 0;
    sessions.forEach(s => {
      if (s.statut === 'ANNULE') return;
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
      if (check.hasConflict) count++;
    });
    return count;
  }, [sessions, rooms, constraints]);

  // Handlers for session actions
  const handleEditSession = (session: SeancePlanifieeEntity) => {
    setEditingSession(session);
    setActiveTab('builder');
  };

  const handleDeleteSession = (sessionId: number) => {
    void ApiClient.deleteSession(sessionId).then(refreshData).catch(error => setLoadError(error.message));
  };

  const handleUpdateStatus = (sessionId: number, newStatus: SeanceStatut) => {
    void ApiClient.updateSessionStatus(sessionId, newStatus).then(refreshData).catch(error => setLoadError(error.message));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#00B4D8] selection:text-[#03045E]">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        conflictCount={conflictCount}
        onPrint={handlePrint}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && <div role="status" className="rounded-xl bg-white p-6 text-slate-600">Chargement des données depuis le serveur…</div>}
        {loadError && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError} <button className="ml-2 font-bold underline" onClick={() => void refreshData()}>Réessayer</button></div>}
        {!loading && scheduleMeta && (
        <>
        {activeTab === 'calendar' && (
          <ScheduleCalendarView
            sessions={sessions}
            rooms={rooms}
            currentUser={currentUser}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSession}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'builder' && (
          <ScheduleBuilderView
            sessions={sessions}
            setSessions={setSessions}
            rooms={rooms}
            timeSlots={timeSlots}
            teachings={teachings}
            constraints={constraints}
            scheduleMeta={scheduleMeta}
            setScheduleMeta={setScheduleMeta}
            currentUser={currentUser}
            editingSession={editingSession}
            setEditingSession={setEditingSession}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomManagementView
            rooms={rooms}
            setRooms={setRooms}
            timeSlots={timeSlots}
            setTimeSlots={setTimeSlots}
            sessions={sessions}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'constraints' && (
          <ConstraintsManagementView
            constraints={constraints}
            setConstraints={setConstraints}
            rooms={rooms}
            teachings={teachings}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'docs' && (
          <Member5DocumentationView />
        )}
        </>
        )}
        {!loading && !loadError && !scheduleMeta && <div className="rounded-xl bg-white p-6 text-slate-600">Aucun emploi du temps n’est encore configuré dans la base.</div>}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#03045E]">EMIT</span>
            <span>— École de Management et d'Innovation Technologique</span>
            <span className="hidden md:inline">• Université de Fianarantsoa</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#03045E] font-bold text-[11px]">
              Emploi du Temps 
            </span>
            <div className="flex items-center space-x-1" title="Palette de couleur officielle appliquée">
              <span className="w-3 h-3 rounded-full bg-[#03045E]" />
              <span className="w-3 h-3 rounded-full bg-[#0077B6]" />
              <span className="w-3 h-3 rounded-full bg-[#00B4D8]" />
              <span className="w-3 h-3 rounded-full bg-[#90E0EF]" />
              <span className="w-3 h-3 rounded-full bg-[#CAF0F8]" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
