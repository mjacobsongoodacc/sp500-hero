// ---------------------------------------------------------------------------
// Animated city skyline background — Gotham-style with parallax scrolling,
// fires, monsters, and military helicopters.
// ---------------------------------------------------------------------------

// --- Parallax rates (fraction of candle scroll speed) ---
const FAR_RATE = 0.3;
const NEAR_RATE = 0.7;
const TILE_MULT = 3; // tile width = viewport × this

// --- Types ---

interface Building {
  x: number;
  w: number;
  h: number;
  shade: string;
  edge: string;
  windows: { rx: number; ry: number; lit: boolean; seed: number }[];
  roof: number;
}

interface CityEvent {
  type: 'fire' | 'monster' | 'helicopter';
  x: number;
  y: number;
  start: number;
  dur: number;
  variant: number;
  bh: number;
}

export interface CityState {
  far: Building[];
  near: Building[];
  events: CityEvent[];
  lastSpawn: number;
  /** Cumulative scroll in pixels (increments each frame). */
  scroll: number;
  prevT: number;
  tileW: number;
  w: number;
  gY: number;
}

// --- Public API ---

export function createCityState(): CityState {
  return {
    far: [],
    near: [],
    events: [],
    lastSpawn: 0,
    scroll: 0,
    prevT: 0,
    tileW: 0,
    w: 0,
    gY: 0,
  };
}

/**
 * @param scrollSpeed  Pixels per second the chart scrolls (= candle step size).
 */
export function drawCityscape(
  ctx: CanvasRenderingContext2D,
  st: CityState,
  width: number,
  height: number,
  scrollSpeed: number,
) {
  const t = performance.now() / 1000;
  const gY = height;

  // (Re)generate on first call or viewport resize
  if (st.w === 0 || Math.abs(st.w - width) > 20 || Math.abs(st.gY - gY) > 20) {
    const tileW = width * TILE_MULT;
    buildCity(st, tileW, gY);
    st.w = width;
    st.gY = gY;
    st.tileW = tileW;
    st.prevT = t;
  }

  // Advance scroll
  const dt = t - st.prevT;
  st.prevT = t;
  st.scroll += scrollSpeed * dt;

  // Prune expired events early so they never reach render functions
  st.events = st.events.filter((e) => t - e.start < e.dur);

  const tW = st.tileW;
  const farOff = (st.scroll * FAR_RATE) % tW;
  const nearOff = (st.scroll * NEAR_RATE) % tW;

  // --- Far buildings (slow parallax) ---
  drawLayerPair(ctx, st.far, farOff, tW, gY, t, (b) => renderBuilding(ctx, b, gY, t));

  // --- Monsters (behind near buildings, same scroll as near layer) ---
  const monsters = st.events.filter((e) => e.type === 'monster');
  if (monsters.length) {
    drawLayerPair(ctx, monsters, nearOff, tW, gY, t, (e) =>
      renderMonster(ctx, e, t, gY),
    );
  }

  // --- Near buildings (faster parallax) ---
  drawLayerPair(ctx, st.near, nearOff, tW, gY, t, (b) => renderBuilding(ctx, b, gY, t));

  // --- Fire (attached to near-layer buildings) ---
  const fires = st.events.filter((e) => e.type === 'fire');
  if (fires.length) {
    drawLayerPair(ctx, fires, nearOff, tW, gY, t, (e) => renderFire(ctx, e, t));
  }

  // --- Helicopters fly in screen space (independent of scroll) ---
  for (const e of st.events) {
    if (e.type === 'helicopter') renderHelicopter(ctx, e, t, width);
  }

  // --- Spawn events ---
  if (st.events.length < 4 && t - st.lastSpawn > 4 + hash(t | 0) * 5) {
    spawn(st, t, gY);
    st.lastSpawn = t;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Draw an array of positioned items twice (original + shifted by tileW)
 * so the wrap seam is invisible.
 */
function drawLayerPair<T>(
  ctx: CanvasRenderingContext2D,
  items: T[],
  offset: number,
  tileW: number,
  _gY: number,
  _t: number,
  draw: (item: T) => void,
) {
  ctx.save();
  ctx.translate(-offset, 0);
  for (const item of items) draw(item);
  ctx.translate(tileW, 0);
  for (const item of items) draw(item);
  ctx.restore();
}

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function rgb(r: number, g: number, b: number): string {
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

// --- City generation (builds over tileW, not viewport width) ---

function buildCity(st: CityState, tileW: number, gY: number) {
  st.far = [];
  st.near = [];

  // Far layer
  let x = 0;
  while (x < tileW) {
    const bw = 22 + hash(x * 7.1) * 50;
    const bh = gY * (0.10 + hash(x * 13.3) * 0.20);
    st.far.push({
      x,
      w: bw,
      h: bh,
      shade: rgb(28 + hash(x * 3.7) * 12, 34 + hash(x * 5.3) * 14, 52 + hash(x * 9.1) * 18),
      edge: rgb(34 + hash(x * 2.1) * 10, 42 + hash(x * 4.1) * 12, 62 + hash(x * 8.1) * 16),
      windows: makeWindows(bw, bh, 0.35, x),
      roof: Math.floor(hash(x * 17.7) * 5),
    });
    x += bw + hash(x * 23.1) * 6;
  }

  // Near layer
  x = 0;
  while (x < tileW) {
    const bw = 30 + hash(x * 11.1 + 500) * 65;
    const bh = gY * (0.15 + hash(x * 19.3 + 500) * 0.40);
    st.near.push({
      x,
      w: bw,
      h: bh,
      shade: rgb(32 + hash(x * 7.7 + 500) * 14, 40 + hash(x * 11.3 + 500) * 16, 58 + hash(x * 13.7 + 500) * 20),
      edge: rgb(40 + hash(x * 2.7 + 500) * 12, 50 + hash(x * 4.7 + 500) * 14, 72 + hash(x * 8.7 + 500) * 18),
      windows: makeWindows(bw, bh, 0.55, x + 500),
      roof: Math.floor(hash(x * 29.1 + 500) * 5),
    });
    x += bw + 2 + hash(x * 31.7 + 500) * 10;
  }
}

function makeWindows(bw: number, bh: number, litChance: number, seed: number) {
  const out: Building['windows'] = [];
  const cols = Math.max(1, Math.floor(bw / 9));
  const rows = Math.max(1, Math.floor(bh / 14));
  const padX = (bw - cols * 4) / (cols + 1);
  const padY = (bh - rows * 5) / (rows + 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = seed + r * 100 + c * 7;
      out.push({
        rx: padX + c * (4 + padX),
        ry: padY + r * (5 + padY) + 8,
        lit: hash(s) < litChance,
        seed: hash(s + 33),
      });
    }
  }
  return out;
}

// --- Building rendering ---

function renderBuilding(ctx: CanvasRenderingContext2D, b: Building, gY: number, t: number) {
  const top = gY - b.h;

  ctx.fillStyle = b.shade;
  ctx.fillRect(b.x, top, b.w, b.h);

  ctx.fillStyle = b.edge;
  ctx.fillRect(b.x, top, 2, b.h);

  const cx = b.x + b.w / 2;
  switch (b.roof) {
    case 1:
      ctx.strokeStyle = '#3a5070';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx, top - 16);
      ctx.stroke();
      if (Math.sin(t * 2.5 + b.x * 0.1) > 0.2) {
        ctx.fillStyle = '#ff3030';
        ctx.beginPath();
        ctx.arc(cx, top - 16, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 2:
      ctx.fillStyle = b.edge;
      ctx.fillRect(cx - b.w * 0.15, top - 9, b.w * 0.3, 9);
      ctx.beginPath();
      ctx.arc(cx, top - 9, b.w * 0.15, Math.PI, 0);
      ctx.fill();
      break;
    case 3:
      ctx.fillStyle = b.shade;
      ctx.beginPath();
      ctx.moveTo(cx - b.w * 0.07, top);
      ctx.lineTo(cx, top - 20);
      ctx.lineTo(cx + b.w * 0.07, top);
      ctx.fill();
      break;
    case 4:
      ctx.fillStyle = b.edge;
      ctx.beginPath();
      ctx.arc(cx, top, b.w * 0.22, Math.PI, 0);
      ctx.fill();
      break;
  }

  for (const win of b.windows) {
    if (!win.lit) continue;
    const fl = 0.45 + 0.3 * Math.sin(t * (0.3 + win.seed * 0.5) + win.seed * 50);
    ctx.fillStyle = `rgba(255,220,90,${fl})`;
    ctx.fillRect(b.x + win.rx, top + win.ry, 4, 5);
  }
}

// --- Fire ---

function renderFire(ctx: CanvasRenderingContext2D, ev: CityEvent, t: number) {
  const age = t - ev.start;
  const fade = Math.max(0, age < 1 ? age : ev.dur - age < 2 ? (ev.dur - age) / 2 : 1);
  if (fade <= 0) return;

  const grd = ctx.createRadialGradient(ev.x, ev.y, 0, ev.x, ev.y, 50 * fade);
  grd.addColorStop(0, `rgba(255,120,20,${0.35 * fade})`);
  grd.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(ev.x - 45, ev.y - 55, 90, 65);

  for (let i = 0; i < 6; i++) {
    const ox = (i - 2.5) * 4;
    const sway = Math.sin(t * 3.5 + i * 1.3) * 5;
    const fh = (16 + Math.sin(t * 4.2 + i * 2) * 7) * fade;
    for (let j = 0; j < 5; j++) {
      const frac = j / 4;
      const fy = ev.y - frac * fh;
      const sz = (1 - frac) * 5 * fade;
      const g = (90 + (1 - frac) * 150) | 0;
      const a = (1 - frac * 0.4) * 0.85 * fade;
      ctx.fillStyle = `rgba(255,${g},${(frac * 25) | 0},${a})`;
      ctx.beginPath();
      ctx.ellipse(ev.x + ox + sway * frac, fy, sz, sz * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 3; i++) {
    const sa = (age * 0.4 + i * 1.8) % 4;
    const sy = ev.y - 28 - sa * 18;
    const sx = ev.x + Math.sin(t * 0.35 + i * 2) * 14;
    const sr = 5 + sa * 5;
    ctx.fillStyle = `rgba(90,90,100,${Math.max(0, 0.22 - sa * 0.05) * fade})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Monsters ---

function renderMonster(ctx: CanvasRenderingContext2D, ev: CityEvent, t: number, gY: number) {
  const progress = Math.min((t - ev.start) / ev.dur, 1);
  const rise = Math.max(0,
    progress < 0.15 ? progress / 0.15 : progress > 0.8 ? (1 - progress) / 0.2 : 1);
  if (rise <= 0) return;
  const sway = Math.sin(t * 0.6 + ev.variant) * 4;
  const x = ev.x + sway;
  const mh = ev.bh * 1.3 * rise;
  const v = ev.variant % 3;

  if (v === 0) {
    ctx.fillStyle = '#1a2a42';
    ctx.beginPath();
    ctx.moveTo(x - 22, gY);
    ctx.quadraticCurveTo(x - 30, gY - mh * 0.5, x - 16, gY - mh * 0.88);
    ctx.lineTo(x - 7, gY - mh);
    ctx.lineTo(x + 7, gY - mh);
    ctx.quadraticCurveTo(x + 30, gY - mh * 0.5, x + 22, gY);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const sy = gY - mh * (0.45 + i * 0.09);
      const sx = x - 16 + i * 5;
      ctx.beginPath();
      ctx.moveTo(sx - 3, sy + 2);
      ctx.lineTo(sx, sy - 10 * rise);
      ctx.lineTo(sx + 3, sy + 2);
      ctx.fill();
    }
    if (rise > 0.4) {
      const ea = (rise - 0.4) / 0.6;
      ctx.fillStyle = `rgba(255,60,60,${ea})`;
      ctx.beginPath();
      ctx.arc(x - 4, gY - mh + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 4, gY - mh + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,40,40,${ea * 0.35})`;
      ctx.beginPath();
      ctx.arc(x, gY - mh + 6, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (v === 1) {
    ctx.strokeStyle = '#1a2a42';
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const tx = ev.x + (i - 2) * 11;
      ctx.lineWidth = 5 - i * 0.4;
      ctx.beginPath();
      ctx.moveTo(tx, gY);
      const seg = 7;
      for (let s = 1; s <= seg; s++) {
        const f = s / seg;
        const ty = gY - mh * f;
        const tw = tx + Math.sin(t * 1.4 + i * 1.3 + s * 0.7) * (6 + f * 14);
        ctx.lineTo(tw, ty);
      }
      ctx.stroke();
    }
    if (rise > 0.5) {
      const ea = (rise - 0.5) * 2;
      ctx.fillStyle = `rgba(160,255,50,${ea * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(ev.x, gY - mh * 0.38, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(0,0,0,${ea})`;
      ctx.beginPath();
      ctx.ellipse(ev.x, gY - mh * 0.38, 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#1e2e48';
    ctx.fillRect(x - 17, gY - mh * 0.35, 9, mh * 0.35);
    ctx.fillRect(x + 8, gY - mh * 0.35, 9, mh * 0.35);
    ctx.fillRect(x - 15, gY - mh * 0.72, 30, mh * 0.4);
    ctx.fillRect(x - 9, gY - mh, 18, mh * 0.2);
    ctx.fillRect(x - 22, gY - mh * 0.72, 10, mh * 0.12);
    ctx.fillRect(x + 12, gY - mh * 0.72, 10, mh * 0.12);
    const armSwing = Math.sin(t * 0.8 + ev.variant) * 0.3;
    ctx.save();
    ctx.translate(x - 15, gY - mh * 0.66);
    ctx.rotate(-0.5 + armSwing);
    ctx.fillRect(-4, 0, 7, mh * 0.28);
    ctx.restore();
    ctx.save();
    ctx.translate(x + 15, gY - mh * 0.66);
    ctx.rotate(0.5 - armSwing);
    ctx.fillRect(-3, 0, 7, mh * 0.28);
    ctx.restore();
    if (rise > 0.3) {
      const ea = (rise - 0.3) / 0.7;
      ctx.fillStyle = `rgba(255,40,40,${ea * 0.9})`;
      ctx.fillRect(x - 6, gY - mh + mh * 0.06, 12, 3);
    }
  }
}

// --- Helicopter (screen-space, not scrolled) ---

function renderHelicopter(ctx: CanvasRenderingContext2D, ev: CityEvent, t: number, w: number) {
  const progress = (t - ev.start) / ev.dur;
  const dir = ev.variant % 2 === 0 ? 1 : -1;
  const x = dir > 0 ? -50 + (w + 100) * progress : w + 50 - (w + 100) * progress;
  const y = ev.y + Math.sin(t * 1.8 + ev.variant) * 5;

  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);

  ctx.fillStyle = 'rgba(255,255,200,0.06)';
  ctx.beginPath();
  ctx.moveTo(3, 8);
  ctx.lineTo(-22, 100);
  ctx.lineTo(28, 100);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2a4060';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 7, -0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(100,180,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(10, -1, 7, 5, -0.1, -Math.PI * 0.6, Math.PI * 0.15);
  ctx.fill();

  ctx.fillStyle = '#253a55';
  ctx.fillRect(-32, -2, 18, 4);
  ctx.beginPath();
  ctx.moveTo(-32, -2);
  ctx.lineTo(-36, -11);
  ctx.lineTo(-28, -2);
  ctx.fill();

  const tr = t * 25;
  ctx.strokeStyle = 'rgba(150,180,220,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-34, -11 + Math.sin(tr) * 5);
  ctx.lineTo(-34, -11 - Math.sin(tr) * 5);
  ctx.stroke();

  ctx.strokeStyle = '#2a4060';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 7);
  ctx.lineTo(-10, 11);
  ctx.lineTo(12, 11);
  ctx.lineTo(12, 7);
  ctx.stroke();

  const mr = t * 20;
  ctx.strokeStyle = 'rgba(170,200,240,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.cos(mr) * 24, -7 + Math.sin(mr) * 1.5);
  ctx.lineTo(-Math.cos(mr) * 24, -7 - Math.sin(mr) * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(Math.sin(mr) * 24, -7 + Math.cos(mr) * 1.5);
  ctx.lineTo(-Math.sin(mr) * 24, -7 - Math.cos(mr) * 1.5);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(160,190,230,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -7, 24, 0, Math.PI * 2);
  ctx.stroke();

  if (Math.sin(t * 5) > 0.3) {
    ctx.fillStyle = 'rgba(255,30,30,0.8)';
    ctx.beginPath();
    ctx.arc(18, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(30,255,30,0.45)';
  ctx.beginPath();
  ctx.arc(-14, -1, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- Event spawning ---

function spawn(st: CityState, t: number, gY: number) {
  const r = hash(t * 137.7);

  if (r < 0.35 && st.near.length > 0) {
    const bi = Math.floor(hash(t * 97.3) * st.near.length);
    const b = st.near[bi];
    st.events.push({
      type: 'fire',
      x: b.x + b.w * (0.25 + hash(t * 47.1) * 0.5),
      y: gY - b.h,
      start: t,
      dur: 8 + hash(t * 67.3) * 12,
      variant: 0,
      bh: b.h,
    });
  } else if (r < 0.6 && st.near.length > 0) {
    const bi = Math.floor(hash(t * 83.7) * st.near.length);
    const b = st.near[bi];
    st.events.push({
      type: 'monster',
      x: b.x + b.w / 2,
      y: gY,
      start: t,
      dur: 12 + hash(t * 53.1) * 10,
      variant: Math.floor(hash(t * 71.3) * 3),
      bh: b.h,
    });
  } else {
    st.events.push({
      type: 'helicopter',
      x: 0,
      y: gY * 0.10 + hash(t * 39.7) * gY * 0.25,
      start: t,
      dur: 10 + hash(t * 43.1) * 8,
      variant: Math.floor(hash(t * 61.7) * 4),
      bh: 0,
    });
  }
}
