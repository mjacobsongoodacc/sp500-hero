import type { ConnectionStatus, LivePriceService } from '../types';

const POLL_MS = 1000;

export class LiveApiPriceService implements LivePriceService {
  private pollId: ReturnType<typeof setInterval> | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusCallback: ((status: ConnectionStatus) => void) | null = null;
  private readonly apiUrl: string;

  constructor(private symbol: string = 'SPX') {
    this.apiUrl = symbol === 'SPX' ? '/api/sp500' : `/api/stock/${symbol}`;
  }

  start(
    onTick: (price: number, timestamp: number) => void,
    onStatusChange?: (status: ConnectionStatus) => void,
  ): void {
    this.statusCallback = onStatusChange ?? null;
    this.setStatus('waiting');

    const poll = async () => {
      try {
        const res = await fetch(this.apiUrl);

        if (!res.ok) {
          this.setStatus(res.status === 502 ? 'gateway_down' : 'error');
          return;
        }

        const data = await res.json();

        if (data.error) {
          this.setStatus('gateway_down');
          return;
        }

        const price: unknown = data.price;
        if (typeof price === 'number' && price > 0) {
          this.setStatus('live');
          onTick(price, Date.now());
          return;
        }

        this.setStatus('waiting');
      } catch {
        this.setStatus('error');
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
    this.setStatus('disconnected');
    this.statusCallback = null;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(s: ConnectionStatus): void {
    if (this.status !== s) {
      this.status = s;
      this.statusCallback?.(s);
    }
  }
}
