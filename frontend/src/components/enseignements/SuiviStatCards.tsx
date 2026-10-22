import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Flag,
  Hourglass,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { ProgressionBar } from '../ui/ProgressionBar';
import { SuiviStatistiques } from '../../types/enseignement';

interface SuiviStatCardsProps {
  stats: SuiviStatistiques | null;
  loading?: boolean;
}

interface CompteurProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  classes: string;
}

function Compteur({ label, value, icon, classes }: CompteurProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${classes}`} aria-hidden="true">
          {icon}
        </span>
        <span className="text-sm font-semibold text-slate-600">{label}</span>
      </div>
      <span className="text-xl font-extrabold text-[#03045E]">{value}</span>
    </div>
  );
}

/**
 * Cartes d'indicateurs du suivi des enseignements.
 *
 * Les agrégats proviennent exclusivement de GET /suivi/statistiques, calculé
 * côté backend sur le périmètre de l'utilisateur et sur les filtres actifs :
 * ils correspondent donc toujours aux lignes affichées, sans fuite de données
 * entre enseignants, mentions ou cycles. Aucun calcul n'est refait ici.
 */
export function SuiviStatCards({ stats, loading = false }: SuiviStatCardsProps) {
  if (!stats) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 h-3 w-20 rounded bg-slate-200" />
            <div className="h-8 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  const { totaux, etats, clotures } = stats;

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Enseignements"
          value={totaux.enseignements}
          icon={<BookOpen size={18} />}
          tone="primary"
          hint="Dans votre périmètre"
        />
        <StatCard
          label="Heures prévues"
          value={totaux.volumePrevu}
          unit="h"
          icon={<CalendarClock size={18} />}
          tone="info"
          hint="Volume total à assurer"
        />
        <StatCard
          label="Heures réalisées"
          value={totaux.heuresRealisees}
          unit="h"
          icon={<CheckCircle2 size={18} />}
          tone="success"
          accent
          hint="Séances déclarées réalisées"
        />
        <StatCard
          label="Heures restantes"
          value={totaux.heuresRestantes}
          unit="h"
          icon={<Hourglass size={18} />}
          tone="warning"
          hint="Reste à assurer"
        />
        <StatCard
          label="Progression globale"
          value={totaux.progression}
          unit="%"
          icon={<TrendingUp size={18} />}
          tone="primary"
          hint="Heures réalisées / prévues"
        >
          <ProgressionBar progression={totaux.progression} size="lg" />
        </StatCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Compteur
          label="Non commencés"
          value={etats.nonCommences}
          icon={<CircleDashed size={18} />}
          classes="bg-slate-100 text-slate-500"
        />
        <Compteur
          label="En cours"
          value={etats.enCours}
          icon={<Timer size={18} />}
          classes="bg-amber-50 text-amber-600"
        />
        <Compteur
          label="Terminés"
          value={etats.termines}
          icon={<CheckCircle2 size={18} />}
          classes="bg-emerald-50 text-emerald-600"
        />
        <Compteur
          label="Clôtures anticipées"
          value={clotures.terminesParClotureAnticipee}
          icon={<Flag size={18} />}
          classes="bg-violet-50 text-violet-600"
        />
      </div>
    </div>
  );
}
