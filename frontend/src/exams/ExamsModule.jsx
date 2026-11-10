import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BookOpenCheck, CalendarDays, Check, CheckCircle, ClipboardList, MessageSquare, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { getRoleHomePath } from '../routing/roleRoutes.js';

// Le backend Nest expose les routes du module sous le préfixe global /api.
const API = `${import.meta.env.VITE_API_URL || ''}/api`;

// Extrait un message clair en français de la réponse d'erreur du backend (jamais de JSON brut ni de code HTTP).
async function extraireMessageErreur(response) {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim();
    if (Array.isArray(data?.message)) {
      const messages = data.message.filter((item) => typeof item === 'string' && item.trim());
      if (messages.length) return messages.join(' ; ');
    }
  } catch {
    // Corps non JSON (ex. page d'erreur du serveur) : message générique.
  }
  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

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
    throw new Error(await extraireMessageErreur(response));
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
  const [enseignements, setEnseignements] = useState([]);
  const [examens, setExamens] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [sessionForm, setSessionForm] = useState({ libelle: '', anneeUniversitaire: '', semestre: '', dateDebut: '', dateFin: '' });
  const [editingSessionId, setEditingSessionId] = useState('');
  const [examForm, setExamForm] = useState({ sessionId: '', enseignementId: '', dateExamen: today, heureDebut: '08:00', heureFin: '10:00', salle: '' });
  const [alertForm, setAlertForm] = useState({ examenId: '', typeAlerte: 'NOTES_NON_REMISES', message: '' });
  const [referentiel, setReferentiel] = useState(null);
  const [newConvSelection, setNewConvSelection] = useState({});
  const [messages, setMessages] = useState([]);
  const [messagesExamenId, setMessagesExamenId] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [conversations, setConversations] = useState([]);
  const prevUnreadRef = useRef(0);

  const navigate = useNavigate();
  const { session, displayName } = useAuth();
  const isScolarite = session?.role === 'SCOLARITE';

  const handleBack = () => {
    navigate(getRoleHomePath(session));
  };

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const [sessionData, examData, enseignementData, alertData, referentielData, messagesNonLusData, conversationsData] = await Promise.all([
        api('/exams/sessions'),
        api('/exams'),
        isScolarite ? api('/suivi/enseignements') : Promise.resolve([]),
        isScolarite ? api('/exams/alertes/all') : Promise.resolve([]),
        isScolarite ? api('/enseignements/referentiels') : Promise.resolve(null),
        api('/exams/messages/non-lus').catch(() => ({ count: 0 })),
        api('/exams/conversations').catch(() => []),
      ]);
      setSessions(sessionData);
      setEnseignements(enseignementData);
      setExamens(examData);
      setAlertes(alertData);
      setReferentiel(referentielData);
      setUnreadMessages(messagesNonLusData?.count ?? 0);
      setConversations(conversationsData ?? []);
      setExamForm((current) => ({ ...current, sessionId: current.sessionId || sessionData[0]?.id || '', enseignementId: current.enseignementId || enseignementData[0]?.id || '' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les données du module.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [isScolarite]);

  useEffect(() => { void load(); }, [load]);

  // Actualisation automatique (30 s) + au retour sur l'onglet.
  useEffect(() => {
    prevUnreadRef.current = unreadMessages;
  }, [unreadMessages]);

  useEffect(() => {
    const interval = setInterval(() => { if (!busy) void refreshMessages(); }, 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void refreshMessages(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, [busy, messagesExamenId]);

  const unreadCount = alertes.filter((item) => !item.estLue).length;
  const anneesUniversitaires = referentiel?.anneesUniversitaires || [];
  const semestresAutorises = [...new Set((referentiel?.semestres || []).map((item) => item.value))];
  const notesPending = examens.filter((item) => !item.notesRemises).length;
  const filteredExams = useMemo(() => examens.filter((item) => {
    const matchesSession = !sessionFilter || item.sessionId === sessionFilter;
    const search = query.trim().toLocaleLowerCase('fr');
    const session = sessions.find((candidate) => candidate.id === item.sessionId);
    const matchesQuery = !search || [item.salle, item.statut, session?.libelle, item.matiereId]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(search));
    return matchesSession && matchesQuery;
  }), [examens, query, sessionFilter, sessions]);
  const teacherConversations = useMemo(() => {
    if (!isScolarite) return [];
    const ensById = new Map(enseignements.map((item) => [item.id, item]));
    const map = new Map();
    for (const ens of enseignements) {
      if (!map.has(ens.enseignant)) {
        map.set(ens.enseignant, { enseignant: ens.enseignant, exams: [], lastMessageAt: null, unreadCount: 0, lastExamenId: null });
      }
    }
    for (const exam of examens) {
      const ens = ensById.get(exam.enseignementId);
      if (!ens) continue;
      const teacher = ens.enseignant;
      if (!map.has(teacher)) {
        map.set(teacher, { enseignant: teacher, exams: [], lastMessageAt: null, unreadCount: 0, lastExamenId: null });
      }
      map.get(teacher).exams.push({ ...exam, matiere: ens.matiere });
    }
    for (const conv of conversations) {
      const exam = examens.find((item) => item.id === conv.examenId);
      const ens = exam ? ensById.get(exam.enseignementId) : null;
      const teacher = ens?.enseignant;
      if (!teacher || !map.has(teacher)) continue;
      const entry = map.get(teacher);
      if (!entry.lastMessageAt || new Date(conv.lastMessageAt) > new Date(entry.lastMessageAt)) {
        entry.lastMessageAt = conv.lastMessageAt;
        entry.lastExamenId = conv.examenId;
      }
      entry.unreadCount += conv.unreadCount || 0;
    }
    const list = [...map.values()];
    list.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return a.enseignant.localeCompare(b.enseignant);
    });
    return list;
  }, [isScolarite, enseignements, examens, conversations]);

  const runAction = async (action, successMessage, onSuccess) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(successMessage);
      await load(false);
      if (onSuccess) onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’action a échoué.');
    } finally {
      setBusy(false);
    }
  };

  const sessionVide = { libelle: '', anneeUniversitaire: '', semestre: '', dateDebut: '', dateFin: '' };
  const submitSession = (event) => {
    event.preventDefault();
    if (editingSessionId) {
      // Modification : réinitialisation uniquement après succès ; en cas d'erreur les champs et le mode édition sont conservés.
      return runAction(
        () => api(`/exams/sessions/${editingSessionId}`, { method: 'PATCH', body: JSON.stringify(sessionForm) }),
        'La session a été mise à jour.',
        () => { setSessionForm(sessionVide); setEditingSessionId(''); },
      );
    }
    return runAction(() => api('/exams/sessions', { method: 'POST', body: JSON.stringify(sessionForm) }), 'La session a été créée.', () => setSessionForm(sessionVide));
  };
  const startEditSession = (item) => {
    setEditingSessionId(item.id);
    setSessionForm({ libelle: item.libelle, anneeUniversitaire: item.anneeUniversitaire, semestre: item.semestre, dateDebut: String(item.dateDebut).slice(0, 10), dateFin: String(item.dateFin).slice(0, 10) });
  };
  const cancelEditSession = () => {
    setEditingSessionId('');
    setSessionForm(sessionVide);
  };

  const defaultReminderFor = (examen) => examen && !examen.notesRemises
    ? `Rappel : vos notes pour l'examen du ${examen.dateExamen} (salle ${examen.salle || '—'}) ne sont pas encore remises. Merci de les transmettre.`
    : '';

  const openThread = async (examenId) => {
    setMessagesExamenId(examenId);
    setMessages([]);
    const examen = examens.find((item) => item.id === examenId);
    setMessageDraft(isScolarite ? defaultReminderFor(examen) : '');
    setBusy(true);
    setError('');
    try {
      const data = await api(`/exams/${examenId}/messages`);
      setMessages(data);
      const myId = session?.userId;
      const toMark = data.filter((item) => String(item.destinataireId) === String(myId) && !item.estLu);
      await Promise.all(toMark.map((item) => api(`/exams/messages/${item.id}/lue`, { method: 'PATCH' }).catch(() => null)));
      if (toMark.length) {
        const refreshed = await api(`/exams/${examenId}/messages`).catch(() => data);
        setMessages(refreshed);
      }
      const nl = await api('/exams/messages/non-lus').catch(() => ({ count: 0 }));
      setUnreadMessages(nl?.count ?? 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les messages.');
    } finally {
      setBusy(false);
    }
  };

  const closeThread = () => {
    setMessagesExamenId('');
    setMessages([]);
    setMessageDraft('');
  };

  const sendMessage = (event) => {
    event.preventDefault();
    if (!messagesExamenId) return;
    const contenu = messageDraft.trim();
    if (!contenu) {
      setError('Le message ne peut pas être vide.');
      return;
    }
    return runAction(
      () => api(`/exams/${messagesExamenId}/messages`, { method: 'POST', body: JSON.stringify({ contenu }) }),
      'Le message a été envoyé.',
      async () => {
        const data = await api(`/exams/${messagesExamenId}/messages`).catch(() => messages);
        setMessages(data);
        setMessageDraft('');
        const nl = await api('/exams/messages/non-lus').catch(() => ({ count: 0 }));
        setUnreadMessages(nl?.count ?? 0);
      },
    );
  };

  const refreshMessages = async () => {
    setBusy(true);
    setError('');
    try {
      const nl = await api('/exams/messages/non-lus').catch(() => ({ count: 0 }));
      const newCount = nl?.count ?? 0;
      if (newCount > prevUnreadRef.current && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification('Nouveau message', { body: `${newCount} message(s) non lu(s) dans M6.` }); } catch { /* ignore */ }
      } else if (newCount > prevUnreadRef.current && (typeof Notification === 'undefined' || Notification.permission !== 'granted')) {
        setNotice('Nouveau message reçu.');
      }
      prevUnreadRef.current = newCount;
      setUnreadMessages(newCount);
      const conv = await api('/exams/conversations').catch(() => []);
      setConversations(conv ?? []);
      if (messagesExamenId) {
        const data = await api(`/exams/${messagesExamenId}/messages`);
        setMessages(data);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’actualiser les messages.');
    } finally {
      setBusy(false);
    }
  };
  const createExam = (event) => {
    event.preventDefault();
    return runAction(() => api('/exams', { method: 'POST', body: JSON.stringify(examForm) }), "L’examen a été créé.", () => setExamForm({ sessionId: sessions[0]?.id || '', enseignementId: enseignements[0]?.id || '', dateExamen: today, heureDebut: '08:00', heureFin: '10:00', salle: '' }));
  };
  const createAlert = (event) => {
    event.preventDefault();
    const payload = { ...alertForm };
    if (!payload.examenId) delete payload.examenId;
    return runAction(() => api('/exams/alertes', { method: 'POST', body: JSON.stringify(payload) }), 'L’alerte a été créée.', () => setAlertForm({ examenId: '', typeAlerte: 'NOTES_NON_REMISES', message: '' }));
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
    { id: 'sessions', label: 'Sessions', task: '', icon: CalendarDays, count: sessions.length },
    { id: 'examens', label: 'Examens & notes', task: '', icon: ClipboardList, count: examens.length },
    { id: 'messages', label: 'Messages', task: '', icon: MessageSquare, count: unreadMessages },
    ...(isScolarite ? [{ id: 'alertes', label: 'Alertes', task: '', icon: Bell, count: unreadCount }] : []),
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
                  <p className="text-sm font-medium text-slate-800">{displayName || 'Utilisateur'}</p>
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
            ...(isScolarite ? [{ label: 'Alertes non lues', value: unreadCount, note: 'À consulter', icon: Bell, color: 'text-rose-700 bg-rose-50' }] : []),
{ label: 'Examens terminés', value: examens.filter((item) => item.statut === 'TERMINE').length, note: 'Examens marqués comme terminés', icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50' }
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
                  {isScolarite && (<form onSubmit={submitSession} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> {editingSessionId ? 'Modifier la session' : 'Nouvelle session'}</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label className="text-xs font-medium text-slate-600">Libellé<input className={`${inputClass} mt-1.5`} value={sessionForm.libelle} onChange={(e) => setSessionForm({ ...sessionForm, libelle: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Année universitaire<select className={`${inputClass} mt-1.5`} value={sessionForm.anneeUniversitaire} onChange={(e) => setSessionForm({ ...sessionForm, anneeUniversitaire: e.target.value })} required><option value="">Choisir une année</option>{anneesUniversitaires.map((annee) => <option key={annee} value={annee}>{annee}</option>)}</select></label>
                      <label className="text-xs font-medium text-slate-600">Semestre<select className={`${inputClass} mt-1.5`} value={sessionForm.semestre} onChange={(e) => setSessionForm({ ...sessionForm, semestre: e.target.value })} required><option value="">Choisir un semestre</option>{semestresAutorises.map((semestre) => <option key={semestre} value={semestre}>{semestre}</option>)}</select></label>
                      <label className="text-xs font-medium text-slate-600">Date de début<input type="date" className={`${inputClass} mt-1.5`} value={sessionForm.dateDebut} onChange={(e) => setSessionForm({ ...sessionForm, dateDebut: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Date de fin<input type="date" className={`${inputClass} mt-1.5`} value={sessionForm.dateFin} onChange={(e) => setSessionForm({ ...sessionForm, dateFin: e.target.value })} required /></label>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">{editingSessionId && <button type="button" className={outlineButtonClass} onClick={cancelEditSession} disabled={busy}>Annuler</button>}<button className={buttonClass} type="submit" disabled={busy}>{editingSessionId ? <><Check size={16} /> Enregistrer les modifications</> : <><Plus size={16} /> Créer la session</>}</button></div>
                  </form>)}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Session</th><th className="px-4 py-3">Année</th><th className="px-4 py-3">Semestre</th><th className="px-4 py-3">Période</th><th className="px-4 py-3">État</th>{isScolarite && <th className="px-4 py-3 text-right">Action</th>}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {sessions.map((session) => <tr key={session.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{session.libelle}</td><td className="px-4 py-4 text-slate-600">{session.anneeUniversitaire}</td><td className="px-4 py-4 text-slate-600">{session.semestre}</td><td className="px-4 py-4 text-slate-600">{dateLabel(session.dateDebut)} – {dateLabel(session.dateFin)}</td>
                          <td className="px-4 py-4"><StatusBadge tone={session.estCloturee ? 'slate' : 'green'}>{session.estCloturee ? 'Clôturée' : 'Ouverte'}</StatusBadge></td>
                          {isScolarite && <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2">{!session.estCloturee && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" disabled={busy} onClick={() => startEditSession(session)}>Modifier</button>}{!session.estCloturee && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#0a0a32] disabled:opacity-50" disabled={busy} onClick={() => closeSession(session.id)}>Clôturer</button>}</div></td>}
                        </tr>)}
                        {!sessions.length && <tr><td colSpan={isScolarite ? 6 : 5} className="px-4 py-12 text-center text-slate-500">Aucune session enregistrée. Créez votre première session ci-dessus.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {tab === 'examens' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Examens & remise des notes</h2><p className="mt-1 text-sm text-slate-500">Planifiez les examens et suivez leur avancement.</p></div>
                  {isScolarite && (<form onSubmit={createExam} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Planifier un examen</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label className="text-xs font-medium text-slate-600">Session<select className={`${inputClass} mt-1.5`} value={examForm.sessionId} onChange={(e) => setExamForm({ ...examForm, sessionId: e.target.value })} required><option value="">Choisir une session</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.libelle} · {item.semestre}</option>)}</select></label>
                      <label className="text-xs font-medium text-slate-600">Enseignement
  <select className={`${inputClass} mt-1.5`} value={examForm.enseignementId}
    onChange={(e) => setExamForm({ ...examForm, enseignementId: e.target.value })} required>
    <option value="">Choisir un enseignement</option>
    {enseignements.map((item) => (
      <option key={item.id} value={item.id}>
        {item.matiere || item.matiereId} · {item.niveau || item.niveauId} · {item.parcours} · {item.semestre || item.semestreId}
      </option>
    ))}
  </select>
</label><label className="text-xs font-medium text-slate-600">Date<input type="date" className={`${inputClass} mt-1.5`} value={examForm.dateExamen} onChange={(e) => setExamForm({ ...examForm, dateExamen: e.target.value })} required /></label>
                      <label className="text-xs font-medium text-slate-600">Heure de début<input type="time" className={`${inputClass} mt-1.5`} value={examForm.heureDebut} onChange={(e) => setExamForm({ ...examForm, heureDebut: e.target.value })} /></label>
                      <label className="text-xs font-medium text-slate-600">Heure de fin<input type="time" className={`${inputClass} mt-1.5`} value={examForm.heureFin} onChange={(e) => setExamForm({ ...examForm, heureFin: e.target.value })} /></label>
                      <label className="text-xs font-medium text-slate-600">Salle<input className={`${inputClass} mt-1.5`} value={examForm.salle} onChange={(e) => setExamForm({ ...examForm, salle: e.target.value })} placeholder="Ex. Salle A1" /></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy || sessions.length === 0 || enseignements.length === 0}><Plus size={16} /> Créer l’examen</button></div>
                    {!sessions.length && <p className="mt-2 text-right text-xs text-amber-700">Créez d’abord une session pour planifier un examen.</p>}
                  </form>)}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">{filteredExams.length} examen(s)</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputClass} pl-9 sm:w-64`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un examen…" /></label>
                      <select className={`${inputClass} sm:w-56`} value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}><option value="">Toutes les sessions</option>{sessions.map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}</select>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date & heure</th><th className="px-4 py-3">Session</th>{isScolarite && <th className="px-4 py-3">Matière</th>}{isScolarite && <th className="px-4 py-3">Enseignant</th>}<th className="px-4 py-3">Salle</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Notes</th>{isScolarite && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExams.map((exam) => <tr key={exam.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-medium text-slate-800">{dateLabel(exam.dateExamen)}<span className="mt-1 block text-xs font-normal text-slate-500">{[exam.heureDebut, exam.heureFin].filter(Boolean).join(' – ') || 'Horaire à définir'}</span></td>
                          <td className="px-4 py-4 text-slate-600">{sessions.find((item) => item.id === exam.sessionId)?.libelle || '—'}</td>{isScolarite && <td className="px-4 py-4 text-slate-600">{enseignements.find((item) => item.id === exam.enseignementId)?.matiere || 'Non rattaché'}</td>}{isScolarite && <td className="px-4 py-4 text-slate-600">{enseignements.find((item) => item.id === exam.enseignementId)?.enseignant || 'Non rattaché'}</td>}<td className="px-4 py-4 text-slate-600">{exam.salle || '—'}</td>
                          <td className="px-4 py-4"><StatusBadge tone={exam.statut === 'TERMINE' ? 'green' : exam.statut === 'EN_COURS' ? 'blue' : 'amber'}>{exam.statut === 'TERMINE' ? 'Terminé' : exam.statut === 'EN_COURS' ? 'En cours' : 'À venir'}</StatusBadge></td>
                          <td className="px-4 py-4"><StatusBadge tone={exam.notesRemises ? 'green' : 'red'}>{exam.notesRemises ? 'Remises' : 'En attente'}</StatusBadge></td>
                          {isScolarite && (<td className="px-4 py-4"><div className="flex justify-end gap-2">
                            {exam.statut === 'A_VENIR' && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50" disabled={busy} onClick={() => changeStatus(exam.id, 'EN_COURS')}>Démarrer</button>}
                            {exam.statut !== 'TERMINE' && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50" disabled={busy} onClick={() => changeStatus(exam.id, 'TERMINE')}>Terminer</button>}
                            {exam.statut === 'TERMINE' && !exam.notesRemises && <button type="button" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[#0a0a32] hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={() => markNotesSubmitted(exam.id)}><Check size={14} /> Notes remises</button>}
                             <button type="button" className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50" disabled={busy} onClick={() => { setTab('messages'); openThread(exam.id); }}><MessageSquare size={14} /> Messages</button>
                          </div></td>)}
                        </tr>)}
                        {!filteredExams.length && <tr><td colSpan={isScolarite ? 8 : 5} className="px-4 py-12 text-center text-slate-500">Aucun examen ne correspond aux filtres sélectionnés.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {tab === 'messages' && <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><h2 className="text-xl font-bold text-[#0a0a32]">Messagerie</h2><p className="mt-1 text-sm text-slate-500">Échanges entre la Scolarité et les enseignants, liés à un examen. {unreadMessages} message(s) non lu(s).</p></div>
                      <button type="button" className={outlineButtonClass} onClick={() => void refreshMessages()} disabled={busy}><RefreshCw size={16} /> Actualiser</button>
                      {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && <button type="button" className={outlineButtonClass} onClick={async () => { try { await Notification.requestPermission(); } catch { /* ignore */ } }}>Activer les notifications</button>}
                    </div>
                    {messagesExamenId ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">{dateLabel(examens.find((item) => item.id === messagesExamenId)?.dateExamen)} · {examens.find((item) => item.id === messagesExamenId)?.salle || 'Sans salle'}</h3>
                            <p className="text-xs text-slate-500">{sessions.find((item) => item.id === examens.find((e) => e.id === messagesExamenId)?.sessionId)?.libelle || '—'}{isScolarite ? ` · ${enseignements.find((item) => item.id === examens.find((e) => e.id === messagesExamenId)?.enseignementId)?.matiere || 'Non rattaché'} · ${enseignements.find((item) => item.id === examens.find((e) => e.id === messagesExamenId)?.enseignementId)?.enseignant || 'Non rattaché'}` : ''}</p>
                          </div>
                          <button type="button" className={outlineButtonClass} onClick={closeThread} disabled={busy}>Fermer</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          {messages.map((item) => {
                            const isMine = String(item.expediteurId) === String(session?.userId);
                            return (
                              <div key={item.id} className={`rounded-lg border p-3 text-sm ${isMine ? 'bg-cyan-50 border-cyan-200 ml-6' : 'bg-white border-slate-200 mr-6'}`}>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                  <span className="font-semibold">{isMine ? 'Vous' : (isScolarite ? 'Enseignant' : 'Scolarité')}</span>
                                  <span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
                                </div>
                                <p className="text-slate-800 whitespace-pre-wrap">{item.contenu}</p>
                                <div className="mt-1 text-xs text-slate-400">{item.estLu ? 'Lu' : 'Non lu'}</div>
                              </div>
                            );
                          })}
                          {!messages.length && <p className="text-sm text-slate-500">Aucun message pour cet examen.</p>}
                        </div>
                        <form onSubmit={sendMessage} className="space-y-2">
                          <textarea className={`${inputClass} min-h-[80px]`} value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} placeholder="Votre message..." />
                          <div className="flex justify-end"><button className={buttonClass} type="submit" disabled={busy}><MessageSquare size={16} /> Envoyer</button></div>
                        </form>
                      </div>
                    ) : isScolarite ? (
                      <div className="space-y-3">
                        {teacherConversations.map((teacher) => (
                          <div key={teacher.enseignant} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-800">{teacher.enseignant}</p>
                                <p className="text-xs text-slate-500">{teacher.exams.length} examen(s) rattaché(s){teacher.lastMessageAt ? ` · dernier message : ${new Date(teacher.lastMessageAt).toLocaleString('fr-FR')}` : ' · Aucune conversation'}</p>
                                {teacher.unreadCount > 0 && <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{teacher.unreadCount} non lu(s)</span>}
                              </div>
                              {teacher.lastExamenId ? (
                                <button type="button" className={buttonClass} disabled={busy} onClick={() => openThread(teacher.lastExamenId)}><MessageSquare size={16} /> Ouvrir</button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select className={inputClass} value={newConvSelection[teacher.enseignant] || teacher.exams[0]?.id || ''} onChange={(e) => setNewConvSelection((prev) => ({ ...prev, [teacher.enseignant]: e.target.value }))}>
                                    {teacher.exams.map((exam) => (
                                      <option key={exam.id} value={exam.id}>{dateLabel(exam.dateExamen)} · {exam.salle || 'Sans salle'} · {exam.matiere}</option>
                                    ))}
                                  </select>
                                  <button type="button" className={buttonClass} disabled={busy || !teacher.exams.length} onClick={() => openThread(newConvSelection[teacher.enseignant] || teacher.exams[0]?.id)}><MessageSquare size={16} /> Démarrer</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {!teacherConversations.length && <p className="text-sm text-slate-500">Aucun enseignant rattaché.</p>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {conversations.length ? conversations.map((conv) => (
                          <div key={conv.examenId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                            <div>
                              <p className="font-semibold text-slate-800">{dateLabel(conv.dateExamen)} · {conv.salle || 'Sans salle'}{conv.unreadCount ? <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{conv.unreadCount} non lu(s)</span> : null}</p>
                              <p className="text-xs text-slate-500">{conv.session || '—'}{isScolarite ? ` · ${conv.matiere || 'Non rattaché'} · ${conv.enseignant || 'Non rattaché'}` : ''} · dernier message : {new Date(conv.lastMessageAt).toLocaleString('fr-FR')}</p>
                            </div>
                            <button type="button" className={buttonClass} disabled={busy} onClick={() => openThread(conv.examenId)}><MessageSquare size={16} /> Ouvrir</button>
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500">Aucune conversation.</p>
                        )}
                      </div>
                    )}
                  </div>}

                  {isScolarite && tab === 'alertes' && <div className="space-y-6">
                  <div><h2 className="text-xl font-bold text-[#0a0a32]">Centre des alertes</h2><p className="mt-1 text-sm text-slate-500">Consultez les alertes et marquez celles que vous avez traitées.</p></div>
                  {isScolarite && (<form onSubmit={createAlert} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={17} className="text-cyan-700" /> Nouvelle alerte</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_1fr]">
                      <label className="text-xs font-medium text-slate-600">Type<select className={`${inputClass} mt-1.5`} value={alertForm.typeAlerte} onChange={(e) => setAlertForm({ ...alertForm, typeAlerte: e.target.value })}><option value="NOTES_NON_REMISES">Notes non remises</option><option value="EXAMEN_APPROCHANT">Examen proche</option><option value="SESSION_OUVERTE">Session ouverte</option><option value="AUTRE">Autre</option></select></label>
                      <label className="text-xs font-medium text-slate-600">Message<input className={`${inputClass} mt-1.5`} value={alertForm.message} onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })} placeholder="Décrivez l’alerte" required /></label>
                      <label className="text-xs font-medium text-slate-600">Examen associé<select className={`${inputClass} mt-1.5`} value={alertForm.examenId} onChange={(e) => setAlertForm({ ...alertForm, examenId: e.target.value })}><option value="">Aucun</option>{examens.map((exam) => <option key={exam.id} value={exam.id}>{dateLabel(exam.dateExamen)} · {exam.salle || 'Sans salle'}</option>)}</select></label>
                    </div>
                    <div className="mt-4 flex justify-end"><button className={buttonClass} type="submit" disabled={busy}><Plus size={16} /> Créer l’alerte</button></div>
                  </form>)}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Examen</th><th className="px-4 py-3">Créée le</th><th className="px-4 py-3">État</th>{isScolarite && <th className="px-4 py-3 text-right">Action</th>}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {alertes.map((alert) => <tr key={alert.id} className="transition hover:bg-cyan-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{alert.typeAlerte}</td><td className="max-w-sm px-4 py-4 text-slate-600">{alert.message}</td><td className="px-4 py-4 text-slate-600">{alert.examenId ? examens.find((exam) => exam.id === alert.examenId)?.salle || 'Examen associé' : '—'}</td><td className="px-4 py-4 whitespace-nowrap text-slate-600">{dateLabel(alert.createdAt)}</td>
                          <td className="px-4 py-4"><StatusBadge tone={alert.estLue ? 'slate' : 'red'}>{alert.estLue ? 'Lue' : 'Non lue'}</StatusBadge>{alert.estTraitee && <span className="ml-1"><StatusBadge tone="green">Traitée</StatusBadge></span>}</td>
                          <td className="px-4 py-4 text-right">{!alert.estLue && <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-[#0a0a32] hover:bg-slate-100 disabled:opacity-50" disabled={busy} onClick={() => markAlertRead(alert.id)}>Marquer comme lue</button>}</td>
                        </tr>)}
                        {!alertes.length && <tr><td colSpan={isScolarite ? 6 : 5} className="px-4 py-12 text-center text-slate-500">Aucune alerte enregistrée.</td></tr>}
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
