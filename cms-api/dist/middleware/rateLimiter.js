"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const rateLimitStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);
const rateLimiter = (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 100;
    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs
        });
    }
    else {
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
exports.rateLimiter = rateLimiter;
//# sourceMappingURL=rateLimiter.js.map