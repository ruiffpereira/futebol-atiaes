'use client';
// BACKOFFICE — login + gestão + registo ao vivo. Escritas protegidas (cookie de admin).
import { useEffect, useState, type ReactNode } from 'react';
import { useTournament } from '@/lib/useTournament';
import { actions } from '@/lib/actions';
import { scoreOf, cardsOf, phaseLabel, liveText, liveBadge, srcLabel, fmtDate } from '@/lib/tournament';
import type { Match, TournamentState } from '@/lib/types';

const GREEN = '#15803d', DGREEN = '#0f4d2e';
type Tab = 'teams' | 'fixtures' | 'knockout' | 'comments' | 'settings' | 'access';

export default function AdminPage() {
  const { state, apply } = useTournament();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState(''); const [err, setErr] = useState(false);
  const [tab, setTab] = useState<Tab>('teams');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editUnlock, setEditUnlock] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => { fetch('/api/session').then((r) => r.json()).then((d) => setAuthed(!!d.admin)).catch(() => setAuthed(false)); }, []);
  // contador de comentários por ler (badge na aba)
  useEffect(() => {
    if (!authed) return;
    let live = true;
    const load = () => fetch('/api/comments').then((r) => (r.ok ? r.json() : null)).then((d) => { if (live && d) setUnread(d.unread || 0); }).catch(() => {});
    load();
    const id = setInterval(load, 20000);
    return () => { live = false; clearInterval(id); };
  }, [authed, tab]);
  // auto-cria fase final quando há ≥2 grupos com equipas
  useEffect(() => {
    if (authed && !state.knockoutCreated && state.groups.length >= 2 && state.teams.filter((t) => t.group).length >= 2) apply(actions.genKnockout(state));
  }, [authed, state, apply]);

  const login = async () => {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) { setAuthed(true); setErr(false); setPw(''); } else setErr(true);
  };
  const logout = async () => { await fetch('/api/session', { method: 'POST' }); setAuthed(false); };
  const openMatch = (id: string) => { setOpenId(id); setEditUnlock(false); };

  if (authed === null) return <div style={{ padding: 40 }}>A carregar…</div>;
  if (!authed) return (
    <div className="admin-login" style={{ maxWidth: 380, margin: '50px auto', background: '#fff', borderRadius: 18, padding: '34px 30px', border: '1px solid #e4ece0' }}>
      <div style={{ fontSize: 38, textAlign: 'center' }}>🔒</div>
      <h2 className="cond" style={{ textAlign: 'center', color: DGREEN, textTransform: 'uppercase', margin: '6px 0 18px' }}>Backoffice</h2>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} placeholder="Palavra-passe" style={{ width: '100%', padding: '13px 14px', border: '1.5px solid #d3e0d0', borderRadius: 11, fontSize: 15, outline: 'none' }} />
      {err && <div style={{ color: '#dc2626', fontWeight: 600, fontSize: 13, marginTop: 8 }}>Palavra-passe incorreta.</div>}
      <button onClick={login} style={{ width: '100%', marginTop: 12, border: 'none', background: GREEN, color: '#fff', fontWeight: 700, fontSize: 15, padding: 13, borderRadius: 11 }}>ENTRAR</button>
      <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: '#8aa093', fontSize: 13 }}>← Voltar ao placar</a>
    </div>
  );

  const open = openId ? state.matches.find((m) => m.id === openId) || null : null;
  const nameOf = (m: Match, s: 'a' | 'b') => { const t = state.teams.find((x) => x.id === m[s]); return t ? t.name : srcLabel(s === 'a' ? m.srcA : m.srcB); };
  const fixtures = state.matches.filter((m) => m.phase === 'group' || m.phase === 'friendly');
  const koList = ['sf', 'third', 'final'].flatMap((ph) => state.matches.filter((m) => m.phase === ph).sort((a, b) => (a.slot || 0) - (b.slot || 0)));

  const tabBtn = (id: Tab, label: string, badge = 0) => (
    <button onClick={() => setTab(id)} style={{ position: 'relative', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #d3e0d0', background: '#fff', fontWeight: 700, fontSize: 13.5, padding: '10px 16px', borderRadius: 11 }}>
      {label}
      {badge > 0 && <span style={{ background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 800, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>}
      {tab === id && <div style={{ position: 'absolute', left: 14, right: 14, bottom: 4, height: 3, background: GREEN, borderRadius: 3 }} />}
    </button>
  );

  return (
    <div className="admin-pad" style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <h1 className="cond" style={{ color: DGREEN, textTransform: 'uppercase', margin: 0 }}>Backoffice</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{ border: '1px solid #d3e0d0', background: '#fff', color: '#5b7163', fontWeight: 600, fontSize: 13, padding: '8px 14px', borderRadius: 9, textDecoration: 'none' }}>Ver placar</a>
          <button onClick={logout} style={{ border: '1px solid #d3e0d0', background: '#fff', color: '#5b7163', fontWeight: 600, fontSize: 13, padding: '8px 14px', borderRadius: 9 }}>Sair</button>
        </div>
      </div>
      <StatsBar />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>{tabBtn('teams', 'EQUIPAS')}{tabBtn('fixtures', 'CALENDÁRIO')}{tabBtn('knockout', 'FASE FINAL')}{tabBtn('comments', 'COMENTÁRIOS', unread)}{tabBtn('settings', 'DEFINIÇÕES')}{tabBtn('access', 'ACESSOS')}</div>

      {tab === 'teams' && <TeamsTab state={state} apply={apply} />}
      {tab === 'fixtures' && <FixturesTab state={state} apply={apply} fixtures={fixtures} nameOf={nameOf} onOpen={openMatch} />}
      {tab === 'knockout' && <KnockoutTab state={state} apply={apply} koList={koList} nameOf={nameOf} onOpen={openMatch} />}
      {tab === 'comments' && <CommentsTab onSeen={() => setUnread(0)} />}
      {tab === 'settings' && <SettingsTab state={state} apply={apply} />}
      {tab === 'access' && <AccessTab />}
      {open && <ScoringModal state={state} m={open} apply={apply} onClose={() => setOpenId(null)} editUnlock={editUnlock} setEditUnlock={setEditUnlock} />}
    </div>
  );
}

function StatsBar() {
  const [s, setS] = useState<{ online: number; peakOnline: number; push: number; visits: number } | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => fetch('/api/stats').then((r) => (r.ok ? r.json() : null)).then((d) => { if (live && d) setS(d); }).catch(() => {});
    load();
    const id = setInterval(load, 10000);
    return () => { live = false; clearInterval(id); };
  }, []);
  const chip = (icon: string, label: string, val: number | undefined, color: string, badge?: ReactNode) => (
    <div style={{ flex: 1, minWidth: 130, background: '#fff', border: '1px solid #e4ece0', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="cond" style={{ fontWeight: 800, fontSize: 24, color, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 8 }}>{val ?? '–'}{badge}</div>
        <div style={{ fontSize: 11.5, color: '#8aa093', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>{label}</div>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {chip('📡', 'Online agora', s?.online, GREEN,
        s ? <span title="Máximo em simultâneo (recorde)" style={{ fontSize: 11, fontWeight: 700, color: '#8aa093', textTransform: 'none', letterSpacing: 0 }}>máx {s.peakOnline}</span> : undefined)}
      {chip('🔔', 'Com notificações', s?.push, '#2563eb')}
      {chip('👁️', 'Visitas (total)', s?.visits, DGREEN)}
    </div>
  );
}

function TeamsTab({ state, apply }: { state: TournamentState; apply: (s: TournamentState) => void }) {
  const [name, setName] = useState(''); const [group, setGroup] = useState(state.groups[0] || 'A');
  const groupOpts = [...state.groups.map((g) => ({ v: g, l: 'Grupo ' + g })), { v: '', l: '— Sem grupo (amigável) —' }];
  const concluded = !!state.groupsConcluded;
  return (
    <div>
      <div style={{ background: '#fff', border: `1px solid ${concluded ? '#bbf7d0' : '#fadf8b'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: '#5b7163' }}>
          {concluded
            ? <><b style={{ color: GREEN }}>✓ Equipas concluídas.</b> A fase final calcula automaticamente e está visível no placar (cada lugar aparece quando estiver 100% certo).</>
            : <><b style={{ color: '#92660a' }}>Equipas ainda em edição.</b> Quando terminares de criar equipas e grupos, marca como concluído para a fase final calcular e aparecer no placar.</>}
        </div>
        <button onClick={() => apply(actions.setGroupsConcluded(state, !concluded))} style={{ border: 'none', background: concluded ? '#fff' : GREEN, color: concluded ? '#5b7163' : '#fff', boxShadow: concluded ? 'inset 0 0 0 1px #d3e0d0' : 'none', fontWeight: 700, fontSize: 14, padding: '11px 18px', borderRadius: 10, flexShrink: 0 }}>{concluded ? 'Reabrir edição' : '✓ Concluído'}</button>
      </div>
      <Box>
        <b style={{ color: DGREEN }}>Adicionar equipa</b>
        <div className="admin-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da equipa" style={{ ...inp, flex: 1, minWidth: 160 }} />
          <select value={group} onChange={(e) => setGroup(e.target.value)} style={inp}>{groupOpts.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}</select>
          <button onClick={() => { if (name.trim()) { apply(actions.addTeam(state, name.trim(), group)); setName(''); } }} style={btn()}>Adicionar</button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f4ee' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5b7163' }}>Grupos:</span>
          {state.groups.map((g) => <span key={g} style={{ background: '#eef2ec', padding: '5px 11px', borderRadius: 8, fontWeight: 700, color: DGREEN, fontSize: 13 }}>Grupo {g} <button onClick={() => apply(actions.removeGroup(state, g))} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>×</button></span>)}
          <button onClick={() => apply(actions.addGroup(state))} style={{ border: '1px dashed #b6c9b0', background: '#fff', color: GREEN, fontWeight: 600, fontSize: 13, padding: '6px 12px', borderRadius: 8 }}>+ Grupo</button>
        </div>
      </Box>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,290px),1fr))', gap: 14, marginTop: 16 }}>
        {state.teams.map((t) => <TeamCard key={t.id} t={t} state={state} apply={apply} groupOpts={groupOpts} />)}
      </div>
    </div>
  );
}

function TeamCard({ t, state, apply, groupOpts }: { t: TournamentState['teams'][number]; state: TournamentState; apply: (s: TournamentState) => void; groupOpts: { v: string; l: string }[] }) {
  const [edit, setEdit] = useState(false);
  const [pin, setPin] = useState('');
  const addPin = () => { if (pin.trim()) { apply(actions.addPlayer(state, t.id, pin.trim())); setPin(''); } };
  const groupLabel = groupOpts.find((g) => g.v === t.group)?.l || (t.group ? 'Grupo ' + t.group : 'Sem grupo');

  if (!edit) return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #e4ece0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="cond" style={{ fontWeight: 700, fontSize: 18, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
        <span style={{ background: '#eef2ec', color: DGREEN, fontWeight: 700, fontSize: 12, padding: '4px 9px', borderRadius: 8 }}>{groupLabel}</span>
        <button onClick={() => setEdit(true)} title="Editar equipa" style={{ border: '1px solid #d3e0d0', background: '#fff', color: GREEN, fontWeight: 700, fontSize: 13, padding: '6px 10px', borderRadius: 8 }}>✏️</button>
      </div>
      {t.players.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {t.players.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f6faf4', padding: '6px 9px', borderRadius: 8 }}>
              {t.captain === p.id && <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>©</span>}
              {p.gk && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#2563eb', padding: '1px 5px', borderRadius: 5 }}>GR</span>}
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            </div>
          ))}
        </div>
      ) : <div style={{ fontSize: 13, color: '#9bb0a3', fontStyle: 'italic' }}>Sem jogadores.</div>}
      {t.coach && <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f4ee', fontSize: 13, color: '#5b7163' }}>Treinador: <b style={{ color: DGREEN }}>{t.coach}</b></div>}
    </div>
  );

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #bef264' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <input value={t.name} onChange={(e) => apply(actions.renameTeam(state, t.id, e.target.value))} className="cond" style={{ fontWeight: 700, fontSize: 18, flex: 1, minWidth: 0, border: '1px solid #d3e0d0', background: '#fff', padding: '3px 7px', borderRadius: 7, outline: 'none' }} />
        <select value={t.group} onChange={(e) => apply(actions.setTeamGroup(state, t.id, e.target.value))} style={{ padding: '5px 8px', border: '1px solid #d3e0d0', borderRadius: 8, fontSize: 12.5 }}>{groupOpts.map((g) => <option key={g.v} value={g.v}>{g.l}</option>)}</select>
        <button onClick={() => setEdit(false)} title="Concluir edição" style={{ border: 'none', background: '#dcfce7', color: DGREEN, fontWeight: 700, fontSize: 13, padding: '7px 11px', borderRadius: 8 }}>✓</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        {t.players.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f6faf4', padding: '5px 7px 5px 9px', borderRadius: 8 }}>
            {t.captain === p.id && <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>©</span>}
            <input value={p.name} onChange={(e) => apply(actions.renamePlayer(state, t.id, p.id, e.target.value))} style={{ flex: 1, minWidth: 0, border: '1px solid transparent', background: 'transparent', fontSize: 14, padding: '3px 6px', borderRadius: 6, outline: 'none' }} />
            <button onClick={() => apply(actions.toggleGK(state, t.id, p.id))} title="Guarda-redes" style={{ border: `1px solid ${p.gk ? '#2563eb' : '#d3e0d0'}`, background: p.gk ? '#2563eb' : '#fff', color: p.gk ? '#fff' : '#aebfb3', fontSize: 11, fontWeight: 800, padding: '5px 8px', borderRadius: 6 }}>GR</button>
            <button onClick={() => apply(actions.removePlayer(state, t.id, p.id))} style={{ border: 'none', background: 'transparent', color: '#b6c9b0', fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addPin(); }} placeholder="Nome do jogador" style={{ ...inp, flex: 1, fontSize: 13.5 }} />
        <button onClick={addPin} style={{ border: 'none', background: '#dcfce7', color: GREEN, fontWeight: 700, fontSize: 13, padding: '9px 13px', borderRadius: 9 }}>+ Jogador</button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid #f0f4ee' }}>
        <select value={t.captain || ''} onChange={(e) => apply(actions.setCaptain(state, t.id, e.target.value))} style={{ ...inp, flex: 1, minWidth: 130, fontSize: 13 }}>
          <option value="">⊘ Capitão (opcional)</option>{t.players.map((p) => <option key={p.id} value={p.id}>© {p.name}</option>)}
        </select>
        <input value={t.coach || ''} onChange={(e) => apply(actions.setCoach(state, t.id, e.target.value))} placeholder="Treinador (opcional)" style={{ ...inp, flex: 1, minWidth: 130, fontSize: 13 }} />
      </div>
      <button onClick={() => { if (confirm('Remover esta equipa?')) apply(actions.removeTeam(state, t.id)); }} style={{ width: '100%', marginTop: 10, border: '1px solid #f3d6d6', background: '#fdeaea', color: '#dc2626', fontWeight: 700, fontSize: 13, padding: '9px 10px', borderRadius: 8 }}>Remover equipa</button>
    </div>
  );
}

function FixturesTab({ state, apply, fixtures, nameOf, onOpen }: { state: TournamentState; apply: (s: TournamentState) => void; fixtures: Match[]; nameOf: (m: Match, s: 'a' | 'b') => string; onOpen: (id: string) => void }) {
  const [g, setG] = useState(state.groups[0] || 'A'); const [a, setA] = useState(''); const [b, setB] = useState(''); const [time, setTime] = useState(''); const [date, setDate] = useState('');
  const friendly = g === '__friendly__';
  const groupOpts = [...state.groups.map((x) => ({ v: x, l: 'Grupo ' + x })), { v: '__friendly__', l: '⚽ Amigável (avulso)' }];
  const teamOpts = friendly ? state.teams : state.teams.filter((t) => t.group === g);
  const ready = !!(a && b && date && time);
  const add = () => {
    if (!a || !b) { alert('Escolhe as duas equipas.'); return; }
    if (!date) { alert('Define a data do jogo.'); return; }
    if (!time) { alert('Define a hora do jogo.'); return; }
    const res = actions.addMatch(state, g, a, b, time, date);
    if ((res as { error?: string }).error) { alert((res as { error: string }).error); return; }
    apply(res as TournamentState); setA(''); setB(''); setTime(''); setDate('');
  };
  return (
    <div>
      <Box>
        <b style={{ color: DGREEN }}>Adicionar jogo</b>
        <div className="admin-form" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <select value={g} onChange={(e) => { setG(e.target.value); setA(''); setB(''); }} style={{ ...inp, fontWeight: 600 }}>{groupOpts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          <select value={a} onChange={(e) => setA(e.target.value)} style={{ ...inp, flex: 1, minWidth: 120 }}><option value="">— equipa —</option>{teamOpts.map((t) => <option key={t.id} value={t.id}>{t.name}{t.group ? ` (${t.group})` : ''}</option>)}</select>
          <span className="vs" style={{ fontSize: 12, fontWeight: 700, color: '#9bb0a3' }}>vs</span>
          <select value={b} onChange={(e) => setB(e.target.value)} style={{ ...inp, flex: 1, minWidth: 120 }}><option value="">— equipa —</option>{teamOpts.map((t) => <option key={t.id} value={t.id}>{t.name}{t.group ? ` (${t.group})` : ''}</option>)}</select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inp} />
          <button onClick={add} disabled={!ready} style={{ ...btn(), opacity: ready ? 1 : 0.5, cursor: ready ? 'pointer' : 'not-allowed' }}>Adicionar</button>
        </div>
        <div style={{ fontSize: 11.5, color: '#9bb0a3', marginTop: 10 }}>Equipas, data e hora são obrigatórias. Cada par de equipas só pode ter um jogo por grupo. Usa ↑/↓ para reordenar.</div>
      </Box>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {fixtures.map((m, i) => <FixtureRow key={m.id} m={m} i={i} total={fixtures.length} state={state} apply={apply} nameOf={nameOf} onOpen={onOpen} />)}
        {!fixtures.length && <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center', color: '#8aa093', border: '1px solid #e4ece0', fontSize: 14 }}>Sem jogos. Adiciona um jogo acima.</div>}
      </div>
    </div>
  );
}

function FixtureRow({ m, i, total, state, apply, nameOf, onOpen }: { m: Match; i: number; total: number; state: TournamentState; apply: (s: TournamentState) => void; nameOf: (m: Match, s: 'a' | 'b') => string; onOpen: (id: string) => void }) {
  const [edit, setEdit] = useState(false);
  const when = [fmtDate(m.date), m.time].filter(Boolean).join(' · ');
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: `1px solid ${edit ? '#bef264' : '#e4ece0'}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {edit ? <>
            <input type="date" value={m.date || ''} onChange={(e) => apply(actions.setMatchDate(state, m.id, e.target.value))} style={{ fontSize: 12, fontWeight: 700, color: DGREEN, border: '1px solid #d3e0d0', borderRadius: 7, padding: '3px 7px', background: '#fff' }} />
            <input type="time" value={m.time || ''} onChange={(e) => apply(actions.setMatchTime(state, m.id, e.target.value))} style={{ fontSize: 12, fontWeight: 700, color: DGREEN, border: '1px solid #d3e0d0', borderRadius: 7, padding: '3px 7px', background: '#fff' }} />
          </> : <span style={{ fontSize: 12, fontWeight: 800, color: DGREEN, background: '#eef2ec', padding: '4px 9px', borderRadius: 7 }}>{when || 'Sem data/hora'}</span>}
          {m.phase === 'friendly' ? <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#7c3aed', padding: '2px 8px', borderRadius: 6 }}>AMIGÁVEL</span> : <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase' }}>{phaseLabel(m)}</span>}
          {m.status === 'live' && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: m.livePhase === 'half' ? '#d97706' : '#dc2626', padding: '2px 7px', borderRadius: 6 }}>{liveBadge(m)}</span>}
          {m.status === 'done' && <span style={{ fontSize: 10, fontWeight: 800, color: '#5b7163', background: '#eef2ec', padding: '2px 7px', borderRadius: 6 }}>TERMINADO</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {edit ? <>
            <button onClick={() => { if (confirm('Remover este jogo?')) apply(actions.removeMatch(state, m.id)); }} style={{ border: '1px solid #f3d6d6', background: '#fdeaea', color: '#dc2626', fontWeight: 700, fontSize: 14, padding: '8px 11px', borderRadius: 9 }}>×</button>
            <button onClick={() => setEdit(false)} title="Concluir edição" style={{ border: 'none', background: '#dcfce7', color: DGREEN, fontWeight: 700, fontSize: 13, padding: '8px 12px', borderRadius: 9 }}>✓</button>
          </> : <>
            <button onClick={() => apply(actions.moveMatch(state, m.id, -1))} style={{ ...iconBtn, color: i === 0 ? '#dde6d8' : GREEN }}>↑</button>
            <button onClick={() => apply(actions.moveMatch(state, m.id, 1))} style={{ ...iconBtn, color: i === total - 1 ? '#dde6d8' : GREEN }}>↓</button>
            <button onClick={() => setEdit(true)} title="Editar jogo" style={{ ...iconBtn, color: GREEN }}>✏️</button>
            <button onClick={() => onOpen(m.id)} style={btn(13)}>Registar</button>
          </>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
        <span style={{ textAlign: 'right', fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(m, 'a')}</span>
        <span className="cond" style={{ fontWeight: 800, fontSize: 19, color: DGREEN, background: '#eef2ec', padding: '3px 11px', borderRadius: 7, minWidth: 54, textAlign: 'center' }}>{scoreOf(m, m.a)}:{scoreOf(m, m.b)}</span>
        <span style={{ textAlign: 'left', fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(m, 'b')}</span>
      </div>
    </div>
  );
}

function KnockoutTab({ state, apply, koList, nameOf, onOpen }: { state: TournamentState; apply: (s: TournamentState) => void; koList: Match[]; nameOf: (m: Match, s: 'a' | 'b') => string; onOpen: (id: string) => void }) {
  const concluded = !!state.groupsConcluded;
  return (
    <div>
      <div style={{ background: '#eef2ec', border: '1px solid #dce6d7', borderRadius: 14, padding: '13px 16px', marginBottom: 16, fontSize: 12.5, color: '#5b7163', lineHeight: 1.5 }}>
        <b style={{ color: DGREEN }}>Fase final automática.</b> MF1: 1º A vs 2º B · MF2: 1º B vs 2º A · 3º/4º: perdedores · Final: vencedores. Preenche sozinha quando cada grupo terminar. Usa ✏️ para corrigir horário ou equipas à mão.
      </div>
      {state.knockoutCreated ? <>
        <div style={{ background: '#fff', border: `1px solid ${concluded ? '#bbf7d0' : '#fadf8b'}`, borderRadius: 14, padding: '13px 16px', marginBottom: 16, fontSize: 13, color: '#5b7163' }}>
          {concluded
            ? <><b style={{ color: GREEN }}>✓ Visível no placar.</b> As equipas estão concluídas — cada lugar preenche-se sozinho quando estiver 100% certo.</>
            : <><b style={{ color: '#92660a' }}>Ainda não aparece no placar.</b> Marca as equipas como <b>Concluído</b> na aba <b>Equipas</b> para a fase final ficar visível.</>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{koList.map((m) => <KoRow key={m.id} m={m} state={state} apply={apply} nameOf={nameOf} onOpen={onOpen} />)}</div>
      </> : <div style={{ background: '#fff', borderRadius: 12, padding: 26, textAlign: 'center', color: '#8aa093', border: '1px solid #e4ece0', fontSize: 14 }}>Cria 2 grupos com equipas para a fase final aparecer.</div>}
    </div>
  );
}

function KoRow({ m, state, apply, nameOf, onOpen }: { m: Match; state: TournamentState; apply: (s: TournamentState) => void; nameOf: (m: Match, s: 'a' | 'b') => string; onOpen: (id: string) => void }) {
  const [edit, setEdit] = useState(false);
  const when = [fmtDate(m.date), m.time].filter(Boolean).join(' · ');
  const teamSel = (side: 'a' | 'b') => (
    <select value={m[side] || ''} onChange={(e) => apply(actions.setKoTeam(state, m.id, side, e.target.value))} style={{ ...inp, width: '100%', fontSize: 13, padding: '8px 9px' }}>
      <option value="">— A definir —</option>
      {state.teams.map((t) => <option key={t.id} value={t.id}>{t.name}{t.group ? ` (${t.group})` : ''}</option>)}
    </select>
  );
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${edit ? '#bef264' : '#e4ece0'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: GREEN, textTransform: 'uppercase' }}>{phaseLabel(m)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {edit ? <>
            <input type="date" value={m.date || ''} onChange={(e) => apply(actions.setMatchDate(state, m.id, e.target.value))} style={{ fontSize: 12, fontWeight: 700, color: DGREEN, border: '1px solid #d3e0d0', borderRadius: 7, padding: '3px 7px', background: '#fff' }} />
            <input type="time" value={m.time || ''} onChange={(e) => apply(actions.setMatchTime(state, m.id, e.target.value))} style={{ fontSize: 12, fontWeight: 700, color: DGREEN, border: '1px solid #d3e0d0', borderRadius: 7, padding: '3px 7px', background: '#fff' }} />
            <button onClick={() => setEdit(false)} title="Concluir edição" style={{ border: 'none', background: '#dcfce7', color: DGREEN, fontWeight: 700, fontSize: 13, padding: '8px 12px', borderRadius: 9 }}>✓</button>
          </> : <>
            {when && <span style={{ fontSize: 12, fontWeight: 800, color: DGREEN, background: '#eef2ec', padding: '4px 9px', borderRadius: 7 }}>{when}</span>}
            <button onClick={() => setEdit(true)} title="Editar jogo" style={{ ...iconBtn, color: GREEN }}>✏️</button>
            <button onClick={() => onOpen(m.id)} style={btn(13)}>Registar</button>
          </>}
        </div>
      </div>
      {edit ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
            {teamSel('a')}
            <span className="cond" style={{ fontWeight: 800, color: DGREEN, background: '#eef2ec', padding: '3px 11px', borderRadius: 7 }}>{scoreOf(m, m.a)}:{scoreOf(m, m.b)}</span>
            {teamSel('b')}
          </div>
          {m.lockTeams && <button onClick={() => apply(actions.setKoAuto(state, m.id))} style={{ marginTop: 8, border: '1px dashed #b6c9b0', background: '#fff', color: GREEN, fontWeight: 600, fontSize: 12, padding: '6px 11px', borderRadius: 8 }}>🔄 Voltar a automático</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          <span style={{ textAlign: 'right', fontWeight: 600, color: m.a ? '#13241b' : '#9bb0a3', fontStyle: m.a ? 'normal' : 'italic' }}>{nameOf(m, 'a')}</span>
          <span className="cond" style={{ fontWeight: 800, color: DGREEN, background: '#eef2ec', padding: '3px 11px', borderRadius: 7 }}>{scoreOf(m, m.a)}:{scoreOf(m, m.b)}</span>
          <span style={{ textAlign: 'left', fontWeight: 600, color: m.b ? '#13241b' : '#9bb0a3', fontStyle: m.b ? 'normal' : 'italic' }}>{nameOf(m, 'b')}</span>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ state, apply }: { state: TournamentState; apply: (s: TournamentState) => void }) {
  const [name, setName] = useState(state.tournamentName);
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,270px),1fr))', gap: 14 }}>
      <Box><b style={{ color: DGREEN }}>Nome do torneio</b><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inp, flex: 1 }} /><button onClick={() => apply(actions.setName(state, name))} style={btn()}>Guardar</button></div></Box>
      <Box><b style={{ color: DGREEN }}>Link do placar (QR)</b><p style={{ fontSize: 12.5, color: '#8aa093' }}>Gera o QR a apontar para este endereço.</p><input readOnly value={url} style={{ ...inp, width: '100%', background: '#f6faf4', color: '#5b7163' }} /></Box>
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #f3d6d6' }}><b style={{ color: '#dc2626' }}>Reiniciar torneio</b><p style={{ fontSize: 12.5, color: '#8aa093' }}>Apaga equipas, jogos e resultados.</p><button onClick={() => { if (confirm('Apagar tudo?')) apply(actions.reset()); }} style={{ border: '1px solid #f3d6d6', background: '#fdeaea', color: '#dc2626', fontWeight: 700, fontSize: 13, padding: '10px 15px', borderRadius: 9 }}>Apagar tudo</button></div>
    </div>
  );
}

type AccessEntry = { ts: number; ip: string; ok: boolean; blocked?: boolean; ua?: string };

function AccessTab() {
  const [entries, setEntries] = useState<AccessEntry[] | null>(null);
  const load = () => { setEntries(null); fetch('/api/access-log').then((r) => r.json()).then((d) => setEntries(d.entries || [])).catch(() => setEntries([])); };
  useEffect(load, []);
  const clear = () => { if (!confirm('Apagar todo o histórico de acessos?')) return; fetch('/api/access-log', { method: 'DELETE' }).then(load); };

  const fmt = (ts: number) => new Date(ts).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const failCount = (entries || []).filter((e) => !e.ok).length;

  return (
    <div>
      <Box>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <b style={{ color: DGREEN }}>Histórico de acessos ao backoffice</b>
            <div style={{ fontSize: 12.5, color: '#8aa093', marginTop: 4 }}>Cada tentativa de login: ✓ entrou, ✗ falhou (password errada), ⛔ bloqueado (muitas tentativas). Guarda as últimas 300.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={load} style={{ border: '1px solid #d3e0d0', background: '#fff', color: '#5b7163', fontWeight: 600, fontSize: 13, padding: '8px 14px', borderRadius: 9 }}>↻ Atualizar</button>
            <button onClick={clear} style={{ border: '1px solid #f3d6d6', background: '#fdeaea', color: '#dc2626', fontWeight: 600, fontSize: 13, padding: '8px 14px', borderRadius: 9 }}>Limpar</button>
          </div>
        </div>
        {entries && entries.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12.5 }}>
            <span style={{ background: '#eef2ec', color: DGREEN, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>{entries.length} registos</span>
            {failCount > 0 && <span style={{ background: '#fdeaea', color: '#b91c1c', fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>{failCount} falhada{failCount === 1 ? '' : 's'}</span>}
          </div>
        )}
      </Box>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
        {entries === null && <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', color: '#8aa093', border: '1px solid #e4ece0', fontSize: 14 }}>A carregar…</div>}
        {entries && entries.length === 0 && <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center', color: '#8aa093', border: '1px solid #e4ece0', fontSize: 14 }}>Ainda sem registos de acesso.</div>}
        {entries && entries.map((e, i) => {
          const status = e.blocked ? { icon: '⛔', label: 'Bloqueado', col: '#92660a', bg: '#fef3c7', bd: '#fadf8b' } : e.ok ? { icon: '✓', label: 'Entrou', col: GREEN, bg: '#dcfce7', bd: '#bbf7d0' } : { icon: '✗', label: 'Falhou', col: '#b91c1c', bg: '#fdeaea', bd: '#f3d6d6' };
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 11, padding: '10px 14px', border: '1px solid #e4ece0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: status.col, background: status.bg, border: `1px solid ${status.bd}`, padding: '4px 9px', borderRadius: 7, flexShrink: 0 }}>{status.icon} {status.label}</span>
              <span className="cond" style={{ fontWeight: 700, fontSize: 14, color: DGREEN, flexShrink: 0 }}>{fmt(e.ts)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#5b7163', flexShrink: 0 }}>IP: {e.ip || 'desconhecido'}</span>
              {e.ua && <span title={e.ua} style={{ fontSize: 11.5, color: '#9bb0a3', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.ua}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CommentItem = { id: string; ts: number; name: string; message: string; read?: boolean };

function CommentsTab({ onSeen }: { onSeen: () => void }) {
  const [items, setItems] = useState<CommentItem[] | null>(null);
  const load = (markRead = false) => {
    fetch('/api/comments').then((r) => r.json()).then((d) => {
      setItems(d.items || []);
      if (markRead && (d.unread || 0) > 0) {
        fetch('/api/comments', { method: 'PATCH' }).then(() => onSeen());
      } else if (markRead) onSeen();
    }).catch(() => setItems([]));
  };
  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const del = (id: string) => { if (!confirm('Apagar este comentário?')) return; fetch('/api/comments?id=' + id, { method: 'DELETE' }).then(() => load()); };
  const clear = () => { if (!confirm('Apagar TODOS os comentários?')) return; fetch('/api/comments', { method: 'DELETE' }).then(() => load()); };
  const fmt = (ts: number) => new Date(ts).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <Box>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <b style={{ color: DGREEN }}>Comentários do público</b>
            <div style={{ fontSize: 12.5, color: '#8aa093', marginTop: 4 }}>Feedback enviado pelos visitantes (anónimo ou com nome). Os mais recentes aparecem primeiro.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => load()} style={{ border: '1px solid #d3e0d0', background: '#fff', color: '#5b7163', fontWeight: 600, fontSize: 13, padding: '8px 14px', borderRadius: 9 }}>↻ Atualizar</button>
            {items && items.length > 0 && <button onClick={clear} style={{ border: '1px solid #f3d6d6', background: '#fdeaea', color: '#dc2626', fontWeight: 600, fontSize: 13, padding: '8px 14px', borderRadius: 9 }}>Limpar</button>}
          </div>
        </div>
        {items && items.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ background: '#eef2ec', color: DGREEN, fontWeight: 700, fontSize: 12.5, padding: '4px 10px', borderRadius: 8 }}>{items.length} comentário{items.length === 1 ? '' : 's'}</span>
          </div>
        )}
      </Box>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {items === null && <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', color: '#8aa093', border: '1px solid #e4ece0', fontSize: 14 }}>A carregar…</div>}
        {items && items.length === 0 && <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center', color: '#8aa093', border: '1px solid #e4ece0', fontSize: 14 }}>Ainda sem comentários.</div>}
        {items && items.map((c) => (
          <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e4ece0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              {c.name
                ? <span style={{ fontWeight: 700, fontSize: 14, color: DGREEN }}>{c.name}</span>
                : <span style={{ fontWeight: 700, fontSize: 13, color: '#7c3aed', background: '#f3eefe', padding: '2px 9px', borderRadius: 7 }}>Anónimo</span>}
              <span style={{ fontSize: 12, color: '#9bb0a3' }}>{fmt(c.ts)}</span>
              <button onClick={() => del(c.id)} title="Apagar" style={{ marginLeft: 'auto', border: '1px solid #f3d6d6', background: '#fdeaea', color: '#dc2626', fontWeight: 700, fontSize: 13, padding: '5px 10px', borderRadius: 8 }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: '#2b3a31', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringModal({ state, m, apply, onClose, editUnlock, setEditUnlock }: { state: TournamentState; m: Match; apply: (s: TournamentState) => void; onClose: () => void; editUnlock: boolean; setEditUnlock: (b: boolean) => void }) {
  const ta = state.teams.find((t) => t.id === m.a), tb = state.teams.find((t) => t.id === m.b);
  const isLive = m.status === 'live'; const canEdit = isLive || editUnlock; const silent = !isLive;
  const side = (team: typeof ta, opp: typeof ta, teamId: string | null, oppId: string | null) => (
    <div style={{ pointerEvents: canEdit ? 'auto' : 'none', opacity: canEdit ? 1 : 0.45 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#5b7163', textTransform: 'uppercase', marginBottom: 8 }}>{team?.name || '—'}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {team?.players.map((p) => (
          <div key={p.id} style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => apply(actions.addGoal(state, m.id, teamId!, p.id, silent))} style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', border: '1.5px solid #e4ece0', background: '#fff', padding: '9px 11px', borderRadius: 10, fontSize: 14, fontWeight: 500 }}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span><span style={{ background: '#dcfce7', color: GREEN, fontWeight: 800, fontSize: 13, padding: '2px 6px', borderRadius: 6 }}>⚽{(m.scorers || []).filter((s) => s.player === p.id).length}</span></button>
            <button onClick={() => apply(actions.addCard(state, m.id, teamId!, p.id, 'yellow', silent))} style={cardBtn('#eab308', '#fef9c3', '#854d0e')}><span style={{ width: 8, height: 12, borderRadius: 2, background: '#eab308' }} />{(m.cards || []).filter((c) => c.player === p.id && c.type === 'yellow').length}</button>
            <button onClick={() => apply(actions.addCard(state, m.id, teamId!, p.id, 'red', silent))} style={cardBtn('#dc2626', '#fee2e2', '#b91c1c')}><span style={{ width: 8, height: 12, borderRadius: 2, background: '#dc2626' }} />{(m.cards || []).filter((c) => c.player === p.id && c.type === 'red').length}</button>
          </div>
        ))}
        <button onClick={() => apply(actions.addOwnGoal(state, m.id, oppId!, silent))} style={{ border: '1px dashed #c8a2a2', background: '#fdf3f3', color: '#b91c1c', fontWeight: 600, fontSize: 13, padding: 8, borderRadius: 9 }}>+ Auto-golo (p/ adversário)</button>
      </div>
    </div>
  );
  const goals = (m.scorers || []).map((s) => { const t = state.teams.find((x) => x.id === s.team); const pl = t && s.player ? t.players.find((p) => p.id === s.player) : null; return { id: s.id, team: t?.name || '?', isA: s.team === m.a, label: s.own ? 'Auto-golo' : pl ? pl.name : 'Sem marcador' }; });
  const f = (label: string, onClick: () => void, bg: string) => <button onClick={onClick} style={{ flex: 1, minWidth: 140, border: 'none', background: bg, color: '#fff', fontWeight: 800, fontSize: 14, padding: 13, borderRadius: 11 }}>{label}</button>;
  return (
    <div onClick={onClose} className="modal-sheet" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,30,18,.55)', display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 620, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}>
        <div style={{ background: 'linear-gradient(120deg,#0f4d2e,#15803d)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="cond" style={{ fontWeight: 800, fontSize: 18, color: '#fff', textTransform: 'uppercase' }}>{phaseLabel(m)}</span>{isLive && <span style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 11px', borderRadius: 7 }}>{liveText(m)}</span>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isLive && <button onClick={() => setEditUnlock(!editUnlock)} style={{ border: 'none', background: editUnlock ? '#bef264' : 'rgba(255,255,255,.2)', color: editUnlock ? DGREEN : '#fff', fontWeight: 800, fontSize: 12, padding: '7px 11px', borderRadius: 9 }}>✏️ {editUnlock ? 'A editar' : 'Editar'}</button>}
            <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', width: 32, height: 32, borderRadius: 9, fontSize: 18 }}>×</button>
          </div>
        </div>
        <div className="modal-inner" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>{ta?.name || '—'}</div><div className="cond" style={{ fontWeight: 800, fontSize: 50, color: DGREEN }}>{scoreOf(m, m.a)}</div></div>
            <div className="cond" style={{ fontWeight: 800, fontSize: 28, color: '#c3d4bd' }}>:</div>
            <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700 }}>{tb?.name || '—'}</div><div className="cond" style={{ fontWeight: 800, fontSize: 50, color: DGREEN }}>{scoreOf(m, m.b)}</div></div>
          </div>
          {!isLive && !editUnlock && <div style={{ display: 'flex', gap: 10, background: '#eef2ec', border: '1px solid #dce6d7', borderRadius: 11, padding: '11px 14px', marginBottom: 14, fontSize: 12.5 }}>🔒 <div><b style={{ color: DGREEN }}>Edição bloqueada.</b> Carrega em ✏️ Editar para corrigir.</div></div>}
          {!isLive && editUnlock && <div style={{ display: 'flex', gap: 10, background: '#fef3c7', border: '1px solid #fadf8b', borderRadius: 11, padding: '11px 14px', marginBottom: 14, fontSize: 12.5 }}>⚠️ <div><b style={{ color: '#92660a' }}>Modo de edição.</b> Estas alterações não notificam ninguém.</div></div>}
          <div className="score-sides">{side(ta, tb, m.a, m.b)}{side(tb, ta, m.b, m.a)}</div>
          {goals.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f4ee', pointerEvents: canEdit ? 'auto' : 'none', opacity: canEdit ? 1 : 0.45 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5b7163', textTransform: 'uppercase', marginBottom: 8 }}>Golos registados · × para corrigir</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{goals.map((gl) => (
                <div key={gl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f6faf4', padding: '7px 11px', borderRadius: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: gl.isA ? GREEN : '#1d4ed8' }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: DGREEN }}>{gl.team}</span><span style={{ fontSize: 13, color: '#5b7163', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gl.label}</span>
                  <button onClick={() => apply(actions.removeGoal(state, m.id, gl.id, silent))} style={{ border: 'none', background: '#fdeaea', color: '#dc2626', fontWeight: 700, fontSize: 14, padding: '4px 9px', borderRadius: 7 }}>×</button>
                </div>
              ))}</div>
            </div>
          )}
          {m.phase !== 'group' && m.phase !== 'friendly' && m.status === 'done' && scoreOf(m, m.a) === scoreOf(m, m.b) && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f6faf4', borderRadius: 11, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#5b7163' }}>Penáltis:</span>
              <input type="number" value={m.penA || 0} onChange={(e) => apply(actions.setPen(state, m.id, 'penA', +e.target.value, silent))} style={{ width: 60, padding: 8, border: '1.5px solid #d3e0d0', borderRadius: 8, textAlign: 'center' }} /><span style={{ fontWeight: 700 }}>–</span>
              <input type="number" value={m.penB || 0} onChange={(e) => apply(actions.setPen(state, m.id, 'penB', +e.target.value, silent))} style={{ width: 60, padding: 8, border: '1.5px solid #d3e0d0', borderRadius: 8, textAlign: 'center' }} />
            </div>
          )}
        </div>
        <div className="modal-foot" style={{ display: 'flex', gap: 10, borderTop: '1px solid #eef2ec', flexWrap: 'wrap', flexShrink: 0 }}>
          {m.status === 'scheduled' && f('▶ Iniciar 1ª parte', () => apply(actions.startMatch(state, m.id)), GREEN)}
          {isLive && (m.livePhase || 'first') === 'first' && <>{f('⏸ Intervalo', () => apply(actions.setLivePhase(state, m.id, 'half')), '#d97706')}{f('■ Terminar', () => apply(actions.finishMatch(state, m.id)), DGREEN)}</>}
          {isLive && m.livePhase === 'half' && <>{f('▶ 2ª parte', () => apply(actions.setLivePhase(state, m.id, 'second')), GREEN)}{f('■ Terminar', () => apply(actions.finishMatch(state, m.id)), DGREEN)}</>}
          {isLive && m.livePhase === 'second' && f('■ Terminar jogo', () => apply(actions.finishMatch(state, m.id)), DGREEN)}
          {m.status === 'done' && <button onClick={() => apply(actions.reopenMatch(state, m.id))} style={{ flex: 1, minWidth: 150, border: '1px solid #d3e0d0', background: '#fff', color: '#5b7163', fontWeight: 700, fontSize: 14, padding: 13, borderRadius: 11 }}>Reabrir jogo</button>}
          <button onClick={onClose} style={{ border: '1px solid #d3e0d0', background: '#fff', color: '#5b7163', fontWeight: 700, fontSize: 14, padding: '13px 20px', borderRadius: 11 }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { padding: '11px 13px', border: '1.5px solid #d3e0d0', borderRadius: 10, fontSize: 14.5, outline: 'none', background: '#fff' };
const iconBtn: React.CSSProperties = { border: '1px solid #d3e0d0', background: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 10px', borderRadius: 9 };
const btn = (fs = 14): React.CSSProperties => ({ border: 'none', background: GREEN, color: '#fff', fontWeight: 700, fontSize: fs, padding: fs < 14 ? '8px 14px' : '11px 20px', borderRadius: fs < 14 ? 9 : 10 });
const cardBtn = (bd: string, bg: string, col: string): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${bd}`, background: bg, color: col, fontWeight: 800, fontSize: 12, padding: '7px 8px', borderRadius: 8, flexShrink: 0 });
const Box = ({ children }: { children: React.ReactNode }) => <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #e4ece0' }}>{children}</div>;
