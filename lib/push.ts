// Web Push (VAPID) + deteção de eventos server-side.
// O servidor compara o estado anterior com o novo e envia uma notificação
// "push" para todos os dispositivos subscritos (funciona com o site fechado).
import webpush from 'web-push';
import type { TournamentState, Match } from './types';
import { scoreOf, fmtDate } from './tournament';

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
export type PushEvent = { icon: string; title: string; body: string; matchId?: string };

let configured = false;
function ensureVapid(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:torneio@atiaes.pt', pub, priv);
  configured = true;
  return true;
}
export function vapidPublicKey(): string { return process.env.VAPID_PUBLIC_KEY || ''; }

const teamName = (d: TournamentState, id: string | null) => { const t = d.teams.find((x) => x.id === id); return t ? t.name : '?'; };
const matchWhen = (m: Match) => [fmtDate(m.date), m.time].filter(Boolean).join(' · ');

// golos, início/intervalo/2ª/fim, cartões, jogo novo e alteração de horário
export function detectEvents(prev: TournamentState, next: TournamentState): PushEvent[] {
  const prevById: Record<string, Match> = {}; prev.matches.forEach((m) => { prevById[m.id] = m; });
  const out: PushEvent[] = [];
  next.matches.forEach((m) => {
    const p = prevById[m.id];
    // jogo novo (calendário/amigável, com as duas equipas definidas)
    if (!p) {
      if ((m.phase === 'group' || m.phase === 'friendly') && m.a && m.b) {
        const when = matchWhen(m);
        out.push({ icon: '📅', title: 'Novo jogo agendado', body: teamName(next, m.a) + ' vs ' + teamName(next, m.b) + (when ? ' · ' + when : ''), matchId: m.id });
      }
      return;
    }
    // alteração de data/hora de um jogo por jogar
    if (m.status === 'scheduled' && (p.date !== m.date || p.time !== m.time)) {
      const when = matchWhen(m);
      out.push({ icon: '📅', title: 'Horário atualizado', body: teamName(next, m.a) + ' vs ' + teamName(next, m.b) + (when ? ' · ' + when : ' · por definir'), matchId: m.id });
    }
    const sa = scoreOf(m, m.a), sb = scoreOf(m, m.b);
    if ((m.scorers || []).length > (p.scorers || []).length) {
      const last = m.scorers[m.scorers.length - 1];
      out.push({ icon: '⚽', title: 'GOLO! ' + teamName(next, last.team), body: teamName(next, m.a) + ' ' + sa + '–' + sb + ' ' + teamName(next, m.b), matchId: m.id });
    }
    if (p.status !== m.status || p.livePhase !== m.livePhase) {
      if (m.status === 'live' && m.livePhase === 'first' && p.status !== 'live') out.push({ icon: '🟢', title: 'Começou o jogo', body: teamName(next, m.a) + ' vs ' + teamName(next, m.b), matchId: m.id });
      else if (m.status === 'live' && m.livePhase === 'half') out.push({ icon: '⏸️', title: 'Intervalo', body: teamName(next, m.a) + ' ' + sa + '–' + sb + ' ' + teamName(next, m.b), matchId: m.id });
      else if (m.status === 'live' && m.livePhase === 'second' && p.livePhase === 'half') out.push({ icon: '🟢', title: 'Recomeço · 2ª parte', body: teamName(next, m.a) + ' vs ' + teamName(next, m.b), matchId: m.id });
      else if (m.status === 'done') out.push({ icon: '🏁', title: 'Fim do jogo', body: teamName(next, m.a) + ' ' + sa + '–' + sb + ' ' + teamName(next, m.b), matchId: m.id });
    }
    if ((m.cards || []).length > (p.cards || []).length) {
      const last = m.cards[m.cards.length - 1];
      out.push({ icon: last.type === 'red' ? '🟥' : '🟨', title: (last.type === 'red' ? 'Cartão vermelho' : 'Cartão amarelo') + ' · ' + teamName(next, last.team), body: teamName(next, m.a) + ' vs ' + teamName(next, m.b), matchId: m.id });
    }
  });
  return out;
}

export function sendPushToAll(subs: PushSub[], events: PushEvent[], onBad: (endpoint: string) => void): void {
  if (!ensureVapid()) return; // sem VAPID configurado → ignora silenciosamente
  // envia só o primeiro evento relevante para não floodar (vibração + título)
  const ev = events[0];
  const payload = JSON.stringify({ title: ev.icon + ' ' + ev.title, body: ev.body, matchId: ev.matchId || '' });
  subs.forEach((sub) => {
    webpush.sendNotification(sub as webpush.PushSubscription, payload).catch((err: { statusCode?: number }) => {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) onBad(sub.endpoint); // subscrição morta
    });
  });
}
