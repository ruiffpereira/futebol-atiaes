// Comentários / feedback do público — aparece no backoffice.
// Persistência em ficheiro (volume) + singleton no globalThis (sobrevive ao hot-reload).
import fs from 'fs';
import path from 'path';

export type Comment = {
  id: string;
  ts: number;       // timestamp
  name: string;     // '' = anónimo
  message: string;
  read?: boolean;   // marcado como lido no backoffice
};

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'comments.json');
const MAX = 500;            // mantém só os últimos N
export const MAX_LEN = 600; // tamanho máximo da mensagem

type Store = { items: Comment[] };
function read(): Comment[] { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } }

const g = globalThis as unknown as { __comments?: Store };
const store: Store = g.__comments || (g.__comments = { items: read() });

function persist() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(store.items)); } catch (e) { console.error('Erro a gravar comentários:', e); } }

function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export function addComment(name: string, message: string): Comment {
  const c: Comment = {
    id: uid(),
    ts: Date.now(),
    name: (name || '').trim().slice(0, 60),
    message: (message || '').trim().slice(0, MAX_LEN),
    read: false,
  };
  store.items.push(c);
  if (store.items.length > MAX) store.items = store.items.slice(-MAX);
  persist();
  return c;
}
export function getComments(): Comment[] { return [...store.items].reverse(); } // mais recente primeiro
export function unreadCount(): number { return store.items.filter((c) => !c.read).length; }
export function markAllRead(): void { store.items.forEach((c) => { c.read = true; }); persist(); }
export function removeComment(id: string): void { store.items = store.items.filter((c) => c.id !== id); persist(); }
export function clearComments(): void { store.items = []; persist(); }
