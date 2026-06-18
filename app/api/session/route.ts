import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('admin_token='))?.slice('admin_token='.length);
  return NextResponse.json({ admin: verifyToken(token) });
}
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
  return res;
}
