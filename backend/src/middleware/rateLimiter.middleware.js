const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.util');

const handler = (req, res, next, options) => {
  return sendError(res, {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later.'
  }, 429);
};

const isDev = process.env.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 50, // generous in dev, strict in prod
  standardHeaders: true,
  legacyHeaders: false,
  handler
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 50000 : 1000, // allow rapid autosave in dev
  standardHeaders: true,
  legacyHeaders: false,
  handler
});

module.exports = {
  authLimiter,
  apiLimiter
};

