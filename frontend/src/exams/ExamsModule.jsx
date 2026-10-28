import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BookOpenCheck, CalendarDays, Check, ClipboardList, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { getRoleHomePath } from '../routing/roleRoutes.js';

// Le backend Nest expose les routes du module sous le préfixe global /api.
const API = `${import.meta.env.VITE_API_URL || ''}/api`;

async function api(path, options = {}) {
  const token = localStorage.getItem('emit_access_token');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Erreur HTTP ${response.status}`);
  }
  return response.json();
}

const today = new Date().toISOString().slice(0, 10);
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a0a32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17175a] disabled:cursor-not-allowed disabled:opacity-50';
const outlineButtonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#0a0a32] disabled:cursor-not-allowed disabled:opacity-50';

function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function StatusBadge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export default function ExamsModule() {
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [examens, setExamens] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [sessionForm, setSessionForm] = useState({
    libelle: 'Session Normale S1', anneeUniversitaire: '2025-2026', semestre: 'S1',
    dateDebut: today, dateFin: today,
  });
  const [examForm, setExamForm] = useState({ sessionId: '', dateExamen: today, heureDebut: '08:00', heureFin: '10:00', salle: '' });
  const [alertForm, setAlertForm] = useState({ examenId: '', typeAlerte: 'NOTES_NON_REMISES', message: '' });

  const navigate = useNavigate();
  const { session } = useAuth();

  const handleBack = () => {
    navigate(getRoleHomePath(session));
  };

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const [sessionData, examData, alertData] = await Promise.all([
        api('/exams/sessions'), api('/exams'), api('/exams/alertes/all'),
      ]);
      setSessions(sessionData);
      setExamens(examData);
      setAlertes(alertData);
      setExamForm((current) => ({ ...current, sessionId: current.sessionId || sessionData[0]?.id || '' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les données du module.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unreadCount = alertes.filter((item) => !item.estLue).length;
  const notesPending = examens.filter((item) => !item.notesRemises).length;
  const filteredExams = useMemo(() => examens.filter((item) => {
    const matchesSession = !sessionFilter || item.sessionId === sessionFilter;
    const search = query.trim().toLocaleLowerCase('fr');
    const session = sessions.find((candidate) => candidate.id === item.sessionId);
    const matchesQuery = !search || [item.salle, item.statut, session?.libelle, item.matiereId]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(search));
    return matchesSession && matchesQuery;
  }), [examens, query, sessionFilter, sessions]);

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(successMessage);
      await load(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’action a échoué.');
    } finally {
      setBusy(false);
    }
  };

  const createSession = (event) => {
    event.preventDefault();
    return runAction(() => api('/exams/sessions', { method: 'POST', body: JSON.stringify(sessionForm) }), 'La session a été créée.');
  };
  const createExam = (event) => {
    event.preventDefault();
    return runAction(() => api('/exams', { method: 'POST', body: JSON.stringify(examForm) }), "L’examen a été créé.");
  };
  const createAlert = (event) => {
    event.preventDefault();
    const payload = { ...alertForm };
    if (!payload.examenId) delete payload.examenId;
    return runAction(() => api('/exams/alertes', { method: 'POST', body: JSON.stringify(payload) }), 'L’alerte a été créée.');
  };
  const changeStatus = (id, statut) => runAction(
    () => api(`/exams/${id}/statut`, { method: 'PATCH', body: JSON.stringify({ statut }) }),
    'Le statut de l’examen a été mis à jour.',
  );
  const markNotesSubmitted = (id) => runAction(
    () => api(`/exams/${id}/notes-remises`, { method: 'PATCH' }),
    'La remise des notes a été enregistrée.',
  );
  const markAlertRead = (id) => runAction(
    () => api(`/exams/alertes/${id}/lue`, { method: 'PATCH' }),
    'L’alerte a été marquée comme lue.',
  );
  const closeSession = (id) => runAction(
    () => api(`/exams/sessions/${id}/cloturer`, { method: 'PATCH' }),
    'La session a été clôturée.',
  );

  const tabs = [
    { id: 'sessions', label: 'Sessions', task: 'T26', icon: CalendarDays, count: sessions.length },
    { id: 'examens', label: 'Examens & notes', task: 'T27–T29', icon: ClipboardList, count: examens.length },
    { id: 'alertes', label: 'Alertes', task: 'T30', icon: Bell, count: unreadCount },
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 border-b border-slate-200 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#00B4D8] text-[#03045E] flex items-center justify-center font-bold text-xl shadow-sm">
                EM
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-[#03045E] uppercase tracking-wider">EMIT</h2>
                <p className="text-[10px] text-slate-500 leading-tight">Université de Fianarantsoa</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-4 w-full sm:w-auto">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-[#0a0a32] tracking-tight">Examens, notes &amp; alertes</h1>
                <p className="text-sm text-slate-500 mt-1">Gérez les sessions d'examen, le calendrier et le suivi des remises de notes.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Utilisateur connecté</p>
                  <p className="text-sm font-medium text-slate-800">{session?.userId || '—'}</p>
                </div>
                <button type="button" className={outlineButtonClass} onClick={handleBack} disabled={loading || busy}>
                  <ArrowLeft size={16} /> Retour à l'application
                </button>
              </div>
            </div>
          </div>
          <button type="button" className={`${buttonClass} bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50`} onClick={() => void load()} disabled={loading || busy}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </header>

        {error && <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><button type="button" aria-label="Fermer le message" onClick={() => setError('')}><X size={18} /></button></div>}
        {notice && <div role="status" className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{notice}</span><button type="button" aria-label="Fermer le message" onClick={() => setNotice('')}><X size={18} /></button></div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs du module">
          {[
            { label: 'Sessions', value: sessions.length, note: 'Sessions enregistrées', icon: CalendarDays, color: 'text-blue-700 bg-blue-50' },
            { label: 'Examens planifiés', value: examens.length, note: 'Toutes les sessions', icon: ClipboardList, color: 'text-violet-700 bg-violet-50' },
            { label: 'Notes à remettre', value: notesPending, note: 'Examens sans notes remises', icon: BookOpenCheck, color: 'text-amber-700 bg-amber-50' },
            { label: 'Alertes non lues', value: unreadCount, note: 'À consulter', icon: Bell, color: 'text-rose-700 bg-rose-50' },
{ label: 'Examens terminés', value: examens.filter((item) => item.statut === 'TERMINE').length, note: 'Examens marqués comme terminés', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50' },\
          ].map(({ label, value, note, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#0a0a32]">{loading ? '—' : value}</p></div><span className={`rounded-xl p-3 ${color}`}><Icon size={20} /></span></div>
              <p className="mt-3 text-xs text-slate-400">{note}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <nav className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50/70 p-2" aria-label="Sections du module">
            {tabs.map(({ id, label, task, count, icon: Icon }) => (
              <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}
                className={`flex min-w-40 flex-1 cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${tab === id ? 'bg-white font-semibold text-[#0a0a32] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}>
                <span className="flex items-center gap-2"><Icon size={17} /><span>{label}</span><span className="text-xs text-slate-400">{task}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-100 text-slate-600'}`}>{count}</span>
              </button>
            ))}
          </nav>

          <div className="p-5 sm:p-7">
            {loading ? <div className="py-16 text-center text-sm text-slate-500">Chargement des données du module…</div> : (
              <>
                {tab === 'sessions' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Sessions d’examen</h2><p className="mt-1 text-sm text-slate-500">Créez et consultez les périodes d’examen.</p></div>
                  <form onSubmit={createSession} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Nouvelle session</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label className="text-xs font-medium text-slate-600">Libellé<input className={`${inputClass} mt-1.5`} value={sessionForm.libelle} onChange={(e) => setSessionForm({ ...sessionForm, libelle: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Année universitaire<input className={`${inputClass} mt-1.5`} value={sessionForm.anneeUniversitaire} onChange={(e) => setSessionForm({ ...sessionForm, anneeUniversitaire: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Semestre<input className={`${inputClass} mt-1.5`} value={sessionForm.semestre} onChange={(e) => setSessionForm({ ...sessionForm, semestre: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Date de début<input type="date" className={`${inputClass} mt-1.5`} value={sessionForm.dateDebut} onChange={(e) => setSessionForm({ ...sessionForm, dateDebut: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Date de fin<input type="date" className={`${inputClass} mt-1.5`} value={sessionForm.dateFin} onChange={(e) => setSessionForm({ ...sessionForm, dateFin: e.target.value })} required /></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy}><Plus size={16} /> Créer la session</button></div>
                  </form>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Session</th><th className="px-4 py-3">Année</th><th className="px-4 py-3">Semestre</th><th className="px-4 py-3">Période</th><th className="px-4 py-3">État</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {sessions.map((session) => <tr key={session.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{session.libelle}</td><td className="px-4 py-4 text-slate-600">{session.anneeUniversitaire}</td><td className="px-4 py-4 text-slate-600">{session.semestre}</td><td className="px-4 py-4 text-slate-600">{dateLabel(session.dateDebut)} – {dateLabel(session.dateFin)}</td>
                          <td className="px-4 py-4"><StatusBadge tone={session.estCloturee ? 'slate' : 'green'}>{session.estCloturee ? 'Clôturée' : 'Ouverte'}</StatusBadge></td>
                          <td className="px-4 py-4 text-right">{!session.estCloturee && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#0a0a32] disabled:opacity-50" disabled={busy} onClick={() => closeSession(session.id)}>Clôturer</button>}</td>
                        </tr>)}
                        {!sessions.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Aucune session enregistrée. Créez votre première session ci-dessus.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {tab === 'examens' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Examens & remise des notes</h2><p className="mt-1 text-sm text-slate-500">Planifiez les examens et suivez leur avancement.</p></div>
                  <form onSubmit={createExam} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Planifier un examen</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label className="text-xs font-medium text-slate-600">Session<select className={`${inputClass} mt-1.5`} value={examForm.sessionId} onChange={(e) => setExamForm({ ...examForm, sessionId: e.target.value })} required><option value="">Choisir une session</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.libelle} · {item.semestre}</option>)}</select></label>
                      <label className="text-xs font-medium text-slate-600">Date<input type="date" className={`${inputClass} mt-1.5`} value={examForm.dateExamen} onChange={(e) => setExamForm({ ...examForm, dateExamen: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Heure de début<input type="time" className={`${inputClass} mt-1.5`} value={examForm.heureDebut} onChange={(e) => setExamForm({ ...examForm, heureDebut: e.target.value })} /></label>
                      <label className="text-xs font-medium text-slate-600">Heure de fin<input type="time" className={`${inputClass} mt-1.5`} value={examForm.heureFin} onChange={(e) => setExamForm({ ...examForm, heureFin: e.target.value })} /></label>
                      <label className="text-xs font-medium text-slate-600">Salle<input className={`${inputClass} mt-1.5`} value={examForm.salle} onChange={(e) => setExamForm({ ...examForm, salle: e.target.value })} placeholder="Ex. Salle A1" /></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy || sessions.length === 0}><Plus size={16} /> Créer l’examen</button></div>
                    {!sessions.length && <p className="mt-2 text-right text-xs text-amber-700">Créez d’abord une session pour planifier un examen.</p>}
                  </form>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">{filteredExams.length} examen(s)</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-9 sm:w-64`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un examen…" /></label>
                      <select className={`${inputClass} sm:w-56`} value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}><option value="">Toutes les sessions</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}</select>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date & heure</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Salle</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Notes</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExams.map((exam) => <tr key={exam.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-medium text-slate-800">{dateLabel(exam.dateExamen)}<span className="mt-1 block text-xs font-normal text-slate-500">{[exam.heureDebut, exam.heureFin].filter(Boolean).join(' – ') || 'Horaire à définir'}</span></td>
                          <td className="px-4 py-4 text-slate-600">{sessions.find((item) => item.id === exam.sessionId)?.libelle || '—'}</td><td className="px-4 py-4 text-slate-600">{exam.salle || '—'}</td>
                          <td className="px-4 py-4"><StatusBadge tone={exam.statut === 'TERMINE' ? 'green' : exam.statut === 'EN_COURS' ? 'blue' : 'amber'}>{exam.statut === 'TERMINE' ? 'Terminé' : exam.statut === 'EN_COURS' ? 'En cours' : 'À venir'}</StatusBadge></td>
                          <td className="px-4 py-4"><StatusBadge tone={exam.notesRemises ? 'green' : 'red'}>{exam.notesRemises ? 'Remises' : 'En attente'}</StatusBadge></td>
                          <td className="px-4 py-4"><div className="flex justify-end gap-2">
                            {exam.statut !== 'TERMINE' && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" disabled={busy} onClick={() => changeStatus(exam.id, exam.statut === 'EN_COURS' ? 'A_VENIR' : 'EN_COURS')}>{exam.statut === 'EN_COURS' ? 'À venir' : 'Démarrer'}</button>}
                            {exam.statut !== 'TERMINE' && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" disabled={busy} onClick={() => changeStatus(exam.id, 'TERMINE')}>Terminer</button>}
                            {!exam.notesRemises && <button type="button" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[#0a0a32] hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={() => markNotesSubmitted(exam.id)}><Check size={14} /> Notes remises</button>}
                          </div></td>
                        </tr>)}
                        {!filteredExams.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Aucun examen ne correspond aux filtres sélectionnés.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {tab === 'alertes' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Centre des alertes</h2><p className="mt-1 text-sm text-slate-500">Consultez les alertes et marquez celles que vous avez traitées.</p></div>
                  <form onSubmit={createAlert} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Nouvelle alerte</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_1fr]">
                      <label className="text-xs font-medium text-slate-600">Type<select className={`${inputClass} mt-1.5`} value={alertForm.typeAlerte} onChange={(e) => setAlertForm({ ...alertForm, typeAlerte: e.target.value })}><option value="NOTES_NON_REMISES">Notes non remises</option><option value="EXAMEN_APPROCHANT">Examen proche</option><option value="SESSION_OUVERTE">Session ouverte</option><option value="AUTRE">Autre</option></select></label>
                      <label className="text-xs font-medium text-slate-600">Message<input className={`${inputClass} mt-1.5`} value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} placeholder="Décrivez l’alerte" required /></label>
                      <label className="text-xs font-medium text-slate-600">Examen associé<select className={`${inputClass} mt-1.5`} value={alertForm.examenId} onChange={(e) => setAlertForm({ ...alertForm, examenId: e.target.value })}><option value="">Aucun</option>{examens.map((exam) => <option key={exam.id} value={exam.id}>{dateLabel(exam.dateExamen)} · {exam.salle || 'Sans salle'}</option>)}</select></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy}><Plus size={16} /> Créer l’alerte</button></div>
                  </form>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Examen</th><th className="px-4 py-3">Créée le</th><th className="px-4 py-3">État</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {alertes.map((alert) => <tr key={alert.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{alert.typeAlerte}</td><td className="max-w-sm px-4 py-4 text-slate-600">{alert.message}</td><td className="px-4 py-4 text-slate-600">{alert.examenId ? examens.find((exam) => exam.id === alert.examenId)?.salle || 'Examen associé' : '—'}</td><td className="px-4 py-4 whitespace-nowrap text-slate-600">{dateLabel(alert.createdAt)}</td>
                          <td className="px-4 py-4"><StatusBadge tone={alert.estLue ? 'slate' : 'red'}>{alert.estLue ? 'Lue' : 'Non lue'}</StatusBadge>{alert.estTraitee && <span className="ml-1"><StatusBadge tone="green">Traitée</StatusBadge></span>}</td>
                          <td className="px-4 py-4 text-right">{!alert.estLue && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#0a0a32] hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={() => markAlertRead(alert.id)}>Marquer comme lue</button>}</td>
                        </tr>)}
                        {!alertes.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Aucune alerte enregistrée.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}
              </>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
