import { GameError } from '../domain/types';
import { OFFERS, PARTNERS, TIERS } from '../domain/prizes';
import type { GameApi, Prize, Tier } from '../domain/types';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без O/0, I/1
const TTL_DAYS = 14;
const games = new Map<string, Prize>();

function random(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 2 ** 32;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function pickTier(r: number): Tier {
  let acc = 0;
  for (const t of TIERS) {
    acc += t.weight;
    if (r < acc) return t.tier;
  }
  return TIERS[TIERS.length - 1].tier;
}

function makeCode(prefix: string, tier: Tier): string {
  const chunk = (n: number) =>
    Array.from({ length: n }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join('');
  return `${prefix}-${tier[0]}${chunk(3)}-${chunk(4)}`;
}

/** Серверная логика в миниатюре: исход определяется при создании игры, reveal идемпотентен. */
export const mockGameApi: GameApi = {
  async startGame() {
    await sleep(250);
    const tier = pickTier(random());
    const offers = OFFERS[tier];
    const offer = offers[Math.floor(random() * offers.length)];
    const partner = PARTNERS[offer.partnerId];
    const code = makeCode(partner.codePrefix, tier);
    const gameId = crypto.randomUUID();
    const params = new URLSearchParams({
      utm_source: 'rshb_agro',
      utm_medium: 'minigame',
      utm_campaign: 'scratch_2026',
      promo: code,
    });
    games.set(gameId, {
      tier,
      partner,
      title: offer.title,
      code,
      expiresAt: new Date(Date.now() + TTL_DAYS * 86_400_000).toISOString(),
      deepLink: `${partner.url}?${params.toString()}`,
    });
    return { gameId };
  },

  async reveal(gameId) {
    await sleep(60);
    const prize = games.get(gameId);
    if (!prize) throw new GameError('GAME_NOT_FOUND');
    return prize;
  },
};
