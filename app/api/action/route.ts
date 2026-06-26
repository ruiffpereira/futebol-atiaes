import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getState, setState } from '@/lib/store';
import { verifyToken } from '@/lib/auth';
import { actions } from '@/lib/actions';
import type { TournamentState } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aplica uma AÇÃO sobre o estado MAIS RECENTE do servidor (não sobre um snapshot do
// cliente). O Node é single-thread → cada pedido aplica o reducer de forma atómica,
// por isso vários admins em simultâneo não se apagam mutuamente (sem locks).
export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const type = typeof body?.type === 'string' ? body.type : '';
  const args = Array.isArray(body?.args) ? body.args : [];
  const fn = (actions as unknown as Record<string, ((...a: unknown[]) => unknown) | undefined>)[type];
  if (typeof fn !== 'function') {
    return NextResponse.json({ ok: false, error: 'Ação desconhecida' }, { status: 400 });
  }
  const res = fn(getState(), ...args) as TournamentState | { error: string };
  if (res && typeof res === 'object' && 'error' in res) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }
  setState(res as TournamentState);
  return NextResponse.json({ ok: true });
}
