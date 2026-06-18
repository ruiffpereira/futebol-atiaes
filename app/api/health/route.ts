import { NextResponse } from 'next/server';
// Healthcheck para o Coolify (HTTP 200).
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ ok: true, ts: Date.now() }); }
