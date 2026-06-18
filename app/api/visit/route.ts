import { NextResponse } from 'next/server';
import { bumpVisits } from '@/lib/store';

export const runtime = 'nodejs';

// Conta uma visita (uma abertura da página). Público, fire-and-forget.
export async function POST() {
  bumpVisits();
  return NextResponse.json({ ok: true });
}
