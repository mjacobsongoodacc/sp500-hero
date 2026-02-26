import { useEffect, useRef, useState } from 'react';
import type { Candle, LivePriceService, TickerData } from '../types';

const MAX_CANDLES = 8000;
const TICKER_THROTTLE_MS = 200;

export function useLivePrice(service: LivePriceService) {
  const candlesRef = useRef<Candle[]>([]);
  const currentCandleRef = useRef<Candle | null>(null);
  const priceRef = useRef(0);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);

  useEffect(() => {
    let lastTickerTs = 0;

    service.start((price, timestamp) => {
      priceRef.current = price;

      // Bucket into 1-second candles
      const second = Math.floor(timestamp / 1000) * 1000;
      const cur = currentCandleRef.current;

      if (!cur || cur.timestamp !== second) {
        if (cur) {
          candlesRef.current.push({ ...cur });
          if (candlesRef.current.length > MAX_CANDLES) {
            candlesRef.current = candlesRef.current.slice(-MAX_CANDLES / 2);
          }
        }
        currentCandleRef.current = {
          timestamp: second,
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

      // Throttled React state update for the bottom ticker
      if (timestamp - lastTickerTs >= TICKER_THROTTLE_MS) {
        lastTickerTs = timestamp;
        const prev = candlesRef.current[candlesRef.current.length - 1];
        const change = prev ? price - prev.close : 0;
        const changePercent = prev ? (change / prev.close) * 100 : 0;
        setTickerData({
          price,
          change,
          changePercent,
          status: service.getStatus(),
        });
      }
    });

    return () => service.stop();
  }, [service]);

  return { candlesRef, currentCandleRef, priceRef, tickerData };
}
