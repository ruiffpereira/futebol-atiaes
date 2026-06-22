'use client';
import { useEffect, useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'theme';
// Cor da topbar do browser/PWA — tem de igualar o fundo do header (var(--brand)):
// claro #15803d, escuro #22c55e. (Antes usava #16a34a no escuro e destoava do header.)
const TOPBAR = { light: '#15803d', dark: '#22c55e' };

// Default = Sistema (segue o dispositivo). A escolha do utilizador é guardada explicitamente.
export function getStoredMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function systemPrefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

// Aplica o modo: light/dark forçam o atributo; system remove-o (o @media decide).
export function applyMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  const dark = mode === 'dark' || (mode === 'system' && systemPrefersDark());
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? TOPBAR.dark : TOPBAR.light);
}

// Store partilhado: todos os consumidores de useTheme (topbar + Info) ficam em sincronia.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit() {
  listeners.forEach((cb) => cb());
}
export function setMode(m: ThemeMode) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, m);
  applyMode(m);
  emit();
}

// Hook do seletor: devolve o modo atual e um setter que persiste + aplica.
export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const mode = useSyncExternalStore(subscribe, getStoredMode, () => 'system' as ThemeMode);

  // Em "system", reage à mudança de tema do dispositivo (atualiza topbar/ícones).
  useEffect(() => {
    if (mode !== 'system' || typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  return [mode, setMode];
}

// Ordem do ciclo do botão da topbar: Claro → Escuro → Sistema → Claro…
export const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'system'];
export function nextMode(m: ThemeMode): ThemeMode {
  return THEME_CYCLE[(THEME_CYCLE.indexOf(m) + 1) % THEME_CYCLE.length];
}
