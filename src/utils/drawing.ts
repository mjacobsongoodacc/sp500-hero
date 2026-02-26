import type { Candle, DrawParams, ViewInfo } from '../types';
import type { CityState } from './cityscape';
import { drawCityscape } from './cityscape';

export const CHART = {
  PAD_RIGHT: 72,
  PAD_TOP: 16,
  PAD_BOTTOM: 16,
  PAD_LEFT: 8,
  BASE_CANDLE_W: 8,
  BASE_GAP: 4,
  /** Candles with ≥ this fraction hidden behind the hero are strongly faded. */
  OBSCURE_THRESHOLD: 0.8,
  BG: '#0a0e17',
  UP: '#00e676',
  DOWN: '#ff1744',
  UP_WICK: '#00c853',
  DOWN_WICK: '#d50000',
  GRID: 'rgba(255,255,255,0.05)',
  GRID_TEXT: '#546e7a',
  PRICE_LINE: '#42a5f5',
} as const;

// ---------------------------------------------------------------------------
// Main draw entry point — called every animation frame
// ---------------------------------------------------------------------------

export function drawChart(
  ctx: CanvasRenderingContext2D,
  p: DrawParams,
  cityState?: CityState,
): ViewInfo | null {
  const cw = CHART.BASE_CANDLE_W * p.zoom;
  const gap = CHART.BASE_GAP * p.zoom;
  const step = cw + gap;

  const chartL = CHART.PAD_LEFT;
  const chartR = p.width - CHART.PAD_RIGHT;
  const chartT = CHART.PAD_TOP;
  const chartB = p.height - CHART.PAD_BOTTOM;
  const chartH = chartB - chartT;

  // Only completed candles — the hero represents the live/current candle.
  const completed = p.candles;

  // Background
  ctx.fillStyle = CHART.BG;
  ctx.fillRect(0, 0, p.width, p.height);

  // City skyline (between background and grid/candles) — scroll speed
  // matches the candle pace (one step per second) for a parallax feel.
  if (cityState) {
    drawCityscape(ctx, cityState, p.width, p.height, step);
  }

  // How many candles fit to the left of the hero
  const maxVis = Math.ceil((p.heroXCenter - chartL) / step) + 1;
  const start = Math.max(0, completed.length - maxVis);
  const vis = completed.slice(start);

  // Price range: include both visible candles AND current live price
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of vis) {
    if (c.low < lo) lo = c.low;
    if (c.high > hi) hi = c.high;
  }
  if (p.currentPrice > 0) {
    if (p.currentPrice < lo) lo = p.currentPrice;
    if (p.currentPrice > hi) hi = p.currentPrice;
  }
  if (!isFinite(lo) || !isFinite(hi)) {
    // No candles yet and no price — nothing to draw
    if (p.currentPrice <= 0) return null;
    lo = p.currentPrice - 1;
    hi = p.currentPrice + 1;
  }
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  lo -= pad;
  hi += pad;

  const priceToY = (price: number) =>
    chartT + (1 - (price - lo) / (hi - lo)) * chartH;

  // Grid
  drawGrid(ctx, lo, hi, chartL, chartR, chartT, chartB, priceToY);

  // Candles trail behind (to the left of) the hero.
  // Newest completed candle is 1 step to the left of heroXCenter.
  for (let i = 0; i < vis.length; i++) {
    const x = p.heroXCenter - (vis.length - i) * step;
    if (x + cw / 2 < chartL) continue;
    drawCandle(ctx, vis[i], x, cw, priceToY);
  }

  // Current-price line
  if (p.currentPrice > 0) {
    drawPriceLine(ctx, p.currentPrice, priceToY, chartL, chartR);
  }

  // Scale labels
  drawScale(ctx, lo, hi, chartR, chartT, chartB, priceToY);

  return { priceToY, priceMin: lo, priceMax: hi };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  lo: number,
  hi: number,
  chartL: number,
  chartR: number,
  chartT: number,
  chartB: number,
  priceToY: (p: number) => number,
) {
  const step = niceStep(hi - lo, 6);
  const first = Math.ceil(lo / step) * step;

  ctx.strokeStyle = CHART.GRID;
  ctx.lineWidth = 1;

  for (let price = first; price <= hi; price += step) {
    const y = Math.round(priceToY(price)) + 0.5;
    if (y < chartT || y > chartB) continue;
    ctx.beginPath();
    ctx.moveTo(chartL, y);
    ctx.lineTo(chartR, y);
    ctx.stroke();
  }
}

function drawScale(
  ctx: CanvasRenderingContext2D,
  lo: number,
  hi: number,
  chartR: number,
  chartT: number,
  chartB: number,
  priceToY: (p: number) => number,
) {
  const step = niceStep(hi - lo, 6);
  const first = Math.ceil(lo / step) * step;

  ctx.fillStyle = CHART.GRID_TEXT;
  ctx.font = '11px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  for (let price = first; price <= hi; price += step) {
    const y = priceToY(price);
    if (y > chartT + 10 && y < chartB - 10) {
      ctx.fillText(price.toFixed(2), chartR + 6, y);
    }
  }
}

function drawPriceLine(
  ctx: CanvasRenderingContext2D,
  price: number,
  priceToY: (p: number) => number,
  chartL: number,
  chartR: number,
) {
  const y = priceToY(price);

  ctx.strokeStyle = CHART.PRICE_LINE;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(chartL, y);
  ctx.lineTo(chartR, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label
  const lw = 64;
  const lh = 18;
  roundRect(ctx, chartR + 2, y - lh / 2, lw, lh, 3);
  ctx.fillStyle = CHART.PRICE_LINE;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px "JetBrains Mono",monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(price.toFixed(2), chartR + 7, y);
}

function drawCandle(
  ctx: CanvasRenderingContext2D,
  c: Candle,
  x: number,
  w: number,
  priceToY: (p: number) => number,
) {
  const up = c.close >= c.open;
  const bTop = priceToY(up ? c.close : c.open);
  const bBot = priceToY(up ? c.open : c.close);
  const wTop = priceToY(c.high);
  const wBot = priceToY(c.low);
  const bH = Math.max(1, bBot - bTop);

  // Wick
  ctx.strokeStyle = up ? CHART.UP_WICK : CHART.DOWN_WICK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, wTop);
  ctx.lineTo(x, wBot);
  ctx.stroke();

  // Body
  ctx.fillStyle = up ? CHART.UP : CHART.DOWN;
  ctx.fillRect(x - w / 2, bTop, w, bH);
}

function niceStep(range: number, target: number): number {
  const rough = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const r = rough / mag;
  if (r <= 1.5) return mag;
  if (r <= 3) return 2 * mag;
  if (r <= 7) return 5 * mag;
  return 10 * mag;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
