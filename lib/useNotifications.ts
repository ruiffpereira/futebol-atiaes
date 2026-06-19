'use client';
// Cliente de notificações: regista o service worker, pede permissão,
// subscreve Web Push (notificações com o site fechado) e vibra no Android.
import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function useNotifications() {
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof Notification !== 'undefined' && 'serviceWorker' in navigator);
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    setOn(true);
    // Re-sincroniza a subscrição com o servidor: quem já deu permissão fica
    // registado mesmo que o servidor tenha perdido as subscrições (auto-corrige).
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const keyRes = await fetch('/api/push').then((r) => r.json()).catch(() => ({ key: '' }));
          if (keyRes.key) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyRes.key) });
        }
        if (sub) await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      } catch (e) { console.error('Falha a re-sincronizar push:', e); }
    })();
  }, []);

  const enable = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Este dispositivo/navegador não suporta notificações push. No iPhone, adiciona primeiro o site ao ecrã principal (iOS 16.4 ou superior) e abre-o por esse ícone.');
        return;
      }
      // Web Push exige contexto seguro (HTTPS) ou localhost
      if (!window.isSecureContext) {
        alert('As notificações só funcionam num endereço seguro (https://…) ou em localhost. Estás a abrir o site por http, por isso o navegador bloqueia.');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Permissão de notificações recusada. Ativa-a nas definições do site/navegador e tenta de novo.');
        return;
      }
      try { (navigator as Navigator & { vibrate?: (p: number[]) => void }).vibrate?.([130, 60, 130]); } catch {}
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const keyRes = await fetch('/api/push').then((r) => r.json()).catch(() => ({ key: '' }));
      if (!keyRes.key) {
        alert('O servidor não tem as chaves de notificações (VAPID) configuradas. Avisa o organizador.');
        return;
      }
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyRes.key) });
      const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      if (!res.ok) {
        alert('Não foi possível registar a subscrição no servidor. Tenta novamente.');
        return;
      }
      setOn(true);
    } catch (e) {
      console.error(e);
      alert('Erro ao ativar as notificações: ' + (e instanceof Error ? e.message : 'desconhecido'));
    }
  }, []);

  return { on, supported, enable };
}
