import { RateLimitConfig, RateLimitResult } from '../types'

interface RateLimitEntry {
  count: number
  firstRequest: number
  lastRequest: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private config: RateLimitConfig) {
    // Start cleanup interval to remove expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.windowMs / 2)
  }

  async checkRateLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry) {
      // First request from this key
      this.store.set(key, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      })

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    // Check if window has expired
    if (now - entry.firstRequest >= this.config.windowMs) {
      // Reset the window
      this.store.set(key, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      })

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    // Within the window, check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.firstRequest + this.config.windowMs
      }
    }

    // Increment count
    entry.count++
    entry.lastRequest = now

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.firstRequest + this.config.windowMs
    }
  }

  getAttempts(key: string): number {
    const entry = this.store.get(key)
    return entry ? entry.count : 0
  }

  reset(key?: string): void {
    if (key) {
      this.store.delete(key)
    } else {
      this.store.clear()
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.store) {
      if (now - entry.firstRequest >= this.config.windowMs) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.store.delete(key)
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }

  // For monitoring/debugging
  getStats() {
    return {
      totalKeys: this.store.size,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        count: entry.count,
        age: Date.now() - entry.firstRequest,
        remainingTime: Math.max(0, (entry.firstRequest + this.config.windowMs) - Date.now())
      }))
    }
  }
}