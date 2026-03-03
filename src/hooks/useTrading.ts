import { useState, useCallback, useEffect } from 'react';

export interface Position {
  shares: number;
  avgCost: number;
}

export interface TradeRecord {
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  amount: number;
  timestamp: number;
}

interface TradingState {
  balance: number;
  position: Position;
  trades: TradeRecord[];
}

const STORAGE_KEY = 'sp500hero_trading';
const STARTING_BALANCE = 10_000;

function loadState(): TradingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.balance === 'number' && parsed.position) {
        return parsed;
      }
    }
  } catch { /* start fresh */ }
  return {
    balance: STARTING_BALANCE,
    position: { shares: 0, avgCost: 0 },
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

  const buy = useCallback((dollarAmount: number, currentPrice: number) => {
    if (dollarAmount <= 0 || currentPrice <= 0) return;

    setState((prev) => {
      if (dollarAmount > prev.balance) return prev;

      const sharesBought = dollarAmount / currentPrice;
      const oldCostBasis = prev.position.shares * prev.position.avgCost;
      const newShares = prev.position.shares + sharesBought;
      const newAvgCost = newShares > 0 ? (oldCostBasis + dollarAmount) / newShares : 0;

      const trade: TradeRecord = {
        type: 'buy',
        shares: sharesBought,
        price: currentPrice,
        amount: dollarAmount,
        timestamp: Date.now(),
      };

      return {
        balance: prev.balance - dollarAmount,
        position: { shares: newShares, avgCost: newAvgCost },
        trades: [...prev.trades.slice(-49), trade],
      };
    });
  }, []);

  const sell = useCallback((dollarAmount: number, currentPrice: number) => {
    if (dollarAmount <= 0 || currentPrice <= 0) return;

    setState((prev) => {
      const sharesToSell = dollarAmount / currentPrice;
      if (sharesToSell > prev.position.shares + 0.0000001) return prev;

      const actualShares = Math.min(sharesToSell, prev.position.shares);
      const proceeds = actualShares * currentPrice;
      const remainingShares = prev.position.shares - actualShares;

      const trade: TradeRecord = {
        type: 'sell',
        shares: actualShares,
        price: currentPrice,
        amount: proceeds,
        timestamp: Date.now(),
      };

      return {
        balance: prev.balance + proceeds,
        position: {
          shares: remainingShares < 0.0000001 ? 0 : remainingShares,
          avgCost: remainingShares < 0.0000001 ? 0 : prev.position.avgCost,
        },
        trades: [...prev.trades.slice(-49), trade],
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      balance: STARTING_BALANCE,
      position: { shares: 0, avgCost: 0 },
      trades: [],
    });
  }, []);

  return {
    balance: state.balance,
    position: state.position,
    trades: state.trades,
    buy,
    sell,
    reset,
  };
}
