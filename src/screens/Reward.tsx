import { useState } from 'react';
import { useGame } from '../context';
import { copyText } from '../clipboard';
import { TIER_LABEL } from '../domain/prizes';
import type { Prize } from '../domain/types';

interface Props {
  prize: Prize;
  onRestart: () => void;
}

export function Reward({ prize, onRestart }: Props) {
  const { track, openPartner } = useGame();
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const expires = new Date(prize.expiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  async function onCopy() {
    const ok = await copyText(prize.code);
    setCopied(ok ? 'ok' : 'fail');
    if (ok) track('code_copy', { tier: prize.tier, partner: prize.partner.id });
    setTimeout(() => setCopied('idle'), 2200);
  }

  function onGo() {
    track('partner_click', { tier: prize.tier, partner: prize.partner.id });
    openPartner(prize);
  }

  return (
    <section>
      <span className="badge" data-tier={prize.tier}>
        {TIER_LABEL[prize.tier]}
      </span>
      <h1>{prize.title}</h1>
      <p className="lead">{prize.partner.name}. Код действует до {expires}.</p>

      <div className="code-row">
        <code aria-label="Промокод">{prize.code}</code>
        <button className="btn copy" onClick={onCopy}>
          {copied === 'ok' ? 'Скопировано' : 'Скопировать код'}
        </button>
      </div>
      <p className="hint" role="status">
        {copied === 'fail' ? 'Не удалось скопировать. Выделите код и скопируйте вручную.' : '\u00A0'}
      </p>

      <button className="btn primary" onClick={onGo}>
        Перейти к партнёру
      </button>
      <button className="btn ghost" onClick={onRestart}>
        Сыграть ещё раз (демо)
      </button>
    </section>
  );
}
