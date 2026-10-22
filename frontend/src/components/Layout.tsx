import { ReactNode, useEffect, useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAuth as useJwtAuth } from '../context/AuthContext.jsx';
import { roleLabel } from '../auth/identities';
import { UserSession } from '../types/enseignement';
import { LocalPreviewBanner } from '../preview/LocalPreviewBanner';

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
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    setMenuOuvert(false);
  }, [location.pathname]);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {menuOuvert && (
        <div
          className="fixed inset-0 z-30 bg-[#03045E]/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOuvert(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="navigation-principale"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-[#03045E] text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00B4D8] to-[#90E0EF]">
            <GraduationCap size={24} className="text-[#03045E]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold leading-tight">
              Suivi des
              <br />
              Enseignants
            </h1>
            <p className="mt-1 text-xs font-semibold text-[#90E0EF]">de l&apos;EMIT</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOuvert(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Navigation principale">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isActive ? 'bg-[#00B4D8] text-[#03045E]' : 'bg-white/5 text-white/60'
                  }`}
                >
                  <item.icon size={17} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">{item.name}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#90E0EF]" aria-hidden="true" />}
              </Link>
            );
          })}

          <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-white/40">
            Autres modules
          </p>
          {WORKSPACE_LINKS.filter(
            (item) => item.path !== '/users' || session.role === 'SCOLARITE' || session.role === 'ADMINISTRATEUR',
          ).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <item.icon size={17} aria-hidden="true" />
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}

          <button
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-white/60 transition-colors hover:bg-rose-500/20 hover:text-rose-200"
          >
            <LogOut size={17} aria-hidden="true" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#90E0EF]/40 bg-white/5 text-[#90E0EF]">
              <GraduationCap size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-white">{current.name}</p>
              <p className="truncate text-xs text-[#90E0EF]">{current.sub}</p>
            </div>
            <Check size={14} className="ml-auto shrink-0 text-[#00B4D8]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-xs text-white/50">
            Rôle actif : <span className="font-semibold text-[#90E0EF]">{role}</span>
          </p>
        </div>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-hidden">
        <LocalPreviewBanner />
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#03045E] lg:hidden"
            aria-label="Ouvrir le menu"
            aria-controls="navigation-principale"
            aria-expanded={menuOuvert}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <GraduationCap size={20} className="text-[#0077B6]" aria-hidden="true" />
            <span className="text-sm font-bold text-[#03045E]">Suivi des enseignants</span>
          </div>
          <p className="ml-auto hidden text-sm text-slate-500 sm:block">
            Bienvenue, <span className="font-semibold text-[#03045E]">{current.name}</span>
          </p>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
