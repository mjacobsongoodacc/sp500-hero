import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import ib from '@stoqey/ib'

const { IBApi, EventName, Index } = ib
const TICK_LAST = 4
const TICK_CLOSE = 9
const TICK_DELAYED_LAST = 68

const TWS_PORT = 7497
const CLIENT_ID = 9001

function ibkrPlugin(): Plugin {
  let price = 0
  let connected = false
  let ib: InstanceType<typeof IBApi> | null = null

  function connect() {
    if (ib) return

    ib = new IBApi({ port: TWS_PORT, clientId: CLIENT_ID })

    ib.on(EventName.connected, () => {
      connected = true
      console.log('[IBKR] connected to TWS on port', TWS_PORT)
      // Type 3 = accept delayed data when live isn't subscribed
      ib!.reqMarketDataType(3)
      ib!.reqMktData(1, new Index('SPX', 'USD', 'CBOE'), '', false, false)
    })

    ib.on(EventName.disconnected, () => {
      connected = false
      console.log('[IBKR] disconnected')
      ib = null
    })

    ib.on(EventName.error, (err: Error, code: number, reqId: number) => {
      // Non-fatal: data-farm status (2104/2106/2158), delayed-data notice (10167),
      // market-data-not-subscribed (354) — we fall back to delayed automatically
      const ignore = [2104, 2106, 2158, 354, 10167]
      if (ignore.includes(code)) return
      console.error(`[IBKR] error ${code} (reqId ${reqId}):`, err.message)
    })

    ib.on(
      EventName.tickPrice,
      (reqId: number, tickType: number, p: number) => {
        if (reqId !== 1) return
        if (
          tickType === TICK_LAST ||
          tickType === TICK_DELAYED_LAST ||
          tickType === TICK_CLOSE
        ) {
          if (p > 0) price = p
        }
      },
    )

    ib.connect()
  }

  return {
    name: 'ibkr-sp500',
    configureServer(server) {
      connect()

      server.middlewares.use('/api/sp500', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
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
        if (ib) {
          ib.cancelMktData(1)
          ib.disconnect()
          ib = null
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), ibkrPlugin()],
})
