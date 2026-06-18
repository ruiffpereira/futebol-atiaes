'use client';
import { useTournament } from '@/lib/useTournament';
import { scoreOf, phaseLabel, liveBadge, fmtDate } from '@/lib/tournament';
import type { Match, TournamentState } from '@/lib/types';

const DGREEN = '#0f4d2e', GREEN = '#15803d';

// Vista FlashScore (lance-a-lance + equipas) — só leitura.
export default function MatchDetail({ m, state, onClose }: { m: Match; state: TournamentState; onClose: () => void }) {
  const team = (id: string | null) => state.teams.find((t) => t.id === id);
  const ta = team(m.a), tb = team(m.b);
  const pname = (t: typeof ta, pid: string | null) => { if (!t || !pid) return null; const p = t.players.find((x) => x.id === pid); return p ? p.name : null; };
  const evs: { kind: string; team: string; player: string | null; own?: boolean; ts: number }[] = [];
  (m.scorers || []).forEach((s) => evs.push({ kind: 'goal', team: s.team, player: s.player, own: s.own, ts: s.ts || 0 }));
  (m.cards || []).forEach((c) => evs.push({ kind: c.type, team: c.team, player: c.player, ts: c.ts || 0 }));
  evs.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  let ra = 0, rb = 0;
  const rows = evs.map((e, i) => {
    const isA = e.team === m.a; const t = isA ? ta : tb;
    let sc = ''; if (e.kind === 'goal') { if (isA) ra++; else rb++; sc = ra + '–' + rb; }
    const who = e.kind === 'goal' ? (e.own ? 'Auto-golo' : pname(t, e.player) || 'Golo') : pname(t, e.player) || 'Cartão';
    const icon = e.kind === 'goal' ? '⚽' : e.kind === 'yellow' ? '🟨' : '🟥';
    return { i, isA, icon, who, sc, isGoal: e.kind === 'goal' };
  });
  const lineup = (t: typeof ta) => (t ? t.players.map((p) => ({
    name: p.name, cap: t.captain === p.id, gk: !!p.gk,
    g: (m.scorers || []).filter((s) => s.player === p.id).length,
    y: (m.cards || []).filter((c) => c.player === p.id && c.type === 'yellow').length,
    r: (m.cards || []).filter((c) => c.player === p.id && c.type === 'red').length,
  })) : []);

  const playerRow = (p: { name: string; cap: boolean; gk: boolean; g: number; y: number; r: number }, k: number) => (
    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 0', borderBottom: '1px solid #f4f7f2' }}>
      {p.cap && <span style={{ fontSize: 11, fontWeight: 800, color: GREEN }}>©</span>}
      {p.gk && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#2563eb', padding: '1px 4px', borderRadius: 4 }}>GR</span>}
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
      {p.g > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: DGREEN }}>⚽{p.g}</span>}
      {p.y > 0 && <span style={{ width: 8, height: 11, borderRadius: 2, background: '#eab308', display: 'inline-block' }} />}
      {p.r > 0 && <span style={{ width: 8, height: 11, borderRadius: 2, background: '#dc2626', display: 'inline-block' }} />}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,30,18,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 36px)' }}>
        <div style={{ background: 'linear-gradient(135deg,#0c2a1c,#15803d)', padding: '16px 18px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#bbf7d0', textTransform: 'uppercase' }}>{[phaseLabel(m), fmtDate(m.date), m.time].filter(Boolean).join(' · ')}</span>
            <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', width: 30, height: 30, borderRadius: 9, fontSize: 17 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
            <div className="cond" style={{ textAlign: 'right', fontWeight: 700, fontSize: 22 }}>{ta?.name || 'A definir'}</div>
            <div className="cond" style={{ fontWeight: 800, fontSize: 38 }}>{scoreOf(m, m.a)} : {scoreOf(m, m.b)}</div>
            <div className="cond" style={{ textAlign: 'left', fontWeight: 700, fontSize: 22 }}>{tb?.name || 'A definir'}</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            {m.status === 'live' && <span style={{ background: m.livePhase === 'half' ? '#d97706' : '#dc2626', padding: '4px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>{liveBadge(m)}</span>}
            {m.status === 'done' && <span style={{ background: 'rgba(255,255,255,.2)', padding: '4px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>TERMINADO</span>}
          </div>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9bb0a3', letterSpacing: .5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>Lance a lance</div>
          {rows.length ? <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#eef2ec', transform: 'translateX(-50%)' }} />
            {rows.map((e) => (
              <div key={e.i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 36px 1fr', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <div style={{ textAlign: 'right', minWidth: 0 }}>{e.isA && <><div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.who}</div>{e.isGoal && <div className="cond" style={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>{e.sc}</div>}</>}</div>
                <div style={{ textAlign: 'center', fontSize: 16, background: '#fff', zIndex: 1 }}>{e.icon}</div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>{!e.isA && <><div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.who}</div>{e.isGoal && <div className="cond" style={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>{e.sc}</div>}</>}</div>
              </div>
            ))}
          </div> : <div style={{ textAlign: 'center', color: '#9bb0a3', fontSize: 13, padding: '14px 0' }}>Ainda sem golos nem cartões.</div>}

          <div style={{ fontSize: 11, fontWeight: 800, color: '#9bb0a3', letterSpacing: .5, textTransform: 'uppercase', textAlign: 'center', margin: '18px 0 10px' }}>Equipas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={{ fontWeight: 800, fontSize: 13.5, color: DGREEN, marginBottom: 7 }}>{ta?.name || '—'}</div>{lineup(ta).map(playerRow)}</div>
            <div><div style={{ fontWeight: 800, fontSize: 13.5, color: DGREEN, marginBottom: 7 }}>{tb?.name || '—'}</div>{lineup(tb).map(playerRow)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
