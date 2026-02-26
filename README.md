# S&P 500 Hero

A real-time S&P 500 candlestick chart with a flying superhero that tracks price movement. Built with React, TypeScript, and HTML Canvas.

The hero flies alongside a live 1-second candlestick chart, tilting up when price rises and diving when it falls. An animated cityscape scrolls in the background, and candles gracefully fade when the hero obscures them.

## Quick Start

```bash
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). Launches in **simulated mode** by default — no API key or broker connection needed. A random-walk model generates realistic 1-second OHLC candles so you can explore the full experience locally.

## Features

- **Real-time 1-second candlestick chart** rendered on Canvas at 60 fps
- **Animated SVG superhero** with cape sway, idle bob, and slope-based rotation
- **Scrolling cityscape** background with parallax effect
- **Live price ticker** with color-coded change indicator
- **Zoom controls** via mouse wheel or on-screen buttons
- **Market hours detection** with countdown overlay when NYSE is closed
- **Automatic fallback** to simulated data when live feed is unavailable

## Controls

| Action   | Input                    |
| -------- | ------------------------ |
| Zoom in  | **+** button / scroll up |
| Zoom out | **−** button / scroll down |

## Live Data

The app includes an Interactive Brokers TWS integration via `@stoqey/ib`. To use live data:

1. Run Interactive Brokers Trader Workstation (TWS)
2. Enable API connections on port **7497**
3. Start the dev server — the Vite plugin connects automatically and streams SPX index prices

You can also swap in any data source by implementing the `LivePriceService` interface in `src/types/index.ts`. See `src/services/PriceService.ts` for the reference implementation.

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 7** (dev server + build)
- **HTML Canvas** for chart rendering
- **CSS animations** (compositor-thread cape sway and idle bob)
- **@stoqey/ib** for Interactive Brokers integration

## Project Structure

```
src/
  components/   SpHeroPage, Superhero, PriceTicker, ZoomControls
  hooks/        useLivePrice (tick → candle aggregation), useAnimationFrame
  services/     LiveApiPriceService, SimulatedPriceService
  utils/        Canvas drawing, cityscape animation, market hours
  types/        Candle, TickerData, LivePriceService interfaces
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Type-check + production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## License

MIT
