function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function getBasePrice(symbol: string): number {
  const hash = Math.abs(hashCode(symbol));
  if (symbol === 'SPX') return 5880;
  return 18 + (hash % 58000) / 100;
}

export interface DailySnapshot {
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  volume: string;
}

export function getDailySnapshot(symbol: string): DailySnapshot {
  const today = new Date().toISOString().slice(0, 10);
  const seed = hashCode(symbol + today);
  const rand = seededRandom(seed);

  const basePrice = getBasePrice(symbol);
  const changePct = (rand() - 0.5) * 7;
  const open = basePrice * (1 + (rand() - 0.5) * 0.005);
  const close = open * (1 + changePct / 100);
  const spread = Math.abs(close - open) || basePrice * 0.005;
  const high = Math.max(open, close) + rand() * spread * 0.4;
  const low = Math.min(open, close) - rand() * spread * 0.4;
  const change = close - open;

  const vol = Math.floor(800_000 + rand() * 60_000_000);
  const volume =
    vol >= 1_000_000
      ? `${(vol / 1_000_000).toFixed(1)}M`
      : `${(vol / 1_000).toFixed(0)}K`;

  return { price: close, open, high, low, change, changePercent: changePct, volume };
}

export function getDailySparkline(symbol: string): number[] {
  const today = new Date().toISOString().slice(0, 10);
  const seed = hashCode(symbol + today + 'spark');
  const rand = seededRandom(seed);
  const snap = getDailySnapshot(symbol);

  const pts: number[] = [snap.open];
  let p = snap.open;
  const drift = (snap.price - snap.open) / 20;

  for (let i = 1; i < 20; i++) {
    p += drift + (rand() - 0.5) * Math.max(Math.abs(snap.change) * 0.25, snap.open * 0.001);
    pts.push(p);
  }
  pts.push(snap.price);
  return pts;
}
