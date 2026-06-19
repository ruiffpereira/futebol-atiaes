import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  addComment,
  getComments,
  unreadCount,
  markAllRead,
  removeComment,
  clearComments,
  MAX_LEN,
} from '@/lib/comments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// anti-spam simples em memória: máx. N por IP numa janela
const WINDOW = 10 * 60 * 1000; // 10 min
const LIMIT = 5;
const g = globalThis as unknown as { __cmtRate?: Map<string, number[]> };
const rate = g.__cmtRate || (g.__cmtRate = new Map());
function allowed(ip: string): boolean {
  const now = Date.now();
  const hits = (rate.get(ip) || []).filter((t: number) => now - t < WINDOW);
  if (hits.length >= LIMIT) return false;
  hits.push(now);
  rate.set(ip, hits);
  return true;
}
function ipOf(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconhecido';
}

// Público — enviar comentário/feedback.
export async function POST(req: NextRequest) {
  let body: { name?: string; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'Pedido inválido.' }, { status: 400 }); }
  const name = (body.name || '').trim();
  const message = (body.message || '').trim();
  if (name.length < 2) return NextResponse.json({ ok: false, error: 'Escreve o teu nome.' }, { status: 400 });
  if (message.length < 2) return NextResponse.json({ ok: false, error: 'Escreve uma mensagem.' }, { status: 400 });
  if (message.length > MAX_LEN) return NextResponse.json({ ok: false, error: 'Mensagem demasiado longa.' }, { status: 400 });
  if (!allowed(ipOf(req))) return NextResponse.json({ ok: false, error: 'Demasiados envios. Tenta mais tarde.' }, { status: 429 });
  addComment(name, message);
  return NextResponse.json({ ok: true });
}

// Admin — listar comentários.
export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  return NextResponse.json({ items: getComments(), unread: unreadCount() });
}

// Admin — marcar todos como lidos.
export async function PATCH(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  markAllRead();
  return NextResponse.json({ ok: true });
}

// Admin — apagar um (?id=) ou todos.
export async function DELETE(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (id) removeComment(id);
  else clearComments();
  return NextResponse.json({ ok: true });
}
