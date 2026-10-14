import { useState, type CSSProperties } from 'react';
import { ScratchCard } from '../components/ScratchCard';
import type { Prize } from '../domain/types';

interface Props {
  prize: Prize | null;
  onThreshold: () => void;
  onDone: () => void;
}

export function Play({ prize, onThreshold, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const p = prize ? 1 : progress;
  const pct = Math.round(p * 100);

  return (
    <section>
      <h1>{prize ? 'Ваш приз' : 'Сотрите карту'}</h1>
      <p className="lead" role="status">
        {prize
          ? `${prize.partner.name}. Осталось забрать код.`
          : 'Проведите пальцем по полю. Приз уже ждёт под защитным слоем.'}
      </p>

      <ScratchCard revealed={prize !== null} onProgress={setProgress} onThreshold={onThreshold}>
        <div className="prize-face" data-tier={prize?.tier} style={{ '--p': p } as CSSProperties}>
          <div className="glow" aria-hidden="true" />
          {prize && (
            <div className="prize-copy">
              <span>{prize.partner.name}</span>
              <strong>{prize.title}</strong>
            </div>
          )}
        </div>
      </ScratchCard>

      <div className="meter" role="progressbar" aria-label="Стёрто" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <i style={{ width: `${pct}%` }} />
      </div>

      {prize ? (
        <button className="btn primary" onClick={onDone} autoFocus>
          Забрать промокод
        </button>
      ) : (
        <button className="btn ghost" onClick={onThreshold}>
          Открыть без стирания
        </button>
      )}
    </section>
  );
}
