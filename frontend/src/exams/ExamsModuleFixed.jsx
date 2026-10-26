import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
// Importation de la fonction de mappage des rôles depuis AuthContext
import { toBackendRole } from '../auth/AuthContext';
// Le backend Nest expose tout sous le préfixe global /api (main.ts).
const API = `${import.meta.env.VITE_API_URL || ''}/api`;
async function api(p, o = {}) {
  const token = localStorage.getItem('emit_access_token');
  const r = await fetch(API + p, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...o,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export default function ExamsModuleFixed() {
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [examens, setExamens] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [fs, setFs] = useState({ libelle: 'Session Normale S1', anneeUniversitaire: '2025-2026', semestre: 'S1', dateDebut: '2026-01-12', dateFin: '2026-01-24' });
  const [fe, setFe] = useState({ sessionId: '', dateExamen: '2026-01-15', salle: 'Salle A1' });
  const [fa, setFa] = useState({ message: 'Notes non remises' });
  const canManage = toBackendRole(useAuth().role) === 'SCOLARITE';
  const load = async () => {
    setErr('');
    try {
      const s = await api('/exams/sessions');
      const e = await api('/exams');
      const a = await api('/exams/alertes/all');
      setSessions(s); setExamens(e); setAlertes(a);
      if (s.length && !fe.sessionId) setFe((p) => ({ ...p, sessionId: s[0].id }));
    } catch (e2) { setErr('Backend injoignable: ' + e2.message); }
  };
  useEffect(() => { load(); }, []);
  const mkSes = async (ev) => { ev.preventDefault(); try { await api('/exams/sessions', { method: 'POST', body: JSON.stringify(fs) }); setMsg('Session creee'); load(); } catch (e) { setErr(e.message); } };
  const mkEx = async (ev) => { ev.preventDefault(); try { await api('/exams', { method: 'POST', body: JSON.stringify(fe) }); setMsg('Examen cree'); load(); } catch (e) { setErr(e.message); } };
  const mkAl = async (ev) => { ev.preventDefault(); try { await api('/exams/alertes', { method: 'POST', body: JSON.stringify({ ...fa, typeAlerte: 'NOTES_NON_REMISES' }) }); setMsg('Alerte creee'); load(); } catch (e) { setErr(e.message); } };
  const st = async (id, statut) => { try { await api('/exams/' + id + '/statut', { method: 'PATCH', body: JSON.stringify({ statut }) }); load(); } catch (e) { setErr(e.message); } };
  const ok = async (id) => { try { await api('/exams/' + id + '/notes-remises', { method: 'PATCH' }); load(); } catch (e) { setErr(e.message); } };
  const nl = alertes.filter((a) => !a.estLue).length;
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginTop: 24, background: '#fff' }}>
      <h2>Module 6 - Examens / notes / alertes ({nl} non lues)</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {err && <p style={{ color: 'red' }}>{err} <button onClick={load}>Reessayer</button></p>}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => setTab('sessions')}>Sessions T26</button>
        <button onClick={() => setTab('examens')}>Examens T27-T29</button>
        <button onClick={() => setTab('alertes')}>Alertes T30</button>
        <button onClick={load} style={{ marginLeft: 'auto' }}>Actualiser</button>
      </div>
      {tab === 'sessions' && (
        <div>
          <form onSubmit={mkSes} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={fs.libelle} onChange={(e) => setFs({ ...fs, libelle: e.target.value })} required />
            <input value={fs.semestre} onChange={(e) => setFs({ ...fs, semestre: e.target.value })} required />
            <button type="submit">Creer</button>
          </form>
          <ul>{sessions.map((s) => (<li key={s.id}>{s.libelle} - {s.semestre}</li>))}</ul>
        </div>
      )}
      {tab === 'examens' && (
        <div>
          <form onSubmit={mkEx} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <select value={fe.sessionId} onChange={(e) => setFe({ ...fe, sessionId: e.target.value })} required>
              <option value="">-- session --</option>
              {sessions.map((s) => (<option key={s.id} value={s.id}>{s.libelle}</option>))}
            </select>
            <input type="date" value={fe.dateExamen} onChange={(e) => setFe({ ...fe, dateExamen: e.target.value })} required />
            <input value={fe.salle} onChange={(e) => setFe({ ...fe, salle: e.target.value })} placeholder="Salle" />
            <button type="submit">Creer</button>
          </form>
          <ul>{examens.map((x) => (
            <li key={x.id}>{(x.dateExamen || '').slice(0, 10)} {x.salle || ''} | {x.statut} | {x.notesRemises ? 'REMISES' : 'NON REMISES'}
              {' '}<button onClick={() => st(x.id, 'EN_COURS')}>En cours</button>
              {' '}<button onClick={() => st(x.id, 'TERMINE')}>Termine</button>
              {' '}{canManage && !x.notesRemises && <button onClick={() => ok(x.id)}>Notes OK</button>}
            </li>))}</ul>
        </div>
      )}
      {tab === 'alertes' && (
        <div>
          <form onSubmit={mkAl} style={{ display: 'flex', gap: 6 }}>
            <input value={fa.message} onChange={(e) => setFa({ message: e.target.value })} required />
            <button type="submit">Creer</button>
          </form>
          <ul>{alertes.map((a) => (<li key={a.id}>[{a.typeAlerte}] {a.message}</li>))}</ul>
        </div>
      )}
    </div>
  );
}
