/**
 * Base Repository Pattern for RevampIT
 *
 * Provides foundation for data access layer with:
 * - Query execution with automatic error handling
 * - Transaction support with automatic rollback
 * - Connection pooling via centralized db module
 *
 * Following Global Engineering Standards:
 * - DRY: Shared query/transaction logic
 * - SSOT: TABLE_NAMES from config
 * - Separation of Concerns: Data access isolated from business logic
 *
 * @see docs/ARCHITECTURE_EVALUATION.md - Phase 1: Repository Layer
 */

import { query as dbQuery, transaction as dbTransaction, getClient } from '@/lib/auth/db'
import type { PoolClient, QueryResult } from 'pg'
import type { QueryParams } from '@/types/common'
import { logger } from '@/lib/logger'

/**
 * Base repository class providing common data access methods
 *
 * All repositories should extend this class to inherit:
 * - Standardized query execution
 * - Transaction management
 * - Error logging
 */
export abstract class BaseRepository {
  /**
   * Execute a parameterized query
   *
   * @param text - SQL query text (use TABLE_NAMES for table references)
   * @param params - Query parameters (prevents SQL injection)
   * @returns Query result with rows and metadata
   *
   * @example
   * ```typescript
   * const result = await this.query<User>(
   *   `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
   *   [userId]
   * )
   * ```
   */
  protected async query<T = unknown>(
    text: string,
    params?: QueryParams
  ): Promise<{ rows: T[]; rowCount: number }> {
    try {
      return await dbQuery<T>(text, params)
    } catch (error) {
      logger.error('Repository query error', {
        error,
        query: text.substring(0, 200), // Log first 200 chars for debugging
        params: params?.slice(0, 5), // Log first 5 params only
      })
      throw error
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   *
   * The callback receives a client that can be used for multiple
   * queries that should be committed together atomically.
   *
   * @param callback - Function containing transaction logic
   * @returns Result of the transaction
   *
   * @example
   * ```typescript
   * return this.transaction(async (client) => {
   *   await client.query('INSERT INTO orders ...', [data])
   *   await client.query('UPDATE inventory ...', [productId])
   *   return { success: true }
   * })
   * ```
   */
  protected async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    try {
      return await dbTransaction(callback)
    } catch (error) {
      logger.error('Repository transaction error', { error })
      throw error
    }
  }

  /**
   * Get a database client from the pool
   *
   * Useful for complex operations that need direct client access.
   * Remember to release the client when done!
   *
   * @returns PostgreSQL client from connection pool
   */
  protected async getClient(): Promise<PoolClient> {
    return getClient()
  }

  /**
   * Helper to execute a query using a specific client (for transactions)
   *
   * @param client - PoolClient to use for query
   * @param text - SQL query text
   * @param params - Query parameters
   * @returns Query result
   */
  protected async queryWithClient<T = unknown>(
    client: PoolClient,
    text: string,
    params?: QueryParams
  ): Promise<{ rows: T[]; rowCount: number }> {
    try {
      const result: QueryResult = await client.query(text, params)
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
      }
    } catch (error) {
      logger.error('Repository client query error', {
        error,
        query: text.substring(0, 200),
      })
      throw error
    }
  }

  /**
   * Build a WHERE clause from filter object
   *
   * Useful for dynamic filtering in repositories.
   *
   * @param filters - Object with column:value pairs
   * @param startIndex - Starting parameter index (for $1, $2, etc.)
   * @returns Object with whereClause string and values array
   *
   * @example
   * ```typescript
   * const { whereClause, values } = this.buildWhereClause(
   *   { status: 'active', is_verified: true },
   *   1
   * )
   * // whereClause: "WHERE status = $1 AND is_verified = $2"
   * // values: ['active', true]
   * ```
   */
  protected buildWhereClause(
    filters: Record<string, unknown>,
    startIndex = 1
  ): { whereClause: string; values: QueryParams } {
    const entries = Object.entries(filters).filter(
      ([_, value]) => value !== undefined
    )

    if (entries.length === 0) {
      return { whereClause: '', values: [] }
    }

    const conditions = entries.map(
      ([key], index) => `${key} = $${startIndex + index}`
    )
    const values = entries.map(([_, value]) => value)

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      values,
    }
  }

  /**
   * Build ORDER BY clause from sort parameters
   *
   * Only allows alphanumeric column names and underscores to prevent SQL injection.
   *
   * @param sortBy - Column to sort by (must match /^[a-zA-Z_][a-zA-Z0-9_.]*$/)
   * @param sortOrder - 'ASC' or 'DESC'
   * @returns ORDER BY clause string
   *
   * @example
   * ```typescript
   * const orderBy = this.buildOrderBy('created_at', 'DESC')
   * // "ORDER BY created_at DESC"
   * ```
   */
  protected buildOrderBy(
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): string {
    if (!sortBy) return ''
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(sortBy)) {
      throw new Error(`Invalid sort column: ${sortBy}`)
    }
    return `ORDER BY ${sortBy} ${sortOrder}`
  }

  /**
   * Build LIMIT and OFFSET clause for pagination
   *
   * Returns parameterized placeholders and values to prevent injection.
   *
   * @param limit - Maximum number of rows to return
   * @param offset - Number of rows to skip
   * @param startIndex - Starting parameter index (for $N placeholders)
   * @returns Object with clause string and param values
   *
   * @example
   * ```typescript
   * const { clause, values } = this.buildPagination(20, 40, 3)
   * // clause: "LIMIT $3 OFFSET $4"
   * // values: [20, 40]
   * ```
   */
  protected buildPagination(
    limit?: number,
    offset?: number,
    startIndex = 1
  ): { clause: string; values: QueryParams } {
    const parts: string[] = []
    const values: QueryParams = []
    let idx = startIndex
    if (limit !== undefined) {
      parts.push(`LIMIT $${idx++}`)
      values.push(limit)
    }
    if (offset !== undefined) {
      parts.push(`OFFSET $${idx++}`)
      values.push(offset)
    }
    return { clause: parts.join(' '), values }
  }
}
