# S&P 500 Hero

A real-time S&P 500 candlestick chart with a flying superhero that tracks price movement — plus a built-in paper trading game. Built with React, TypeScript, and HTML Canvas.

The hero flies alongside a live 15-second candlestick chart, tilting up when price rises and diving when it falls. An animated cityscape scrolls in the background, and candles gracefully fade when the hero obscures them. A trading panel lets you buy and sell with a simulated $10,000 account to test your instincts against the market.

## Quick Start

```bash
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). Launches in **simulated mode** by default — no API key or broker connection needed. A random-walk model generates realistic 15-second OHLC candles so you can explore the full experience locally.

## Features

- **Real-time 15-second candlestick chart** rendered on Canvas at 60 fps
- **Animated SVG superhero** with cape sway, idle bob, and slope-based rotation
- **Scrolling cityscape** background with parallax effect
- **Live price ticker** with color-coded change indicator
- **Zoom controls** via mouse wheel or on-screen buttons
- **Market hours detection** with countdown overlay when NYSE is closed
- **Automatic fallback** to simulated data when live feed is unavailable
- **Paper trading game** — buy and sell S&P 500 with a virtual $10,000 account

## Trading Game

The trading panel on the left side of the chart lets you practice trading:

- **$10,000 starting balance** — preserved across page refreshes via localStorage
- **Buy** — enter a dollar amount and buy shares at the current price
- **Sell** — enter a dollar amount to sell at the current price
- **Position tracker** — view your shares, average cost, market value, and unrealized P&L
- **Trade history** — scrollable log of all your buys and sells
- **Quick presets** — one-click buttons for $100, $500, $1,000, $2,500, or MAX
- **Reset** — hit the ↺ button to start fresh at $10,000

Buy low and sell high to grow your account. Buy high and sell low, and you lose money — just like the real thing.

## Controls

| Action   | Input                    |
| -------- | ------------------------ |
| Zoom in  | **+** button / scroll up |
| Zoom out | **−** button / scroll down |
| Buy      | Enter amount, click **BUY** |
| Sell     | Enter amount, click **SELL** |
| Reset    | Click **↺** in trading panel |

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
- **localStorage** for persistent trading state

## Project Structure

```
src/
  components/   SpHeroPage, Superhero, PriceTicker, ZoomControls, TradingPanel
  hooks/        useLivePrice (tick → candle aggregation), useTrading, useAnimationFrame
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
