import { NextResponse } from 'next/server';
import { checkPassword, makeToken } from '@/lib/auth';

export const runtime = 'nodejs';

// Rate limit em memória por IP (suficiente para um único container).
// 5 tentativas falhadas por janela de 10 min; só conta falhas.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now > e.resetAt) return false;
  return e.count >= MAX_ATTEMPTS;
}

function registerFailure(ip: string): void {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now > e.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    e.count++;
  }
}

export async function POST(req: Request) {
  const ip = getIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Demasiadas tentativas. Tenta novamente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(WINDOW_MS / 1000) } }
    );
  }

  const { password } = await req.json().catch(() => ({ password: '' }));
  if (!checkPassword(password || '')) {
    registerFailure(ip);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Login com sucesso: limpa o contador deste IP.
  attempts.delete(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', makeToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 });
  return res;
}
