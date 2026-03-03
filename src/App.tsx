import './App.css';
import { useState, useCallback, useRef } from 'react';
import { HomePage } from './components/HomePage';
import { SpHeroPage } from './components/SpHeroPage';
import { SetupGuide } from './components/SetupGuide';
import { TroubleshootGuide } from './components/TroubleshootGuide';

type View = 'home' | 'chart' | 'setup' | 'troubleshoot';

interface ChartConfig {
  symbol1: string;
  symbol2: string;
  split: boolean;
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [config, setConfig] = useState<ChartConfig>({
    symbol1: 'SPX',
    symbol2: 'AAPL',
    split: false,
  });

  const prevViewRef = useRef<View>('home');

  const goToStock = useCallback((symbol: string) => {
    setConfig({ symbol1: symbol, symbol2: 'AAPL', split: false });
    setView('chart');
  }, []);

  const goToSplit = useCallback((symbol1: string, symbol2: string) => {
    setConfig({ symbol1, symbol2, split: true });
    setView('chart');
  }, []);

  const goHome = useCallback(() => setView('home'), []);

  const goToSetup = useCallback(() => {
    prevViewRef.current = view === 'setup' || view === 'troubleshoot' ? prevViewRef.current : view;
    setView('setup');
  }, [view]);

  const goToTroubleshoot = useCallback(() => {
    prevViewRef.current = view === 'setup' || view === 'troubleshoot' ? prevViewRef.current : view;
    setView('troubleshoot');
  }, [view]);

  const goBack = useCallback(() => {
    setView(prevViewRef.current);
  }, []);

  if (view === 'setup') {
    return <SetupGuide onBack={goBack} />;
  }

  if (view === 'troubleshoot') {
    return <TroubleshootGuide onBack={goBack} onSetup={goToSetup} />;
  }

  if (view === 'home') {
    return <HomePage onViewStock={goToStock} onSplitView={goToSplit} />;
  }

  return (
    <SpHeroPage
      key={`${config.symbol1}-${config.symbol2}-${config.split}`}
      initialSymbol1={config.symbol1}
      initialSymbol2={config.symbol2}
      initialSplit={config.split}
      onGoHome={goHome}
      onGoSetup={goToSetup}
      onGoTroubleshoot={goToTroubleshoot}
    />
  );
}
