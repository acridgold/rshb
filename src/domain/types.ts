export type Tier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC';

export interface Partner {
  id: string;
  name: string;
  category: string;
  codePrefix: string;
  url: string;
}

export interface Prize {
  tier: Tier;
  partner: Partner;
  title: string;
  code: string;
  expiresAt: string;
  deepLink: string;
}

/** Контракт между клиентом и сервером игры. Реализации: MockGameApi (демо), HttpGameApi (прод, см. RFC-0001 §6). */
export interface GameApi {
  startGame(): Promise<{ gameId: string }>;
  reveal(gameId: string): Promise<Prize>;
}

export type GameEventName =
  | 'game_open' | 'game_start' | 'scratch_threshold' | 'prize_reveal' | 'code_copy' | 'partner_click';

export interface GameEvent {
  name: GameEventName;
  ts: number;
  payload: Record<string, unknown>;
}

export type GameErrorCode =
  | 'DAILY_LIMIT' | 'RATE_LIMIT' | 'GAME_NOT_FOUND' | 'GAME_EXPIRED' | 'TOO_FAST' | 'NETWORK' | 'UNKNOWN';

export class GameError extends Error {
  constructor(readonly code: GameErrorCode, readonly nextAt?: string) {
    super(code);
  }
}
