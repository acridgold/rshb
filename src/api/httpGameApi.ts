import { GameError, type GameApi, type GameErrorCode, type Prize } from '../domain/types';

export interface HttpGameApiOptions {
  baseUrl: string;
  getToken: () => Promise<string>;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const KNOWN: GameErrorCode[] = ['DAILY_LIMIT', 'RATE_LIMIT', 'GAME_NOT_FOUND', 'GAME_EXPIRED', 'TOO_FAST'];
const toCode = (c?: string): GameErrorCode => KNOWN.find((k) => k === c) ?? 'UNKNOWN';

export function createHttpGameApi(o: HttpGameApiOptions): GameApi {
  const doFetch = o.fetchImpl ?? fetch.bind(globalThis);
  const startedAt = new Map<string, number>();

  async function call<T>(path: string, body: unknown, key?: string): Promise<T> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), o.timeoutMs ?? 8000);
    try {
      const res = await doFetch(`${o.baseUrl}/v1${path}`, {
        method: 'POST',
        signal: ctl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await o.getToken()}`,
          ...(key ? { 'Idempotency-Key': key } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { code?: string; nextAt?: string };
        throw new GameError(toCode(err.code), err.nextAt);
      }
      return (await res.json()) as T;
    } catch (e) {
      throw e instanceof GameError ? e : new GameError('NETWORK');
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async startGame() {
      const key = crypto.randomUUID(); // один ключ на оба запроса: повтор не создаст вторую игру
      let res: { gameId: string };
      try {
        res = await call('/games', {}, key);
      } catch (e) {
        if (!(e instanceof GameError) || e.code !== 'NETWORK') throw e;
        res = await call('/games', {}, key);
      }
      startedAt.set(res.gameId, performance.now());
      return res;
    },
    reveal(gameId) {
      const elapsedMs = Math.round(performance.now() - (startedAt.get(gameId) ?? performance.now()));
      return call<Prize>(`/games/${encodeURIComponent(gameId)}/reveal`, { elapsedMs });
    },
  };
}
