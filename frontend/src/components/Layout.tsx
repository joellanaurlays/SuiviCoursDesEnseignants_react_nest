import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart,
  Check,
  UserCircle2,
  GraduationCap,
  History,
  CalendarDays,
  ClipboardList,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAuth as useJwtAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../auth/identities';
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
  const cycle = session.cycles?.join(', ') ?? '';
  switch (session.role) {
    case 'ENSEIGNANT':
      return { name: session.userId, sub: 'Enseignant' };
    case 'SCOLARITE':
      return { name: session.userId, sub: 'Chef de scolarité' };
    case 'RESPONSABLE_MENTION': {
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

const WORKSPACE_LINKS: NavItem[] = [
  { name: 'Emploi du temps', path: '/', icon: CalendarDays },
  { name: 'Examens & notes', path: '/exams', icon: ClipboardList },
  { name: 'Compteurs & rôles', path: '/users', icon: Users },
  { name: 'Mon profil', path: '/profile', icon: UserCircle2 },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { logout } = useJwtAuth() as { logout: () => Promise<void> };
  const navItems = navForRole(session);
  const role = roleLabel(session.role);
  const current = describeSession(session);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-[#03045E] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#00B4D8] text-[#03045E] rounded-md flex items-center justify-center font-bold text-xl">
            S
          </div>
          <div>
            <h1 className="font-bold leading-tight">
              Suivi
              <br />
              Enseignements
            </h1>
            <p className="text-xs text-[#00B4D8] mt-1">UNIVERSITÉ ERP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive ? 'bg-[#0077B6] text-white' : 'text-gray-300 hover:bg-[#03045E]'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
                <span>{item.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />}
              </Link>
            );
          })}

          <p className="pt-4 px-4 text-xs uppercase tracking-wide text-gray-500">
            Autres modules
          </p>
          {WORKSPACE_LINKS.filter(
            (item) => item.path !== '/users' || session.role === 'SCOLARITE' || session.role === 'ADMINISTRATEUR',
          ).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center space-x-3 px-4 py-2 rounded-md text-gray-300 hover:bg-[#03045E] transition-colors"
            >
              <item.icon size={18} className="text-gray-400" />
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}

          <button
            onClick={onLogout}
            className="mt-2 w-full flex items-center space-x-3 px-4 py-2 rounded-md text-gray-300 hover:bg-[#03045E] transition-colors"
          >
            <LogOut size={18} className="text-gray-400" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#03045E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#03045E] border border-[#00B4D8] text-[#00B4D8] flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-bold text-white truncate">{current.name}</p>
              <p className="text-xs text-[#00B4D8] truncate">{current.sub}</p>
            </div>
            <Check size={14} className="ml-auto text-[#0077B6]" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Rôle actif : <span className="text-[#00B4D8] font-semibold">{role}</span></p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-end gap-4 shrink-0">
          <p className="text-sm text-gray-600">
            Bienvenue, <span className="font-semibold text-[#03045E]">{current.name}</span>
          </p>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
