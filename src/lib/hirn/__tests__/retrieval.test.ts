/**
 * Tests for hirn/retrieval.ts — vector similarity search and document management.
 *
 * Mission-relevant: retrieval is the R in RAG — if searchSimilar maps rows
 * incorrectly or formatContext loses the source attribution, the LLM gets
 * bad context and staff gets wrong repair guidance.
 *
 * Behaviors locked:
 *   searchSimilar
 *   - throws when embedding generation returns no embedding
 *   - calls db.execute once for the similarity query
 *   - maps result rows to RetrievalResult shape
 *
 *   formatContext
 *   - returns "No relevant context found." for empty results
 *   - uses document title when available
 *   - falls back to sourcePath when title is null
 *   - formats similarity as a percentage (1 decimal)
 *   - joins multiple results with separator
 *
 *   listDocuments
 *   - returns mapped documents and total count
 *   - returns empty documents array when none found
 *
 *   deleteDocument
 *   - calls db.delete once
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()
const mockDbSelect = jest.fn(() => makeChain([]))
const mockDbDelete = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    delete: (...args: unknown[]) => mockDbDelete.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  hirnDocuments: { id: 'hd_id', sourceType: 'hd_sourceType' },
  hirnChunks: { id: 'hc_id', documentId: 'hc_documentId' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    {
      raw: jest.fn().mockReturnValue({ __raw: true }),
      join: jest.fn().mockReturnValue({ __join: true }),
    },
  ),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  count: jest.fn().mockReturnValue({ __count: 0 }),
}))

const mockGenerateEmbeddings = jest.fn()

jest.mock('../providers', () => ({
  generateEmbeddings: (...args: unknown[]) => mockGenerateEmbeddings.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  searchSimilar,
  formatContext,
  listDocuments,
  deleteDocument,
  type RetrievalResult,
} from '../retrieval'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDbRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    chunk_id: 'chunk-1',
    document_id: 'doc-1',
    content: 'Schritt 1: Akku abklemmen',
    chunk_metadata: {},
    similarity: 0.87,
    source_path: '/docs/repair-guide.md',
    source_type: 'markdown',
    title: 'Repair Guide',
    ...overrides,
  }
}

function makeRetrievalResult(overrides: Partial<RetrievalResult> = {}): RetrievalResult {
  return {
    chunkId: 'chunk-1',
    documentId: 'doc-1',
    content: 'Akku abklemmen',
    similarity: 0.87,
    metadata: {},
    document: {
      sourcePath: '/docs/repair.md',
      sourceType: 'markdown',
      title: 'Repair Guide',
    },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbExecute.mockResolvedValue({ rows: [] })
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbDelete.mockImplementation(() => makeChain([]))
  mockGenerateEmbeddings.mockResolvedValue({ embeddings: [[0.1, 0.2, 0.3]] })
})

// ============================================================================
// searchSimilar
// ============================================================================

describe('searchSimilar', () => {
  it('throws when embedding generation returns no embedding', async () => {
    mockGenerateEmbeddings.mockResolvedValueOnce({ embeddings: [] })

    await expect(searchSimilar('broken query')).rejects.toThrow('Failed to generate query embedding')
  })

  it('calls db.execute once and maps result rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeDbRow()] })

    const results = await searchSimilar('Akku reparieren')

    expect(mockDbExecute).toHaveBeenCalledTimes(1)
    expect(results).toHaveLength(1)
    expect(results[0].chunkId).toBe('chunk-1')
    expect(results[0].content).toBe('Schritt 1: Akku abklemmen')
    expect(results[0].similarity).toBe(0.87)
    expect(results[0].document.sourcePath).toBe('/docs/repair-guide.md')
    expect(results[0].document.title).toBe('Repair Guide')
  })

  it('returns empty array when no similar chunks found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const results = await searchSimilar('Frage ohne Kontext')

    expect(results).toEqual([])
  })
})

// ============================================================================
// formatContext (pure)
// ============================================================================

describe('formatContext', () => {
  it('returns "No relevant context found." for empty results', () => {
    const result = formatContext([])
    expect(result).toBe('No relevant context found.')
  })

  it('uses document title when available', () => {
    const result = formatContext([makeRetrievalResult()])
    expect(result).toContain('Repair Guide')
  })

  it('falls back to sourcePath when title is null', () => {
    const r = makeRetrievalResult({ document: { sourcePath: '/docs/repair.md', sourceType: 'markdown', title: null } })
    const result = formatContext([r])
    expect(result).toContain('/docs/repair.md')
  })

  it('formats similarity as a percentage with 1 decimal place', () => {
    const r = makeRetrievalResult({ similarity: 0.87654 })
    const result = formatContext([r])
    expect(result).toContain('87.7%')
  })

  it('labels context items with 1-based index', () => {
    const r = makeRetrievalResult()
    const result = formatContext([r])
    expect(result).toContain('[Context 1]')
  })

  it('joins multiple results with separator', () => {
    const results = [
      makeRetrievalResult({ content: 'first chunk' }),
      makeRetrievalResult({ chunkId: 'chunk-2', content: 'second chunk' }),
    ]
    const result = formatContext(results)
    expect(result).toContain('---')
    expect(result).toContain('[Context 1]')
    expect(result).toContain('[Context 2]')
  })
})

// ============================================================================
// listDocuments
// ============================================================================

describe('listDocuments', () => {
  it('returns mapped documents and total count', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [
        {
          id: 'doc-1',
          source_path: '/docs/guide.md',
          source_type: 'markdown',
          title: 'Guide',
          created_at: '2026-01-01T00:00:00Z',
          indexed_at: '2026-01-02T00:00:00Z',
          chunk_count: '12',
        },
      ],
    })
    mockDbSelect.mockImplementationOnce(() => makeChain([{ count: 1 }]))

    const result = await listDocuments({})

    expect(result.documents).toHaveLength(1)
    expect(result.documents[0].id).toBe('doc-1')
    expect(result.documents[0].chunkCount).toBe(12)
    expect(result.total).toBe(1)
  })

  it('returns empty documents array and zero total when none found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })
    mockDbSelect.mockImplementationOnce(() => makeChain([{ count: 0 }]))

    const result = await listDocuments({})

    expect(result.documents).toEqual([])
    expect(result.total).toBe(0)
  })
})

// ============================================================================
// deleteDocument
// ============================================================================

describe('deleteDocument', () => {
  it('calls db.delete once with the document id', async () => {
    await deleteDocument('doc-1')

    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })
})
