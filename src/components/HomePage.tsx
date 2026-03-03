import { useState, useCallback, useMemo, memo } from 'react';
import { SP500_COMPANIES, type SP500Company } from '../data/sp500';
import { getDailySnapshot, getDailySparkline, type DailySnapshot } from '../utils/stockSnapshot';

interface Props {
  onViewStock: (symbol: string) => void;
  onSplitView: (symbol1: string, symbol2: string) => void;
}

type FilterKey =
  | 'all'
  | 'gainers'
  | 'losers'
  | 'active'
  | 'az'
  | 'price_high'
  | 'price_low';

const FILTERS: { key: FilterKey; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '⊞' },
  { key: 'gainers', label: 'Top Gainers', icon: '▲' },
  { key: 'losers', label: 'Top Losers', icon: '▼' },
  { key: 'active', label: 'Most Active', icon: '⚡' },
  { key: 'az', label: 'A – Z', icon: 'Aa' },
  { key: 'price_high', label: 'Price: High', icon: '$↑' },
  { key: 'price_low', label: 'Price: Low', icon: '$↓' },
];

const snapshotCache = new Map<string, DailySnapshot>();
function getCachedSnapshot(symbol: string): DailySnapshot {
  let s = snapshotCache.get(symbol);
  if (!s) {
    s = getDailySnapshot(symbol);
    snapshotCache.set(symbol, s);
  }
  return s;
}

function applyFilter(
  companies: SP500Company[],
  filter: FilterKey,
): SP500Company[] {
  if (filter === 'all') return companies;
  if (filter === 'az') return [...companies].sort((a, b) => a.symbol.localeCompare(b.symbol));

  const withSnap = companies.map((c) => ({ c, s: getCachedSnapshot(c.symbol) }));

  switch (filter) {
    case 'gainers':
      return withSnap
        .filter((x) => x.s.changePercent > 0)
        .sort((a, b) => b.s.changePercent - a.s.changePercent)
        .map((x) => x.c);
    case 'losers':
      return withSnap
        .filter((x) => x.s.changePercent < 0)
        .sort((a, b) => a.s.changePercent - b.s.changePercent)
        .map((x) => x.c);
    case 'active':
      return withSnap
        .sort((a, b) => parseVol(b.s.volume) - parseVol(a.s.volume))
        .map((x) => x.c);
    case 'price_high':
      return withSnap
        .sort((a, b) => b.s.price - a.s.price)
        .map((x) => x.c);
    case 'price_low':
      return withSnap
        .sort((a, b) => a.s.price - b.s.price)
        .map((x) => x.c);
    default:
      return companies;
  }
}

function parseVol(v: string): number {
  const n = parseFloat(v);
  if (v.endsWith('M')) return n * 1_000_000;
  if (v.endsWith('K')) return n * 1_000;
  return n;
}

export function HomePage({ onViewStock, onSplitView }: Props) {
  const [search, setSearch] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const query = search.toLowerCase();

  const filtered = useMemo(() => {
    const searched = query
      ? SP500_COMPANIES.filter(
          (c) =>
            c.symbol.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query),
        )
      : SP500_COMPANIES;
    return applyFilter(searched, activeFilter);
  }, [query, activeFilter]);

  const toggleSelect = useCallback((symbol: string) => {
    setSelected((prev) => {
      if (prev.includes(symbol)) return prev.filter((s) => s !== symbol);
      if (prev.length >= 2) return prev;
      return [...prev, symbol];
    });
  }, []);

  const handleCardClick = useCallback(
    (symbol: string) => {
      if (selectMode) {
        toggleSelect(symbol);
      } else {
        onViewStock(symbol);
      }
    },
    [selectMode, toggleSelect, onViewStock],
  );

  const handleGo = useCallback(() => {
    if (selected.length === 2) {
      onSplitView(selected[0], selected[1]);
    }
  }, [selected, onSplitView]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelected([]);
  }, []);

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelected([]);
  }, []);

  return (
    <div className="home-page">
      <header className="sp-header home-header">
        <h1>S&P 500 Hero</h1>
        <span className="sp-subtitle">market overview</span>
        <div className="sp-header-actions">
          {selectMode ? (
            <button className="select-mode-btn active" onClick={exitSelectMode}>
              Cancel
            </button>
          ) : (
            <button className="select-mode-btn" onClick={enterSelectMode}>
              <svg viewBox="0 0 16 16" width={12} height={12} fill="currentColor">
                <path d="M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z" opacity="0.8" />
              </svg>
              Select
            </button>
          )}
        </div>
      </header>

      {selectMode && (
        <div className="select-hint-bar">
          <span className="select-hint-text">
            {selected.length === 0
              ? 'Tap two stocks to compare in split view'
              : selected.length === 1
                ? `${selected[0]} selected — pick one more`
                : `${selected[0]} vs ${selected[1]}`}
          </span>
          {selected.length === 2 && (
            <button className="go-btn" onClick={handleGo}>
              GO
              <svg viewBox="0 0 12 12" width={12} height={12} fill="currentColor">
                <path d="M4 2l5 4-5 4V2z" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="home-content">
        <div className="home-search-wrap">
          <div className="home-search-box">
            <svg className="home-search-icon" viewBox="0 0 16 16" width={14} height={14} fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 110-10 5 5 0 010 10z" />
            </svg>
            <input
              className="home-search-input"
              type="text"
              placeholder="Search by ticker or company name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="home-search-clear" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${activeFilter === f.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <span className="filter-chip-icon">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="stock-grid">
          {filtered.map((company) => (
            <StockCard
              key={company.symbol}
              company={company}
              selectMode={selectMode}
              isSelected={selected.includes(company.symbol)}
              onClick={() => handleCardClick(company.symbol)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="stock-grid-empty">No stocks match your search</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Stock Card --------------------------------------------------------- */

interface CardProps {
  company: SP500Company;
  selectMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const StockCard = memo(function StockCard({
  company,
  selectMode,
  isSelected,
  onClick,
}: CardProps) {
  const snap = useMemo(() => getCachedSnapshot(company.symbol), [company.symbol]);
  const sparkline = useMemo(() => getDailySparkline(company.symbol), [company.symbol]);
  const up = snap.change >= 0;

  return (
    <div
      className={`stock-card ${isSelected ? 'selected' : ''} ${selectMode ? 'select-mode' : ''}`}
      onClick={onClick}
    >
      {selectMode && (
        <div className={`card-check ${isSelected ? 'checked' : ''}`}>
          {isSelected && (
            <svg viewBox="0 0 12 12" width={10} height={10} fill="#fff">
              <path d="M10 3L4.5 8.5 2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      <div className="card-top-row">
        <span className="card-symbol">{company.symbol}</span>
        <span className={`card-change-badge ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {up ? '+' : ''}{snap.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="card-company-name">{company.name}</div>

      <div className="card-middle">
        <span className="card-price">${snap.price.toFixed(2)}</span>
        <MiniChart points={sparkline} up={up} />
      </div>

      <div className="card-detail-row">
        <span className={`card-change-amount ${up ? 'up' : 'down'}`}>
          {up ? '+' : ''}{snap.change.toFixed(2)}
        </span>
        <span className="card-volume">Vol {snap.volume}</span>
      </div>

      <div className="card-stats">
        <span>O {snap.open.toFixed(2)}</span>
        <span>H {snap.high.toFixed(2)}</span>
        <span>L {snap.low.toFixed(2)}</span>
      </div>
    </div>
  );
});

/* ---- Mini Chart (sparkline) --------------------------------------------- */

function MiniChart({ points, up }: { points: number[]; up: boolean }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 72;
  const h = 28;

  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 2 - ((p - min) / range) * (h - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const color = up ? '#00e676' : '#ff1744';

  return (
    <svg className="card-sparkline" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
