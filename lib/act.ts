// Proxy de despacho de ações para o backoffice.
//
// Cada chamada (ex.: `act.addGoal(state, matchId, teamId, pid)`) corre a ação
// localmente (estado otimista, para a UI responder já) e devolve esse NOVO estado
// com metadados não-enumeráveis anexados: __act (nome da ação) e __args (argumentos
// sem o `state`). O `apply()` do useTournament deteta esses metadados e envia a AÇÃO
// para `/api/action`, onde é reaplicada sobre o estado MAIS RECENTE do servidor —
// em vez de gravar o estado inteiro do cliente. Isto evita "lost updates" quando há
// vários admins a mexer ao mesmo tempo (ex.: dois a marcar golos em jogos diferentes).
//
// Como os metadados são não-enumeráveis, não aparecem em JSON.stringify/Object.keys
// nem no `clone` (JSON) das ações seguintes, por isso não "contaminam" o estado.
import { actions } from './actions';

export const act = new Proxy(actions, {
  get(target, prop: string) {
    const fn = (target as unknown as Record<string, (...a: unknown[]) => unknown>)[prop];
    if (typeof fn !== 'function') return fn;
    return (...callArgs: unknown[]) => {
      const res = fn(...callArgs) as object;
      Object.defineProperty(res, '__act', { value: prop, enumerable: false, configurable: true });
      Object.defineProperty(res, '__args', { value: callArgs.slice(1), enumerable: false, configurable: true });
      return res;
    };
  },
}) as typeof actions;

// Extrai os metadados de ação de um resultado vindo do proxy `act` (ou null se for
// um estado "cru", sem metadados — esses seguem pelo /api/state como fallback).
export function actionOf(s: unknown): { type: string; args: unknown[] } | null {
  if (s && typeof s === 'object' && typeof (s as { __act?: unknown }).__act === 'string') {
    return { type: (s as { __act: string }).__act, args: (s as { __args?: unknown[] }).__args || [] };
  }
  return null;
}
