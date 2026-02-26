export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TickerData {
  price: number;
  change: number;
  changePercent: number;
  status: ConnectionStatus;
}

export type ConnectionStatus = 'live' | 'simulated' | 'disconnected';

export interface LivePriceService {
  start(onTick: (price: number, timestamp: number) => void): void;
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
