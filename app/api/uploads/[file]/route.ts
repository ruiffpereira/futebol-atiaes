import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

// Serve imagens guardadas no volume /data. Nome sanitizado (evita path traversal).
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const name = params.file;
  if (!/^[A-Za-z0-9_-]+\.(webp|png|jpe?g)$/.test(name)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const ext = name.split('.').pop()!.toLowerCase();
  try {
    const buf = fs.readFileSync(path.join(UPLOADS_DIR, name));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
