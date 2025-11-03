import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Fix for deployments behind proxies
  // This tells rate-limit to trust the X-Forwarded-For header
  validate: { xForwardedForHeader: false },
});
