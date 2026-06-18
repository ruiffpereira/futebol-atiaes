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
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') setOn(true);
  }, []);

  const enable = useCallback(async () => {
    try {
      if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) { alert('Este dispositivo/navegador não suporta notificações. No iPhone, adiciona o site ao ecrã principal primeiro.'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      try { (navigator as Navigator & { vibrate?: (p: number[]) => void }).vibrate?.([130, 60, 130]); } catch {}
      const reg = await navigator.serviceWorker.register('/sw.js');
      const keyRes = await fetch('/api/push').then((r) => r.json()).catch(() => ({ key: '' }));
      if (keyRes.key) {
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyRes.key) });
        await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      }
      setOn(true);
    } catch (e) { console.error(e); }
  }, []);

  return { on, supported, enable };
}
