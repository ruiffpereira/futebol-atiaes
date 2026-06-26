'use client';
import { scoreOf, phaseLabel, liveBadge, fmtDate } from '@/lib/tournament';
import type { Match, TournamentState } from '@/lib/types';
import { useScrollLock } from '@/lib/useScrollLock';
import { Ball, Card, Jersey, Shield, TeamBadge, User } from './Icons';

const INK = 'var(--text)', MUTED = 'var(--muted)', LINE = 'var(--line)', GREEN = 'var(--brand)';

// Detalhe do jogo (lance-a-lance + equipas) — só leitura.
export default function MatchDetail({ m, state, onClose }: { m: Match; state: TournamentState; onClose: () => void }) {
  useScrollLock();
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
    const icon = e.kind === 'goal'
      ? <Ball size={16} color={INK} />
      : <Card size={15} color={e.kind === 'yellow' ? 'var(--warn)' : 'var(--danger)'} />;
    return { i, isA, icon, who, sc, isGoal: e.kind === 'goal' };
  });
  const lineup = (t: typeof ta) => (t ? t.players.map((p) => ({
    name: p.name, cap: t.captain === p.id, gk: !!p.gk, num: p.number,
    g: (m.scorers || []).filter((s) => s.player === p.id).length,
    y: (m.cards || []).filter((c) => c.player === p.id && c.type === 'yellow').length,
    r: (m.cards || []).filter((c) => c.player === p.id && c.type === 'red').length,
  })).sort((a, b) => rank(a) - rank(b)) : []);  // guarda-redes, depois capitão, depois o resto (sort estável)

  const rank = (p: { gk: boolean; cap: boolean }) => (p.gk ? 0 : p.cap ? 1 : 2);

  // Camisola verde para os jogadores; guarda-redes sempre azul (independente da equipa).
  // Braçadeira dourada se for capitão; nº ao peito.
  const jersey = (p: { num?: number; gk: boolean; cap: boolean }) => {
    const col = p.gk ? 'var(--info)' : GREEN;
    return (
      <span style={{ position: 'relative', width: 30, height: 30, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Jersey size={30} color={col} />
        {p.num != null && <span style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%,-50%)', fontSize: String(p.num).length > 1 ? 8 : 10, fontWeight: 800, color: '#fff', lineHeight: 1, textShadow: '0 1px 1.5px rgba(0,0,0,.35)' }}>{p.num}</span>}
        {p.cap && <span style={{ position: 'absolute', top: -2, right: -2, width: 13, height: 13, borderRadius: '50%', background: 'var(--warn)', color: '#fff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--surface)', lineHeight: 1 }}>C</span>}
      </span>
    );
  };

  const playerRow = (p: { name: string; cap: boolean; gk: boolean; num?: number; g: number; y: number; r: number }, k: number, align: 'left' | 'right' = 'left') => {
    const right = align === 'right';
    return (
      <div key={k} style={{ display: 'flex', flexDirection: right ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `1px solid ${LINE}` }}>
        {jersey(p)}
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: INK, textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
        {p.g > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontWeight: 700, color: INK }}><Ball size={13} />{p.g}</span>}
        {p.y > 0 && <Card size={12} color="var(--warn)" />}
        {p.r > 0 && <Card size={12} color="var(--danger)" />}
      </div>
    );
  };

  // Linha de "staff" (treinador / presidente) com ícone e rótulo.
  const staffRow = (role: string, name: string, icon: React.ReactNode, color: string, align: 'left' | 'right' = 'left') => {
    const right = align === 'right';
    return (
      <div style={{ display: 'flex', flexDirection: right ? 'row-reverse' : 'row', alignItems: 'center', gap: 7, padding: '5px 0' }}>
        <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', background: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 8.5, fontWeight: 800, letterSpacing: .4, textTransform: 'uppercase', color: MUTED, lineHeight: 1.2, textAlign: right ? 'right' : 'left' }}>{role}</span>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.2, textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        </span>
      </div>
    );
  };

  // Coluna de uma equipa: plantel e (por baixo) treinador + presidente.
  // O emblema/nome já aparecem no topo da modal, por isso não se repetem aqui.
  const teamColumn = (t: typeof ta, _side: 'a' | 'b', align: 'left' | 'right' = 'left') => {
    return (
      <div style={{ minWidth: 0 }}>
        {lineup(t).map((p, k) => playerRow(p, k, align))}
        {(t?.coach || t?.president) && (
          <div style={{ marginTop: 8, paddingTop: 2 }}>
            {t?.coach && staffRow('Treinador', t.coach, <User size={14} color="#fff" />, 'var(--info)', align)}
            {t?.president && staffRow('Presidente', t.president, <Shield size={13} color="#fff" />, 'var(--warn)', align)}
          </div>
        )}
      </div>
    );
  };

  const teamCol = (label: string, side: 'a' | 'b', logo?: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
      <div style={{ padding: 3, borderRadius: '50%', background: 'var(--surface)', border: `2.5px solid ${GREEN}`, boxShadow: '0 3px 12px rgba(10,30,20,.12)', display: 'flex' }}>
        <TeamBadge name={label} seed={m[side] || side} logo={logo} size={48} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14.5, color: INK, textAlign: 'center', lineHeight: 1.15, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </div>
  );

  return (
    <div className="m-fade" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70, background: 'rgba(10,12,11,.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'calc(var(--topbar-h, 0px) + 18px) 14px calc(env(safe-area-inset-bottom) + 18px)', overflowY: 'hidden' }}>
      <div className="m-pop" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 560, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - var(--topbar-h, 0px) - 36px - env(safe-area-inset-bottom))', boxShadow: '0 12px 28px rgba(10,30,20,.22), 0 36px 90px rgba(8,30,18,.45)' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5 }}>{[phaseLabel(m), fmtDate(m.date), m.time].filter(Boolean).join(' · ')}</span>
            <button onClick={onClose} aria-label="Fechar" style={{ border: `1px solid ${LINE}`, background: 'var(--surface)', color: 'var(--muted-2)', width: 42, height: 42, borderRadius: '50%', fontSize: 26, lineHeight: 1, boxShadow: '0 2px 8px rgba(10,30,20,.12)', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
            {teamCol(ta?.name || 'A definir', 'a', ta?.logo)}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span className="cond" style={{ fontWeight: 800, fontSize: 40, color: INK, lineHeight: 1 }}>{scoreOf(m, m.a)} : {scoreOf(m, m.b)}</span>
              {((m.penA || 0) > 0 || (m.penB || 0) > 0) && <span style={{ color: MUTED, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .3 }}>Penáltis {m.penA || 0}–{m.penB || 0}</span>}
              {m.status === 'live' && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: m.livePhase === 'half' ? 'var(--warn)' : m.livePhase === 'pens' ? 'var(--brand)' : 'var(--danger)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 1.1s infinite' }} />{liveBadge(m)}</span>}
              {m.status === 'done' && <span style={{ color: MUTED, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Terminado</span>}
              {m.status === 'scheduled' && <span style={{ color: MUTED, fontSize: 11, fontWeight: 700 }}>{m.time || 'Por jogar'}</span>}
            </div>
            {teamCol(tb?.name || 'A definir', 'b', tb?.logo)}
          </div>
        </div>
        <div style={{ padding: '16px 18px', overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: .5, textTransform: 'uppercase', marginBottom: 12 }}>Lance a lance</div>
          {rows.length ? <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: LINE, transform: 'translateX(-50%)' }} />
            {rows.map((e) => (
              <div key={e.i} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 36px 1fr', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <div style={{ textAlign: 'right', minWidth: 0 }}>{e.isA && <><div style={{ fontWeight: 600, fontSize: 13.5, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.who}</div>{e.isGoal && <div className="cond" style={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>{e.sc}</div>}</>}</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--surface)', zIndex: 1 }}>{e.icon}</div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>{!e.isA && <><div style={{ fontWeight: 600, fontSize: 13.5, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.who}</div>{e.isGoal && <div className="cond" style={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>{e.sc}</div>}</>}</div>
              </div>
            ))}
          </div> : <div style={{ textAlign: 'center', color: MUTED, fontSize: 13, padding: '14px 0' }}>Ainda sem golos nem cartões.</div>}

          <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: .5, textTransform: 'uppercase', margin: '20px 0 10px' }}>Equipas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {teamColumn(ta, 'a', 'left')}
            {teamColumn(tb, 'b', 'right')}
          </div>
        </div>
      </div>
    </div>
  );
}
