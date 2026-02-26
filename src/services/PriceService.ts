import type { ConnectionStatus, LivePriceService } from '../types';

// Vite middleware connects to IBKR TWS (localhost:7497) and streams
// real-time SPX index ticks. The /api/sp500 endpoint returns { price }.
const API_URL = '/api/sp500';
const POLL_MS = 1000;
const SUBTICK_MS = 100;
const MAX_FAILURES = 3;

/**
 * Polls the Vite middleware for live S&P 500 index data from IBKR TWS.
 * Emits sub-ticks at 10 Hz between polls so candles form smoothly.
 * Falls back to SimulatedPriceService after MAX_FAILURES consecutive errors.
 */
export class LiveApiPriceService implements LivePriceService {
  private pollId: ReturnType<typeof setInterval> | null = null;
  private subTickId: ReturnType<typeof setInterval> | null = null;
  private fallback: SimulatedPriceService | null = null;
  private status: ConnectionStatus = 'disconnected';
  private lastPrice = 0;
  private failures = 0;

  start(onTick: (price: number, timestamp: number) => void): void {
    this.status = 'live';

    // Sub-tick emitter: re-broadcasts the latest known price at 10 Hz
    // so the useLivePrice hook always has data for smooth 1-second candles.
    // Micro-jitter (±$0.03) keeps candles visually distinct even when the
    // API price is static between polls or outside market hours.
    this.subTickId = setInterval(() => {
      if (this.lastPrice > 0 && !this.fallback) {
        const jitter = (Math.random() - 0.5) * 0.06;
        onTick(this.lastPrice + jitter, Date.now());
      }
    }, SUBTICK_MS);

    const poll = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const price: unknown = data.price;
        if (typeof price === 'number' && price > 0) {
          this.lastPrice = price;
          this.failures = 0;
          if (this.fallback) {
            this.fallback.stop();
            this.fallback = null;
          }
          this.status = 'live';
          onTick(price, Date.now());
          return;
        }
        throw new Error('invalid payload');
      } catch {
        this.failures++;
        if (this.failures >= MAX_FAILURES && !this.fallback) {
          this.status = 'simulated';
          this.fallback = new SimulatedPriceService(this.lastPrice || undefined);
          this.fallback.start(onTick);
        }
      }
    };

    poll();
    this.pollId = setInterval(poll, POLL_MS);
  }

  stop(): void {
    if (this.pollId !== null) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
    if (this.subTickId !== null) {
      clearInterval(this.subTickId);
      this.subTickId = null;
    }
    if (this.fallback) {
      this.fallback.stop();
      this.fallback = null;
    }
    this.status = 'disconnected';
  }

  getStatus(): ConnectionStatus {
    return this.fallback ? this.fallback.getStatus() : this.status;
  }
}

/**
 * Generates realistic simulated SPY price data.
 * Used as a standalone fallback or as the automatic fallback inside
 * LiveApiPriceService when the network is unavailable.
 */
export class SimulatedPriceService implements LivePriceService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private price: number;
  private readonly volatility: number;

  constructor(startPrice = 5900, volatility = 0.12) {
    this.price = startPrice;
    this.volatility = volatility;
  }

  start(onTick: (price: number, timestamp: number) => void): void {
    const dt = 0.1;
    const drift = 0.000005;

    this.intervalId = setInterval(() => {
      const randomShock = (Math.random() - 0.5) * 2;
      const change =
        this.price *
        (drift * dt + this.volatility * Math.sqrt(dt) * randomShock * 0.01);
      this.price += change;
      onTick(this.price, Date.now());
    }, 100);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getStatus(): ConnectionStatus {
    return this.intervalId !== null ? 'simulated' : 'disconnected';
  }
}
