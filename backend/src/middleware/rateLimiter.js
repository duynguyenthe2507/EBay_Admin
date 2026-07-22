const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Applied globally to all /api routes.
 * Allows 100 requests per minute per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too many requests. Please try again in a minute.',
  },
});

/**
 * Auth rate limiter (strict)
 * Applied to login, register, forgot-password, and 2FA endpoints.
 * Allows 10 requests per 15 minutes per IP to defend against brute-force.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Password/sensitive action rate limiter (very strict)
 * Applied to password change and reset endpoints.
 * Allows 5 requests per hour per IP.
 */
const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many sensitive requests. Please try again after 1 hour.',
  },
});

module.exports = { generalLimiter, authLimiter, sensitiveActionLimiter };
