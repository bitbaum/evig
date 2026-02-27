/**
 * Shared DB row types for SQL query results.
 *
 * PostgreSQL returns COUNT/SUM as string — these types reflect that.
 * Parse to number where needed: `Number(row.total)`.
 */

/** Row shape for `SELECT COUNT(*) AS total FROM ...` queries */
export interface CountRow {
  total: string
}

/** Variant where the column is aliased as `count` instead of `total` */
export interface CountAsCountRow {
  count: string
}
