import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getLiveStats } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Observabilidade — SÓ admin autenticado.
// online  = dispositivos com a página aberta (ligações SSE)
// push    = dispositivos subscritos a notificações
// visits  = total de aberturas da página
export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  return NextResponse.json(getLiveStats());
}
