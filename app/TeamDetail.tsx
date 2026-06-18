'use client';
import { scoreOf, phaseLabel, liveBadge, fmtDate } from '@/lib/tournament';
import type { Match, Team, TournamentState } from '@/lib/types';

const DGREEN = '#0f4d2e', GREEN = '#15803d';

// Ficha da equipa — jogadores (golos/cartões) + histórico de jogos. Só leitura.
// Clicar num jogo ao vivo reencaminha para o separador "Ao Vivo".
export default function TeamDetail({
  team,
  state,
  onClose,
  onMatch,
  onLive,
}: {
  team: Team;
  state: TournamentState;
  onClose: () => void;
  onMatch: (id: string) => void;
  onLive: () => void;
}) {
  const nameOf = (id: string | null) => {
    const t = state.teams.find((x) => x.id === id);
    return t ? t.name : 'A definir';
  };
  // jogos da equipa, ao vivo primeiro, depois por data/hora
  const matches = state.matches
    .filter((m) => m.a === team.id || m.b === team.id)
    .sort((a, b) => {
      const rank = (m: Match) => (m.status === 'live' ? 0 : m.status === 'scheduled' ? 1 : 2);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || '');
    });

  // golos e cartões por jogador (todos os jogos, incl. amigáveis)
  const stat = (pid: string) => {
    let g = 0, y = 0, r = 0;
    state.matches.forEach((m) => {
      (m.scorers || []).forEach((s) => { if (s.team === team.id && s.player === pid) g++; });
      (m.cards || []).forEach((c) => { if (c.team === team.id && c.player === pid) { if (c.type === 'yellow') y++; else r++; } });
    });
    return { g, y, r };
  };

  const matchRow = (m: Match) => {
    const isA = m.a === team.id;
    const oppId = isA ? m.b : m.a;
    const my = scoreOf(m, team.id), th = scoreOf(m, oppId);
    const live = m.status === 'live';
    const done = m.status === 'done';
    const result = done ? (my > th ? 'V' : my < th ? 'D' : 'E') : '';
    const resColor = result === 'V' ? GREEN : result === 'D' ? '#dc2626' : '#d97706';
    const when = [fmtDate(m.date), m.time].filter(Boolean).join(' · ');
    return (
      <button
        key={m.id}
        onClick={() => (live ? onLive() : onMatch(m.id))}
        style={{ textAlign: 'left', width: '100%', background: live ? '#fff7f5' : '#f6faf4', border: `1px solid ${live ? '#f3c9c9' : '#e4ece0'}`, borderRadius: 11, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        {done && <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: resColor, color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{result}</span>}
        {live && <span style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.1s infinite' }} />}
        {m.status === 'scheduled' && <span style={{ width: 22, height: 22, flexShrink: 0, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🕐</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9bb0a3', textTransform: 'uppercase' }}>{[phaseLabel(m), when].filter(Boolean).join(' · ')}</div>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>vs {nameOf(oppId)}</div>
        </div>
        {live && <span style={{ background: m.livePhase === 'half' ? '#d97706' : '#dc2626', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>{liveBadge(m)}</span>}
        {(done || live) && <span className="cond" style={{ fontWeight: 800, fontSize: 18, color: DGREEN, flexShrink: 0 }}>{my}:{th}</span>}
      </button>
    );
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(8,30,18,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 36px)' }}>
        <div style={{ background: 'linear-gradient(135deg,#0c2a1c,#15803d)', padding: '16px 18px', color: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div className="cond" style={{ fontWeight: 800, fontSize: 26, textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
              <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 600, marginTop: 4 }}>
                {team.group ? 'Grupo ' + team.group : 'Amigável'} · {team.players.length} jogador{team.players.length === 1 ? '' : 'es'}{team.coach ? ' · Treinador: ' + team.coach : ''}
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.2)', color: '#fff', width: 30, height: 30, borderRadius: 9, fontSize: 17, flexShrink: 0 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9bb0a3', letterSpacing: .5, textTransform: 'uppercase', marginBottom: 8 }}>Jogadores</div>
          {team.players.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {team.players.map((p) => {
                const s = stat(p.id);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f6faf4', padding: '7px 11px', borderRadius: 9 }}>
                    {team.captain === p.id && <span style={{ fontSize: 12, fontWeight: 800, color: GREEN }}>©</span>}
                    {p.gk && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: '#2563eb', padding: '1px 5px', borderRadius: 5 }}>GR</span>}
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    {s.g > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: DGREEN }}>⚽{s.g}</span>}
                    {s.y > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: '#854d0e' }}><span style={{ width: 8, height: 11, borderRadius: 2, background: '#eab308' }} />{s.y}</span>}
                    {s.r > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: '#b91c1c' }}><span style={{ width: 8, height: 11, borderRadius: 2, background: '#dc2626' }} />{s.r}</span>}
                  </div>
                );
              })}
            </div>
          ) : <div style={{ fontSize: 13, color: '#9bb0a3', fontStyle: 'italic' }}>Sem jogadores registados.</div>}

          <div style={{ fontSize: 11, fontWeight: 800, color: '#9bb0a3', letterSpacing: .5, textTransform: 'uppercase', margin: '18px 0 8px' }}>Jogos</div>
          {matches.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{matches.map(matchRow)}</div>
          ) : <div style={{ fontSize: 13, color: '#9bb0a3', fontStyle: 'italic' }}>Sem jogos associados.</div>}
        </div>
      </div>
    </div>
  );
}
