import { useEffect, useState } from 'react';
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' }, ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export default function ExamsModule() {
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [examens, setExamens] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const load = async () => {
    setErr('');
    try {
      const [s, e, a] = await Promise.all([
        api('/exams/sessions'), api('/exams'), api('/exams/alertes/all'),
      ]);
      setSessions(s); setExamens(e); setAlertes(a);
    } catch (e2) { setErr('Backend injoignable (' + API + '). Lance yarn start:dev. ' + e2.message); }
  };
  useEffect(() => { load(); }, []);
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const [fSession, setFSession] = useState({ libelle: 'Session Normale S1', anneeUniversitaire: '2025-2026', semestre: 'S1', dateDebut: '2026-01-12', dateFin: '2026-01-24' });
  const [fExamen, setFExamen] = useState({ sessionId: '', dateExamen: '2026-01-15', heureDebut: '08:00', heureFin: '10:00', salle: 'Salle A1' });
  const [fAlerte, setFAlerte] = useState({ examenId: '', typeAlerte: 'NOTES_NON_REMISES', message: 'Notes non remises' });
  const load2 = async () => {
    setErr('');
    try {
      const s = await api('/exams/sessions');
      const e = await api('/exams');
      const a = await api('/exams/alertes/all');
      setSessions(s); setExamens(e); setAlertes(a);
      if (s.length) setFExamen((p) => (p.sessionId ? p : { ...p, sessionId: s[0].id }));
    } catch (e2) { setErr('Backend injoignable (' + API + '). ' + e2.message); }
  };
  const createSession = async (ev) => {
    ev.preventDefault();
    try { await api('/exams/sessions', { method: 'POST', body: JSON.stringify(fSession) }); flash('Session creee'); load2(); }
    catch (e) { setErr(e.message); }
  };
  const createExamen = async (ev) => {
    ev.preventDefault();
    try {
      if (!fExamen.sessionId) { setErr('Choisis une session'); return; }
      await api('/exams', { method: 'POST', body: JSON.stringify(fExamen) }); flash('Examen cree'); load2();
    } catch (e) { setErr(e.message); }
  };
  const chStatut = async (id, statut) => {
    try { await api('/exams/' + id + '/statut', { method: 'PATCH', body: JSON.stringify({ statut }) }); load2(); }
    catch (e) { setErr(e.message); }
  };
  const notesOk = async (id) => {
    try { await api('/exams/' + id + '/notes-remises', { method: 'PATCH' }); flash('Notes remises'); load2(); }
    catch (e) { setErr(e.message); }
  };
  const createAlerte = async (ev) => {
    ev.preventDefault();
    try {
      const p = { ...fAlerte };
      if (!p.examenId) delete p.examenId;
      await api('/exams/alertes', { method: 'POST', body: JSON.stringify(p) });
      flash('Alerte creee');
      load2();
    } catch (e) {
      setErr(e.message);
    }
  };

  const nonLues = alertes.filter((a) => !a.estLue).length;
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, marginTop: 24, background: '#fff' }}>
      <h2>Module 6 — Examens / notes / alertes {nonLues > 0 && <span style={{ background: '#c0392b', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 13 }}>{nonLues} non lue(s)</span>}</h2>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {err && <p style={{ color: '#c0392b' }}>{err} <button onClick={load2}>Reessayer</button></p>}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => setTab('sessions')} style={{ fontWeight: tab === 'sessions' ? 'bold' : 'normal' }}>Sessions (T26)</button>
        <button onClick={() => setTab('examens')} style={{ fontWeight: tab === 'examens' ? 'bold' : 'normal' }}>Examens (T27-T29)</button>
        <button onClick={() => setTab('alertes')} style={{ fontWeight: tab === 'alertes' ? 'bold' : 'normal' }}>Alertes (T30)</button>
        <button onClick={load2} style={{ marginLeft: 'auto' }}>Actualiser</button>
      </div>
      {tab === 'sessions' && (
        <div>
          <form onSubmit={createSession} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input value={fSession.libelle} onChange={(e) => setFSession({ ...fSession, libelle: e.target.value })} required />
            <input value={fSession.anneeUniversitaire} onChange={(e) => setFSession({ ...fSession, anneeUniversitaire: e.target.value })} required />
            <input value={fSession.semestre} onChange={(e) => setFSession({ ...fSession, semestre: e.target.value })} required />
            <input type="date" value={fSession.dateDebut} onChange={(e) => setFSession({ ...fSession, dateDebut: e.target.value })} required />
            <input type="date" value={fSession.dateFin} onChange={(e) => setFSession({ ...fSession, dateFin: e.target.value })} required />
            <button type="submit">Creer session</button>
          </form>
          <ul>{sessions.map((s) => (<li key={s.id}>{s.libelle} — {s.anneeUniversitaire} {s.semestre}</li>))}</ul>
        </div>
      )}
      {tab === 'examens' && (
        <div>
          <form onSubmit={createExamen} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <select value={fExamen.sessionId} onChange={(e) => setFExamen({ ...fExamen, sessionId: e.target.value })} required>
              <option value="">-- session --</option>
              {sessions.map((s) => (<option key={s.id} value={s.id}>{s.libelle}</option>))}
            </select>
            <input type="date" value={fExamen.dateExamen} onChange={(e) => setFExamen({ ...fExamen, dateExamen: e.target.value })} required />
            <input value={fExamen.salle} onChange={(e) => setFExamen({ ...fExamen, salle: e.target.value })} placeholder="Salle" />
            <button type="submit">Creer examen</button>
          </form>
          <ul>{examens.map((x) => (
            <li key={x.id}>{(x.dateExamen || '').slice(0, 10)} {x.salle || ''} | {x.statut} | {x.notesRemises ? 'REMISES' : 'NON REMISES'}
              {' '}<button onClick={() => chStatut(x.id, 'EN_COURS')}>En cours</button>
              {' '}<button onClick={() => chStatut(x.id, 'TERMINE')}>Termine</button>
              {' '}{!x.notesRemises && <button onClick={() => notesOk(x.id)}>Notes remises</button>}
            </li>))}</ul>
        </div>
      )}
      {tab === 'alertes' && (
        <div>
          <form onSubmit={createAlerte} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input value={fAlerte.message} onChange={(e) => setFAlerte({ ...fAlerte, message: e.target.value })} placeholder="Message" required />
            <button type="submit">Creer alerte</button>
          </form>
          <ul>{alertes.map((a) => (<li key={a.id}>[{a.typeAlerte}] {a.message} {a.estLue ? '(lue)' : '(non lue)'}</li>))}</ul>
        </div>
      )}
    </div>
  );
}
