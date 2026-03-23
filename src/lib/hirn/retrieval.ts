/**
 * Hirn Vector Retrieval
 *
 * Semantic search over document chunks using pgvector.
 * Returns relevant context for RAG queries.
 */

import { db } from '@/db'
import { hirnDocuments, hirnChunks } from '@/db/schema'
import { eq, sql, count, desc } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { generateEmbeddings } from './providers'

export interface RetrievalResult {
  chunkId: string
  documentId: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
  document: {
    sourcePath: string
    sourceType: string
    title: string | null
  }
}

export interface RetrievalOptions {
  topK?: number              // Number of results to return (default: 5)
  minSimilarity?: number     // Minimum similarity threshold (default: 0.5)
  sourceTypes?: string[]     // Filter by document types
  sourcePaths?: string[]     // Filter by specific paths (supports LIKE patterns)
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilar(
  queryText: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult[]> {
  const {
    topK = 5,
    minSimilarity = 0.5,
    sourceTypes,
    sourcePaths,
  } = options

  // Generate embedding for the query
  const embeddingResponse = await generateEmbeddings({ input: queryText })
  const queryEmbedding = embeddingResponse.embeddings[0]

  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding')
  }

  const embeddingLiteral = `[${queryEmbedding.join(',')}]`

  // Build optional filter chunks
  const filterParts: ReturnType<typeof sql>[] = []

  if (sourceTypes && sourceTypes.length > 0) {
    filterParts.push(sql`AND d.source_type IN (${sql.join(sourceTypes.map(t => sql`${t}`), sql`, `)})`)
  }

  if (sourcePaths && sourcePaths.length > 0) {
    const pathConditions = sourcePaths.map(p => sql`d.source_path LIKE ${p}`)
    filterParts.push(sql`AND (${sql.join(pathConditions, sql` OR `)})`)
  }

  const filterClause = filterParts.length > 0
    ? sql.join(filterParts, sql` `)
    : sql``

  const result = await db.execute<{
    chunk_id: string
    document_id: string
    content: string
    chunk_metadata: Record<string, unknown>
    similarity: number
    source_path: string
    source_type: string
    title: string | null
  }>(sql`
    SELECT
      c.id as chunk_id,
      c.document_id,
      c.content,
      c.metadata as chunk_metadata,
      1 - (c.embedding <=> ${embeddingLiteral}::vector) as similarity,
      d.source_path,
      d.source_type,
      d.title
    FROM ${hirnChunks} c
    JOIN ${hirnDocuments} d ON c.document_id = d.id
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> ${embeddingLiteral}::vector) >= ${minSimilarity}
      ${filterClause}
    ORDER BY c.embedding <=> ${embeddingLiteral}::vector
    LIMIT ${topK}
  `)

  logger.debug('Similarity search', {
    query: queryText.slice(0, 100),
    resultsFound: result.rows.length,
    topSimilarity: result.rows[0]?.similarity,
  })

  return result.rows.map(row => ({
    chunkId: row.chunk_id,
    documentId: row.document_id,
    content: row.content,
    similarity: row.similarity,
    metadata: row.chunk_metadata,
    document: {
      sourcePath: row.source_path,
      sourceType: row.source_type,
      title: row.title,
    },
  }))
}

/**
 * Format retrieved chunks as context for the LLM
 */
export function formatContext(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return 'No relevant context found.'
  }

  return results
    .map((r, i) => {
      const source = r.document.title || r.document.sourcePath
      return `[Context ${i + 1}] (${source}, similarity: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`
    })
    .join('\n\n---\n\n')
}

/**
 * Get all documents for browsing
 */
export async function listDocuments(options: {
  limit?: number
  offset?: number
  sourceType?: string
}): Promise<{
  documents: Array<{
    id: string
    sourcePath: string
    sourceType: string
    title: string | null
    createdAt: string
    indexedAt: string | null
    chunkCount: number
  }>
  total: number
}> {
  const { limit = 50, offset = 0, sourceType } = options

  const whereClause = sourceType
    ? sql`WHERE d.source_type = ${sourceType}`
    : sql``

  const docsResult = await db.execute<{
    id: string
    source_path: string
    source_type: string
    title: string | null
    created_at: string
    indexed_at: string | null
    chunk_count: string
  }>(sql`
    SELECT
      d.id, d.source_path, d.source_type, d.title, d.created_at, d.indexed_at,
      COUNT(c.id) as chunk_count
    FROM ${hirnDocuments} d
    LEFT JOIN ${hirnChunks} c ON c.document_id = d.id
    ${whereClause}
    GROUP BY d.id
    ORDER BY d.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  const countCondition = sourceType
    ? eq(hirnDocuments.sourceType, sourceType)
    : undefined

  const [countRow] = await db
    .select({ count: count() })
    .from(hirnDocuments)
    .where(countCondition)

  return {
    documents: docsResult.rows.map(d => ({
      id: d.id,
      sourcePath: d.source_path,
      sourceType: d.source_type,
      title: d.title,
      createdAt: d.created_at,
      indexedAt: d.indexed_at,
      chunkCount: parseInt(d.chunk_count),
    })),
    total: countRow?.count ?? 0,
  }
}

/**
 * Delete a document and its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await db.delete(hirnDocuments).where(eq(hirnDocuments.id, documentId))
  logger.info('Document deleted', { documentId })
}
