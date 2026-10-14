import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

interface Props {
  revealed: boolean;
  /** Доля пути до порога открытия, 0..1 (вызывается при изменении целого процента) */
  onProgress: (towardThreshold: number) => void;
  /** Вызывается один раз, когда стёрто достаточно */
  onThreshold: () => void;
  children: ReactNode;
}

const W = 340;
const H = 210;
const BRUSH = 22; // радиус кисти в логических пикселях
const THRESHOLD = 0.3; // доля площади, после которой карта открывается
const CELL = 10; // размер клетки сетки учёта покрытия
const COLS = W / CELL;
const ROWS = H / CELL;
const MAX_DPR = 2;

type Point = { x: number; y: number };

export function ScratchCard({ revealed, onProgress, onThreshold, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const last = useRef<Point | null>(null);
  const cells = useRef(new Uint8Array(COLS * ROWS));
  const covered = useRef(0);
  const lastPct = useRef(-1);
  const fired = useRef(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const foil = ctx.createLinearGradient(0, 0, W, H);
    foil.addColorStop(0, '#0c6b3a');
    foil.addColorStop(0.5, '#3f9b4f');
    foil.addColorStop(1, '#0c6b3a');
    ctx.fillStyle = foil;
    ctx.fillRect(0, 0, W, H);

    // Борозды пашни: слой выглядит как вспаханное поле.
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.lineWidth = 2;
    for (let y = -W; y < H; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y + W);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#eef6d2';
    ctx.font = '800 18px Manrope, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Сотрите слой', W / 2, H / 2 + 6);

    // Режим стирания и параметры кисти задаются один раз.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, []);

  /** Отмечает клетки сетки, попавшие под кисть в точке p. */
  function mark(p: Point) {
    const r = BRUSH * 0.85; // чуть меньше видимой кисти: прогресс не завышается
    const c0 = Math.max(0, Math.floor((p.x - r) / CELL));
    const c1 = Math.min(COLS - 1, Math.floor((p.x + r) / CELL));
    const r0 = Math.max(0, Math.floor((p.y - r) / CELL));
    const r1 = Math.min(ROWS - 1, Math.floor((p.y + r) / CELL));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const i = row * COLS + col;
        if (cells.current[i]) continue;
        const dx = (col + 0.5) * CELL - p.x;
        const dy = (row + 0.5) * CELL - p.y;
        if (dx * dx + dy * dy <= r * r) {
          cells.current[i] = 1;
          covered.current += 1;
        }
      }
    }
  }

  function dab(p: Point) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, BRUSH, 0, Math.PI * 2);
    ctx.fill();
    mark(p);
  }

  function segment(from: Point, to: Point) {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    // Клетки отмечаем вдоль всего отрезка, чтобы быстрый жест не оставлял пропусков в учёте.
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (BRUSH / 2)));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      mark({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
  }

  function report() {
    const progress = Math.min(1, covered.current / (COLS * ROWS) / THRESHOLD);
    const pct = Math.round(progress * 100);
    if (pct !== lastPct.current) {
      lastPct.current = pct;
      onProgress(progress);
    }
    if (!fired.current && progress >= 1) {
      fired.current = true;
      navigator.vibrate?.(15);
      onThreshold();
    }
  }

  function toPoint(clientX: number, clientY: number): Point {
    const rect = rectRef.current;
    if (!rect) return { x: 0, y: 0 };
    return { x: ((clientX - rect.left) * W) / rect.width, y: ((clientY - rect.top) * H) / rect.height };
  }

  function onDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (revealed) return;
    setTouched(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    rectRef.current = e.currentTarget.getBoundingClientRect(); // один замер на жест, без layout на каждое движение
    const p = toPoint(e.clientX, e.clientY);
    last.current = p;
    dab(p);
    report();
  }

  function onMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!last.current || revealed) return;
    // Браузер объединяет частые события касания; берём все промежуточные точки для гладкой линии.
    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const events = coalesced.length > 0 ? coalesced : [e.nativeEvent];
    for (const ev of events) {
      const p = toPoint(ev.clientX, ev.clientY);
      segment(last.current, p);
      last.current = p;
    }
    report();
  }

  function onEnd() {
    last.current = null;
  }

  return (
    <div className="scratch" style={{ aspectRatio: `${W} / ${H}` }}>
      {children}
      <canvas
        ref={canvasRef}
        className={revealed ? 'foil is-open' : 'foil'}
        aria-hidden="true"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
      />
      {!touched && !revealed && (
        <div className="swipe-hint" aria-hidden="true">
          <span />
        </div>
      )}
    </div>
  );
}
