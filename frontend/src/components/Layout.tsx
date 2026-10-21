import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart,
  ChevronDown,
  Check,
  UserCircle2,
  GraduationCap,
  History,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ROLE_PROFILES, roleLabel, profileToSession } from '../auth/identities';
import { UserSession } from '../types/enseignement';

interface NavItem {
  name: string;
  path: string;
  icon: typeof BookOpen;
}

function navForRole(session: UserSession): NavItem[] {
  switch (session.role) {
    case 'ENSEIGNANT':
      return [
        { name: 'Tableau de bord', path: '/enseignant/dashboard', icon: LayoutDashboard },
        { name: 'Mes enseignements', path: '/enseignant/enseignements', icon: BookOpen },
        { name: 'Mes séances', path: '/enseignant/seances', icon: Calendar },
        { name: 'Suivi des heures', path: '/enseignant/heures', icon: BarChart },
        { name: "Journal d'audit", path: '/enseignant/journal', icon: History },
      ];
    case 'SCOLARITE':
      return [
        { name: 'Suivi des enseignements', path: '/scolarite/suivi-enseignements', icon: BookOpen },
        { name: 'Séances & contenus', path: '/scolarite/seances', icon: Calendar },
        { name: "Journal d'audit", path: '/scolarite/journal', icon: History },
      ];
    case 'RESPONSABLE_MENTION': {
      const isMaster = session.cycles?.includes('MASTER');
      const base = isMaster ? '/responsable/master' : '/responsable/licence';
      return [
        { name: 'Suivi des enseignements', path: `${base}/suivi-enseignements`, icon: BookOpen },
        { name: 'Séances & contenus', path: `${base}/seances`, icon: Calendar },
        { name: "Journal d'audit", path: `${base}/journal`, icon: History },
      ];
    }
    case 'ADMINISTRATEUR':
      return [
        { name: 'Suivi des enseignements', path: '/admin/suivi-enseignements', icon: BookOpen },
        { name: 'Séances & contenus', path: '/admin/seances', icon: Calendar },
        { name: "Journal d'audit", path: '/admin/journal', icon: History },
      ];
    default:
      return [];
  }
}

function describeSession(session: UserSession): { name: string; sub: string } {
  switch (session.role) {
    case 'ENSEIGNANT':
      return { name: session.userId, sub: 'Enseignant' };
    case 'SCOLARITE':
      return { name: session.userId, sub: 'Chef de scolarité' };
    case 'RESPONSABLE_MENTION': {
      const cycle = session.cycles?.join(', ') ?? '';
      const parcours = session.parcours ? `Parcours ${session.parcours}` : '';
      return {
        name: session.userId,
        sub: `Responsable ${parcours}${cycle ? ` · ${cycle}` : ''}`.trim(),
      };
    }
    case 'ADMINISTRATEUR':
      return { name: session.userId, sub: 'Administrateur' };
    default:
      return { name: session.userId, sub: session.role };
  }
}

function identitiesMatch(session: UserSession, profileKey: string): boolean {
  const profile = ROLE_PROFILES.find((p) => p.key === profileKey);
  if (!profile) return false;
  const expected = profileToSession(profile);
  return (
    expected.userId === session.userId &&
    expected.role === session.role &&
    (expected.mentionId ?? '') === (session.mentionId ?? '') &&
    (expected.parcours ?? '') === (session.parcours ?? '') &&
    JSON.stringify(expected.cycles ?? []) === JSON.stringify(session.cycles ?? [])
  );
}

function IdentitySwitcher() {
  const { session, changeProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = describeSession(session);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-full bg-[#0a0a32] text-[#00e5ff] flex items-center justify-center">
          <UserCircle2 size={20} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-[#0a0a32]">{current.name}</p>
          <p className="text-xs text-gray-500">{current.sub}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Sélecteur d'identité (test)
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Le backend authentifie par headers (x-user-id, x-user-role...)
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {ROLE_PROFILES.map((profile) => {
              const isActive = identitiesMatch(session, profile.key);
              return (
                <button
                  key={profile.key}
                  onClick={() => {
                    changeProfile(profile);
                    setOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-cyan-50' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    <GraduationCap size={18} className={isActive ? 'text-[#0088aa]' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isActive ? 'text-[#0088aa]' : 'text-[#0a0a32]'}`}>
                      {profile.label}
                    </p>
                    <p className="text-xs text-gray-500">{profile.description}</p>
                  </div>
                  {isActive && <Check size={16} className="text-[#0088aa] mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { session } = useAuth();
  const navItems = navForRole(session);
  const role = roleLabel(session.role);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-[#0a0a32] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#00e5ff] text-[#0a0a32] rounded-md flex items-center justify-center font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="font-bold leading-tight">
              Suivi
              <br />
              Enseignements
            </h1>
            <p className="text-xs text-[#00e5ff] mt-1">UNIVERSITÉ ERP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive ? 'bg-[#0088aa] text-white' : 'text-gray-300 hover:bg-[#1a1a4a]'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span>{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1a1a4a]">
          <p className="text-xs text-gray-400">Rôle actif :</p>
          <p className="text-sm font-semibold text-[#00e5ff]">{role}</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-end gap-4 shrink-0">
          <IdentitySwitcher />
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}