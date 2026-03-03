import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { SP500_COMPANIES, findCompany } from '../data/sp500';

interface Props {
  value: string;
  onChange: (symbol: string) => void;
}

export const StockSelector = memo(function StockSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const company = findCompany(value);
  const query = search.toLowerCase();

  const filtered = query
    ? SP500_COMPANIES.filter(
        (c) =>
          c.symbol.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query),
      )
    : SP500_COMPANIES;

  const handleOpen = useCallback(() => {
    setOpen(true);
    setSearch('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleSelect = useCallback(
    (symbol: string) => {
      onChange(symbol);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="stock-selector" ref={containerRef}>
      <button className="stock-selector-btn" onClick={handleOpen}>
        <span className="stock-selector-symbol">{value}</span>
        <span className="stock-selector-name">{company?.name ?? value}</span>
        <span className="stock-selector-chevron">▾</span>
      </button>

      {open && (
        <div className="stock-selector-dropdown">
          <div className="stock-selector-search-wrap">
            <input
              ref={inputRef}
              className="stock-selector-search"
              type="text"
              placeholder="Search symbol or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="stock-selector-list" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="stock-selector-empty">No matches</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.symbol}
                  className={`stock-selector-item ${c.symbol === value ? 'active' : ''}`}
                  onClick={() => handleSelect(c.symbol)}
                >
                  <span className="stock-selector-item-symbol">{c.symbol}</span>
                  <span className="stock-selector-item-name">{c.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});
