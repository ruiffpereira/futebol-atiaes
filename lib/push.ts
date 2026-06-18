// Web Push (VAPID) + deteção de eventos server-side.
// O servidor compara o estado anterior com o novo e envia uma notificação
// "push" para todos os dispositivos subscritos (funciona com o site fechado).
import webpush from 'web-push';
import type { TournamentState, Match } from './types';
import { scoreOf } from './tournament';

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
export type PushEvent = { icon: string; title: string; body: string };

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

// mesma lógica do protótipo: golos, início/intervalo/2ª/fim, cartões
export function detectEvents(prev: TournamentState, next: TournamentState): PushEvent[] {
  const prevById: Record<string, Match> = {}; prev.matches.forEach((m) => { prevById[m.id] = m; });
  const out: PushEvent[] = [];
  next.matches.forEach((m) => {
    const p = prevById[m.id]; if (!p) return;
    const sa = scoreOf(m, m.a), sb = scoreOf(m, m.b);
    if ((m.scorers || []).length > (p.scorers || []).length) {
      const last = m.scorers[m.scorers.length - 1];
      out.push({ icon: '⚽', title: 'GOLO! ' + teamName(next, last.team), body: teamName(next, m.a) + ' ' + sa + '–' + sb + ' ' + teamName(next, m.b) });
    }
    if (p.status !== m.status || p.livePhase !== m.livePhase) {
      if (m.status === 'live' && m.livePhase === 'first' && p.status !== 'live') out.push({ icon: '🟢', title: 'Começou o jogo', body: teamName(next, m.a) + ' vs ' + teamName(next, m.b) });
      else if (m.status === 'live' && m.livePhase === 'half') out.push({ icon: '⏸️', title: 'Intervalo', body: teamName(next, m.a) + ' ' + sa + '–' + sb + ' ' + teamName(next, m.b) });
      else if (m.status === 'live' && m.livePhase === 'second' && p.livePhase === 'half') out.push({ icon: '🟢', title: 'Recomeço · 2ª parte', body: teamName(next, m.a) + ' vs ' + teamName(next, m.b) });
      else if (m.status === 'done') out.push({ icon: '🏁', title: 'Fim do jogo', body: teamName(next, m.a) + ' ' + sa + '–' + sb + ' ' + teamName(next, m.b) });
    }
    if ((m.cards || []).length > (p.cards || []).length) {
      const last = m.cards[m.cards.length - 1];
      out.push({ icon: last.type === 'red' ? '🟥' : '🟨', title: (last.type === 'red' ? 'Cartão vermelho' : 'Cartão amarelo') + ' · ' + teamName(next, last.team), body: teamName(next, m.a) + ' vs ' + teamName(next, m.b) });
    }
  });
  return out;
}

export function sendPushToAll(subs: PushSub[], events: PushEvent[], onBad: (endpoint: string) => void): void {
  if (!ensureVapid()) return; // sem VAPID configurado → ignora silenciosamente
  // envia só o primeiro evento relevante para não floodar (vibração + título)
  const ev = events[0];
  const payload = JSON.stringify({ title: ev.icon + ' ' + ev.title, body: ev.body });
  subs.forEach((sub) => {
    webpush.sendNotification(sub as webpush.PushSubscription, payload).catch((err: { statusCode?: number }) => {
      if (err && (err.statusCode === 404 || err.statusCode === 410)) onBad(sub.endpoint); // subscrição morta
    });
  });
}
