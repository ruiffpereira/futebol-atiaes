// Modelo de dados do torneio (partilhado servidor + cliente)

export type Player = { id: string; name: string; gk?: boolean };

export type Team = {
  id: string;
  name: string;
  group: string;        // '' = sem grupo (só amigáveis)
  players: Player[];
  captain?: string;     // id do jogador capitão
  coach?: string;       // nome do treinador
};

export type Scorer = { id: string; team: string; player: string | null; own?: boolean; ts: number };
export type Card = { team: string; player: string | null; type: 'yellow' | 'red'; ts: number };

export type Phase = 'group' | 'friendly' | 'sf' | 'final' | 'third';
export type LivePhase = 'first' | 'half' | 'second';
export type Status = 'scheduled' | 'live' | 'done';

// origem automática de um lugar da fase final
export type Src =
  | { kind: 'group'; group: string; pos: number }
  | { kind: 'winner'; ref: 'sf1' | 'sf2' }
  | { kind: 'loser'; ref: 'sf1' | 'sf2' };

export type Match = {
  id: string;
  phase: Phase;
  slot?: number;
  group?: string;
  a: string | null;
  b: string | null;
  time?: string;        // "HH:MM" definido pela organização
  scorers: Scorer[];
  cards: Card[];
  status: Status;
  livePhase?: LivePhase;
  finishedAt?: number;
  penA?: number;
  penB?: number;
  srcA?: Src;           // só fase final
  srcB?: Src;
};

export type TournamentState = {
  tournamentName: string;
  subtitle: string;
  groups: string[];
  teams: Team[];
  matches: Match[];
  knockoutCreated: boolean;
  _notify?: boolean;    // false = alteração silenciosa (edição), não notifica
};
