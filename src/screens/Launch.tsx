import { useEffect } from 'react';
import { useGame } from '../context';
import { PARTNERS } from '../domain/prizes';

interface Props {
  onStart: () => void;
  busy: boolean;
}

export function Launch({ onStart, busy }: Props) {
  const { track } = useGame();
  useEffect(() => track('game_open'), [track]);
  return (
    <section>
      <h1>Скретч-карта студента</h1>
      <p className="lead">Сотрите защитный слой и получите промокод партнёра банка. Приз выпадает в каждой игре.</p>
      <button className="btn primary" onClick={onStart} disabled={busy}>
        {busy ? 'Готовим карту…' : 'Играть'}
      </button>
      <p className="hint">Игра займёт меньше минуты. Одна карта в день.</p>
      <ul className="partners" aria-label="Партнёры акции">
        {Object.values(PARTNERS).map((p) => (
          <li key={p.id}>
            <b>{p.name}</b>
            <span>{p.category}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
