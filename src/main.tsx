import './element';
import { mockGameApi } from './api/mockGameApi';
import type { AgroScratchGame } from './element';

const el = document.querySelector<AgroScratchGame>('agro-scratch-game')!;
el.api = mockGameApi; // в продукте: createHttpGameApi({ baseUrl, getToken })
el.addEventListener('agro-event', (e) => console.debug('[analytics]', (e as CustomEvent).detail));
