import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Clock3,
  GraduationCap,
  Hourglass,
  Layers,
  Timer,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { Seance, SuiviEnseignement } from '../../types/enseignement';
import { formatDuree } from '../../utils/format';
import { EtatBadge } from './EtatBadge';
import { ClotureBadge } from './ClotureBadge';
import { SeanceStatutBadge } from './SeanceStatutBadge';
import { ProgressionBar } from '../ui/ProgressionBar';
import { EmptyState } from '../ui/EmptyState';

interface SuiviDetailViewProps {
  enseignement: SuiviEnseignement;
  seances: Seance[];
  backLabel: string;
  backLink: string;
  /** Rendu de l'action « Clôturer l'enseignement » (enseignant titulaire uniquement). */
  actionCloture?: React.ReactNode;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-[#03045E]">{value}</span>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        accent ? 'border-[#90E0EF] bg-[#CAF0F8]' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={accent ? 'text-[#03045E]' : 'text-slate-400'} aria-hidden="true">
          {icon}
        </span>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-extrabold text-[#03045E]">{value}</p>
    </div>
  );
}

export function SuiviDetailView({ enseignement, seances, backLabel, backLink, actionCloture }: SuiviDetailViewProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          to={backLink}
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-[#0077B6] transition hover:text-[#03045E]"
        >
          <ArrowLeft size={16} aria-hidden="true" /> {backLabel}
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="emit-eyebrow">Fiche de suivi</p>
            <h1 className="emit-title mt-1 truncate">Détail de l&apos;enseignement</h1>
            <p className="emit-subtitle mt-1">{enseignement.matiere}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EtatBadge etat={enseignement.etat} />
            <span className="emit-chip bg-white text-slate-600 ring-1 ring-inset ring-slate-200">
              <CalendarRange size={13} aria-hidden="true" />
              Année {enseignement.anneeUniversitaire}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Fiche d'enseignement */}
          <section className="emit-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
                  <GraduationCap size={18} />
                </span>
                <h2 className="text-lg font-bold text-[#03045E]">Fiche d&apos;enseignement</h2>
              </div>
              <EtatBadge etat={enseignement.etat} />
            </div>
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow
                label="Matière"
                value={<span className="inline-flex items-center gap-1.5"><Layers size={13} aria-hidden="true" />{enseignement.matiere}</span>}
              />
              <InfoRow
                label="Enseignant"
                value={<span className="inline-flex items-center gap-1.5"><UserRound size={13} aria-hidden="true" />{enseignement.enseignant}</span>}
              />
              <InfoRow label="Mention" value={enseignement.mention} />
              <InfoRow label="Parcours" value={enseignement.parcours} />
              <InfoRow label="Cycle" value={enseignement.cycle} />
              <InfoRow label="Niveau" value={enseignement.niveau} />
              <InfoRow label="Semestre" value={enseignement.semestre} />
              <InfoRow label="Année universitaire" value={enseignement.anneeUniversitaire} />
              <InfoRow label="Volume prévu" value={`${enseignement.volumePrevu}h`} />
            </div>
          </section>

          {/* Historique des séances */}
          <section className="emit-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
                  <CalendarDays size={18} />
                </span>
                <h2 className="text-lg font-bold text-[#03045E]">Historique des séances</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {seances.length} séance(s)
              </span>
            </div>

            {seances.length === 0 ? (
              <EmptyState
                message="Aucune séance enregistrée pour cet enseignement."
                hint="Les séances déclarées par l'enseignant apparaîtront ici."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="emit-table-head">
                    <tr>
                      <th scope="col" className="emit-table-th">Date</th>
                      <th scope="col" className="emit-table-th">Horaire</th>
                      <th scope="col" className="emit-table-th">Salle</th>
                      <th scope="col" className="emit-table-th">Type</th>
                      <th scope="col" className="emit-table-th">Durée</th>
                      <th scope="col" className="emit-table-th">Statut</th>
                      <th scope="col" className="emit-table-th">Contenu enseigné</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {seances.map((seance) => (
                      <tr key={seance.id} className="transition-colors hover:bg-[#CAF0F8]/40">
                        <td className="emit-table-td whitespace-nowrap font-medium text-slate-700">
                          {new Date(seance.dateSeance).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="emit-table-td whitespace-nowrap text-slate-500">
                          {seance.heureDebut} - {seance.heureFin}
                        </td>
                        <td className="emit-table-td whitespace-nowrap text-slate-500">
                          {seance.salle || <span className="italic text-slate-400">—</span>}
                        </td>
                        <td className="emit-table-td whitespace-nowrap text-slate-500">
                          {seance.typeSeance || <span className="italic text-slate-400">—</span>}
                        </td>
                        <td className="emit-table-td whitespace-nowrap font-medium text-slate-700">
                          {formatDuree(seance.duree)}
                        </td>
                        <td className="emit-table-td">
                          <SeanceStatutBadge statut={seance.statut} />
                        </td>
                        <td className="emit-table-td max-w-xs text-slate-500">
                          {seance.contenuEnseigne || <span className="italic text-slate-400">Non renseigné</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Suivi des heures */}
          <section className="emit-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
                <Timer size={18} />
              </span>
              <h2 className="text-lg font-bold text-[#03045E]">Suivi des heures</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock
                label="Volume prévu"
                value={`${enseignement.volumePrevu}h`}
                icon={<CalendarRange size={13} />}
              />
              <StatBlock
                label="Heures réalisées"
                value={`${enseignement.heuresRealisees}h`}
                icon={<Clock3 size={13} />}
                accent
              />
              <StatBlock
                label="Heures restantes"
                value={`${enseignement.heuresRestantes}h`}
                icon={<Hourglass size={13} />}
              />
              <StatBlock
                label="Progression"
                value={`${enseignement.progression}%`}
                icon={<TrendingUp size={13} />}
              />
            </div>

            <div className="mt-4">
              <ProgressionBar progression={enseignement.progression} showLabel size="lg" />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-semibold text-slate-500">État</span>
              <EtatBadge etat={enseignement.etat} />
            </div>

            {actionCloture && <div className="mt-5 border-t border-slate-100 pt-4">{actionCloture}</div>}
          </section>

          {/* Clôture anticipée */}
          {enseignement.clotureAnticipee && (
            <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600" aria-hidden="true">
                    <AlertTriangle size={18} />
                  </span>
                  <h2 className="text-lg font-bold text-[#03045E]">Clôture anticipée</h2>
                </div>
                <ClotureBadge typeCloture={enseignement.typeCloture} />
              </div>
              <div className="space-y-1">
                <InfoRow label="Motif" value={enseignement.motifCloture || 'Non renseigné'} />
                <InfoRow
                  label="Date de clôture"
                  value={
                    enseignement.dateCloture
                      ? new Date(enseignement.dateCloture).toLocaleDateString('fr-FR')
                      : '—'
                  }
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                La progression ci-dessus reste celle des heures réellement réalisées : la clôture
                anticipée ne l&apos;a pas modifiée.
              </p>
            </section>
          )}

          {/* Résumé */}
          <section className="emit-card p-6">
            <h2 className="mb-3 text-lg font-bold text-[#03045E]">Séances réalisées</h2>
            <p className="text-sm text-slate-600">
              <span className="text-2xl font-extrabold text-[#03045E]">
                {enseignement.nombreSeancesRealisees}
              </span>{' '}
              séance(s) réalisée(s)
              {enseignement.derniereSeanceRealisee && (
                <>
                  {' '}
                  · dernier cours le{' '}
                  {new Date(enseignement.derniereSeanceRealisee).toLocaleDateString('fr-FR')}
                </>
              )}
            </p>
            {enseignement.enRetard && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                Aucune séance réalisée depuis plus de 14 jours
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
