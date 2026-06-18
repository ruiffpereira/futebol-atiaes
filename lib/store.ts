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

type Store = {
  state: TournamentState;
  subscribers: Set<(s: TournamentState) => void>;   // SSE
  pushSubs: PushSub[];                               // Web Push
  saveTimer: ReturnType<typeof setTimeout> | null;
};

function readJSON<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function init(): Store {
  return { state: readJSON(STATE_FILE, defaultState()), subscribers: new Set(), pushSubs: readJSON(SUBS_FILE, [] as PushSub[]), saveTimer: null };
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
