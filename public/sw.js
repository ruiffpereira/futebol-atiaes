// Service worker — recebe Web Push (site fechado) e mostra notificação + vibração.
self.addEventListener('push', (event) => {
  let data = { title: '⚽ Atiães em Movimento', body: 'Atualização do torneio' };
  try { if (event.data) data = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png?v=2',   // ícone grande (cor) no corpo da notificação
      badge: '/badge.png?v=2',     // ícone pequeno na barra de estado (Android usa só o alfa → silhueta)
      vibrate: [130, 60, 130],   // Android
      tag: 'torneio',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Handler 'fetch' mínimo: NÃO faz cache (deixa o browser tratar de tudo),
// apenas existe porque alguns navegadores exigem um fetch handler para
// considerarem a app instalável (PWA). Sem respondWith = sem alterar nada.
self.addEventListener('fetch', () => {});
