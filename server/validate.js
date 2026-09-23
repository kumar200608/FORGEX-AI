// Input validation for the write routes.
//
// Nothing here trusts `req.body` shape: every field is type-checked, trimmed and
// range-bounded before it reaches a model, and the first problem is reported by
// name so the client can act on it.

import { httpError } from './middleware/error.js'

// Session ids are client-generated identifiers, not user content: keep them to
// a conservative slug-ish alphabet so they are safe to log and index.
const SESSION_ID_RE = /^[A-Za-z0-9_-]{6,128}$/
const PRODUCT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/

/** Require a body object (guards against `null`, arrays and JSON scalars). */
export function requireObjectBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw httpError(400, 'Request body must be a JSON object')
  }
  return body
}

export function validateSessionId(value) {
  if (typeof value !== 'string') {
    throw httpError(400, '`sessionId` is required and must be a string')
  }
  const sessionId = value.trim()
  if (!SESSION_ID_RE.test(sessionId)) {
    throw httpError(
      400,
      '`sessionId` must be 6–128 characters of letters, digits, hyphen or underscore'
    )
  }
  return sessionId
}

export function validateProductId(value) {
  if (typeof value !== 'string') {
    throw httpError(400, '`productId` is required and must be a string')
  }
  const productId = value.trim()
  if (!PRODUCT_ID_RE.test(productId)) {
    throw httpError(400, '`productId` must be 1–64 characters of letters, digits, hyphen or underscore')
  }
  return productId
}

export function validateQty(value, { fallback = 1 } = {}) {
  if (value === undefined && fallback !== undefined) return fallback
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw httpError(400, '`qty` must be an integer')
  }
  if (value < 1 || value > 99) {
    throw httpError(400, '`qty` must be between 1 and 99')
  }
  return value
}

/** Parse `?limit=` into a bounded integer. `undefined` means "no limit applied". */
export function parseLimit(raw, { max = 100 } = {}) {
  if (raw === undefined) return undefined
  if (Array.isArray(raw)) throw httpError(400, '`limit` may only be given once')
  if (!/^\d+$/.test(String(raw))) {
    throw httpError(400, '`limit` must be a positive integer')
  }
  const limit = Number(raw)
  if (limit < 1 || limit > max) {
    throw httpError(400, `\`limit\` must be between 1 and ${max}`)
  }
  return limit
}
