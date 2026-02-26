import { memo } from 'react';
import type { TickerData } from '../types';
import { isMarketOpen } from '../utils/marketHours';

interface Props {
  data: TickerData | null;
}

export const PriceTicker = memo(function PriceTicker({ data }: Props) {
  const open = isMarketOpen();

  if (!data) {
    return (
      <div className="price-ticker">
        <span className="ticker-label">S&P 500</span>
        <span className="ticker-price">—</span>
        <span className="ticker-status disconnected">connecting…</span>
      </div>
    );
  }

  const up = data.change >= 0;
  const arrow = up ? '▲' : '▼';
  const sign = up ? '+' : '';
  const changeClass = up ? 'up' : 'down';

  return (
    <div className="price-ticker">
      <span className="ticker-label">S&P 500</span>
      <span className="ticker-price">{data.price.toFixed(2)}</span>
      <span className={`ticker-change ${changeClass}`}>
        {arrow} {sign}
        {data.change.toFixed(2)} ({sign}
        {data.changePercent.toFixed(3)}%)
      </span>
      {open ? (
        <span className={`ticker-status ${data.status}`}>
          <span className="status-dot" />
          {data.status.toUpperCase()}
        </span>
      ) : (
        <span className="ticker-status closed">
          <span className="status-dot" />
          CLOSED
        </span>
      )}
    </div>
  );
});
