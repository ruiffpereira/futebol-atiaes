// Lógica pura do torneio — reutilizável no servidor e no cliente.
import type { TournamentState, Match, Src } from './types';

export function uid(): string { return Math.random().toString(36).slice(2, 9); }

export function defaultState(): TournamentState {
  return {
    tournamentName: 'Atiães em Movimento',
    subtitle: 'Torneio Futebol 5',
    groups: ['A', 'B'],
    teams: [],
    matches: [],
    knockoutCreated: false,
  };
}

export function newMatch(extra: Partial<Match>): Match {
  return Object.assign({
    id: uid(), phase: 'group', group: '', a: null, b: null, date: '', time: '',
    scorers: [], cards: [], status: 'scheduled', livePhase: 'first',
    finishedAt: 0, penA: 0, penB: 0,
  } as Match, extra);
}

export function scoreOf(m: Match, teamId: string | null): number {
  if (!teamId) return 0;
  let n = 0; (m.scorers || []).forEach((s) => { if (s.team === teamId) n++; });
  return n;
}
export function cardsOf(m: Match, teamId: string | null, type: 'yellow' | 'red'): number {
  let n = 0; (m.cards || []).forEach((c) => { if (c.team === teamId && c.type === type) n++; });
  return n;
}

// "YYYY-MM-DD" -> "DD/MM" (vazio se não definido)
export function fmtDate(date?: string): string {
  if (!date) return '';
  const [y, mo, d] = date.split('-');
  if (!y || !mo || !d) return date;
  return d + '/' + mo;
}

export function phaseLabel(m: Match): string {
  if (m.phase === 'group') return 'Grupo ' + m.group;
  if (m.phase === 'friendly') return 'Amigável';
  if (m.phase === 'sf') return 'Meia-final ' + (m.slot || '');
  if (m.phase === 'final') return 'Final';
  if (m.phase === 'third') return '3º e 4º lugar';
  return '';
}
export function liveText(m: Match): string {
  if (m.status !== 'live') return '';
  if (m.livePhase === 'half') return 'Intervalo';
  if (m.livePhase === 'pens') return 'Penáltis';
  if (m.livePhase === 'second') return '2ª parte';
  return '1ª parte';
}
export function liveBadge(m: Match): string {
  if (m.status !== 'live') return '';
  if (m.livePhase === 'half') return 'INTERVALO';
  if (m.livePhase === 'pens') return 'PENÁLTIS';
  return 'AO VIVO · ' + (m.livePhase === 'second' ? '2ª PARTE' : '1ª PARTE');
}

export type StandingRow = { team: { id: string; name: string }; P: number; W: number; D: number; L: number; GF: number; GA: number; Pts: number };

// inclui jogos ao vivo (tabela provisória em tempo real)
export function standings(d: TournamentState, g: string): StandingRow[] {
  const teams = d.teams.filter((t) => t.group === g);
  const row: Record<string, StandingRow> = {};
  teams.forEach((t) => { row[t.id] = { team: t, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }; });
  const gm = d.matches.filter((m) => m.phase === 'group' && m.group === g && (m.status === 'done' || m.status === 'live'));
  gm.forEach((m) => {
    const sa = scoreOf(m, m.a), sb = scoreOf(m, m.b);
    const ra = m.a ? row[m.a] : null, rb = m.b ? row[m.b] : null;
    if (!ra || !rb) return;
    ra.P++; rb.P++; ra.GF += sa; ra.GA += sb; rb.GF += sb; rb.GA += sa;
    if (sa > sb) { ra.W++; ra.Pts += 3; rb.L++; }
    else if (sb > sa) { rb.W++; rb.Pts += 3; ra.L++; }
    else { ra.D++; rb.D++; ra.Pts++; rb.Pts++; }
  });
  const directPts = (ta: string, tb: string) => {
    let p = 0;
    gm.forEach((m) => {
      const inv = (m.a === ta && m.b === tb) || (m.a === tb && m.b === ta);
      if (!inv) return;
      const sa = scoreOf(m, m.a), sb = scoreOf(m, m.b);
      const my = m.a === ta ? sa : sb, th = m.a === ta ? sb : sa;
      if (my > th) p += 3; else if (my === th) p += 1;
    });
    return p;
  };
  return Object.keys(row).map((k) => row[k]).sort((x, y) => {
    if (y.Pts !== x.Pts) return y.Pts - x.Pts;
    const dpx = directPts(x.team.id, y.team.id), dpy = directPts(y.team.id, x.team.id);
    if (dpy !== dpx) return dpy - dpx;
    const gdx = x.GF - x.GA, gdy = y.GF - y.GA;
    if (gdy !== gdx) return gdy - gdx;
    if (y.GF !== x.GF) return y.GF - x.GF;
    return x.team.name.localeCompare(y.team.name);
  });
}

export type ScorerRow = { id: string; name: string; team: string; goals: number };
export function topScorers(d: TournamentState): ScorerRow[] {
  const map: Record<string, ScorerRow> = {};
  d.matches.forEach((m) => { if (m.phase === 'friendly') return; (m.scorers || []).forEach((s) => {
    if (!s.player) return;
    const t = d.teams.find((x) => x.id === s.team); if (!t) return;
    const pl = t.players.find((p) => p.id === s.player); if (!pl) return;
    if (!map[s.player]) map[s.player] = { id: s.player, name: pl.name, team: t.name, goals: 0 };
    map[s.player].goals++;
  }); });
  return Object.keys(map).map((k) => map[k]).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

// Ataque/defesa por equipa — jogos oficiais (não amigáveis) já terminados ou ao vivo.
export type TeamStatRow = { id: string; name: string; gf: number; ga: number; games: number };
export function teamStats(d: TournamentState): TeamStatRow[] {
  const map: Record<string, TeamStatRow> = {};
  d.teams.forEach((t) => { map[t.id] = { id: t.id, name: t.name, gf: 0, ga: 0, games: 0 }; });
  d.matches.forEach((m) => {
    if (m.phase === 'friendly') return;
    if (m.status !== 'done' && m.status !== 'live') return;
    if (!m.a || !m.b) return;
    const sa = scoreOf(m, m.a), sb = scoreOf(m, m.b);
    if (map[m.a]) { map[m.a].gf += sa; map[m.a].ga += sb; map[m.a].games++; }
    if (map[m.b]) { map[m.b].gf += sb; map[m.b].ga += sa; map[m.b].games++; }
  });
  return Object.keys(map).map((k) => map[k]).filter((r) => r.games > 0);
}
// Melhor ataque: mais golos marcados (desempate: menos sofridos, depois nome).
export function bestAttack(d: TournamentState): TeamStatRow[] {
  return teamStats(d).sort((a, b) => b.gf - a.gf || a.ga - b.ga || a.name.localeCompare(b.name));
}
// Melhor defesa: menos golos sofridos (desempate: mais marcados, depois nome).
export function bestDefense(d: TournamentState): TeamStatRow[] {
  return teamStats(d).sort((a, b) => a.ga - b.ga || b.gf - a.gf || a.name.localeCompare(b.name));
}

// ---- fase final automática ----
// Grupo só está 100% concluído quando TODAS as equipas jogaram entre si (round-robin)
// e todos esses jogos terminaram. Assim a classificação final é certa.
export function groupComplete(d: TournamentState, g: string): boolean {
  const teams = d.teams.filter((t) => t.group === g);
  if (teams.length < 2) return false;
  const gm = d.matches.filter((m) => m.phase === 'group' && m.group === g);
  // nenhum jogo do grupo pode estar por terminar
  if (gm.some((m) => m.status !== 'done')) return false;
  // cada par de equipas tem de ter um jogo terminado entre si
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i].id, b = teams[j].id;
      const played = gm.some((m) => m.status === 'done' && ((m.a === a && m.b === b) || (m.a === b && m.b === a)));
      if (!played) return false;
    }
  }
  return true;
}
export function koWinner(m?: Match | null): string | null {
  if (!m || m.status !== 'done' || !m.a || !m.b) return null;
  const sa = scoreOf(m, m.a), sb = scoreOf(m, m.b);
  if (sa > sb) return m.a; if (sb > sa) return m.b;
  if ((m.penA || 0) > (m.penB || 0)) return m.a;
  if ((m.penB || 0) > (m.penA || 0)) return m.b;
  return null;
}
export function koLoser(m?: Match | null): string | null {
  const w = koWinner(m); if (!w || !m) return null;
  return w === m.a ? m.b : m.a;
}
function refMatch(d: TournamentState, ref: string): Match | undefined {
  const slot = ref === 'sf1' ? 1 : ref === 'sf2' ? 2 : 0;
  return d.matches.find((m) => m.phase === 'sf' && m.slot === slot);
}
export function resolveSrc(d: TournamentState, src?: Src): string | null {
  if (!src) return null;
  if (src.kind === 'group') {
    if (!groupComplete(d, src.group)) return null;
    const st = standings(d, src.group);
    return st[src.pos - 1] ? st[src.pos - 1].team.id : null;
  }
  if (src.kind === 'winner') return koWinner(refMatch(d, src.ref));
  if (src.kind === 'loser') return koLoser(refMatch(d, src.ref));
  return null;
}
export function srcLabel(src?: Src): string {
  if (!src) return 'A definir';
  if (src.kind === 'group') return src.pos + 'º Grupo ' + src.group;
  if (src.kind === 'winner') return 'Vencedor ' + (src.ref === 'sf1' ? 'Meia-final 1' : 'Meia-final 2');
  if (src.kind === 'loser') return 'Perdedor ' + (src.ref === 'sf1' ? 'Meia-final 1' : 'Meia-final 2');
  return 'A definir';
}
// resolve os lugares da fase final quando 100% certos (não mexe se o jogo já começou)
export function propagate(d: TournamentState): void {
  (['sf', 'third', 'final'] as const).forEach((ph) =>
    d.matches.filter((m) => m.phase === ph).forEach((m) => {
      if (m.lockTeams) return;
      if (m.status !== 'scheduled' || (m.scorers || []).length > 0) return;
      if (m.srcA !== undefined) m.a = resolveSrc(d, m.srcA);
      if (m.srcB !== undefined) m.b = resolveSrc(d, m.srcB);
    }));
}
