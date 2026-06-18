import { getState, subscribe, addPresence, touchPresence, removePresence } from '@/lib/store';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stream em tempo real (SSE) — empurra o estado para todos os dispositivos ligados.
export async function GET(req: NextRequest) {
  // id estável por aba (sobrevive ao refresh) p/ contagem de "online agora"; fallback aleatório.
  const clientId = new URL(req.url).searchParams.get('cid') || crypto.randomUUID();
  const encoder = new TextEncoder();
  let unsub: () => void = () => {};
  let ping: ReturnType<typeof setInterval>;
  let closed = false;
  const cleanup = () => { if (closed) return; closed = true; clearInterval(ping); unsub(); removePresence(clientId); };
  const stream = new ReadableStream({
    start(controller) {
      const send = (s: unknown) => { try { controller.enqueue(encoder.encode('data: ' + JSON.stringify(s) + '\n\n')); } catch {} };
      send(getState());
      unsub = subscribe(send);
      addPresence(clientId);
      ping = setInterval(() => { touchPresence(clientId); try { controller.enqueue(encoder.encode(': ping\n\n')); } catch {} }, 15000);
    },
    cancel: cleanup,
  });
  // Abort do request é o sinal mais fiável de fecho/quebra da ligação no Next.
  req.signal.addEventListener('abort', cleanup);
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}
