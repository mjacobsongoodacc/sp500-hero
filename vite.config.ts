import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import ib from '@stoqey/ib'

const { IBApi, EventName, Index, Stock } = ib
const TICK_LAST = 4
const TICK_CLOSE = 9
const TICK_DELAYED_LAST = 68

const TWS_PORT = 7497
const CLIENT_ID = 9001
const STALE_SUBSCRIPTION_MS = 60_000

interface Subscription {
  reqId: number
  price: number
  lastPoll: number
}

function ibkrPlugin(): Plugin {
  let connected = false
  let api: InstanceType<typeof IBApi> | null = null
  let nextReqId = 1
  const subscriptions = new Map<string, Subscription>()
  const reqIdToSymbol = new Map<number, string>()

  function subscribe(symbol: string) {
    if (subscriptions.has(symbol)) return
    if (!api || !connected) return

    const reqId = nextReqId++
    subscriptions.set(symbol, { reqId, price: 0, lastPoll: Date.now() })
    reqIdToSymbol.set(reqId, symbol)

    api.reqMarketDataType(3)
    if (symbol === 'SPX') {
      api.reqMktData(reqId, new Index('SPX', 'USD', 'CBOE'), '', false, false)
    } else {
      api.reqMktData(reqId, new Stock(symbol, 'SMART', 'USD'), '', false, false)
    }
  }

  function cleanupStale() {
    const now = Date.now()
    for (const [symbol, sub] of subscriptions) {
      if (now - sub.lastPoll > STALE_SUBSCRIPTION_MS) {
        if (api) api.cancelMktData(sub.reqId)
        reqIdToSymbol.delete(sub.reqId)
        subscriptions.delete(symbol)
      }
    }
  }

  function connect() {
    if (api) return

    api = new IBApi({ port: TWS_PORT, clientId: CLIENT_ID })

    api.on(EventName.connected, () => {
      connected = true
      console.log('[IBKR] connected to TWS on port', TWS_PORT)
    })

    api.on(EventName.disconnected, () => {
      connected = false
      console.log('[IBKR] disconnected')
      api = null
      subscriptions.clear()
      reqIdToSymbol.clear()
    })

    api.on(EventName.error, (err: Error, code: number, reqId: number) => {
      const ignore = [2104, 2106, 2158, 354, 10167]
      if (ignore.includes(code)) return
      console.error(`[IBKR] error ${code} (reqId ${reqId}):`, err.message)
    })

    api.on(
      EventName.tickPrice,
      (_reqId: number, tickType: number, p: number) => {
        if (
          tickType === TICK_LAST ||
          tickType === TICK_DELAYED_LAST ||
          tickType === TICK_CLOSE
        ) {
          if (p > 0) {
            const symbol = reqIdToSymbol.get(_reqId)
            if (symbol) {
              const sub = subscriptions.get(symbol)
              if (sub) sub.price = p
            }
          }
        }
      },
    )

    api.connect()
    setInterval(cleanupStale, 30_000)
  }

  return {
    name: 'ibkr-stocks',
    configureServer(server) {
      connect()

      // Legacy SPX endpoint
      server.middlewares.use('/api/sp500', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        subscribe('SPX')
        const sub = subscriptions.get('SPX')
        if (sub) sub.lastPoll = Date.now()
        const price = sub?.price ?? 0
        if (price > 0) {
          res.end(JSON.stringify({ price }))
        } else {
          res.statusCode = connected ? 200 : 502
          res.end(
            JSON.stringify(
              connected
                ? { price: 0, waiting: true }
                : { error: 'not connected to TWS' },
            ),
          )
        }
      })

      // Per-symbol stock endpoint
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/stock\/([A-Z0-9.]+)$/)
        if (!match) return next()

        const symbol = match[1]
        res.setHeader('Content-Type', 'application/json')

        subscribe(symbol)
        const sub = subscriptions.get(symbol)
        if (sub) sub.lastPoll = Date.now()
        const price = sub?.price ?? 0

        if (price > 0) {
          res.end(JSON.stringify({ price }))
        } else {
          res.statusCode = connected ? 200 : 502
          res.end(
            JSON.stringify(
              connected
                ? { price: 0, waiting: true }
                : { error: 'not connected to TWS' },
            ),
          )
        }
      })

      server.httpServer?.on('close', () => {
        if (api) {
          for (const [, sub] of subscriptions) {
            api.cancelMktData(sub.reqId)
          }
          api.disconnect()
          api = null
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), ibkrPlugin()],
})
