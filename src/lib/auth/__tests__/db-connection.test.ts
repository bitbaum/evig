/**
 * @jest-environment node
 */

/**
 * Tests for the auth DB connection layer (lib/auth/db-connection.ts).
 *
 * Mission-critical infrastructure: every legacy SQL query in the app
 * passes through this module. Three exported behaviors:
 *
 *   query() — pg.Pool.query wrapper with automatic retry on connection
 *     errors (2 retries, 500ms then 1500ms backoff). Non-connection
 *     errors (constraint violations, syntax errors) bubble immediately.
 *
 *   paginatedQuery() — injects COUNT(*) OVER() into the SELECT clause
 *     for single-round-trip pagination. Returns { rows, total } with
 *     the synthetic _total_count column stripped from every row.
 *
 *   transaction() — BEGIN / callback / COMMIT, with ROLLBACK on throw,
 *     and release() always called via finally.
 */

const mockQuery = jest.fn()
const mockConnect = jest.fn()
const mockPoolOn = jest.fn()

class MockPool {
  query = mockQuery
  connect = mockConnect
  on = mockPoolOn
}

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => new MockPool()),
}))

jest.mock('../config', () => ({
  getDbConfig: jest.fn(() => ({ host: 'localhost', database: 'test' })),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

let dbConn: typeof import('../db-connection')

beforeEach(() => {
  jest.useFakeTimers()
  jest.resetModules()
  mockQuery.mockReset()
  mockConnect.mockReset()
  mockPoolOn.mockReset()
  dbConn = require('../db-connection') as typeof import('../db-connection')
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

/** Helper: run sync code + drain all pending timers + microtasks */
async function runAndAdvance<T>(fn: () => Promise<T>): Promise<T> {
  const promise = fn()
  // Allow the first attempt to resolve, then advance through all backoff timers
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
    jest.runAllTimers()
  }
  return promise
}

// ============================================================================
// query — happy path
// ============================================================================

describe('query — happy path', () => {
  it('returns rows + rowCount on first attempt', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }], rowCount: 2 })

    const result = await dbConn.query('SELECT * FROM users')
    expect(result).toEqual({ rows: [{ id: 1 }, { id: 2 }], rowCount: 2 })
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('passes the SQL text and params through to pool.query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    await dbConn.query('SELECT * FROM users WHERE id = $1', ['user-1'])
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['user-1'])
  })

  it('defaults rowCount to 0 when pg returns null/undefined', async () => {
    // Some pg drivers return rowCount=null for SELECT — must coerce to 0
    mockQuery.mockResolvedValueOnce({ rows: [{ x: 1 }], rowCount: null })

    const result = await dbConn.query('SELECT * FROM x')
    expect(result.rowCount).toBe(0)
  })

  it('typed rows: generic param flows through to result type', async () => {
    interface UserRow { id: string; email: string }
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: '1', email: 'a@b.ch' }],
      rowCount: 1,
    })

    const result = await dbConn.query<UserRow>('SELECT id, email FROM users')
    // Compile-time assertion + runtime
    expect(result.rows[0].email).toBe('a@b.ch')
  })
})

// ============================================================================
// query — non-connection errors bubble immediately (no retry)
// ============================================================================

describe('query — non-connection errors', () => {
  it('throws constraint violations immediately without retrying', async () => {
    const err = new Error('duplicate key value violates unique constraint')
    mockQuery.mockRejectedValueOnce(err)

    await expect(dbConn.query('INSERT INTO x VALUES ($1)', ['dup'])).rejects.toThrow(
      'duplicate key',
    )
    expect(mockQuery).toHaveBeenCalledTimes(1) // no retry
  })

  it('throws syntax errors immediately', async () => {
    const err = new Error('syntax error at or near "SELEKT"')
    mockQuery.mockRejectedValueOnce(err)

    await expect(dbConn.query('SELEKT broken')).rejects.toThrow('syntax error')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('throws permission-denied errors immediately', async () => {
    const err = new Error('permission denied for table users')
    mockQuery.mockRejectedValueOnce(err)

    await expect(dbConn.query('SELECT * FROM users')).rejects.toThrow('permission denied')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// query — connection-error retry logic
// ============================================================================

describe('query — retry on connection errors', () => {
  it('retries up to 2 times on ECONNREFUSED, succeeds on attempt 3', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:5432'))
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:5432'))
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })

    const result = await runAndAdvance(() => dbConn.query('SELECT 1'))

    expect(result.rows).toEqual([{ ok: true }])
    expect(mockQuery).toHaveBeenCalledTimes(3)
  })

  it('retries on timeout errors', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('Query read timeout'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })

    await runAndAdvance(() => dbConn.query('SELECT 1'))
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('retries on "Connection terminated" errors', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('Connection terminated unexpectedly'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })

    await runAndAdvance(() => dbConn.query('SELECT 1'))
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('retries on ENOTFOUND (DNS failure)', async () => {
    mockQuery
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND db.example'))
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })

    await runAndAdvance(() => dbConn.query('SELECT 1'))
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('throws Swiss-German user-facing error after 3 total attempts (initial + 2 retries)', async () => {
    mockQuery
      .mockRejectedValue(new Error('connect ECONNREFUSED'))

    await expect(runAndAdvance(() => dbConn.query('SELECT 1'))).rejects.toThrow(
      /Datenbankverbindung fehlgeschlagen.*später erneut/,
    )
    expect(mockQuery).toHaveBeenCalledTimes(3) // initial + 2 retries
  })
})

// ============================================================================
// paginatedQuery
// ============================================================================

describe('paginatedQuery', () => {
  it('injects COUNT(*) OVER() AS _total_count after the first SELECT keyword', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'l1', _total_count: '42' },
        { id: 'l2', _total_count: '42' },
      ],
      rowCount: 2,
    })

    await dbConn.paginatedQuery(
      'SELECT id FROM listings ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [20, 0],
    )

    const calledSql = mockQuery.mock.calls[0][0]
    expect(calledSql).toContain('COUNT(*) OVER() AS _total_count')
    // Injection happens right after SELECT (so order of select-list is preserved)
    expect(calledSql).toMatch(/SELECT\s+COUNT\(\*\) OVER\(\) AS _total_count, id/)
  })

  it('returns total from first row (parsed as integer)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'l1', _total_count: '127' },
        { id: 'l2', _total_count: '127' },
      ],
      rowCount: 2,
    })

    const result = await dbConn.paginatedQuery('SELECT id FROM listings LIMIT $1', [10])
    expect(result.total).toBe(127)
  })

  it('strips _total_count from every returned row', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'l1', title: 'foo', _total_count: '5' },
        { id: 'l2', title: 'bar', _total_count: '5' },
      ],
      rowCount: 2,
    })

    const result = await dbConn.paginatedQuery<{ id: string; title: string }>(
      'SELECT id, title FROM listings LIMIT $1',
      [10],
    )

    expect(result.rows).toEqual([
      { id: 'l1', title: 'foo' },
      { id: 'l2', title: 'bar' },
    ])
    // _total_count must NOT leak through to consumers
    for (const row of result.rows) {
      expect(row).not.toHaveProperty('_total_count')
    }
  })

  it('returns total=0 when query yields zero rows', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    const result = await dbConn.paginatedQuery('SELECT id FROM listings LIMIT $1', [10])
    expect(result).toEqual({ rows: [], total: 0 })
  })

  it('handles _total_count="0" without crashing on parseInt', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'l1', _total_count: '0' }],
      rowCount: 1,
    })

    const result = await dbConn.paginatedQuery('SELECT id FROM x LIMIT $1', [10])
    expect(result.total).toBe(0)
  })

  it('case-insensitive SELECT match (lowercase select also injected)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    await dbConn.paginatedQuery('select id from listings limit $1', [10])
    expect(mockQuery.mock.calls[0][0]).toContain('COUNT(*) OVER() AS _total_count')
  })

  it('passes pagination parameters through', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    await dbConn.paginatedQuery(
      'SELECT id FROM x WHERE status = $1 LIMIT $2 OFFSET $3',
      ['active', 20, 40],
    )
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['active', 20, 40])
  })
})

// ============================================================================
// transaction
// ============================================================================

describe('transaction', () => {
  function makeClient() {
    const queryFn = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
    const release = jest.fn()
    return {
      client: { query: queryFn, release } as unknown as import('pg').PoolClient,
      queryFn,
      release,
    }
  }

  it('runs BEGIN, callback, COMMIT in order on success', async () => {
    const { client, queryFn, release } = makeClient()
    mockConnect.mockResolvedValueOnce(client)

    const result = await dbConn.transaction(async (c) => {
      await c.query('INSERT INTO x VALUES (1)')
      return 'callback-result'
    })

    expect(queryFn).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(queryFn).toHaveBeenNthCalledWith(2, 'INSERT INTO x VALUES (1)')
    expect(queryFn).toHaveBeenNthCalledWith(3, 'COMMIT')
    expect(release).toHaveBeenCalledTimes(1)
    expect(result).toBe('callback-result')
  })

  it('runs ROLLBACK and re-throws on callback failure', async () => {
    const { client, queryFn, release } = makeClient()
    mockConnect.mockResolvedValueOnce(client)

    const err = new Error('Business rule violated')
    await expect(
      dbConn.transaction(async () => {
        throw err
      }),
    ).rejects.toThrow('Business rule violated')

    expect(queryFn).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(queryFn).toHaveBeenLastCalledWith('ROLLBACK')
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('always releases the client (even on COMMIT failure)', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // callback query
      .mockRejectedValueOnce(new Error('COMMIT failed: deadlock')) // COMMIT
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // ROLLBACK
    const release = jest.fn()
    mockConnect.mockResolvedValueOnce({ query: queryFn, release } as unknown as import('pg').PoolClient)

    await expect(
      dbConn.transaction(async (c) => {
        await c.query('UPDATE x SET y = 1')
      }),
    ).rejects.toThrow('COMMIT failed')

    // Critical: release happens via finally, even when COMMIT throws —
    // otherwise the connection leaks back to the pool half-open
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('passes callback return value through unchanged', async () => {
    const { client } = makeClient()
    mockConnect.mockResolvedValueOnce(client)

    const result = await dbConn.transaction(async () => ({ id: 'new-1', count: 42 }))
    expect(result).toEqual({ id: 'new-1', count: 42 })
  })
})
