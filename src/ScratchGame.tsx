import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { GameProvider, type GameContextValue } from './context';
import { GameError, type GameApi, type GameEvent, type Prize } from './domain/types';
import { Launch } from './screens/Launch';
import { Play } from './screens/Play';
import { Reward } from './screens/Reward';

export interface ScratchGameProps {
  api: GameApi;
  onEvent?: (event: GameEvent) => void;
  onOpenPartner?: (prize: Prize) => void;
}

type Screen = 'launch' | 'play' | 'reward';

function messageFor(e: unknown): string {
  switch (e instanceof GameError ? e.code : 'UNKNOWN') {
    case 'DAILY_LIMIT': return 'Сегодняшняя карта уже сыграна. Следующая будет завтра.';
    case 'RATE_LIMIT': return 'Слишком много попыток. Подождите минуту.';
    case 'NETWORK': return 'Нет соединения. Проверьте сеть и попробуйте ещё раз.';
    case 'GAME_EXPIRED': return 'Карта устарела. Начните новую игру.';
    default: return 'Что-то пошло не так. Попробуйте ещё раз.';
  }
}

export function ScratchGame({ api, onEvent, onOpenPartner }: ScratchGameProps) {
  const [screen, setScreen] = useState<Screen>('launch');
  const [gameId, setGameId] = useState<string | null>(null);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const revealing = useRef(false);

  const cb = useRef({ onEvent, onOpenPartner });
  cb.current = { onEvent, onOpenPartner };
  const ctx = useMemo<GameContextValue>(
    () => ({
      track: (name, payload = {}) => cb.current.onEvent?.({ name, ts: Date.now(), payload }),
      openPartner: (p) =>
        cb.current.onOpenPartner
          ? cb.current.onOpenPartner(p)
          : void window.open(p.deepLink, '_blank', 'noopener,noreferrer'),
    }),
    [],
  );

  const start = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const game = await api.startGame();
      setGameId(game.gameId);
      setPrize(null);
      revealing.current = false;
      ctx.track('game_start', { gameId: game.gameId });
      setScreen('play');
    } catch (e) {
      setError(messageFor(e));
    } finally {
      setBusy(false);
    }
  }, [api, busy, ctx]);

  const reveal = useCallback(async () => {
    if (!gameId || revealing.current) return;
    revealing.current = true;
    ctx.track('scratch_threshold', { gameId });
    try {
      const p = await api.reveal(gameId);
      setPrize(p);
      ctx.track('prize_reveal', { gameId, tier: p.tier, partner: p.partner.id });
    } catch (e) {
      revealing.current = false;
      setError(messageFor(e));
    }
  }, [api, gameId, ctx]);

  const goReward = useCallback(() => setScreen('reward'), []);
  const restart = useCallback(() => {
    setScreen('launch');
    setPrize(null);
    setGameId(null);
  }, []);

  return (
    <GameProvider value={ctx}>
      <MotionConfig reducedMotion="user">
        <div className="agro">
          <header className="brand">
            <i aria-hidden="true">А</i>
            <span>РСХБ · Агро</span>
          </header>
          <AnimatePresence mode="wait">
            <motion.main
              key={screen}
              className="screen"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              {screen === 'launch' && <Launch onStart={start} busy={busy} />}
              {screen === 'play' && <Play prize={prize} onThreshold={reveal} onDone={goReward} />}
              {screen === 'reward' && prize && <Reward prize={prize} onRestart={restart} />}
              {error && <p className="error" role="alert">{error}</p>}
            </motion.main>
          </AnimatePresence>
          <footer className="legal">Реклама. Условия акции и срок действия кодов — в правилах в приложении.</footer>
        </div>
      </MotionConfig>
    </GameProvider>
  );
}
