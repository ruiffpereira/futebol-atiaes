'use client';
import { scoreOf, phaseLabel, liveBadge, fmtDate, standings } from '@/lib/tournament';
import type { Match, Team, TournamentState } from '@/lib/types';
import { Ball, Clock, TeamBadge } from './Icons';

const INK = 'var(--text)', MUTED = 'var(--muted)', LINE = 'var(--line)', GREEN = 'var(--brand)';

// Ficha da equipa — resumo, forma recente, jogos e melhores marcadores. Só leitura.
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
  const logoOf = (id: string | null) => state.teams.find((x) => x.id === id)?.logo;
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

  // resumo (jogos oficiais terminados)
  const doneOfficial = state.matches.filter((m) => (m.a === team.id || m.b === team.id) && m.status === 'done' && m.phase !== 'friendly');
  let wins = 0, gf = 0;
  doneOfficial.forEach((m) => {
    const my = scoreOf(m, team.id), th = scoreOf(m, team.id === m.a ? m.b : m.a);
    if (my > th) wins++;
    gf += my;
  });
  // golos totais (inclui amigáveis)
  let totalGoals = 0;
  state.matches.forEach((m) => { if (m.a === team.id || m.b === team.id) totalGoals += scoreOf(m, team.id); });
  // pontos (se em grupo)
  const groupRow = team.group ? standings(state, team.group).find((r) => r.team.id === team.id) : null;
  const pos = team.group ? standings(state, team.group).findIndex((r) => r.team.id === team.id) + 1 : 0;

  // forma recente (últimos 5 jogos terminados, em ordem cronológica)
  const recent = [...doneOfficial]
    .sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0))
    .slice(-5)
    .map((m) => {
      const my = scoreOf(m, team.id), th = scoreOf(m, team.id === m.a ? m.b : m.a);
      return my > th ? 'V' : my < th ? 'D' : 'E';
    });

  // melhores marcadores da equipa
  const scorers = team.players
    .map((p) => ({ id: p.id, name: p.name, g: stat(p.id).g }))
    .filter((p) => p.g > 0)
    .sort((a, b) => b.g - a.g);
  const maxG = scorers[0]?.g || 1;

  const liveMatch = matches.find((m) => m.status === 'live');

  const box = (label: string, val: number | string) => (
    <div style={{ background: 'var(--surface)', border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
      <div className="cond" style={{ fontWeight: 800, fontSize: 26, color: INK, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: .3, marginTop: 4 }}>{label}</div>
    </div>
  );

  const formChip = (r: string, k: number) => {
    const c = r === 'V' ? GREEN : r === 'D' ? 'var(--danger)' : 'var(--muted)';
    return <span key={k} style={{ width: 26, height: 26, borderRadius: '50%', background: c, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12.5 }}>{r}</span>;
  };

  const label = (t: string) => <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: .5, textTransform: 'uppercase', margin: '18px 0 9px' }}>{t}</div>;

  const matchRow = (m: Match) => {
    const isA = m.a === team.id;
    const oppId = isA ? m.b : m.a;
    const my = scoreOf(m, team.id), th = scoreOf(m, oppId);
    const live = m.status === 'live';
    const done = m.status === 'done';
    const result = done ? (my > th ? 'V' : my < th ? 'D' : 'E') : '';
    const resColor = result === 'V' ? GREEN : result === 'D' ? 'var(--danger)' : 'var(--warn)';
    const when = [fmtDate(m.date), m.time].filter(Boolean).join(' · ');
    return (
      <button
        key={m.id}
        onClick={() => (live ? onLive() : onMatch(m.id))}
        style={{ textAlign: 'left', width: '100%', background: 'var(--surface)', border: `1px solid ${live ? 'var(--danger-tint)' : LINE}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        {done && <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', background: resColor, color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{result}</span>}
        {live && <span style={{ width: 8, height: 8, flexShrink: 0, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.1s infinite' }} />}
        {m.status === 'scheduled' && <span style={{ width: 24, height: 24, flexShrink: 0, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} /></span>}
        <TeamBadge name={nameOf(oppId)} seed={oppId || 'x'} logo={logoOf(oppId)} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, textTransform: 'uppercase' }}>{[phaseLabel(m), when].filter(Boolean).join(' · ')}</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(oppId)}</div>
        </div>
        {live && <span style={{ background: m.livePhase === 'half' ? 'var(--warn)' : m.livePhase === 'pens' ? 'var(--brand)' : 'var(--danger)', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>{liveBadge(m)}</span>}
        {(done || live) && <span className="cond" style={{ fontWeight: 800, fontSize: 18, color: INK, flexShrink: 0 }}>{my}:{th}</span>}
      </button>
    );
  };

  return (
    <div className="m-fade" onClick={onClose} style={{ position: 'fixed', top: 'var(--topbar-h, 0px)', left: 0, right: 0, bottom: 0, zIndex: 70, background: 'rgba(8,30,18,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '18px 14px calc(env(safe-area-inset-bottom) + 18px)', overflowY: 'auto' }}>
      <div className="m-pop" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 540, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - var(--topbar-h, 0px) - 36px - env(safe-area-inset-bottom))', boxShadow: '0 12px 28px rgba(10,30,20,.22), 0 36px 90px rgba(8,30,18,.45)' }}>
        <div style={{ padding: '16px 18px 18px', borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} aria-label="Fechar" style={{ border: `1px solid ${LINE}`, background: 'var(--surface)', color: 'var(--muted-2)', width: 42, height: 42, borderRadius: '50%', fontSize: 26, lineHeight: 1, boxShadow: '0 2px 8px rgba(10,30,20,.12)', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: -14 }}>
            <div style={{ padding: 5, borderRadius: '50%', background: 'var(--surface)', border: `3px solid ${GREEN}`, boxShadow: '0 4px 16px rgba(10,30,20,.14)' }}>
              <TeamBadge name={team.name} seed={team.id} logo={team.logo} size={104} style={{ display: 'block' }} />
            </div>
            <div className="cond" style={{ fontWeight: 800, fontSize: 26, color: INK, textAlign: 'center', lineHeight: 1.05, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {pos > 0 && <span style={{ background: 'var(--brand-tint)', color: GREEN, fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 999 }}>{pos}.º lugar</span>}
              <span style={{ fontSize: 12.5, color: MUTED, fontWeight: 600 }}>
                {team.group ? 'Grupo ' + team.group : 'Amigável'}{team.coach ? ' · ' + team.coach : ''}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {box('Jogos', doneOfficial.length)}
            {box('Vitórias', wins)}
            {box('Golos', totalGoals)}
            {box('Pontos', groupRow ? groupRow.Pts : '–')}
          </div>

          {recent.length > 0 && <>
            {label('Forma recente')}
            <div style={{ display: 'flex', gap: 7 }}>{recent.map(formChip)}</div>
          </>}

          {liveMatch && <>
            {label('Jogo a decorrer')}
            {matchRow(liveMatch)}
          </>}

          {scorers.length > 0 && <>
            {label('Melhores marcadores')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {scorers.map((p, i) => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', alignItems: 'center', gap: 11 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: i < 3 ? GREEN : MUTED, textAlign: 'center' }}>{i + 1}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ marginTop: 5, height: 5, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: Math.max(8, (p.g / maxG) * 100) + '%', height: '100%', borderRadius: 999, background: GREEN }} />
                    </div>
                  </div>
                  <span className="cond" style={{ fontWeight: 800, fontSize: 18, color: INK, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ball size={13} />{p.g}</span>
                </div>
              ))}
            </div>
          </>}

          {label('Plantel')}
          {team.players.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {team.players.map((p) => {
                const s = stat(p.id);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', border: `1px solid ${LINE}`, padding: '6px 11px', borderRadius: 999 }}>
                    {team.captain === p.id && <span style={{ fontSize: 11, fontWeight: 800, color: GREEN }}>©</span>}
                    {p.gk && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'var(--info)', padding: '1px 5px', borderRadius: 5 }}>GR</span>}
                    <span style={{ fontSize: 13.5, color: INK }}>{p.name}</span>
                    {s.g > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 700, color: INK }}><Ball size={12} />{s.g}</span>}
                  </div>
                );
              })}
            </div>
          ) : <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>Sem jogadores registados.</div>}

          {label('Todos os jogos')}
          {matches.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{matches.map(matchRow)}</div>
          ) : <div style={{ fontSize: 13, color: MUTED, fontStyle: 'italic' }}>Sem jogos associados.</div>}
        </div>
      </div>
    </div>
  );
}
