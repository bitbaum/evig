/**
 * Database connection layer for RevampIT unified auth
 * Uses the pg package for PostgreSQL connection
 *
 * Provides the raw Pool used by both Drizzle ORM (src/db/index.ts)
 * and legacy query/transaction helpers during migration.
 */

import { Pool, PoolClient } from 'pg'
import { logger } from '@/lib/logger'
import { getDbConfig } from './config'
import type { QueryParams } from '@/types/common'
import { ERROR_MESSAGES } from '@/config/error-messages'

// Get database configuration from centralized config
const dbConfig = {
  ...getDbConfig(),
  // Keep pool conservative for Neon to avoid connection saturation under load.
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000', 10),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '30000', 10),
  idle_in_transaction_session_timeout: parseInt(process.env.DB_IDLE_TX_TIMEOUT_MS || '60000', 10),
}

// Connection error patterns for retry logic
const CONNECTION_ERROR_PATTERNS = [
  'connect', 'ECONNREFUSED', 'timeout',
  'Connection terminated', 'Connection closed',
  'ENOTFOUND', 'EHOSTUNREACH',
] as const

function isConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return CONNECTION_ERROR_PATTERNS.some(pattern => message.includes(pattern))
}

const MAX_RETRIES = 2
const RETRY_DELAYS = [500, 1500] as const

// Create connection pool (singleton)
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig)

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected error on auth database pool', { error: err })
    })
  }
  return pool
}

/**
 * Execute a query with automatic connection management.
 * Retries up to 2 times on connection errors with exponential backoff.
 * Non-connection errors (constraint violations, syntax errors) throw immediately.
 */
export async function query<T = unknown>(
  text: string,
  params?: QueryParams
): Promise<{ rows: T[]; rowCount: number }> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const pool = getPool()
      const result = await pool.query(text, params)
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0
      }
    } catch (error) {
      if (!isConnectionError(error)) {
        throw error
      }

      lastError = error

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt]
        logger.warn('Database connection error, retrying', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          query: text.substring(0, 100),
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  logger.error('Database connection failed after retries', {
    attempts: MAX_RETRIES + 1,
    query: text.substring(0, 100),
  })
  throw new Error(ERROR_MESSAGES.DB_CONNECTION_FAILED)
}

/**
 * Get a client from the pool for transactions.
 * Retries up to 2 times on connection errors with exponential backoff.
 */
export async function getClient(): Promise<PoolClient> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const pool = getPool()
      return await pool.connect()
    } catch (error) {
      if (!isConnectionError(error)) {
        throw error
      }

      lastError = error

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt]
        logger.warn('Database client connection error, retrying', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delayMs: delay,
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  logger.error('Database client connection failed after retries', {
    attempts: MAX_RETRIES + 1,
  })
  throw new Error(ERROR_MESSAGES.DB_CONNECTION_FAILED)
}

// Cache user columns to keep queries schema-safe across migrations (5-minute TTL)
const USER_COLUMNS_CACHE_TTL_MS = 5 * 60_000
let _userColumnsCache: { columns: Set<string>; expiresAt: number } | null = null

export async function getUserColumns(): Promise<Set<string>> {
  if (_userColumnsCache && Date.now() < _userColumnsCache.expiresAt) {
    return _userColumnsCache.columns
  }

  const result = await query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    ['users']
  )

  const columns = new Set(result.rows.map((row) => row.column_name))
  _userColumnsCache = { columns, expiresAt: Date.now() + USER_COLUMNS_CACHE_TTL_MS }
  return columns
}

/**
 * Execute a paginated query using COUNT(*) OVER() window function.
 * Combines the data query and count into a single DB round-trip.
 *
 * @param text - SQL query that MUST include LIMIT and OFFSET placeholders.
 *   The function injects `COUNT(*) OVER() AS _total_count` into the SELECT.
 * @param params - Query parameters (including limit and offset values)
 * @returns Object with typed rows (without _total_count) and total count
 *
 * @example
 * ```typescript
 * const { rows, total } = await paginatedQuery<Listing>(
 *   `SELECT l.id, l.title FROM listings l WHERE l.status = $1
 *    ORDER BY l.created_at DESC LIMIT $2 OFFSET $3`,
 *   ['active', 20, 0]
 * )
 * ```
 */
export async function paginatedQuery<T = unknown>(
  text: string,
  params?: QueryParams
): Promise<{ rows: T[]; total: number }> {
  // Inject COUNT(*) OVER() after the first SELECT keyword
  const injectedQuery = text.replace(
    /^(\s*SELECT\s)/i,
    '$1COUNT(*) OVER() AS _total_count, '
  )

  const result = await query<T & { _total_count: string }>(injectedQuery, params)

  // Extract total from first row (0 if no rows returned)
  const total = result.rows.length > 0
    ? parseInt(result.rows[0]._total_count || '0', 10)
    : 0

  // Strip _total_count from all rows
  const rows = result.rows.map(({ _total_count, ...rest }) => rest as unknown as T)

  return { rows, total }
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
