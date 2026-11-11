import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

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
    let message = `Erreur ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data?.message === 'string' && data.message) message = data.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export default function MessagesBubble() {
  const { session } = useAuth();
  const role = session?.role;
  const isAllowed = role === 'SCOLARITE' || role === 'ENSEIGNANT';
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  const prevUnreadRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const nl = await api('/exams/messages/non-lus').catch(() => ({ count: 0 }));
      const newCount = nl?.count ?? 0;
      if (newCount > prevUnreadRef.current && document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification('Nouveau message M6', { body: `${newCount} message(s) non lu(s).` }); } catch { /* ignore */ }
      }
      prevUnreadRef.current = newCount;
      setUnread(newCount);
      const conv = await api('/exams/conversations').catch(() => []);
      setConversations(conv ?? []);
      if (selected) {
        const data = await api(`/exams/${selected}/messages`).catch(() => []);
        setMessages(data ?? []);
      }
    } catch { /* ignore */ }
  }, [selected]);

  useEffect(() => {
    if (!isAllowed) return;
    refresh();
    const interval = setInterval(() => { if (!busy) refresh(); }, 30000);
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
  }, [isAllowed, busy, refresh]);

  const openThread = async (examenId) => {
    setSelected(examenId);
    setMessages([]);
    setDraft('');
    setBusy(true);
    try {
      const data = await api(`/exams/${examenId}/messages`);
      setMessages(data ?? []);
      // marquer les messages reçus comme lus
      const myId = session?.userId;
      const toMark = (data ?? []).filter((m) => String(m.destinataireId) === String(myId) && !m.estLu);
      await Promise.all(toMark.map((m) => api(`/exams/messages/${m.id}/lue`, { method: 'PATCH' }).catch(() => null)));
      if (toMark.length) {
        const refreshed = await api(`/exams/${examenId}/messages`).catch(() => data);
        setMessages(refreshed ?? data);
      }
      const nl = await api('/exams/messages/non-lus').catch(() => ({ count: 0 }));
      setUnread(nl?.count ?? 0);
      prevUnreadRef.current = nl?.count ?? 0;
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  const send = async (event) => {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setBusy(true);
    try {
      await api(`/exams/${selected}/messages`, { method: 'POST', body: JSON.stringify({ contenu: draft.trim() }) });
      setDraft('');
      const data = await api(`/exams/${selected}/messages`).catch(() => messages);
      setMessages(data ?? messages);
      const nl = await api('/exams/messages/non-lus').catch(() => ({ count: 0 }));
      setUnread(nl?.count ?? 0);
      prevUnreadRef.current = nl?.count ?? 0;
      const conv = await api('/exams/conversations').catch(() => conversations);
      setConversations(conv ?? conversations);
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  if (!isAllowed) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Messagerie"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0a0a32] text-white shadow-lg transition hover:bg-[#17175a]"
      >
        <MessageSquare size={24} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-[#0a0a32]">Messagerie ({unread} non lu(s))</span>
            <button type="button" onClick={() => { setOpen(false); setSelected(''); }} aria-label="Fermer" className="text-slate-500 hover:text-slate-800"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!selected ? (
              conversations.length ? conversations.map((c) => (
                <button key={c.examenId} type="button" onClick={() => openThread(c.examenId)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm hover:bg-cyan-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{c.matiere || 'Examen'} · {c.salle || '—'}</span>
                    {c.unreadCount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{c.unreadCount}</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.enseignant || '—'} · {new Date(c.lastMessageAt).toLocaleString('fr-FR')}</p>
                </button>
              )) : (
                <p className="text-sm text-slate-500">Aucune conversation.</p>
              )
            ) : (
              <>
                <button type="button" onClick={() => { setSelected(''); setMessages([]); setDraft(''); }} className="text-xs text-cyan-700 hover:underline">← Retour</button>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {messages.map((m) => {
                    const isMine = String(m.expediteurId) === String(session?.userId);
                    return (
                      <div key={m.id} className={`rounded-lg border p-2 text-xs ${isMine ? 'bg-cyan-50 border-cyan-200 ml-4' : 'bg-white border-slate-200 mr-4'}`}>
                        <div className="flex justify-between text-slate-400 mb-0.5">
                          <span className="font-semibold">{isMine ? 'Vous' : (m.expediteurRole === 'CHEF_SCOLARITE' ? 'Scolarité' : (m.expediteurRole === 'ENSEIGNANT' ? 'Enseignant' : 'Scolarité'))}</span>
                          <span>{new Date(m.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap">{m.contenu}</p>
                      </div>
                    );
                  })}
                  {!messages.length && <p className="text-xs text-slate-500">Aucun message.</p>}
                </div>
                <form onSubmit={send} className="mt-2 flex gap-2">
                  <input className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Répondre..." />
                  <button type="submit" disabled={busy || !draft.trim()} className="rounded-lg bg-[#0a0a32] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                    <Send size={12} />
                  </button>
                </form>
              </>
            )}
          </div>
          {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
            <div className="border-t border-slate-200 px-3 py-2">
              <button type="button" onClick={async () => { try { await Notification.requestPermission(); } catch { /* ignore */ } }} className="text-xs text-cyan-700 hover:underline">
                Activer les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
