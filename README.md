# S&P 500 Hero

A real-time S&P 500 candlestick chart with a flying superhero that tracks price movement — plus a built-in paper trading game. Built with React, TypeScript, and HTML Canvas.

The hero flies alongside a live candlestick chart, tilting up when price rises and diving when it falls. An animated cityscape scrolls in the background, and candles gracefully fade when the hero obscures them. A trading panel lets you buy and sell with a virtual $10,000 account to test your instincts against the market.

## Quick Start

```bash
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). Requires a running IB Gateway or TWS instance for live market data. If the gateway is not connected, the app displays a setup guide and troubleshooting page to help you get started.

## Features

- **Real-time candlestick chart** (15s / 30s / 1m intervals) rendered on Canvas at 60 fps
- **Animated SVG superhero** with cape sway, idle bob, and slope-based rotation
- **Scrolling cityscape** background with parallax effect
- **Live price ticker** with color-coded change and volume indicators
- **Multi-stock support** — view any S&P 500 company via a searchable dropdown
- **Split view** — compare two stocks side by side
- **Home page** — market overview grid with filters, search, and split-view selection
- **Zoom controls** via mouse wheel or on-screen buttons
- **Market hours detection** with countdown overlay when NYSE is closed
- **Setup & troubleshooting guides** — step-by-step help when the gateway is not connected
- **Paper trading game** — buy and sell with a virtual $10,000 account

## Trading Game

The trading panel on the chart lets you practice trading:

- **$10,000 starting balance** — preserved across page refreshes via localStorage
- **Buy** — enter a dollar amount and buy shares at the current price
- **Sell** — enter a dollar amount to sell at the current price
- **Position tracker** — view your shares, average cost, market value, and unrealized P&L
- **Trade history** — scrollable log of all your buys and sells
- **Quick presets** — one-click buttons for $100, $500, $1,000, $2,500, or MAX
- **Reset** — hit the ↺ button to start fresh at $10,000

## Controls

| Action   | Input                    |
| -------- | ------------------------ |
| Zoom in  | **+** button / scroll up |
| Zoom out | **−** button / scroll down |
| Buy      | Enter amount, click **BUY** |
| Sell     | Enter amount, click **SELL** |
| Reset    | Click **↺** in trading panel |

## Live Data

The app streams real-time prices from Interactive Brokers via `@stoqey/ib`. To connect:

1. Install and launch IB Gateway (or TWS)
2. Enable API connections on port **7497**
3. Start the dev server — the Vite plugin connects automatically

If the gateway is not reachable, the chart shows a connection overlay with direct links to the built-in Setup Guide and Troubleshooting pages.

You can also swap in any data source by implementing the `LivePriceService` interface in `src/types/index.ts`.

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
  components/   SpHeroPage, ChartPanel, HomePage, TradingPanel, PriceTicker,
                ConnectionOverlay, SetupGuide, TroubleshootGuide, Superhero,
                ZoomControls, StockSelector
  hooks/        useLivePrice, useTrading, useAnimationFrame
  services/     LiveApiPriceService
  utils/        Canvas drawing, cityscape animation, market hours, stock snapshots
  data/         S&P 500 company list
  types/        Candle, TickerData, ConnectionStatus, LivePriceService interfaces
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
