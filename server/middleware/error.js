// Centralised error handling. Two rules:
//   1. Every failure leaves as JSON with a useful `message` — never HTML.
//   2. Stack traces are a development affordance; production gets `stack: undefined`.
//
// Routes signal intent with `httpError(status, message)` instead of throwing
// bare Errors, so status codes stay deliberate rather than accidental.

/** Build an Error carrying an HTTP status, for the handler below to read. */
export function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  err.expose = status < 500 // 4xx messages are safe to show; 5xx may not be
  return err
}

/**
 * Express 4 does not catch rejected promises from handlers, so an `await` that
 * throws would hang the request. Wrap every async route in this: failures land
 * in `errorHandler` exactly as a synchronous throw would.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

/** Anything that falls through the routers is a 404 with the attempted path. */
export function notFound(req, res, _next) {
  res.status(404).json({
    error: 'Not Found',
    message: `No route matches ${req.method} ${req.originalUrl}`,
  })
}

/** Canonical reason phrase per status, so 413 never reports itself as "Bad Request". */
const REASON = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
}

export function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === 'production'

  // Map the errors our dependencies throw with a status onto HTTP codes:
  // body-parser uses `status`, mongoose validation has none (400), and a
  // malformed ObjectId in a path is a client mistake (400), not a 500.
  let status = err.status || err.statusCode || 500
  if (!err.status && !err.statusCode) {
    if (err.name === 'ValidationError' || err.name === 'CastError') status = 400
  }
  // Never let a bogus status escape the valid range.
  if (!Number.isInteger(status) || status < 400 || status > 599) status = 500

  // A JSON *parse* failure is the client's fault even though it surfaces as a
  // 400 from express.json() — keep body-parser's own message, it is precise.
  const isClientError = status >= 400 && status < 500
  const message = isClientError
    ? err.message || 'Bad Request'
    : isProd
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error'

  if (status >= 500) {
    // Server faults are worth a log line; client faults are noise.
    console.error(`[server] ${req.method} ${req.originalUrl} → ${status}: ${err.message}`)
  }

  const label = isClientError ? REASON[status] || 'Request Error' : 'Internal Server Error'
  const body = { error: label, message }
  // Only ever attach a stack outside production, and never for a 4xx.
  if (!isProd && status >= 500 && err.stack) body.stack = err.stack

  res.status(status).json(body)
}
