/**
 * Tests for blog-translations.ts — the per-locale overlay sync for DB posts.
 *
 * This is what makes "translate a post entirely in the admin UI, no git" work.
 * The sync must be a transaction, must drop locales the admin removed, and must
 * reject invalid input before any write (locale is attacker-adjacent via the
 * admin API body).
 */

// ── Drizzle transaction mock ────────────────────────────────────────────────
const mockTxDeleteWhere = jest.fn().mockResolvedValue(undefined)
const mockTxDelete = jest.fn().mockReturnValue({ where: mockTxDeleteWhere })
const mockTxInsertConflict = jest.fn().mockResolvedValue(undefined)
const mockTxInsertValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockTxInsertConflict })
const mockTxInsert = jest.fn().mockReturnValue({ values: mockTxInsertValues })
const mockTx = { delete: mockTxDelete, insert: mockTxInsert }
const mockTransaction = jest.fn().mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))

jest.mock('@/db', () => ({ db: { transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn) } }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }))

import { syncPostTranslations } from '../blog-translations'

beforeEach(() => jest.clearAllMocks())

const POST = '11111111-1111-1111-1111-111111111111'

describe('syncPostTranslations', () => {
  it('rejects an invalid locale without writing', async () => {
    const result = await syncPostTranslations(POST, [{ locale: 'de', title: 'x', content: 'y' }])
    expect(result.success).toBe(false)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('upserts each provided translation inside a transaction', async () => {
    const result = await syncPostTranslations(POST, [
      { locale: 'en', title: 'English title', content: 'English body' },
      { locale: 'fr', title: 'Titre', content: 'Corps' },
    ])
    expect(result.success).toBe(true)
    expect(result.count).toBe(2)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    // One delete (prune removed locales) + one insert per row.
    expect(mockTxDelete).toHaveBeenCalledTimes(1)
    expect(mockTxInsert).toHaveBeenCalledTimes(2)
    expect(mockTxInsertConflict).toHaveBeenCalledTimes(2)
  })

  it('deletes all rows for the post when given an empty array', async () => {
    const result = await syncPostTranslations(POST, [])
    expect(result.success).toBe(true)
    expect(result.count).toBe(0)
    expect(mockTxDelete).toHaveBeenCalledTimes(1)
    expect(mockTxInsert).not.toHaveBeenCalled()
  })

  it('treats undefined translations as an empty set (idempotent no-op prune)', async () => {
    const result = await syncPostTranslations(POST, undefined)
    expect(result.success).toBe(true)
    expect(result.count).toBe(0)
  })

  it('rejects a duplicated locale', async () => {
    const result = await syncPostTranslations(POST, [
      { locale: 'en', title: 'A', content: 'a' },
      { locale: 'en', title: 'B', content: 'b' },
    ])
    expect(result.success).toBe(false)
    expect(mockTransaction).not.toHaveBeenCalled()
  })
})
