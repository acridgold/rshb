import { describe, expect, it, vi } from 'vitest';
import { createHttpGameApi } from '../src/api/httpGameApi';

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const make = (f: typeof fetch) =>
  createHttpGameApi({ baseUrl: 'https://x', getToken: async () => 't', fetchImpl: f });
const headers = (f: ReturnType<typeof vi.fn>, call: number) =>
  (f.mock.calls[call][1] as RequestInit).headers as Record<string, string>;

describe('httpGameApi', () => {
  it('передаёт токен и Idempotency-Key', async () => {
    const f = vi.fn().mockResolvedValue(reply(201, { gameId: 'g1' }));
    await make(f as unknown as typeof fetch).startGame();
    expect(headers(f, 0).Authorization).toBe('Bearer t');
    expect(headers(f, 0)['Idempotency-Key']).toBeTruthy();
  });
  it('409 превращается в DAILY_LIMIT', async () => {
    const f = vi.fn().mockResolvedValue(reply(409, { code: 'DAILY_LIMIT', nextAt: '2026-10-15T00:00:00+03:00' }));
    await expect(make(f as unknown as typeof fetch).startGame()).rejects.toMatchObject({ code: 'DAILY_LIMIT' });
  });
  it('при сетевой ошибке повторяет запрос с тем же ключом', async () => {
    const f = vi.fn().mockRejectedValueOnce(new TypeError('net')).mockResolvedValueOnce(reply(201, { gameId: 'g2' }));
    await make(f as unknown as typeof fetch).startGame();
    expect(headers(f, 0)['Idempotency-Key']).toBe(headers(f, 1)['Idempotency-Key']);
  });
});
