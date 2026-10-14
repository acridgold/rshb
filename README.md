# Скретч-карта студента

Виджет мини-игры для получения промокодов партнёров банка. Стек: React 18, TypeScript, Vite, Framer Motion. Поставляется как веб-компонент `<agro-scratch-game>` (Shadow DOM).

## Команды

```bash
npm install
npm run dev            # демо-страница, http://localhost:5173
npm test               # модульные тесты
npm run build          # проверка типов и сборка демо
npm run build:element  # единый файл dist-element/agro-scratch-game.js
```

## Встраивание

```html
<agro-scratch-game id="game"></agro-scratch-game>
<script type="module">
  import './agro-scratch-game.js';
  const game = document.getElementById('game');
  game.api = createHttpGameApi({ baseUrl: 'https://api.example', getToken }); // либо mockGameApi
  game.addEventListener('agro-event', (e) => analytics.send(e.detail));
  game.addEventListener('agro-open-partner', (e) => { e.preventDefault(); host.openLink(e.detail.deepLink); });
</script>
```

Тема: переменные `--g900`, `--g700`, `--g500`, `--lime`, `--bg`, `--ink`, `--muted`, `--line` на элементе. Полный контракт: `docs/02-RFC-0001.md`, §16.

## Структура

| Путь | Назначение |
|---|---|
| `src/element.ts` | Веб-компонент, контракт встраивания |
| `src/ScratchGame.tsx` | Корневой компонент: автомат экранов, ошибки |
| `src/screens`, `src/components/ScratchCard.tsx` | Экраны и скретч-слой |
| `src/api/httpGameApi.ts` | Клиент серверного API (RFC-0001 §6) |
| `src/api/mockGameApi.ts` | Локальная реализация для демо и тестов |
| `src/domain` | Типы, веса уровней, партнёры, предложения |
| `docs/01-BRD.md`, `docs/02-RFC-0001.md` | Бизнес-требования и техническое решение |

Партнёры и ссылки в демо вымышленные. Бэкенд описан в RFC-0001.
