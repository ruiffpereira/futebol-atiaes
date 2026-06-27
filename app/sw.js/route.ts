import { APP_VERSION } from '@/lib/version';

// Service worker servido dinamicamente: leva a APP_VERSION embutida, por isso o
// ficheiro muda a cada deploy → o Chrome deteta bytes diferentes e re-instala o
// SW. Cabeçalho no-cache garante que o browser nunca serve uma versão antiga.
export const dynamic = 'force-dynamic';

const SW = `// Service worker (v${APP_VERSION}) — Web Push (site fechado) + vibração.
const V = '${APP_VERSION}';

self.addEventListener('push', (event) => {
  let data = { title: '⚽ Atiães em Movimento', body: 'Atualização do torneio' };
  try { if (event.data) data = event.data.json(); } catch (e) {}
  var matchId = data.matchId || '';
  var url = matchId ? '/?match=' + matchId : '/';
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png?v=' + V,   // ícone grande (cor) no corpo da notificação
      badge: '/badge.png?v=' + V,     // ícone pequeno na barra de estado (silhueta)
      vibrate: [130, 60, 130],
      tag: 'torneio',
      renotify: true,
      data: { url: url, matchId: matchId },   // levado para o clique → abre a modal do jogo
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var d = event.notification.data || {};
  var matchId = d.matchId || '';
  var url = d.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // se já houver uma janela no placar (rota '/'), foca-a e diz-lhe que jogo abrir
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        var path = '/';
        try { path = new URL(c.url).pathname; } catch (e) {}
        if (path === '/' && 'focus' in c) {
          return c.focus().then(function () {
            if (matchId) { try { c.postMessage({ type: 'open-match', matchId: matchId }); } catch (e) {} }
          });
        }
      }
      // senão, abre uma nova janela já no jogo
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
`;

export function GET() {
  return new Response(SW, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
