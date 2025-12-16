/**
 * Minimal Redis client helper with lazy dynamic import.
 * Tries ioredis first, then node-redis. Falls back to null if unavailable.
 */

export type RedisLike = {
  incr(key: string): Promise<number>
  pttl(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>
  get(key: string): Promise<string | null>
  del(key: string): Promise<number>
}

let cached: RedisLike | null | undefined

export async function getRedis(): Promise<RedisLike | null> {
  if (cached !== undefined) return cached

  const url = process.env.REDIS_URL || process.env.MEDUSA_REDIS_URL
  if (!url) {
    cached = null
    return cached
  }

  // Try ioredis
  try {
    // @ts-ignore dynamic import
    const { default: IORedis } = await import('ioredis')
    const client = new IORedis(url)

    // Wrap to a minimal interface
    const wrapper: RedisLike = {
      incr: (key) => client.incr(key),
      pttl: (key) => client.pttl(key),
      expire: (key, seconds) => client.expire(key, seconds),
      set: (key, value, mode?: 'EX' | 'PX', duration?: number) => {
        if (mode && duration) return client.set(key, value, mode, duration)
        return client.set(key, value)
      },
      get: (key) => client.get(key),
      del: (key) => client.del(key) as unknown as Promise<number>,
    }

    cached = wrapper
    return cached
  } catch {}

  // Try node-redis
  try {
    // @ts-ignore dynamic import
    const redis = await import('redis')
    const client = redis.createClient({ url })
    if (!client.isOpen) await client.connect()

    const wrapper: RedisLike = {
      incr: (key) => client.incr(key),
      pttl: (key) => client.pTTL(key),
      expire: (key, seconds) => client.expire(key, seconds),
      set: async (key, value, mode?: string, duration?: number) => {
        if (mode === 'EX' && duration) {
          await client.set(key, value, { EX: duration })
          return 'OK'
        }
        await client.set(key, value)
        return 'OK'
      },
      get: (key) => client.get(key),
      del: (key) => client.del(key),
    }

    cached = wrapper
    return cached
  } catch (err) {
    console.warn('Redis client not available; falling back to in-memory rate limits')
    cached = null
    return cached
  }
}

