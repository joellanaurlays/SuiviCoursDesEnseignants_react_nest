import { ReactNode } from 'react';

export type StatCardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  children?: ReactNode;
  /** Icône affichée dans un pastille colorée au-dessus du libellé. */
  icon?: ReactNode;
  /** Teinte sémantique du repère coloré. */
  tone?: StatCardTone;
  /** Remplace l'unité affichée après la valeur (ex. « h », « % »). */
  unit?: string;
}

const TONE_CLASSES: Record<StatCardTone, { badge: string; accent: string }> = {
  neutral: { badge: 'bg-slate-100 text-slate-500', accent: 'bg-slate-400' },
  primary: { badge: 'bg-[#CAF0F8] text-[#03045E]', accent: 'bg-[#00B4D8]' },
  success: { badge: 'bg-emerald-50 text-emerald-700', accent: 'bg-emerald-500' },
  warning: { badge: 'bg-amber-50 text-amber-700', accent: 'bg-amber-500' },
  danger: { badge: 'bg-rose-50 text-rose-700', accent: 'bg-rose-500' },
  info: { badge: 'bg-sky-50 text-sky-700', accent: 'bg-sky-500' },
};

/**
 * Carte d'indicateur : un libellé, une valeur dominante, un indice éventuel
 * et un contenu complémentaire (barre de progression, jauge...).
 *
 * La palette suit l'identité EMIT de l'application (bleu #03045E pour la
 * valeur, dégradé #0077B6 → #00B4D8 pour les accents).
 */
export function StatCard({
  label,
  value,
  hint,
  accent = false,
  children,
  icon,
  tone = 'neutral',
  unit,
}: StatCardProps) {
  const palette = TONE_CLASSES[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition ${
        accent
          ? 'border-[#90E0EF] bg-gradient-to-br from-[#CAF0F8] via-white to-white'
          : 'border-slate-200 bg-white'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${palette.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="emit-eyebrow truncate">{label}</p>
          <p className="mt-2 flex items-baseline gap-1 text-3xl font-extrabold tracking-tight text-[#03045E]">
            <span className="truncate">{value}</span>
            {unit && <span className="text-base font-bold text-slate-400">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>}
        </div>

        {icon && (
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${palette.badge}`}
          >
            {icon}
          </span>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
