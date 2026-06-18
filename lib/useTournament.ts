'use client';
// Hook central: React Query (cache) + SSE (tempo real) + mutações.
// O servidor empurra o estado por SSE → fazemos setQueryData direto (instantâneo,
// sem refetch). Ao voltar ao separador, o React Query refaz a query na mesma.
import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TournamentState } from './types';
import { defaultState } from './tournament';

const KEY = ['tournament-state'];

async function fetchState(): Promise<TournamentState> {
  const r = await fetch('/api/state'); if (!r.ok) throw new Error('fetch'); return r.json();
}

export function useTournament() {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  const query = useQuery({ queryKey: KEY, queryFn: fetchState, placeholderData: defaultState() });

  // SSE: empurra o estado novo para a cache do React Query
  useEffect(() => {
    const es = new EventSource('/api/stream');
    es.onmessage = (e) => { try { qc.setQueryData(KEY, JSON.parse(e.data)); } catch {} };
    es.onerror = () => { /* o browser reconecta sozinho */ };
    esRef.current = es;
    return () => es.close();
  }, [qc]);

  // mutação otimista: aplica já localmente e envia para o servidor
  const mutation = useMutation({
    mutationFn: async (next: TournamentState) => {
      const r = await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      if (r.status === 401) throw new Error('unauthorized');
      if (!r.ok) throw new Error('save');
      return next;
    },
    onMutate: (next) => { qc.setQueryData(KEY, next); },
    onError: () => { qc.invalidateQueries({ queryKey: KEY }); },
  });

  const apply = (next: TournamentState | { error: string }) => {
    if ((next as { error?: string }).error) { alert((next as { error: string }).error); return; }
    mutation.mutate(next as TournamentState);
  };

  // a mostrar o placeholder = ainda não chegou o estado real do servidor
  const loading = query.isPlaceholderData && !query.isError;

  return { state: (query.data || defaultState()) as TournamentState, apply, loading, refetch: () => qc.invalidateQueries({ queryKey: KEY }) };
}
