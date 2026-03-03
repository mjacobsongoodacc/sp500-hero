import { memo } from 'react';
import type { ConnectionStatus, TickerData } from '../types';
import { isMarketOpen } from '../utils/marketHours';
import { findCompany } from '../data/sp500';

interface Props {
  panels: (TickerData | null)[];
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  live: 'LIVE',
  waiting: 'WAITING',
  gateway_down: 'NOT CONNECTED',
  error: 'ERROR',
  disconnected: 'DISCONNECTED',
};

export const PriceTicker = memo(function PriceTicker({ panels }: Props) {
  const open = isMarketOpen();

  if (panels.length === 0 || panels.every((p) => !p)) {
    return (
      <div className="price-ticker">
        <span className="ticker-label">S&P 500 Hero</span>
        <span className="ticker-price">&mdash;</span>
        <span className="ticker-status disconnected">connecting&hellip;</span>
      </div>
    );
  }

  return (
    <div className="price-ticker">
      {panels.map((data, i) => {
        if (!data) return null;
        const company = findCompany(data.symbol);
        const hasPrice = data.price > 0;
        const up = data.change >= 0;
        const arrow = up ? '\u25B2' : '\u25BC';
        const sign = up ? '+' : '';
        const changeClass = up ? 'up' : 'down';

        const statusKey = open ? data.status : 'closed';
        const statusLabel = open ? STATUS_LABELS[data.status] : 'CLOSED';

        return (
          <div key={i} className="ticker-segment">
            <span className="ticker-label">{data.symbol}</span>
            {company && <span className="ticker-company">{company.name}</span>}
            <span className="ticker-price">{hasPrice ? data.price.toFixed(2) : '\u2014'}</span>
            {hasPrice && <span className="ticker-vol">Vol {data.volume}</span>}
            {hasPrice && (
              <span className={`ticker-change ${changeClass}`}>
                {arrow} {sign}
                {data.change.toFixed(2)} ({sign}
                {data.changePercent.toFixed(3)}%)
              </span>
            )}
            <span className={`ticker-status ${statusKey}`}>
              <span className="status-dot" />
              {statusLabel}
            </span>
            {i < panels.length - 1 && panels[i + 1] && (
              <span className="ticker-divider">&vert;</span>
            )}
          </div>
        );
      })}
    </div>
  );
});
