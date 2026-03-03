import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LiveApiPriceService } from '../services/PriceService';
import { useLivePrice } from '../hooks/useLivePrice';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { drawChart, CHART } from '../utils/drawing';
import { createCityState } from '../utils/cityscape';
import { isMarketOpen, getNextOpen, formatCountdown } from '../utils/marketHours';
import { Superhero } from './Superhero';
import { ZoomControls } from './ZoomControls';
import { StockSelector } from './StockSelector';
import { ConnectionOverlay } from './ConnectionOverlay';
import type { CandleInterval, TickerData } from '../types';
import { CANDLE_INTERVALS } from '../types';

const HERO_PX_W = 120;
const HERO_PX_H = 80;
const LERP_SPEED = 0.008;
const ANGLE_LERP = 0.006;
const MAX_ANGLE = 40;
const SLOPE_LOOKBACK_MS = 800;

interface Props {
  symbol: string;
  candleIntervalMs: CandleInterval;
  onSymbolChange: (symbol: string) => void;
  onCandleIntervalChange: (ms: CandleInterval) => void;
  onTickerUpdate?: (data: TickerData | null) => void;
  onPriceUpdate?: (price: number) => void;
  onGoSetup: () => void;
  onGoTroubleshoot: () => void;
  children?: ReactNode;
}

export function ChartPanel({
  symbol,
  candleIntervalMs,
  onSymbolChange,
  onCandleIntervalChange,
  onTickerUpdate,
  onPriceUpdate,
  onGoSetup,
  onGoTroubleshoot,
  children,
}: Props) {
  const service = useMemo(() => new LiveApiPriceService(symbol), [symbol]);
  const { candlesRef, currentCandleRef, priceRef, tickerData, connectionStatus } =
    useLivePrice(service, symbol, candleIntervalMs);

  const [marketOpen, setMarketOpen] = useState(() => isMarketOpen());

  useEffect(() => {
    const id = setInterval(() => {
      setMarketOpen(isMarketOpen());
      if (priceRef.current > 0) onPriceUpdate?.(priceRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [priceRef, onPriceUpdate]);

  useEffect(() => {
    const update: TickerData = tickerData
      ? { ...tickerData, status: connectionStatus }
      : { symbol, price: 0, change: 0, changePercent: 0, volume: '\u2014', status: connectionStatus };
    onTickerUpdate?.(update);
    if (tickerData && tickerData.price > 0) {
      onPriceUpdate?.(tickerData.price);
    }
  }, [tickerData, connectionStatus, onTickerUpdate, onPriceUpdate, symbol]);

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const heroYRef = useRef(-1);
  const heroAngleRef = useRef(0);
  const priceHistoryRef = useRef<{ price: number; time: number }[]>([]);
  const cityRef = useRef(createCityState());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = devicePixelRatio;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.trading-panel')) return;
      e.preventDefault();
      setZoom((z) => clamp(z * (1 - e.deltaY * 0.001), 0.3, 6));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = devicePixelRatio;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const heroXCenter = w - CHART.PAD_RIGHT - HERO_PX_W * 0.25;

    ctx.save();
    ctx.scale(dpr, dpr);

    const view = drawChart(
      ctx,
      {
        candles: candlesRef.current,
        currentCandle: currentCandleRef.current,
        width: w,
        height: h,
        zoom: zoomRef.current,
        heroXCenter,
        heroWidth: HERO_PX_W,
        currentPrice: priceRef.current,
      },
      cityRef.current,
    );

    const mOpen = isMarketOpen();
    if (!mOpen) {
      const next = getNextOpen();
      const remaining = next.getTime() - Date.now();
      ctx.fillStyle = 'rgba(10, 14, 23, 0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.fillText('MARKET CLOSED', w / 2, h / 2 - 24);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 28px "JetBrains Mono", monospace';
      ctx.fillText(formatCountdown(remaining), w / 2, h / 2 + 10);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText('until next open', w / 2, h / 2 + 38);
    }

    ctx.restore();

    if (view && priceRef.current > 0) {
      const target = view.priceToY(priceRef.current);
      if (heroYRef.current < 0) {
        heroYRef.current = target;
      } else {
        heroYRef.current += (target - heroYRef.current) * Math.min(1, dt * LERP_SPEED);
      }

      const now = performance.now();
      const hist = priceHistoryRef.current;
      hist.push({ price: priceRef.current, time: now });
      while (hist.length > 1 && now - hist[0].time > 2000) hist.shift();

      let pastPrice = hist[0].price;
      for (let i = hist.length - 1; i >= 0; i--) {
        if (now - hist[i].time >= SLOPE_LOOKBACK_MS) {
          pastPrice = hist[i].price;
          break;
        }
      }

      const pastY = view.priceToY(pastPrice);
      const curY = view.priceToY(priceRef.current);
      const dyPx = pastY - curY;
      const step = (CHART.BASE_CANDLE_W + CHART.BASE_GAP) * zoomRef.current;
      const dxPx = step * (SLOPE_LOOKBACK_MS / 1000);
      const rawAngle = Math.atan2(dyPx, dxPx) * (180 / Math.PI);
      const targetAngle = clamp(rawAngle, -MAX_ANGLE, MAX_ANGLE);

      heroAngleRef.current +=
        (targetAngle - heroAngleRef.current) * Math.min(1, dt * ANGLE_LERP);

      const top = heroYRef.current - HERO_PX_H / 2;
      const angle = heroAngleRef.current;
      hero.style.transform =
        `translate(${heroXCenter - HERO_PX_W / 2}px,${top}px) rotate(${-angle}deg)`;
      hero.style.opacity = '1';
    }
  });

  const zoomIn = useCallback(
    () => setZoom((z) => clamp(z * 1.35, 0.3, 6)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => clamp(z / 1.35, 0.3, 6)),
    [],
  );

  return (
    <div className="chart-panel">
      <div className="panel-toolbar">
        <StockSelector value={symbol} onChange={onSymbolChange} />
        <div className="candle-interval-btns">
          {CANDLE_INTERVALS.map((ci) => (
            <button
              key={ci.ms}
              className={`ci-btn ${ci.ms === candleIntervalMs ? 'active' : ''}`}
              onClick={() => onCandleIntervalChange(ci.ms)}
            >
              {ci.label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-chart-area" ref={areaRef}>
        <canvas ref={canvasRef} />
        <div
          ref={heroRef}
          className="superhero-wrapper"
          style={{ opacity: 0 }}
        >
          <div className={marketOpen ? 'superhero-bob' : 'superhero-bob paused'}>
            <Superhero />
          </div>
        </div>
        {children}
        <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} />
        <ConnectionOverlay
          status={connectionStatus}
          onSetup={onGoSetup}
          onTroubleshoot={onGoTroubleshoot}
        />
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
