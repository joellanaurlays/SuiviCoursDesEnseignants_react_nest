import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BookOpenCheck, CalendarDays, Check, ClipboardList, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../services/sessionApi';

const api = (path, method = 'GET', body) => apiFetch(path, { method, body });

const today = new Date().toISOString().slice(0, 10);
const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a0a32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17175a] disabled:cursor-not-allowed disabled:opacity-50';

function dateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function temporalState(value) {
  const date = String(value || '').slice(0, 10);
  if (!date || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) return 'Date non renseignée';
  if (date < today) return 'Date passée';
  if (date === today) return 'Aujourd’hui';
  return 'Date à venir';
}

function sessionSignature(session) {
  return [session.libelle, session.anneeUniversitaire, session.semestre,
    String(session.dateDebut || '').slice(0, 10), String(session.dateFin || '').slice(0, 10)]
    .map((value) => String(value || '').trim().toLocaleLowerCase('fr')).join('|');
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

function overlapsInRoom(candidate, existing) {
  if (!candidate.dateExamen || !candidate.salle || !candidate.heureDebut || !candidate.heureFin) return false;
  const room = candidate.salle.trim().toLocaleLowerCase('fr');
  const minutes = (value) => {
    const [hours, mins] = String(value || '').split(':').map(Number);
    return Number.isFinite(hours) && Number.isFinite(mins) ? hours * 60 + mins : null;
  };
  const start = minutes(candidate.heureDebut);
  const end = minutes(candidate.heureFin);
  if (start === null || end === null || end <= start) return false;
  return existing.some((exam) => {
    if (exam.dateExamen !== candidate.dateExamen || String(exam.salle || '').trim().toLocaleLowerCase('fr') !== room) return false;
    const otherStart = minutes(exam.heureDebut);
    const otherEnd = minutes(exam.heureFin);
    return otherStart !== null && otherEnd !== null && start < otherEnd && otherStart < end;
  });
}

export default function ExamsModule() {
  const { session } = useAuth();
  const canManage = session.role === 'SCOLARITE';
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
  const [statusDrafts, setStatusDrafts] = useState({});
  const [sessionForm, setSessionForm] = useState({
    libelle: 'Session Normale S1', anneeUniversitaire: '2025-2026', semestre: 'S1',
    dateDebut: today, dateFin: today,
  });
  const [examForm, setExamForm] = useState({ sessionId: '', dateExamen: today, heureDebut: '08:00', heureFin: '10:00', salle: '' });
  const [alertForm, setAlertForm] = useState({ examenId: '', typeAlerte: 'NOTES_NON_REMISES', message: '' });

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
      setExamForm((current) => ({
        ...current,
        sessionId: sessionData.some((item) => item.id === current.sessionId && !item.estCloturee)
          ? current.sessionId
          : sessionData.find((item) => !item.estCloturee)?.id || '',
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les données du module.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unreadCount = alertes.filter((item) => !item.estLue).length;
  const notesPending = examens.filter((item) => !item.notesRemises).length;
  const upcomingCount = examens.filter((item) => item.statut === 'A_VENIR' && String(item.dateExamen).slice(0, 10) >= today).length;
  const completedCount = examens.filter((item) => item.statut === 'TERMINE').length;
  const openSessions = sessions.filter((item) => !item.estCloturee);
  const sessionSignatures = useMemo(() => {
    const counts = new Map();
    sessions.forEach((item) => counts.set(sessionSignature(item), (counts.get(sessionSignature(item)) || 0) + 1));
    return counts;
  }, [sessions]);
  const conflictedExamIds = useMemo(() => {
    const ids = new Set();
    examens.forEach((exam, index) => examens.slice(index + 1).forEach((other) => {
      if (overlapsInRoom(exam, [other])) {
        ids.add(exam.id);
        ids.add(other.id);
      }
    }));
    return ids;
  }, [examens]);
  const filteredExams = useMemo(() => examens.filter((item) => {
    const matchesSession = !sessionFilter || item.sessionId === sessionFilter;
    const search = query.trim().toLocaleLowerCase('fr');
    const session = sessions.find((candidate) => candidate.id === item.sessionId);
    const matchesQuery = !search || [item.salle, item.statut, session?.libelle, item.matiereId]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(search));
    return matchesSession && matchesQuery;
  }), [examens, query, sessionFilter, sessions]);

  const runAction = async (action, successMessage) => {
    if (!canManage) {
      setError('Seul le chef de scolarité peut effectuer cette action.');
      return;
    }
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
    if (sessionForm.dateFin < sessionForm.dateDebut) {
      setError('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }
    return runAction(() => api('/exams/sessions', 'POST', sessionForm), 'La session a été créée.');
  };
  const createExam = (event) => {
    event.preventDefault();
    if (!openSessions.some((item) => item.id === examForm.sessionId)) {
      setError('Choisissez une session ouverte avant de planifier un examen.');
      return;
    }
    if (examForm.heureDebut && examForm.heureFin && examForm.heureFin <= examForm.heureDebut) {
      setError('L’heure de fin doit être postérieure à l’heure de début.');
      return;
    }
    if (overlapsInRoom(examForm, examens)) {
      setError('Conflit détecté : un examen est déjà prévu dans cette salle sur ce créneau.');
      return;
    }
    return runAction(() => api('/exams', 'POST', examForm), "L’examen a été créé.");
  };
  const createAlert = (event) => {
    event.preventDefault();
    const payload = { ...alertForm };
    if (!payload.examenId) delete payload.examenId;
    return runAction(() => api('/exams/alertes', 'POST', payload), 'L’alerte a été créée.');
  };
  const changeStatus = (id, statut) => runAction(
    () => api(`/exams/${id}/statut`, 'PATCH', { statut }),
    'Le statut de l’examen a été mis à jour.',
  );
  const markNotesSubmitted = (id) => runAction(
    () => api(`/exams/${id}/notes-remises`, 'PATCH'),
    'La remise des notes a été enregistrée.',
  );
  const markAlertRead = (id) => runAction(
    () => api(`/exams/alertes/${id}/lue`, 'PATCH'),
    'L’alerte a été marquée comme lue.',
  );
  const markAlertTreated = (id) => runAction(
    () => api(`/exams/alertes/${id}/traitee`, 'PATCH'),
    'L’alerte a été marquée comme traitée.',
  );
  const closeSession = (id) => runAction(
    () => api(`/exams/sessions/${id}/cloturer`, 'PATCH'),
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
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Administration académique · Module 6</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#0a0a32]">Examens, notes & alertes</h1>
            <p className="mt-2 text-sm text-slate-500">Gérez les sessions d’examen, le calendrier et le suivi des remises de notes.</p>
          </div>
          <button type="button" className={`${buttonClass} bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50`} onClick={() => void load()} disabled={loading || busy}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </header>

        {error && <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><button type="button" aria-label="Fermer le message" onClick={() => setError('')}><X size={18} /></button></div>}
        {notice && <div role="status" className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><span>{notice}</span><button type="button" aria-label="Fermer le message" onClick={() => setNotice('')}><X size={18} /></button></div>}

        {!canManage && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Mode consultation : la gestion et la validation des examens sont réservées au chef de scolarité. La demande de date par un enseignant n’est pas encore prise en charge par l’API.</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicateurs du module">
          {[
            { label: 'Sessions', value: sessions.length, note: 'Sessions enregistrées', icon: CalendarDays, color: 'text-blue-700 bg-blue-50' },
            { label: 'Examens à venir', value: upcomingCount, note: 'Statut à venir, date du jour ou future', icon: ClipboardList, color: 'text-violet-700 bg-violet-50' },
            { label: 'Examens terminés', value: completedCount, note: 'Statut terminé', icon: Check, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Notes à remettre', value: notesPending, note: 'Examens sans notes remises', icon: BookOpenCheck, color: 'text-amber-700 bg-amber-50' },
            { label: 'Alertes non lues', value: unreadCount, note: 'À consulter', icon: Bell, color: 'text-rose-700 bg-rose-50' },
          ].map(({ label, value, note, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  {canManage && <form onSubmit={createSession} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Nouvelle session</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label className="text-xs font-medium text-slate-600">Libellé<input className={`${inputClass} mt-1.5`} value={sessionForm.libelle} onChange={(e) => setSessionForm({ ...sessionForm, libelle: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Année universitaire<input className={`${inputClass} mt-1.5`} value={sessionForm.anneeUniversitaire} onChange={(e) => setSessionForm({ ...sessionForm, anneeUniversitaire: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Semestre<input className={`${inputClass} mt-1.5`} value={sessionForm.semestre} onChange={(e) => setSessionForm({ ...sessionForm, semestre: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Date de début<input type="date" className={`${inputClass} mt-1.5`} value={sessionForm.dateDebut} onChange={(e) => setSessionForm({ ...sessionForm, dateDebut: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Date de fin<input type="date" min={sessionForm.dateDebut} className={`${inputClass} mt-1.5`} value={sessionForm.dateFin} onChange={(e) => setSessionForm({ ...sessionForm, dateFin: e.target.value })} required /></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy}><Plus size={16} /> Créer la session</button></div>
                  </form>}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Session</th><th className="px-4 py-3">Année</th><th className="px-4 py-3">Semestre</th><th className="px-4 py-3">Période</th><th className="px-4 py-3">État</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {sessions.map((session) => <tr key={session.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{session.libelle}{sessionSignatures.get(sessionSignature(session)) > 1 && <span className="mt-1 block"><StatusBadge tone="amber">Enregistrement semblable à une autre session</StatusBadge></span>}</td><td className="px-4 py-4 text-slate-600">{session.anneeUniversitaire}</td><td className="px-4 py-4 text-slate-600">{session.semestre}</td><td className="px-4 py-4 text-slate-600">{dateLabel(session.dateDebut)} – {dateLabel(session.dateFin)}</td>
                          <td className="px-4 py-4"><StatusBadge tone={session.estCloturee ? 'slate' : 'green'}>{session.estCloturee ? 'Clôturée' : 'Ouverte'}</StatusBadge></td>
                          <td className="px-4 py-4 text-right">{canManage && !session.estCloturee && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#0a0a32] disabled:opacity-50" disabled={busy} onClick={() => closeSession(session.id)}>Clôturer</button>}</td>
                        </tr>)}
                        {!sessions.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Aucune session enregistrée. Créez votre première session ci-dessus.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {tab === 'examens' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Examens & remise des notes</h2><p className="mt-1 text-sm text-slate-500">Planifiez les examens et suivez leur avancement.</p></div>
                  {canManage && <form onSubmit={createExam} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Planifier un examen</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label className="text-xs font-medium text-slate-600">Session<select className={`${inputClass} mt-1.5`} value={examForm.sessionId} onChange={(e) => setExamForm({ ...examForm, sessionId: e.target.value })} required><option value="">Choisir une session</option>{openSessions.map((item) => <option key={item.id} value={item.id}>{item.libelle} · {item.semestre}</option>)}</select></label>
                      <label className="text-xs font-medium text-slate-600">Date<input type="date" className={`${inputClass} mt-1.5`} value={examForm.dateExamen} onChange={(e) => setExamForm({ ...examForm, dateExamen: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Heure de début<input type="time" className={`${inputClass} mt-1.5`} value={examForm.heureDebut} onChange={(e) => setExamForm({ ...examForm, heureDebut: e.target.value })} /></label>
                      <label className="text-xs font-medium text-slate-600">Heure de fin<input type="time" className={`${inputClass} mt-1.5`} value={examForm.heureFin} onChange={(e) => setExamForm({ ...examForm, heureFin: e.target.value })} /></label>
                      <label className="text-xs font-medium text-slate-600">Salle<input className={`${inputClass} mt-1.5`} value={examForm.salle} onChange={(e) => setExamForm({ ...examForm, salle: e.target.value })} placeholder="Ex. Salle A1" /></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy || openSessions.length === 0}><Plus size={16} /> Créer l’examen</button></div>
                    {!openSessions.length && <p className="mt-2 text-right text-xs text-amber-700">Aucune session ouverte : impossible de planifier un examen.</p>}
                  </form>}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">{filteredExams.length} examen(s)</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-9 sm:w-64`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un examen…" /></label>
                      <select className={`${inputClass} sm:w-56`} value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}><option value="">Toutes les sessions</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}</select>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    {conflictedExamIds.size > 0 && <p className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">Conflit de salle détecté parmi les examens chargés. Le contrôle utilise les dates, salles et horaires renvoyés par l’API; il ne remplace pas une validation serveur.</p>}
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date & heure</th><th className="px-4 py-3">Matière / identifiant</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Salle</th><th className="px-4 py-3">Statut enregistré / date</th><th className="px-4 py-3">Notes</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExams.map((exam) => <tr key={exam.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-medium text-slate-800">{dateLabel(exam.dateExamen)}<span className="mt-1 block text-xs font-normal text-slate-500">{[exam.heureDebut, exam.heureFin].filter(Boolean).join(' – ') || 'Horaire à définir'}</span></td>
                          <td className="px-4 py-4 text-xs text-slate-600">{exam.matiereId ? <span className="font-mono">{exam.matiereId}</span> : 'Matière non renseignée'}</td><td className="px-4 py-4 text-slate-600">{sessions.find((item) => item.id === exam.sessionId)?.libelle || '—'}</td><td className="px-4 py-4 text-slate-600">{exam.salle || '—'}</td>
                          <td className="px-4 py-4"><div className="flex flex-col items-start gap-1"><StatusBadge tone={exam.statut === 'TERMINE' ? 'green' : exam.statut === 'EN_COURS' ? 'blue' : 'amber'}>{exam.statut === 'TERMINE' ? 'Terminé' : exam.statut === 'EN_COURS' ? 'En cours' : 'À venir'}</StatusBadge><StatusBadge tone={temporalState(exam.dateExamen) === 'Date passée' ? 'red' : temporalState(exam.dateExamen) === 'Date à venir' ? 'blue' : 'slate'}>{temporalState(exam.dateExamen)}</StatusBadge>{exam.statut === 'A_VENIR' && temporalState(exam.dateExamen) === 'Date passée' && <StatusBadge tone="red">Date passée — statut à vérifier</StatusBadge>}{conflictedExamIds.has(exam.id) && <StatusBadge tone="red">Conflit de salle</StatusBadge>}{(!exam.salle || !exam.heureDebut || !exam.heureFin) && <StatusBadge>Contrôle incomplet</StatusBadge>}</div></td>
                          <td className="px-4 py-4"><StatusBadge tone={exam.notesRemises ? 'green' : 'red'}>{exam.notesRemises ? 'Remises' : 'En attente'}</StatusBadge></td>
                          <td className="px-4 py-4"><div className="flex justify-end gap-2">
                            {canManage && <><select aria-label={`Statut de l’examen du ${dateLabel(exam.dateExamen)}`} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" value={statusDrafts[exam.id] || exam.statut} disabled={busy} onChange={(event) => setStatusDrafts({ ...statusDrafts, [exam.id]: event.target.value })}><option value="A_VENIR">À venir</option><option value="EN_COURS">En cours</option><option value="TERMINE">Terminé</option></select>{(statusDrafts[exam.id] || exam.statut) !== exam.statut && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" disabled={busy} onClick={() => changeStatus(exam.id, statusDrafts[exam.id])}>Enregistrer</button>}</>}
                            {canManage && !exam.notesRemises && exam.statut === 'TERMINE' && <button type="button" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[#0a0a32] hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={() => markNotesSubmitted(exam.id)}><Check size={14} /> Notes remises</button>}
                            {canManage && !exam.notesRemises && exam.statut !== 'TERMINE' && <span className="self-center text-xs text-slate-500">Remise possible après la fin de l’examen</span>}
                          </div></td>
                        </tr>)}
                        {!filteredExams.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Aucun examen ne correspond aux filtres sélectionnés.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {tab === 'alertes' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Centre des alertes</h2><p className="mt-1 text-sm text-slate-500">Alertes enregistrées renvoyées par l’API. Leur affichage ne précise pas leur mode de création.</p></div>
                  {canManage && <form onSubmit={createAlert} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Nouvelle alerte</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_1fr]">
                      <label className="text-xs font-medium text-slate-600">Type<select className={`${inputClass} mt-1.5`} value={alertForm.typeAlerte} onChange={(e) => setAlertForm({ ...alertForm, typeAlerte: e.target.value })}><option value="NOTES_NON_REMISES">Notes non remises</option><option value="MISSING_DOCUMENTS">Documents manquants</option><option value="EN_COURS">Examen en cours</option><option value="A_VENIR">Examen à venir</option></select></label>
                      <label className="text-xs font-medium text-slate-600">Message<input className={`${inputClass} mt-1.5`} value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} placeholder="Décrivez l’alerte" required /></label>
                      <label className="text-xs font-medium text-slate-600">Examen associé<select className={`${inputClass} mt-1.5`} value={alertForm.examenId} onChange={(e) => setAlertForm({ ...alertForm, examenId: e.target.value })}><option value="">Aucun</option>{examens.map((exam) => <option key={exam.id} value={exam.id}>{dateLabel(exam.dateExamen)} · {exam.salle || 'Sans salle'}</option>)}</select></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy}><Plus size={16} /> Créer l’alerte</button></div>
                  </form>}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Examen</th><th className="px-4 py-3">Créée le</th><th className="px-4 py-3">État</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {alertes.map((alert) => <tr key={alert.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{alert.typeAlerte}</td><td className="max-w-sm px-4 py-4 text-slate-600">{alert.message}</td><td className="px-4 py-4 text-slate-600">{alert.examen?.salle || (alert.examenId ? `${dateLabel(alert.examen?.dateExamen || examens.find((exam) => exam.id === alert.examenId)?.dateExamen)} · ${alert.examenId.slice(0, 8)}` : '—')}</td><td className="px-4 py-4 whitespace-nowrap text-slate-600">{dateLabel(alert.createdAt)}</td>
                          <td className="px-4 py-4"><StatusBadge tone={alert.estLue ? 'slate' : 'red'}>{alert.estLue ? 'Lue' : 'Non lue'}</StatusBadge>{alert.estTraitee && <span className="ml-1"><StatusBadge tone="green">Traitée</StatusBadge></span>}</td>
                          <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2">{canManage && !alert.estLue && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#0a0a32] hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={() => markAlertRead(alert.id)}>Marquer comme lue</button>}{canManage && !alert.estTraitee && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" disabled={busy} onClick={() => markAlertTreated(alert.id)}>Traiter</button>}</div></td>
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
