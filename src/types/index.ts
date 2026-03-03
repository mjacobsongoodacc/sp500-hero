export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  status: ConnectionStatus;
}

export type ConnectionStatus = 'live' | 'waiting' | 'gateway_down' | 'error' | 'disconnected';

export interface LivePriceService {
  start(
    onTick: (price: number, timestamp: number) => void,
    onStatusChange?: (status: ConnectionStatus) => void,
  ): void;
  stop(): void;
  getStatus(): ConnectionStatus;
}

export interface ViewInfo {
  priceToY: (price: number) => number;
  priceMin: number;
  priceMax: number;
}

export interface DrawParams {
  candles: Candle[];
  currentCandle: Candle | null;
  width: number;
  height: number;
  zoom: number;
  heroXCenter: number;
  heroWidth: number;
  currentPrice: number;
}

export type CandleInterval = 15_000 | 30_000 | 60_000;

export const CANDLE_INTERVALS: { label: string; ms: CandleInterval }[] = [
  { label: '15s', ms: 15_000 },
  { label: '30s', ms: 30_000 },
  { label: '1m', ms: 60_000 },
];
