import { createContext, useContext } from 'react';
import type { GameEventName, Prize } from './domain/types';

export interface GameContextValue {
  track(name: GameEventName, payload?: Record<string, unknown>): void;
  openPartner(prize: Prize): void;
}

const Ctx = createContext<GameContextValue>({ track() {}, openPartner() {} });
export const GameProvider = Ctx.Provider;
export const useGame = () => useContext(Ctx);
