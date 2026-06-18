import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addPushSub } from '@/lib/store';
import { vapidPublicKey } from '@/lib/push';

export const runtime = 'nodejs';

// devolve a chave pública VAPID para o cliente subscrever
export async function GET() { return NextResponse.json({ key: vapidPublicKey() }); }

// regista uma subscrição de Web Push (qualquer visitante pode subscrever)
export async function POST(req: NextRequest) {
  const sub = await req.json().catch(() => null);
  if (!sub || !sub.endpoint) return NextResponse.json({ ok: false }, { status: 400 });
  addPushSub(sub);
  return NextResponse.json({ ok: true });
}
