'use client';
import { useEffect } from 'react';

// Bloqueia o scroll do fundo enquanto um modal está aberto.
// Reference-counted: suporta modais empilhados (ex.: Info → Regulamento) — só bloqueia
// no primeiro lock e só restaura no último. Cada componente-modal chama useScrollLock()
// no topo; como o componente só está montado enquanto o modal está aberto, o lock
// acompanha automaticamente o ciclo abrir/fechar.
let locks = 0;
let saved: { bodyOverflow: string; htmlOverflow: string; bodyPadRight: string } | null = null;

function lock() {
  if (locks === 0 && typeof document !== 'undefined') {
    const body = document.body, html = document.documentElement;
    saved = { bodyOverflow: body.style.overflow, htmlOverflow: html.style.overflow, bodyPadRight: body.style.paddingRight };
    // Compensa a largura da scrollbar em desktop (em mobile a scrollbar é overlay → 0px).
    const sbw = window.innerWidth - html.clientWidth;
    if (sbw > 0) body.style.paddingRight = sbw + 'px';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';  // Android Chrome precisa do <html> para travar de forma fiável
  }
  locks++;
}

function unlock() {
  locks = Math.max(0, locks - 1);
  if (locks === 0 && saved && typeof document !== 'undefined') {
    document.body.style.overflow = saved.bodyOverflow;
    document.documentElement.style.overflow = saved.htmlOverflow;
    document.body.style.paddingRight = saved.bodyPadRight;
    saved = null;
  }
}

export function useScrollLock() {
  useEffect(() => {
    lock();
    return unlock;
  }, []);
}
