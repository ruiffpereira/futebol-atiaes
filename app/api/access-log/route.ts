import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAccessLog, clearAccessLog } from '@/lib/accessLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Histórico de acessos — SÓ admin autenticado.
export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  return NextResponse.json({ entries: getAccessLog() });
}

// Limpar o histórico.
export async function DELETE(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  clearAccessLog();
  return NextResponse.json({ ok: true });
}
