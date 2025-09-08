import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (for production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = req.ip || 'unknown'; // Use IP address as key (in production, consider user ID for authenticated requests)
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max requests per window

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
  } else {
    // Within window
    if (entry.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }
    entry.count++;
  }

  // Add rate limit headers
  const currentEntry = rateLimitStore.get(key);
  if (currentEntry) {
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - currentEntry.count).toString(),
      'X-RateLimit-Reset': new Date(currentEntry.resetTime).toISOString()
    });
  }

  next();
};
