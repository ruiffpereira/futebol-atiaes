// Histórico de tentativas de acesso ao backoffice.
// Persistência em ficheiro (volume) + singleton no globalThis (sobrevive ao hot-reload).
import fs from 'fs';
import path from 'path';

export type AccessEntry = {
  ts: number;        // timestamp
  ip: string;
  ok: boolean;       // true = entrou; false = falhou
  blocked?: boolean; // bloqueado por rate-limit (nem chegou a tentar a password)
  ua?: string;       // user-agent
};

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'access-log.json');
const MAX = 300; // mantém só as últimas N entradas

type LogStore = { entries: AccessEntry[] };
function read(): AccessEntry[] { try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch { return []; } }

const g = globalThis as unknown as { __accessLog?: LogStore };
const store: LogStore = g.__accessLog || (g.__accessLog = { entries: read() });

function persist() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(LOG_FILE, JSON.stringify(store.entries)); } catch (e) { console.error('Erro a gravar access-log:', e); } }

export function logAccess(e: AccessEntry): void {
  store.entries.push(e);
  if (store.entries.length > MAX) store.entries = store.entries.slice(-MAX);
  persist();
}
export function getAccessLog(): AccessEntry[] { return [...store.entries].reverse(); } // mais recente primeiro
export function clearAccessLog(): void { store.entries = []; persist(); }
