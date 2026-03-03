import { useCallback, useState, useRef } from 'react';
import { useTrading } from '../hooks/useTrading';
import { ChartPanel } from './ChartPanel';
import { TradingPanel } from './TradingPanel';
import { PriceTicker } from './PriceTicker';
import type { CandleInterval, TickerData } from '../types';

interface Props {
  initialSymbol1?: string;
  initialSymbol2?: string;
  initialSplit?: boolean;
  onGoHome: () => void;
  onGoSetup: () => void;
  onGoTroubleshoot: () => void;
}

export function SpHeroPage({
  initialSymbol1 = 'SPX',
  initialSymbol2 = 'AAPL',
  initialSplit = false,
  onGoHome,
  onGoSetup,
  onGoTroubleshoot,
}: Props) {
  const { balance, positions, trades, buy, sell, reset } = useTrading();

  const [splitView, setSplitView] = useState(initialSplit);
  const [symbol1, setSymbol1] = useState(initialSymbol1);
  const [symbol2, setSymbol2] = useState(initialSymbol2);
  const [interval1, setInterval1] = useState<CandleInterval>(15_000);
  const [interval2, setInterval2] = useState<CandleInterval>(15_000);

  const [ticker1, setTicker1] = useState<TickerData | null>(null);
  const [ticker2, setTicker2] = useState<TickerData | null>(null);

  const price1Ref = useRef(0);
  const price2Ref = useRef(0);
  const [price1State, setPrice1State] = useState(0);
  const [, setPrice2State] = useState(0);

  const handlePrice1 = useCallback((p: number) => {
    price1Ref.current = p;
    setPrice1State(p);
  }, []);
  const handlePrice2 = useCallback((p: number) => {
    price2Ref.current = p;
    setPrice2State(p);
  }, []);

  const handleTicker1 = useCallback((d: TickerData | null) => setTicker1(d), []);
  const handleTicker2 = useCallback((d: TickerData | null) => setTicker2(d), []);

  const toggleSplit = useCallback(() => {
    setSplitView((v) => !v);
  }, []);

  const panels = splitView ? [ticker1, ticker2] : [ticker1];

  return (
    <div className="sp-hero-page">
      <header className="sp-header">
        <button className="home-btn" onClick={onGoHome} title="Home">
          <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor">
            <path d="M8 1.4L1.5 7H4v6.5h3V10h2v3.5h3V7h2.5L8 1.4z" />
          </svg>
        </button>
        <h1>S&P 500 Hero</h1>
        <span className="sp-subtitle">live price tracker</span>
        <div className="sp-header-actions">
          <button
            className={`split-view-btn ${splitView ? 'active' : ''}`}
            onClick={toggleSplit}
            title={splitView ? 'Single view' : 'Split view'}
          >
            <svg viewBox="0 0 20 16" width={18} height={14}>
              <rect x="0.5" y="0.5" width="19" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
              {splitView ? (
                <line x1="10" y1="1" x2="10" y2="15" stroke="currentColor" strokeWidth="1" />
              ) : (
                <line x1="10" y1="1" x2="10" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              )}
            </svg>
            <span className="split-view-label">{splitView ? 'Split' : 'Single'}</span>
          </button>
        </div>
      </header>

      <div className={`charts-container ${splitView ? 'split' : 'single'}`}>
        <ChartPanel
          key={`panel1-${symbol1}`}
          symbol={symbol1}
          candleIntervalMs={interval1}
          onSymbolChange={setSymbol1}
          onCandleIntervalChange={setInterval1}
          onTickerUpdate={handleTicker1}
          onPriceUpdate={handlePrice1}
          onGoSetup={onGoSetup}
          onGoTroubleshoot={onGoTroubleshoot}
        >
          <TradingPanel
            balance={balance}
            positions={positions}
            trades={trades}
            activeSymbol={symbol1}
            currentPrice={price1State}
            onBuy={buy}
            onSell={sell}
            onReset={reset}
          />
        </ChartPanel>

        {splitView && (
          <ChartPanel
            key={`panel2-${symbol2}`}
            symbol={symbol2}
            candleIntervalMs={interval2}
            onSymbolChange={setSymbol2}
            onCandleIntervalChange={setInterval2}
            onTickerUpdate={handleTicker2}
            onPriceUpdate={handlePrice2}
            onGoSetup={onGoSetup}
            onGoTroubleshoot={onGoTroubleshoot}
          />
        )}
      </div>

      <PriceTicker panels={panels} />
    </div>
  );
}
