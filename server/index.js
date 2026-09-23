// Bootstrap. Loads .env, proves the database is reachable, and only then starts
// listening. If MONGODB_URI is missing or the connection fails, it logs a clear
// reason and exits non-zero — a server that answers /api/health with "degraded"
// forever is worse than one that refuses to start.

import 'dotenv/config'
import createApp from './app.js'
import { connect, disconnect, getMongoUri, redactUri } from './db.js'

const DEFAULT_PORT = 4000

function resolvePort(raw) {
  if (raw === undefined || raw === '') return DEFAULT_PORT
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535 (got "${raw}")`)
  }
  return port
}

/** Log the reason and leave with a non-zero status. Never starts the listener. */
async function fail(reason) {
  console.error(`[server] ${reason}`)
  console.error('[server] not starting. See README → "Backend" for setup.')
  // Release any half-open connection before exiting so the process can wind down
  // and streams flush; `exitCode` sets the status without truncating output.
  try {
    await disconnect()
  } catch {
    /* nothing useful to add — we are already failing */
  }
  process.exitCode = 1
}

async function main() {
  let uri
  let port
  try {
    uri = getMongoUri()
    port = resolvePort(process.env.PORT)
  } catch (err) {
    await fail(err.message)
    return
  }

  try {
    await connect(uri)
    console.log(`[server] connected to MongoDB at ${redactUri(uri)}`)
  } catch (err) {
    await fail(`could not connect to MongoDB at ${redactUri(uri)} — ${err.message}`)
    return
  }

  const app = createApp()
  const server = app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`)
    console.log(`[server] health: http://localhost:${port}/api/health`)
  })

  // Close the listener and the pool before exiting, so `Ctrl+C` and container
  // stops do not leave a socket in TIME_WAIT or an open db handle.
  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received — shutting down`)
    server.close(async () => {
      await disconnect()
      process.exit(0)
    })
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main()
