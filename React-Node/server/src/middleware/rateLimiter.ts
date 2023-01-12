import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication routes.
 * 5 requests per minute per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter.
 * 100 requests per minute per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
