import { useState, useCallback, useEffect } from 'react';

export interface Position {
  shares: number;
  avgCost: number;
}

export interface TradeRecord {
  type: 'buy' | 'sell';
  symbol: string;
  shares: number;
  price: number;
  amount: number;
  timestamp: number;
}

interface TradingState {
  balance: number;
  positions: Record<string, Position>;
  trades: TradeRecord[];
}

const STORAGE_KEY = 'sp500hero_trading';
const STARTING_BALANCE = 10_000;

function emptyPosition(): Position {
  return { shares: 0, avgCost: 0 };
}

function loadState(): TradingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.balance === 'number') {
        // Migrate from old single-position format
        if (parsed.position && !parsed.positions) {
          const positions: Record<string, Position> = {};
          if (parsed.position.shares > 0) {
            positions['SPX'] = parsed.position;
          }
          return {
            balance: parsed.balance,
            positions,
            trades: (parsed.trades || []).map((t: TradeRecord) => ({
              ...t,
              symbol: t.symbol || 'SPX',
            })),
          };
        }
        if (parsed.positions) {
          return parsed;
        }
      }
    }
  } catch { /* start fresh */ }
  return {
    balance: STARTING_BALANCE,
    positions: {},
    trades: [],
  };
}

function saveState(state: TradingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useTrading() {
  const [state, setState] = useState<TradingState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const buy = useCallback((symbol: string, dollarAmount: number, currentPrice: number) => {
    if (dollarAmount <= 0 || currentPrice <= 0) return;

    setState((prev) => {
      if (dollarAmount > prev.balance) return prev;

      const pos = prev.positions[symbol] || emptyPosition();
      const sharesBought = dollarAmount / currentPrice;
      const oldCostBasis = pos.shares * pos.avgCost;
      const newShares = pos.shares + sharesBought;
      const newAvgCost = newShares > 0 ? (oldCostBasis + dollarAmount) / newShares : 0;

      const trade: TradeRecord = {
        type: 'buy',
        symbol,
        shares: sharesBought,
        price: currentPrice,
        amount: dollarAmount,
        timestamp: Date.now(),
      };

      return {
        balance: prev.balance - dollarAmount,
        positions: {
          ...prev.positions,
          [symbol]: { shares: newShares, avgCost: newAvgCost },
        },
        trades: [...prev.trades.slice(-49), trade],
      };
    });
  }, []);

  const sell = useCallback((symbol: string, dollarAmount: number, currentPrice: number) => {
    if (dollarAmount <= 0 || currentPrice <= 0) return;

    setState((prev) => {
      const pos = prev.positions[symbol] || emptyPosition();
      const sharesToSell = dollarAmount / currentPrice;
      if (sharesToSell > pos.shares + 0.0000001) return prev;

      const actualShares = Math.min(sharesToSell, pos.shares);
      const proceeds = actualShares * currentPrice;
      const remainingShares = pos.shares - actualShares;

      const trade: TradeRecord = {
        type: 'sell',
        symbol,
        shares: actualShares,
        price: currentPrice,
        amount: proceeds,
        timestamp: Date.now(),
      };

      const newPositions = { ...prev.positions };
      if (remainingShares < 0.0000001) {
        delete newPositions[symbol];
      } else {
        newPositions[symbol] = {
          shares: remainingShares,
          avgCost: pos.avgCost,
        };
      }

      return {
        balance: prev.balance + proceeds,
        positions: newPositions,
        trades: [...prev.trades.slice(-49), trade],
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      balance: STARTING_BALANCE,
      positions: {},
      trades: [],
    });
  }, []);

  return {
    balance: state.balance,
    positions: state.positions,
    trades: state.trades,
    buy,
    sell,
    reset,
  };
}
