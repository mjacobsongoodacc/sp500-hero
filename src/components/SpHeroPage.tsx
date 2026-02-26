import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LiveApiPriceService } from '../services/PriceService';
import { useLivePrice } from '../hooks/useLivePrice';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { drawChart, CHART } from '../utils/drawing';
import { createCityState } from '../utils/cityscape';
import { isMarketOpen, getNextOpen, formatCountdown } from '../utils/marketHours';
import { Superhero } from './Superhero';
import { PriceTicker } from './PriceTicker';
import { ZoomControls } from './ZoomControls';

const HERO_PX_W = 120;
const HERO_PX_H = 80;
const LERP_SPEED = 0.008;
const ANGLE_LERP = 0.006;
const MAX_ANGLE = 40;
const SLOPE_LOOKBACK_MS = 800;

export function SpHeroPage() {
  // ---- data layer ----------------------------------------------------------
  const service = useMemo(() => new LiveApiPriceService(), []);
  const { candlesRef, currentCandleRef, priceRef, tickerData } =
    useLivePrice(service);

  // ---- market hours state ---------------------------------------------------
  const [marketOpen, setMarketOpen] = useState(() => isMarketOpen());

  useEffect(() => {
    const id = setInterval(() => setMarketOpen(isMarketOpen()), 1000);
    return () => clearInterval(id);
  }, []);

  // ---- zoom state ----------------------------------------------------------
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // ---- DOM refs ------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  // ---- animation state (not React state — stays in refs for perf) ----------
  const heroYRef = useRef(-1);
  const heroAngleRef = useRef(0);
  const priceHistoryRef = useRef<{ price: number; time: number }[]>([]);
  const cityRef = useRef(createCityState());

  // ---- canvas sizing (ResizeObserver) --------------------------------------
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

  // ---- mouse-wheel zoom ----------------------------------------------------
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clamp(z * (1 - e.deltaY * 0.001), 0.3, 6));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ---- animation loop (canvas draw + hero position) ------------------------
  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = devicePixelRatio;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    // Hero sits at the leading edge — right side of chart, just before the price scale
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

    // Market-closed overlay
    const marketOpen = isMarketOpen();
    if (!marketOpen) {
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

      // --- slope-based rotation ---
      // Record price with high-res timestamp for slope calculation
      const now = performance.now();
      const hist = priceHistoryRef.current;
      hist.push({ price: priceRef.current, time: now });

      // Trim to last 2 s
      while (hist.length > 1 && now - hist[0].time > 2000) hist.shift();

      // Find price from ~SLOPE_LOOKBACK_MS ago
      let pastPrice = hist[0].price;
      for (let i = hist.length - 1; i >= 0; i--) {
        if (now - hist[i].time >= SLOPE_LOOKBACK_MS) {
          pastPrice = hist[i].price;
          break;
        }
      }

      // Visual slope: how many screen-px the price moved vs horizontal chart px
      const pastY = view.priceToY(pastPrice);
      const curY = view.priceToY(priceRef.current);
      const dyPx = pastY - curY; // positive ⇒ price went up (screen Y decreased)
      const step = (CHART.BASE_CANDLE_W + CHART.BASE_GAP) * zoomRef.current;
      const dxPx = step * (SLOPE_LOOKBACK_MS / 1000); // horizontal px for the lookback period
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

  // ---- zoom handlers -------------------------------------------------------
  const zoomIn = useCallback(
    () => setZoom((z) => clamp(z * 1.35, 0.3, 6)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => clamp(z / 1.35, 0.3, 6)),
    [],
  );

  // ---- render --------------------------------------------------------------
  return (
    <div className="sp-hero-page">
      <header className="sp-header">
        <h1>S&P 500 Hero</h1>
        <span className="sp-subtitle">live price tracker</span>
      </header>

      <div className="chart-area" ref={areaRef}>
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
        <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} />
      </div>

      <PriceTicker data={tickerData} />
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
