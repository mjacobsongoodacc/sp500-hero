import { memo, useState, useCallback } from 'react';
import type { Position, TradeRecord } from '../hooks/useTrading';
import { findCompany } from '../data/sp500';

interface Props {
  balance: number;
  positions: Record<string, Position>;
  trades: TradeRecord[];
  activeSymbol: string;
  currentPrice: number;
  onBuy: (symbol: string, amount: number, price: number) => void;
  onSell: (symbol: string, amount: number, price: number) => void;
  onReset: () => void;
}

const PRESETS = [100, 500, 1000, 2500];

export const TradingPanel = memo(function TradingPanel({
  balance,
  positions,
  trades,
  activeSymbol,
  currentPrice,
  onBuy,
  onSell,
  onReset,
}: Props) {
  const [buyAmount, setBuyAmount] = useState('1000');
  const [sellAmount, setSellAmount] = useState('1000');
  const [tab, setTab] = useState<'trade' | 'history'>('trade');
  const [collapsed, setCollapsed] = useState(false);

  const position = positions[activeSymbol] || { shares: 0, avgCost: 0 };
  const positionValue = position.shares * currentPrice;
  const costBasis = position.shares * position.avgCost;
  const unrealizedPnL = positionValue - costBasis;
  const pnlPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

  const allPositionEntries = Object.entries(positions).filter(
    ([, p]) => p.shares > 0.0000001,
  );
  const totalPositionValue = allPositionEntries.reduce(
    (sum, [, p]) => sum + p.shares * p.avgCost,
    0,
  );
  const totalEquity = balance + totalPositionValue;

  const handleBuy = useCallback(() => {
    const amt = parseFloat(buyAmount);
    if (!isNaN(amt) && amt > 0 && currentPrice > 0) {
      onBuy(activeSymbol, amt, currentPrice);
    }
  }, [buyAmount, currentPrice, onBuy, activeSymbol]);

  const handleSell = useCallback(() => {
    const amt = parseFloat(sellAmount);
    if (!isNaN(amt) && amt > 0 && currentPrice > 0) {
      onSell(activeSymbol, amt, currentPrice);
    }
  }, [sellAmount, currentPrice, onSell, activeSymbol]);

  const maxSellValue = position.shares * currentPrice;

  if (collapsed) {
    return (
      <div className="trading-panel tp-collapsed">
        <div className="tp-collapsed-bar" onClick={() => setCollapsed(false)}>
          <span className="tp-title">TRADING</span>
          <span className="tp-collapsed-balance">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="tp-collapsed-symbol">{activeSymbol}</span>
          <span className="tp-expand-icon" title="Expand panel">▾</span>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-panel">
      <div className="tp-header">
        <span className="tp-title">TRADING</span>
        <div className="tp-header-btns">
          <button
            className="tp-collapse-btn"
            onClick={() => setCollapsed(true)}
            title="Collapse panel"
          >
            ▴
          </button>
          <button className="tp-reset" onClick={onReset} title="Reset account to $10,000">
            ↺
          </button>
        </div>
      </div>

      <div className="tp-section">
        <div className="tp-label">ACCOUNT BALANCE</div>
        <div className="tp-balance">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className="tp-equity-row">
          <span className="tp-sublabel">Total Equity</span>
          <span className="tp-subvalue">${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="tp-section">
        <div className="tp-label">POSITIONS</div>
        {allPositionEntries.length === 0 ? (
          <div className="tp-no-position">No open positions</div>
        ) : (
          <div className="tp-positions-list">
            {allPositionEntries.map(([sym, pos]) => {
              const company = findCompany(sym);
              const val = pos.shares * pos.avgCost;
              const isActive = sym === activeSymbol;
              return (
                <div key={sym} className={`tp-position-item ${isActive ? 'active' : ''}`}>
                  <div className="tp-pos-symbol-row">
                    <span className="tp-pos-symbol">{sym}</span>
                    {company && <span className="tp-pos-name">{company.name}</span>}
                  </div>
                  <div className="tp-pos-row">
                    <span className="tp-sublabel">Shares</span>
                    <span className="tp-subvalue">{pos.shares.toFixed(4)}</span>
                  </div>
                  <div className="tp-pos-row">
                    <span className="tp-sublabel">Avg Cost</span>
                    <span className="tp-subvalue">${pos.avgCost.toFixed(2)}</span>
                  </div>
                  <div className="tp-pos-row">
                    <span className="tp-sublabel">Value</span>
                    <span className="tp-subvalue">${val.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {position.shares > 0 && (
        <div className="tp-section">
          <div className="tp-label">{activeSymbol} P&L</div>
          <div className="tp-pos-row">
            <span className="tp-sublabel">Mkt Value</span>
            <span className="tp-subvalue">${positionValue.toFixed(2)}</span>
          </div>
          <div className="tp-pos-row">
            <span className="tp-sublabel">P&L</span>
            <span className={`tp-pnl ${unrealizedPnL >= 0 ? 'profit' : 'loss'}`}>
              {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}

      <div className="tp-tabs">
        <button
          className={`tp-tab ${tab === 'trade' ? 'active' : ''}`}
          onClick={() => setTab('trade')}
        >
          Trade
        </button>
        <button
          className={`tp-tab ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>

      {tab === 'trade' ? (
        <div className="tp-trade-section">
          <div className="tp-active-symbol-badge">{activeSymbol}</div>
          <div className="tp-trade-group">
            <div className="tp-input-row">
              <span className="tp-input-label">BUY $</span>
              <input
                type="number"
                className="tp-input"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min="0"
                step="100"
              />
            </div>
            <div className="tp-presets">
              {PRESETS.map((p) => (
                <button key={p} className="tp-preset" onClick={() => setBuyAmount(String(p))}>
                  ${p.toLocaleString()}
                </button>
              ))}
              <button className="tp-preset tp-preset-max" onClick={() => setBuyAmount(balance.toFixed(2))}>
                MAX
              </button>
            </div>
            <button
              className="tp-btn tp-btn-buy"
              onClick={handleBuy}
              disabled={!currentPrice || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > balance}
            >
              BUY
            </button>
          </div>

          <div className="tp-trade-group">
            <div className="tp-input-row">
              <span className="tp-input-label">SELL $</span>
              <input
                type="number"
                className="tp-input"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                min="0"
                step="100"
              />
            </div>
            <div className="tp-presets">
              {PRESETS.map((p) => (
                <button key={p} className="tp-preset" onClick={() => setSellAmount(String(p))}>
                  ${p.toLocaleString()}
                </button>
              ))}
              <button
                className="tp-preset tp-preset-max"
                onClick={() => setSellAmount(maxSellValue.toFixed(2))}
              >
                MAX
              </button>
            </div>
            <button
              className="tp-btn tp-btn-sell"
              onClick={handleSell}
              disabled={!currentPrice || position.shares <= 0 || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > maxSellValue + 0.01}
            >
              SELL
            </button>
          </div>
        </div>
      ) : (
        <div className="tp-history">
          {trades.length === 0 ? (
            <div className="tp-no-position">No trades yet</div>
          ) : (
            <div className="tp-trades-list">
              {[...trades].reverse().map((t, i) => (
                <div key={i} className={`tp-trade-item ${t.type}`}>
                  <span className="tp-trade-type">{t.type.toUpperCase()}</span>
                  <span className="tp-trade-symbol">{t.symbol}</span>
                  <span className="tp-trade-detail">
                    {t.shares.toFixed(4)} @ ${t.price.toFixed(2)}
                  </span>
                  <span className="tp-trade-amount">
                    ${t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
