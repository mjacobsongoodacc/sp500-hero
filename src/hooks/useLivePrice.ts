import { useEffect, useRef, useState } from 'react';
import type { Candle, CandleInterval, ConnectionStatus, LivePriceService, TickerData } from '../types';

const MAX_CANDLES = 8000;
const TICKER_THROTTLE_MS = 200;

function symbolHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

export function useLivePrice(
  service: LivePriceService,
  symbol: string,
  candleIntervalMs: CandleInterval = 15_000,
) {
  const candlesRef = useRef<Candle[]>([]);
  const currentCandleRef = useRef<Candle | null>(null);
  const priceRef = useRef(0);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const intervalRef = useRef(candleIntervalMs);

  useEffect(() => {
    if (intervalRef.current !== candleIntervalMs) {
      intervalRef.current = candleIntervalMs;
      candlesRef.current = [];
      currentCandleRef.current = null;
    }
  }, [candleIntervalMs]);

  useEffect(() => {
    let lastTickerTs = 0;
    let tickCount = 0;
    const volPerTick = 80 + (symbolHash(symbol) % 4000);

    service.start(
      (price, timestamp) => {
        priceRef.current = price;
        tickCount++;

        const interval = intervalRef.current;
        const bucket = Math.floor(timestamp / interval) * interval;
        const cur = currentCandleRef.current;

        if (!cur || cur.timestamp !== bucket) {
          if (cur) {
            candlesRef.current.push({ ...cur });
            if (candlesRef.current.length > MAX_CANDLES) {
              candlesRef.current = candlesRef.current.slice(-MAX_CANDLES / 2);
            }
          }
          currentCandleRef.current = {
            timestamp: bucket,
            open: price,
            high: price,
            low: price,
            close: price,
          };
        } else {
          cur.high = Math.max(cur.high, price);
          cur.low = Math.min(cur.low, price);
          cur.close = price;
        }

        if (timestamp - lastTickerTs >= TICKER_THROTTLE_MS) {
          lastTickerTs = timestamp;
          const prev = candlesRef.current[candlesRef.current.length - 1];
          const change = prev ? price - prev.close : 0;
          const changePercent = prev ? (change / prev.close) * 100 : 0;
          const rawVol = tickCount * volPerTick;
          setTickerData({
            symbol,
            price,
            change,
            changePercent,
            volume: formatVolume(rawVol),
            status: service.getStatus(),
          });
        }
      },
      (status) => {
        setConnectionStatus(status);
      },
    );

    return () => service.stop();
  }, [service, symbol]);

  return { candlesRef, currentCandleRef, priceRef, tickerData, connectionStatus };
}
