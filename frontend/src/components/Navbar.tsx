import React from 'react';
import { 
  Calendar, 
  Layers, 
  Building2, 
  ShieldAlert, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  UserCheck,
  Sparkles,
  Printer
} from 'lucide-react';
import { CurrentUserSession, UserRole, MentionCode } from '../types/schedule';

interface NavbarProps {
  activeTab: 'calendar' | 'builder' | 'rooms' | 'constraints' | 'docs';
  setActiveTab: (tab: 'calendar' | 'builder' | 'rooms' | 'constraints' | 'docs') => void;
  currentUser: CurrentUserSession;
  setCurrentUser: (user: CurrentUserSession) => void;
  conflictCount: number;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  conflictCount,
  onPrint
}) => {
  return (
    <header className="no-print bg-[#03045E] text-white shadow-xl sticky top-0 z-40 border-b border-[#0077B6]/40">
      {/* Top Banner: EMIT branding & Member 5 badge */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#0077B6] flex items-center justify-center font-bold text-white shadow-md text-lg">
              E
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-white text-base">EMIT</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0077B6] text-white font-medium">
                  Université de Fianarantsoa
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00B4D8]/20 border border-[#00B4D8] text-[#90E0EF] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#00B4D8]" />
                  Emploi du Temps 
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Suivi des Enseignements — Planification, Salles, Créneaux & Détection de Conflits
              </p>
            </div>
          </div>

          {/* Right: Quick actions & Role Selector */}
          <div className="flex items-center space-x-4">
            {conflictCount > 0 ? (
              <button 
                onClick={() => setActiveTab('builder')}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400 text-rose-200 text-xs font-semibold hover:bg-rose-500/30 transition animate-pulse"
                title="Conflits détectés dans l'emploi du temps"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{conflictCount} conflit{conflictCount > 1 ? 's' : ''} actif{conflictCount > 1 ? 's' : ''}</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>0 Conflit détecté</span>
              </div>
            )}

            <button
              onClick={onPrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 hover:text-white transition"
              title="Imprimer l'emploi du temps"
            >
              <Printer className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span className="hidden md:inline">Imprimer</span>
            </button>

            {/* Role switch simulation for permissions */}
            <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/15">
              <UserCheck className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span className="text-xs text-slate-300 hidden md:inline">Rôle :</span>
              <select
                aria-label="Sélectionner le rôle actif"
                value={currentUser.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  if (role === 'CHEF_SCOLARITE') {
                    setCurrentUser({ id: 1, nom: 'Chef de Scolarité EMIT', role: 'CHEF_SCOLARITE' });
                  } else if (role === 'ADMINISTRATEUR') {
                    setCurrentUser({ id: 2, nom: 'Administrateur Planning', role: 'ADMINISTRATEUR' });
                  } else if (role === 'RESPONSABLE_MENTION') {
                    setCurrentUser({ id: 3, nom: 'Dr. Resp. Mention Informatique', role: 'RESPONSABLE_MENTION', mentionResponsable: 'Informatique' });
                  } else if (role === 'ENSEIGNANT') {
                    setCurrentUser({ id: 4, nom: 'Dr. Randrianarisoa Mamy', role: 'ENSEIGNANT', enseignantId: 12 });
                  } else {
                    setCurrentUser({ id: 5, nom: 'Étudiant L1 Informatique', role: 'ETUDIANT' });
                  }
                }}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="CHEF_SCOLARITE" className="bg-[#03045E] text-white">Chef de Scolarité</option>
                <option value="ADMINISTRATEUR" className="bg-[#03045E] text-white">Administrateur</option>
                <option value="RESPONSABLE_MENTION" className="bg-[#03045E] text-white">Resp. Mention Info</option>
                <option value="ENSEIGNANT" className="bg-[#03045E] text-white">Enseignant (Dr. Randria)</option>
                <option value="ETUDIANT" className="bg-[#03045E] text-white">Étudiant (Consultation)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Member 5 responsibilities */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-[#0077B6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#90E0EF]" />
            <span>Consultation Emploi du Temps </span>
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap relative ${
              activeTab === 'builder'
                ? 'bg-[#0077B6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4 text-[#00B4D8]" />
            <span>Planificateur & Conflits </span>
            {conflictCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 absolute top-2 right-2 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'bg-[#0077B6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#90E0EF]" />
            <span>Salles & Créneaux </span>
          </button>

          <button
            onClick={() => setActiveTab('constraints')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'constraints'
                ? 'bg-[#0077B6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[#00B4D8]" />
            <span>Contraintes </span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'docs'
                ? 'bg-[#0077B6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#CAF0F8]" />
            <span>Dossier Technique & UML</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
