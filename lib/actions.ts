// Transformações de estado puras. Cada ação recebe o estado e devolve um NOVO estado.
// Espelham a lógica do protótipo. O resultado é enviado para /api/state.
import type { TournamentState, LivePhase, Src } from './types';
import { uid, newMatch, propagate, standings, defaultState } from './tournament';

const clone = (d: TournamentState): TournamentState => JSON.parse(JSON.stringify(d));
// aplica propagação da fase final e marca se deve notificar (silent = edição)
const done = (d: TournamentState, silent = false): TournamentState => { propagate(d); d._notify = !silent; return d; };

function pairExists(d: TournamentState, g: string, x: string, y: string): boolean {
  return d.matches.some((m) => m.phase === 'group' && m.group === g && ((m.a === x && m.b === y) || (m.a === y && m.b === x)));
}

export const actions = {
  // ---- equipas / jogadores / grupos ----
  addTeam: (d: TournamentState, name: string, group: string) => { const n = clone(d); n.teams.push({ id: uid(), name, group, players: [], captain: '', coach: '' }); return done(n); },
  removeTeam: (d: TournamentState, id: string) => { const n = clone(d); n.teams = n.teams.filter((t) => t.id !== id); n.matches = n.matches.filter((m) => m.a !== id && m.b !== id); return done(n); },
  renameTeam: (d: TournamentState, id: string, name: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === id); if (t) t.name = name; return done(n, true); },
  setTeamGroup: (d: TournamentState, id: string, group: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === id); if (t) t.group = group; return done(n); },
  setCaptain: (d: TournamentState, id: string, pid: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === id); if (t) t.captain = pid || ''; return done(n, true); },
  setCoach: (d: TournamentState, id: string, coach: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === id); if (t) t.coach = coach; return done(n, true); },
  setTeamLogo: (d: TournamentState, id: string, url: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === id); if (t) t.logo = url || undefined; return done(n, true); },
  toggleGK: (d: TournamentState, teamId: string, pid: string) => {
    const n = clone(d); const t = n.teams.find((x) => x.id === teamId);
    if (t) { const target = t.players.find((x) => x.id === pid); if (target) { const on = !target.gk; t.players.forEach((p) => { p.gk = false; }); target.gk = on; } }
    return done(n, true);
  },
  addPlayer: (d: TournamentState, teamId: string, name: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === teamId); if (t) t.players.push({ id: uid(), name }); return done(n, true); },
  renamePlayer: (d: TournamentState, teamId: string, pid: string, name: string) => { const n = clone(d); const t = n.teams.find((x) => x.id === teamId); if (t) { const p = t.players.find((x) => x.id === pid); if (p) p.name = name; } return done(n, true); },
  removePlayer: (d: TournamentState, teamId: string, pid: string) => {
    const n = clone(d); const t = n.teams.find((x) => x.id === teamId);
    if (t) t.players = t.players.filter((p) => p.id !== pid);
    n.matches.forEach((m) => { m.scorers = m.scorers.filter((s) => s.player !== pid); m.cards = m.cards.filter((c) => c.player !== pid); });
    return done(n, true);
  },
  addGroup: (d: TournamentState) => { const n = clone(d); n.groups.push(String.fromCharCode(65 + n.groups.length)); return done(n); },
  removeGroup: (d: TournamentState, g: string) => {
    const n = clone(d); if (n.groups.length <= 1) return n;
    n.groups = n.groups.filter((x) => x !== g);
    n.teams.forEach((t) => { if (t.group === g) t.group = ''; });
    n.matches = n.matches.filter((m) => m.group !== g);
    return done(n);
  },

  // ---- calendário (manual) ----
  addMatch: (d: TournamentState, g: string, a: string, b: string, time: string, date = ''): TournamentState | { error: string } => {
    if (!a || !b || a === b) return { error: 'Escolhe duas equipas diferentes.' };
    const friendly = g === '__friendly__';
    if (!friendly && pairExists(d, g, a, b)) return { error: 'Essas equipas já têm um jogo neste grupo.' };
    const n = clone(d);
    n.matches.push(newMatch(friendly ? { phase: 'friendly', group: '', a, b, time: time || '', date: date || '' } : { group: g, a, b, time: time || '', date: date || '' }));
    return done(n);
  },
  removeMatch: (d: TournamentState, id: string) => { const n = clone(d); n.matches = n.matches.filter((m) => m.id !== id); return done(n, true); },
  // edição "ao vivo" da data/hora — silenciosa (não notifica em cada tecla)
  setMatchTime: (d: TournamentState, id: string, time: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) m.time = time; return done(n, true); },
  setMatchDate: (d: TournamentState, id: string, date: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) m.date = date; return done(n, true); },
  // guardar data+hora de uma vez → envia UMA notificação "Horário atualizado"
  setSchedule: (d: TournamentState, id: string, date: string, time: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { m.date = date; m.time = time; } return done(n); },
  moveMatch: (d: TournamentState, id: string, dir: number) => {
    const n = clone(d);
    const list = n.matches.filter((m) => m.phase === 'group' || m.phase === 'friendly');
    const idx = list.findIndex((m) => m.id === id), sw = idx + dir;
    if (idx < 0 || sw < 0 || sw >= list.length) return n;
    const ai = n.matches.findIndex((m) => m.id === list[idx].id), bi = n.matches.findIndex((m) => m.id === list[sw].id);
    const t = n.matches[ai]; n.matches[ai] = n.matches[bi]; n.matches[bi] = t;
    return done(n, true);
  },

  // ---- golos / cartões (silent = correção pós-jogo) ----
  addGoal: (d: TournamentState, matchId: string, teamId: string, playerId: string | null, silent = false) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) m.scorers.push({ id: uid(), team: teamId, player: playerId || null, own: false, ts: Date.now() }); return done(n, silent); },
  addOwnGoal: (d: TournamentState, matchId: string, benefitTeamId: string, silent = false) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) m.scorers.push({ id: uid(), team: benefitTeamId, player: null, own: true, ts: Date.now() }); return done(n, silent); },
  removeGoal: (d: TournamentState, matchId: string, goalId: string, silent = false) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) { const i = m.scorers.findIndex((s) => s.id === goalId); if (i >= 0) m.scorers.splice(i, 1); } return done(n, silent); },
  addCard: (d: TournamentState, matchId: string, teamId: string, playerId: string | null, type: 'yellow' | 'red', silent = false) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) { if (!m.cards) m.cards = []; m.cards.push({ team: teamId, player: playerId || null, type, ts: Date.now() }); } return done(n, silent); },
  removeLastCard: (d: TournamentState, matchId: string, teamId: string, type: 'yellow' | 'red', silent = false) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m && m.cards) { for (let i = m.cards.length - 1; i >= 0; i--) { if (m.cards[i].team === teamId && m.cards[i].type === type) { m.cards.splice(i, 1); break; } } } return done(n, silent); },
  setPen: (d: TournamentState, matchId: string, side: 'penA' | 'penB', v: number, silent = false) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) m[side] = Math.max(0, v | 0); return done(n, silent); },

  // ---- estado do jogo ao vivo (sem cronómetro) ----
  startMatch: (d: TournamentState, id: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { m.status = 'live'; m.livePhase = 'first'; } return done(n); },
  setLivePhase: (d: TournamentState, id: string, phase: LivePhase) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { m.status = 'live'; m.livePhase = phase; } return done(n); },
  finishMatch: (d: TournamentState, id: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { m.status = 'done'; m.finishedAt = Date.now(); } return done(n); },
  // ---- desempate por penáltis (fase final empatada ao fim da 2ª parte) ----
  startPens: (d: TournamentState, id: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { m.status = 'live'; m.livePhase = 'pens'; m.penA = m.penA || 0; m.penB = m.penB || 0; } return done(n); },
  setPenStart: (d: TournamentState, id: string, side: 'a' | 'b') => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) m.penStart = side; return done(n); },
  addPen: (d: TournamentState, id: string, side: 'a' | 'b') => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { const k = side === 'a' ? 'penA' : 'penB'; m[k] = (m[k] || 0) + 1; } return done(n); },
  removePen: (d: TournamentState, id: string, side: 'a' | 'b') => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { const k = side === 'a' ? 'penA' : 'penB'; m[k] = Math.max(0, (m[k] || 0) - 1); } return done(n); },
  reopenMatch: (d: TournamentState, id: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === id); if (m) { m.status = 'live'; m.livePhase = m.livePhase || 'second'; } return done(n); },

  // ---- fase final (automática) ----
  genKnockout: (d: TournamentState) => {
    const n = clone(d);
    n.matches = n.matches.filter((m) => m.phase === 'group' || m.phase === 'friendly');
    const g0 = n.groups[0] || 'A', g1 = n.groups[1] || 'B';
    const mk = (phase: 'sf' | 'third' | 'final', slot: number, srcA: Src, srcB: Src) => newMatch({ phase, slot, group: '', a: null, b: null, srcA, srcB });
    n.matches.push(mk('sf', 1, { kind: 'group', group: g0, pos: 1 }, { kind: 'group', group: g1, pos: 2 }));
    n.matches.push(mk('sf', 2, { kind: 'group', group: g1, pos: 1 }, { kind: 'group', group: g0, pos: 2 }));
    n.matches.push(mk('third', 0, { kind: 'loser', ref: 'sf1' }, { kind: 'loser', ref: 'sf2' }));
    n.matches.push(mk('final', 0, { kind: 'winner', ref: 'sf1' }, { kind: 'winner', ref: 'sf2' }));
    n.knockoutCreated = true;
    return done(n);
  },
  // marcar equipas/grupos como concluídos → fase final calcula e aparece no placar
  setGroupsConcluded: (d: TournamentState, v: boolean) => { const n = clone(d); n.groupsConcluded = v; return done(n, true); },
  // editar manualmente uma equipa de um jogo da fase final (bloqueia o auto-preenchimento)
  setKoTeam: (d: TournamentState, matchId: string, side: 'a' | 'b', teamId: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) { m[side] = teamId || null; m.lockTeams = true; } return done(n, true); },
  // voltar ao preenchimento automático de um jogo da fase final
  setKoAuto: (d: TournamentState, matchId: string) => { const n = clone(d); const m = n.matches.find((x) => x.id === matchId); if (m) m.lockTeams = false; return done(n, true); },

  // ---- definições ----
  setName: (d: TournamentState, name: string) => { const n = clone(d); n.tournamentName = name; return done(n, true); },
  reset: () => done(defaultState()),
  replaceState: (_d: TournamentState, next: TournamentState) => clone(next),
};
