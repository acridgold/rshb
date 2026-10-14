import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ScratchGame } from './ScratchGame';
import styles from './styles.css?inline';
import type { GameApi, GameEvent, Prize } from './domain/types';

/**
 * Контракт встраивания:
 *  - свойство `api: GameApi` (обязательно);
 *  - событие `agro-event` (detail: GameEvent) — для аналитики хоста;
 *  - событие `agro-open-partner` (detail: Prize, cancelable) — preventDefault() передаёт переход хосту.
 */
export class AgroScratchGame extends HTMLElement {
  private root?: Root;
  private _api?: GameApi;

  get api(): GameApi | undefined {
    return this._api;
  }
  set api(value: GameApi | undefined) {
    this._api = value;
    this.render();
  }

  connectedCallback() {
    let mount = this.shadowRoot?.querySelector('.agro-mount') as HTMLElement | null;
    if (!mount) {
      const shadow = this.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = styles;
      mount = document.createElement('div');
      mount.className = 'agro-mount';
      shadow.append(style, mount);
    }
    this.root = createRoot(mount);
    this.render();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
  }

  private emit<T>(name: string, detail: T, cancelable = false): boolean {
    return this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true, cancelable }));
  }

  private render() {
    if (!this.root || !this._api) return;
    this.root.render(
      createElement(ScratchGame, {
        api: this._api,
        onEvent: (e: GameEvent) => void this.emit('agro-event', e),
        onOpenPartner: (p: Prize) => {
          if (this.emit('agro-open-partner', p, true)) window.open(p.deepLink, '_blank', 'noopener,noreferrer');
        },
      }),
    );
  }
}

export function defineAgroScratchGame(tag = 'agro-scratch-game') {
  if (!customElements.get(tag)) customElements.define(tag, AgroScratchGame);
}

defineAgroScratchGame();
