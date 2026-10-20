import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Filter, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  Eye, 
  Check, 
  Tag, 
  BookMarked,
  Printer
} from 'lucide-react';
import { 
  AcademicLevel, 
  CurrentUserSession, 
  DayOfWeek, 
  MentionCode, 
  SalleEntity, 
  SeancePlanifieeEntity, 
  SeanceStatut 
} from '../types/schedule';

interface ScheduleCalendarViewProps {
  sessions: SeancePlanifieeEntity[];
  rooms: SalleEntity[];
  currentUser: CurrentUserSession;
  onEditSession: (session: SeancePlanifieeEntity) => void;
  onDeleteSession: (sessionId: number) => void;
  onUpdateStatus: (sessionId: number, newStatus: SeanceStatut) => void;
}

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const TIME_SLOTS_DEF = [
  { label: '08:00 - 10:00', start: '08:00', end: '10:00', badge: 'Matin 1' },
  { label: '10:15 - 12:15', start: '10:15', end: '12:15', badge: 'Matin 2' },
  { label: '13:30 - 15:30', start: '13:30', end: '15:30', badge: 'Après-midi 1' },
  { label: '15:45 - 17:45', start: '15:45', end: '17:45', badge: 'Après-midi 2' },
];

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  sessions,
  rooms,
  currentUser,
  onEditSession,
  onDeleteSession,
  onUpdateStatus
}) => {
  // Calendar view mode
  const [viewMode, setViewMode] = useState<'semaine' | 'jour' | 'liste'>('semaine');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Lundi');

  // Filters (T24 requirements)
  const [filterMention, setFilterMention] = useState<string>('Toutes');
  const [filterLevel, setFilterLevel] = useState<string>('Tous');
  const [filterTeacher, setFilterTeacher] = useState<string>('Tous');
  const [filterRoom, setFilterRoom] = useState<string>('Toutes');
  const [filterStatus, setFilterStatus] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected session for modal details
  const [selectedSession, setSelectedSession] = useState<SeancePlanifieeEntity | null>(null);

  // If user is logged in as Teacher, default filter to teacher
  React.useEffect(() => {
    if (currentUser.role === 'ENSEIGNANT' && currentUser.enseignantId) {
      const teacher = sessions.find(session => session.enseignantId === currentUser.enseignantId);
      if (teacher) setFilterTeacher(teacher.nomEnseignant);
    } else if (currentUser.role === 'RESPONSABLE_MENTION' && currentUser.mentionResponsable) {
      setFilterMention(currentUser.mentionResponsable);
    }
  }, [currentUser, sessions]);

  // Unique lists for filter dropdowns
  const teachersList = useMemo(() => {
    const list = Array.from(new Set(sessions.map(s => s.nomEnseignant)));
    return list.sort();
  }, [sessions]);
  const mentionsList = useMemo(() => [...new Set(sessions.map(session => session.mentionNom))].sort(), [sessions]);
  const levelsList = useMemo(() => [...new Set(sessions.map(session => session.codeNiveau))].sort(), [sessions]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (filterMention !== 'Toutes' && s.mentionNom !== filterMention) return false;
      if (filterLevel !== 'Tous' && s.codeNiveau !== filterLevel) return false;
      if (filterTeacher !== 'Tous' && s.nomEnseignant !== filterTeacher) return false;
      if (filterRoom !== 'Toutes' && s.nomSalle !== filterRoom) return false;
      if (filterStatus !== 'Tous' && s.statut !== filterStatus) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match = 
          s.matiereNom.toLowerCase().includes(q) ||
          s.codeMatiere.toLowerCase().includes(q) ||
          s.nomEnseignant.toLowerCase().includes(q) ||
          s.nomSalle.toLowerCase().includes(q) ||
          s.codeNiveau.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [sessions, filterMention, filterLevel, filterTeacher, filterRoom, filterStatus, searchQuery]);

  // Export iCal (.ics) function
  const exportICal = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//EMIT//Suivi Enseignements EDT//FR\nCALSCALE:GREGORIAN\n";
    filteredSessions.forEach(s => {
      const dtStart = (s.dateSeance ? s.dateSeance.replace(/-/g, '') : '20261019') + 'T' + s.heureDebut.replace(':', '') + '00';
      const dtEnd = (s.dateSeance ? s.dateSeance.replace(/-/g, '') : '20261019') + 'T' + s.heureFin.replace(':', '') + '00';
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:[${s.codeNiveau} ${s.mentionNom}] ${s.matiereNom} (${s.typeSeance})\n`;
      icsContent += `DESCRIPTION:Enseignant: ${s.nomEnseignant}\\nSalle: ${s.nomSalle}\\nStatut: ${s.statut}\n`;
      icsContent += `LOCATION:${s.nomSalle} - EMIT\n`;
      icsContent += `DTSTART:${dtStart}\n`;
      icsContent += `DTEND:${dtEnd}\n`;
      icsContent += `STATUS:${s.statut === 'ANNULE' ? 'CANCELLED' : 'CONFIRMED'}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `EDT_EMIT_${filterLevel}_${filterMention}.ics`;
    link.click();
  };

  const getStatusBadge = (statut: SeanceStatut) => {
    switch (statut) {
      case 'PLANIFIE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0077B6] text-white">Planifié</span>;
      case 'VALIDE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white">Validé</span>;
      case 'BROUILLON':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500 text-slate-900">Brouillon</span>;
      case 'EN_CONFLIT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-600 text-white animate-pulse">En Conflit</span>;
      case 'REALISE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-white">Réalisé</span>;
      case 'ANNULE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-300 text-slate-700 line-through">Annulé</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-800">{statut}</span>;
    }
  };

  const getTypeSeanceBadge = (type: 'CM' | 'TD' | 'TP') => {
    switch (type) {
      case 'CM':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#03045E] text-white">CM</span>;
      case 'TD':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#0077B6] text-white">TD</span>;
      case 'TP':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#00B4D8] text-[#03045E]">TP Machine</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls (T24) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#03045E]">Emploi du Temps Universitaire</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#CAF0F8] text-[#0077B6] font-semibold">
                Semestre 1 • 2026-2027
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Affichage interactif par niveau, enseignant ou salle. Détection automatique des chevauchements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Semaine / Jour / Liste */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('semaine')}
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'semaine' ? 'bg-[#0077B6] text-white shadow-sm' : 'hover:text-slate-900'}`}
              >
                Vue Semaine
              </button>
              <button
                onClick={() => setViewMode('jour')}
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'jour' ? 'bg-[#0077B6] text-white shadow-sm' : 'hover:text-slate-900'}`}
              >
                Vue Jour
              </button>
              <button
                onClick={() => setViewMode('liste')}
                className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'liste' ? 'bg-[#0077B6] text-white shadow-sm' : 'hover:text-slate-900'}`}
              >
                Vue Liste
              </button>
            </div>

            <button
              onClick={exportICal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition"
              title="Exporter au format iCal pour Google Agenda / Apple Calendar"
            >
              <Download className="w-3.5 h-3.5 text-[#0077B6]" />
              <span>Export .ics</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher matière, prof..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30"
            />
          </div>

          {/* Mention Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mention</label>
            <select
              value={filterMention}
              onChange={(e) => setFilterMention(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
            >
              <option value="Toutes">Toutes les mentions</option>
              {mentionsList.map(mention => <option key={mention} value={mention}>{mention}</option>)}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Niveau</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
            >
              <option value="Tous">Tous les niveaux</option>
              {levelsList.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Enseignant</label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
            >
              <option value="Tous">Tous les enseignants</option>
              {teachersList.map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Salle</label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
            >
              <option value="Toutes">Toutes les salles</option>
              {rooms.map(room => (
                <option key={room.id} value={room.nom}>{room.nom} ({room.capacite} pl.)</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0077B6]/30 font-medium text-slate-700"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="PLANIFIE">Planifié</option>
              <option value="VALIDE">Validé</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="EN_CONFLIT">En Conflit</option>
              <option value="REALISE">Réalisé</option>
            </select>
          </div>
        </div>

        {/* Active filters pill display */}
        {(filterMention !== 'Toutes' || filterLevel !== 'Tous' || filterTeacher !== 'Tous' || filterRoom !== 'Toutes' || filterStatus !== 'Tous' || searchQuery) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Filtres appliqués :</span>
            {filterMention !== 'Toutes' && (
              <span className="px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#03045E] text-[11px] font-medium">
                Mention : {filterMention}
              </span>
            )}
            {filterLevel !== 'Tous' && (
              <span className="px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#03045E] text-[11px] font-medium">
                Niveau : {filterLevel}
              </span>
            )}
            {filterTeacher !== 'Tous' && (
              <span className="px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#03045E] text-[11px] font-medium">
                Prof : {filterTeacher}
              </span>
            )}
            {filterRoom !== 'Toutes' && (
              <span className="px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#03045E] text-[11px] font-medium">
                Salle : {filterRoom}
              </span>
            )}
            <button
              onClick={() => {
                setFilterMention('Toutes');
                setFilterLevel('Tous');
                setFilterTeacher('Tous');
                setFilterRoom('Toutes');
                setFilterStatus('Tous');
                setSearchQuery('');
              }}
              className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline ml-2"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </div>

      {/* Printable Heading (Only visible in Print) */}
      <div className="hidden print:block mb-4 text-center">
        <h2 className="text-xl font-bold uppercase text-[#03045E]">EMIT — Université de Fianarantsoa</h2>
        <h3 className="text-base font-semibold text-[#0077B6]">Emploi du Temps Officiel des Enseignements</h3>
        <p className="text-xs text-slate-600">Semaine du 19 au 24 Octobre 2026 • Filtres : {filterMention} / {filterLevel}</p>
      </div>

      {/* Day Selector for "Vue Jour" */}
      {viewMode === 'jour' && (
        <div className="flex items-center justify-center space-x-2 no-print bg-white p-2 rounded-xl border border-slate-200">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                selectedDay === day 
                  ? 'bg-[#03045E] text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* 1. WEEK VIEW (Grille Hebdomadaire standardisée EMIT) */}
      {viewMode === 'semaine' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#03045E] text-white">
                  <th className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider w-36 border-r border-white/20">
                    Créneaux
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider border-r border-white/20 last:border-r-0">
                      <div className="font-extrabold">{day}</div>
                      <div className="text-[10px] text-[#90E0EF] font-normal">EMIT Campus</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {TIME_SLOTS_DEF.map((slot, slotIdx) => (
                  <tr key={slot.label} className={slotIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    {/* Time slot header */}
                    <td className="p-3 text-center align-middle border-r border-slate-200 bg-slate-50">
                      <div className="font-mono text-xs font-bold text-[#03045E]">{slot.label}</div>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#CAF0F8] text-[#0077B6]">
                        {slot.badge}
                      </span>
                    </td>

                    {/* Columns for each day */}
                    {DAYS.map(day => {
                      const sessionsHere = filteredSessions.filter(
                        s => s.jourSemaine === day && s.heureDebut === slot.start
                      );

                      return (
                        <td 
                          key={`${day}-${slot.start}`} 
                          className="p-2 border-r border-slate-200 last:border-r-0 align-top h-36 w-[14%]"
                        >
                          {sessionsHere.length === 0 ? (
                            <div className="h-full border border-dashed border-slate-200/80 rounded-xl flex items-center justify-center text-[11px] text-slate-300 font-medium select-none hover:bg-slate-50/80 transition">
                              Libre
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {sessionsHere.map(session => {
                                const isConflict = session.statut === 'EN_CONFLIT' || (session.conflits && session.conflits.length > 0);
                                return (
                                  <div
                                    key={session.id}
                                    onClick={() => setSelectedSession(session)}
                                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition transform hover:-translate-y-0.5 hover:shadow-md ${
                                      isConflict
                                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                                        : session.statut === 'BROUILLON'
                                        ? 'bg-amber-50 border-amber-300'
                                        : 'bg-[#CAF0F8]/40 border-[#90E0EF] hover:bg-[#CAF0F8]/80'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-black text-[#03045E]">
                                          {session.codeNiveau} {session.mentionNom}
                                        </span>
                                      </div>
                                      {getTypeSeanceBadge(session.typeSeance)}
                                    </div>

                                    <div className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                                      {session.matiereNom}
                                    </div>

                                    <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3 text-[#0077B6] shrink-0" />
                                        <span className="truncate font-medium">{session.nomEnseignant}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-[#00B4D8] shrink-0" />
                                        <span className="font-semibold text-[#03045E] truncate">{session.nomSalle}</span>
                                      </div>
                                    </div>

                                    <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                                      {getStatusBadge(session.statut)}
                                      {isConflict && (
                                        <AlertCircle className="w-4 h-4 text-rose-600 animate-bounce" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DAY VIEW (Vue Journée détaillée) */}
      {viewMode === 'jour' && (
        <div className="space-y-4">
          <div className="bg-[#03045E] text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#00B4D8]" />
              Planning du {selectedDay} (Toutes les salles & promotions)
            </h2>
            <span className="text-xs bg-[#0077B6] px-3 py-1 rounded-full font-semibold">
              {filteredSessions.filter(s => s.jourSemaine === selectedDay).length} séance(s) programmée(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIME_SLOTS_DEF.map(slot => {
              const daySessions = filteredSessions.filter(
                s => s.jourSemaine === selectedDay && s.heureDebut === slot.start
              );

              return (
                <div key={slot.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <div className="text-sm font-bold text-[#03045E]">{slot.label}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{slot.badge}</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {daySessions.length} cours
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {daySessions.length === 0 ? (
                      <div className="h-32 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                        Aucun cours sur ce créneau
                      </div>
                    ) : (
                      daySessions.map(session => (
                        <div
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-[#CAF0F8]/30 hover:border-[#0077B6] cursor-pointer transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-[#03045E]">
                              {session.codeNiveau} {session.mentionNom}
                            </span>
                            {getTypeSeanceBadge(session.typeSeance)}
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 mt-1">{session.matiereNom}</h4>
                          <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-[#0077B6]" />
                              <span>{session.nomEnseignant}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-[#00B4D8]" />
                              <span className="font-semibold text-slate-900">{session.nomSalle}</span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            {getStatusBadge(session.statut)}
                            <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-[#0077B6]" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST VIEW (Vue Liste tabulaire) */}
      {viewMode === 'liste' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-[#03045E] uppercase tracking-wider">
              {filteredSessions.length} séance(s) trouvée(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#03045E] text-white">
                <tr>
                  <th className="py-3 px-4 font-bold">Jour & Heure</th>
                  <th className="py-3 px-4 font-bold">Matière</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Promotion</th>
                  <th className="py-3 px-4 font-bold">Enseignant</th>
                  <th className="py-3 px-4 font-bold">Salle</th>
                  <th className="py-3 px-4 font-bold">Statut</th>
                  <th className="py-3 px-4 font-bold text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-[#03045E]">
                      <div>{session.jourSemaine}</div>
                      <div className="font-mono text-[11px] text-slate-500">{session.heureDebut} - {session.heureFin}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{session.matiereNom}</div>
                      <div className="font-mono text-[10px] text-slate-400">{session.codeMatiere}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getTypeSeanceBadge(session.typeSeance)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0077B6]">{session.codeNiveau}</span> {session.mentionNom}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {session.nomEnseignant}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {session.nomSalle}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(session.statut)}
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="px-2.5 py-1 rounded-lg bg-[#CAF0F8] text-[#03045E] font-semibold hover:bg-[#90E0EF] transition"
                        >
                          Détails
                        </button>
                        {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
                          <button
                            onClick={() => onEditSession(session)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Session Details & Actions */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0077B6]">
                  Séance #{selectedSession.id} • {selectedSession.semestreNom}
                </span>
                <h3 className="text-lg font-bold text-[#03045E] mt-0.5">
                  {selectedSession.matiereNom}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Promotion</span>
                  <p className="font-bold text-[#03045E] text-sm">{selectedSession.codeNiveau} {selectedSession.mentionNom}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Type de cours</span>
                  <p className="font-semibold">{selectedSession.typeSeance === 'CM' ? 'Cours Magistral (CM)' : (selectedSession.typeSeance === 'TP' ? 'Travaux Pratiques (TP)' : 'Travaux Dirigés (TD)')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Horaire</span>
                  <p className="font-semibold text-slate-800">{selectedSession.jourSemaine} : {selectedSession.heureDebut} - {selectedSession.heureFin}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Salle Affectée</span>
                  <p className="font-bold text-[#0077B6]">{selectedSession.nomSalle}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Enseignant Responsable</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedSession.nomEnseignant}</p>
              </div>

              {selectedSession.notes && (
                <div className="bg-[#CAF0F8]/50 p-3 rounded-xl border border-[#90E0EF]">
                  <span className="text-[10px] text-[#0077B6] uppercase font-bold">Consignes pédagogiques</span>
                  <p className="text-slate-700 text-xs mt-0.5">{selectedSession.notes}</p>
                </div>
              )}

              {/* Conflits list if any */}
              {selectedSession.conflits && selectedSession.conflits.length > 0 && (
                <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Conflit détecté sur cette séance !</span>
                  </div>
                  {selectedSession.conflits.map(c => (
                    <div key={c.id} className="text-rose-800 text-[11px]">
                      • {c.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Status workflow transitions (Diagramme d'état 2.7) */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">Cycle de vie de la séance</span>
                <div className="flex flex-wrap gap-2">
                  {(['BROUILLON', 'VALIDE', 'PLANIFIE', 'REALISE'] as SeanceStatut[]).map(status => (
                    <button
                      key={status}
                      disabled={currentUser.role === 'ETUDIANT'}
                      onClick={() => {
                        onUpdateStatus(selectedSession.id, status);
                        setSelectedSession({ ...selectedSession, statut: status });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedSession.statut === status
                          ? 'bg-[#03045E] text-white shadow-sm ring-2 ring-[#00B4D8]'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'BROUILLON' && 'Brouillon'}
                      {status === 'VALIDE' && 'Valider'}
                      {status === 'PLANIFIE' && 'Publier/Planifier'}
                      {status === 'REALISE' && 'Marquer Réalisé'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {(currentUser.role === 'CHEF_SCOLARITE' || currentUser.role === 'ADMINISTRATEUR') && (
                <button
                  onClick={() => {
                    onDeleteSession(selectedSession.id);
                    setSelectedSession(null);
                  }}
                  className="text-rose-600 hover:text-rose-800 font-semibold text-xs"
                >
                  Supprimer du planning
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
