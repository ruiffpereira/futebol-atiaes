import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getState, setState } from '@/lib/store';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Leitura: pública (qualquer pessoa vê o placar)
export async function GET() { return NextResponse.json(getState()); }

// Escrita: SÓ autenticado. Sem cookie de admin → 401.
export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.teams) || !Array.isArray(body.matches)) {
    return NextResponse.json({ ok: false, error: 'Estado inválido' }, { status: 400 });
  }
  setState(body);
  return NextResponse.json({ ok: true });
}
