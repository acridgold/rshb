import { describe, expect, it } from 'vitest';
import { mockGameApi, pickTier } from '../src/api/mockGameApi';
import { OFFERS, TIERS } from '../src/domain/prizes';

describe('конфигурация призов', () => {
  it('веса уровней в сумме дают 1', () => {
    const sum = TIERS.reduce((s, t) => s + t.weight, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
  it('для каждого уровня есть хотя бы одно предложение', () => {
    for (const t of TIERS) expect(OFFERS[t.tier].length).toBeGreaterThan(0);
  });
});

describe('pickTier', () => {
  it('корректно обрабатывает границы', () => {
    expect(pickTier(0)).toBe('COMMON');
    expect(pickTier(0.549)).toBe('COMMON');
    expect(pickTier(0.55)).toBe('UNCOMMON');
    expect(pickTier(0.999999)).toBe('EPIC');
  });
});

describe('mockGameApi', () => {
  it('всегда выдаёт приз с кодом и ссылкой партнёра', async () => {
    const { gameId } = await mockGameApi.startGame();
    const prize = await mockGameApi.reveal(gameId);
    expect(prize.code).toMatch(/^[A-Z]{3}-[A-Z][A-Z2-9]{3}-[A-Z2-9]{4}$/);
    expect(prize.deepLink).toContain(encodeURIComponent(prize.code));
  });
  it('reveal идемпотентен', async () => {
    const { gameId } = await mockGameApi.startGame();
    const a = await mockGameApi.reveal(gameId);
    const b = await mockGameApi.reveal(gameId);
    expect(a.code).toBe(b.code);
  });
  it('неизвестная игра — ошибка', async () => {
    await expect(mockGameApi.reveal('nope')).rejects.toThrow('GAME_NOT_FOUND');
  });
});
