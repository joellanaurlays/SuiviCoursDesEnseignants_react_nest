import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { ScheduleBuilderView } from './components/ScheduleBuilderView';
import { RoomManagementView } from './components/RoomManagementView';
import { ConstraintsManagementView } from './components/ConstraintsManagementView';
import { Member5DocumentationView } from './components/Member5DocumentationView';

import { 
  INITIAL_ROOMS, 
  INITIAL_TIME_SLOTS, 
  INITIAL_TEACHINGS, 
  INITIAL_SESSIONS, 
  INITIAL_CONSTRAINTS, 
  INITIAL_SCHEDULE_METADATA 
} from './data/mockAcademicData';

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

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'calendar' | 'builder' | 'rooms' | 'constraints' | 'docs'>('calendar');

  // Application Data States (Membre 5 scope)
  const [rooms, setRooms] = useState<SalleEntity[]>(INITIAL_ROOMS);
  const [timeSlots, setTimeSlots] = useState<CreneauHoraireEntity[]>(INITIAL_TIME_SLOTS);
  const [teachings] = useState<EnseignementEntity[]>(INITIAL_TEACHINGS);
  const [sessions, setSessions] = useState<SeancePlanifieeEntity[]>(INITIAL_SESSIONS);
  const [constraints, setConstraints] = useState<ContraintePlanificationEntity[]>(INITIAL_CONSTRAINTS);
  const [scheduleMeta, setScheduleMeta] = useState<EmploiDuTempsEntity>(INITIAL_SCHEDULE_METADATA);

  // Active User session simulation
  const [currentUser, setCurrentUser] = useState<CurrentUserSession>({
    id: 1,
    nom: 'Chef de Scolarité EMIT',
    role: 'CHEF_SCOLARITE'
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
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleUpdateStatus = (sessionId: number, newStatus: SeanceStatut) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, statut: newStatus } : s));
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
        setCurrentUser={setCurrentUser}
        conflictCount={conflictCount}
        onPrint={handlePrint}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              Module 5 : Emploi du Temps (T21 - T25)
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
