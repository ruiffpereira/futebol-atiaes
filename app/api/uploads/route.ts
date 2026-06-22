import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/auth';
import { uid } from '@/lib/tournament';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const MAX_BYTES = 600 * 1024; // ~600KB (a imagem já vem reduzida do cliente)

// Upload de imagem (logo de equipa) — SÓ admin. Guarda no volume /data e devolve o URL.
export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get('admin_token')?.value)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'Ficheiro inválido' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'Imagem demasiado grande' }, { status: 413 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${uid()}.webp`;
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, name), buf);
  } catch (e) {
    console.error('Erro a guardar upload:', e);
    return NextResponse.json({ ok: false, error: 'Erro a guardar' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, url: `/api/uploads/${name}` });
}
