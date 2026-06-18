import { getState, subscribe } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stream em tempo real (SSE) — empurra o estado para todos os dispositivos ligados.
export async function GET() {
  const encoder = new TextEncoder();
  let unsub: () => void = () => {};
  let ping: ReturnType<typeof setInterval>;
  const stream = new ReadableStream({
    start(controller) {
      const send = (s: unknown) => { try { controller.enqueue(encoder.encode('data: ' + JSON.stringify(s) + '\n\n')); } catch {} };
      send(getState());
      unsub = subscribe(send);
      ping = setInterval(() => { try { controller.enqueue(encoder.encode(': ping\n\n')); } catch {} }, 25000);
    },
    cancel() { clearInterval(ping); unsub(); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' } });
}
