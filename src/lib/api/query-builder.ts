/**
 * SQL Query Builder Utilities
 *
 * Eliminates manual paramIndex++ tracking in API routes.
 * Provides a safe, composable way to build parameterized WHERE clauses.
 */

/**
 * Tracks SQL parameter indices automatically.
 *
 * @example
 * const qb = new QueryParams()
 * if (category) qb.add('r.category = $P', category)
 * if (skills.length) qb.add('$P = ANY(r.skills)', skills)
 * const { where, params, nextIndex } = qb.build()
 * // where = 'WHERE r.category = $1 AND $2 = ANY(r.skills)'
 * // params = ['electronics', ['soldering']]
 * // nextIndex = 3 (for LIMIT/OFFSET)
 */
export class QueryParams {
  private conditions: string[] = []
  private params: unknown[] = []
  private index = 1

  /** Add a condition with a parameter. Use $P as placeholder for the auto-incremented index. */
  add(condition: string, value: unknown): this {
    this.conditions.push(condition.replace(/\$P/g, `$${this.index}`))
    this.params.push(value)
    this.index++
    return this
  }

  /** Add a raw condition with no parameter (e.g. 'hp.is_active = true'). */
  addRaw(condition: string): this {
    this.conditions.push(condition)
    return this
  }

  /** Get the current next parameter index (for appending LIMIT/OFFSET). */
  get nextIndex(): number {
    return this.index
  }

  /** Build the WHERE clause and params array. */
  build(prefix = 'WHERE'): { where: string; params: unknown[]; nextIndex: number } {
    const where = this.conditions.length > 0
      ? `${prefix} ${this.conditions.join(' AND ')}`
      : ''
    return { where, params: [...this.params], nextIndex: this.index }
  }
}
