// Estado em memória + persistência em ficheiro (volume) + subscritores SSE + Web Push.
// Singleton no globalThis (sobrevive ao hot-reload do Next em dev).
import fs from 'fs';
import path from 'path';
import type { TournamentState } from './types';
import { defaultState } from './tournament';
import { detectEvents, sendPushToAll, type PushSub } from './push';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

type Store = {
  state: TournamentState;
  subscribers: Set<(s: TournamentState) => void>;   // SSE
  pushSubs: PushSub[];                               // Web Push
  visits: number;                                    // total de aberturas da página
  peakOnline: number;                                // máximo de "online agora" em simultâneo (recorde)
  presence: Map<string, { conns: number; lastSeen: number }>;  // clientId (aba) -> ligações activas + último sinal — "online agora"
  saveTimer: ReturnType<typeof setTimeout> | null;
};

function readJSON<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function init(): Store {
  const stats = readJSON(STATS_FILE, { visits: 0, peakOnline: 0 });
  return { state: readJSON(STATE_FILE, defaultState()), subscribers: new Set(), pushSubs: readJSON(SUBS_FILE, [] as PushSub[]), visits: stats.visits || 0, peakOnline: stats.peakOnline || 0, presence: new Map(), saveTimer: null };
}

const g = globalThis as unknown as { __torneioStore?: Store };
const store: Store = g.__torneioStore || (g.__torneioStore = init());

export function getState(): TournamentState { return store.state; }

export function setState(next: TournamentState): void {
  const prev = store.state;
  store.state = next;
  // persistir (debounced)
  if (store.saveTimer) clearTimeout(store.saveTimer);
  store.saveTimer = setTimeout(() => {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(store.state)); }
    catch (e) { console.error('Erro a gravar estado:', e); }
  }, 200);
  // tempo real (SSE) para todos
  store.subscribers.forEach((fn) => { try { fn(store.state); } catch {} });
  // notificações Web Push (site fechado) — só se não for edição silenciosa
  if (next._notify !== false) {
    const events = detectEvents(prev, next);
    if (events.length && store.pushSubs.length) sendPushToAll(store.pushSubs, events, (bad) => removeSub(bad));
  }
}

export function subscribe(fn: (s: TournamentState) => void): () => void {
  store.subscribers.add(fn);
  return () => { store.subscribers.delete(fn); };
}

// ---- estatísticas / observabilidade ----
function persistStats() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(STATS_FILE, JSON.stringify({ visits: store.visits, peakOnline: store.peakOnline })); } catch {} }
export function bumpVisits(): void { store.visits++; persistStats(); }

// Presença "online agora": cada aba tem um clientId estável (sobrevive ao refresh).
// Refcount de ligações por aba — o refresh reabre com o mesmo cid (não duplica) e o
// fecho remove logo (conns→0). O TTL é só rede de segurança p/ quedas sem cancel().
const ONLINE_TTL = 40_000; // ms — tolera 1 ping perdido (ping a cada 15s)
export function addPresence(clientId: string): void {
  if (!clientId) return;
  const p = store.presence.get(clientId);
  if (p) { p.conns++; p.lastSeen = Date.now(); }
  else store.presence.set(clientId, { conns: 1, lastSeen: Date.now() });
  bumpPeak(liveOnline()); // captura o recorde no instante em que alguém entra (mesmo sem o admin a ver)
}
export function touchPresence(clientId: string): void {
  const p = store.presence.get(clientId); if (p) p.lastSeen = Date.now();
}
export function removePresence(clientId: string): void {
  const p = store.presence.get(clientId); if (!p) return;
  if (--p.conns <= 0) store.presence.delete(clientId);
}
function liveOnline(): number {
  const cutoff = Date.now() - ONLINE_TTL;
  let n = 0;
  for (const [id, p] of store.presence) { if (p.lastSeen < cutoff) store.presence.delete(id); else n++; }
  return n;
}
function bumpPeak(n: number): void {
  if (n > store.peakOnline) { store.peakOnline = n; persistStats(); }
}
export function getLiveStats(): { online: number; peakOnline: number; push: number; visits: number } {
  const online = liveOnline();
  bumpPeak(online);
  return { online, peakOnline: store.peakOnline, push: store.pushSubs.length, visits: store.visits };
}

// ---- Web Push subscriptions ----
function persistSubs() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(SUBS_FILE, JSON.stringify(store.pushSubs)); } catch {} }
export function addPushSub(sub: PushSub): void {
  if (!sub || !sub.endpoint) return;
  if (!store.pushSubs.find((s) => s.endpoint === sub.endpoint)) { store.pushSubs.push(sub); persistSubs(); }
}
export function removeSub(endpoint: string): void {
  const before = store.pushSubs.length;
  store.pushSubs = store.pushSubs.filter((s) => s.endpoint !== endpoint);
  if (store.pushSubs.length !== before) persistSubs();
}
