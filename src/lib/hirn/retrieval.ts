/**
 * Hirn Vector Retrieval
 *
 * Semantic search over document chunks using pgvector.
 * Returns relevant context for RAG queries.
 */

import { query } from '@/lib/auth/db'
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

  // Build the query with optional filters
  let filterClauses = ''
  const params: (string | string[] | number)[] = [
    `[${queryEmbedding.join(',')}]`,
    minSimilarity,
    topK,
  ]
  let paramIndex = 4

  if (sourceTypes && sourceTypes.length > 0) {
    filterClauses += ` AND d.source_type = ANY($${paramIndex})`
    params.push(sourceTypes)
    paramIndex++
  }

  if (sourcePaths && sourcePaths.length > 0) {
    // Support LIKE patterns in paths
    const pathConditions = sourcePaths
      .map(() => {
        const condition = `d.source_path LIKE $${paramIndex}`
        paramIndex++
        return condition
      })
      .join(' OR ')
    filterClauses += ` AND (${pathConditions})`
    params.push(...sourcePaths)
  }

  const sql = `
    SELECT
      c.id as chunk_id,
      c.document_id,
      c.content,
      c.metadata as chunk_metadata,
      1 - (c.embedding <=> $1::vector) as similarity,
      d.source_path,
      d.source_type,
      d.title
    FROM hirn_chunks c
    JOIN hirn_documents d ON c.document_id = d.id
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> $1::vector) >= $2
      ${filterClauses}
    ORDER BY c.embedding <=> $1::vector
    LIMIT $3
  `

  const result = await query<{
    chunk_id: string
    document_id: string
    content: string
    chunk_metadata: Record<string, unknown>
    similarity: number
    source_path: string
    source_type: string
    title: string | null
  }>(sql, params)

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
    createdAt: Date
    indexedAt: Date | null
    chunkCount: number
  }>
  total: number
}> {
  const { limit = 50, offset = 0, sourceType } = options

  let whereClause = ''
  const params: (string | number)[] = [limit, offset]
  if (sourceType) {
    whereClause = 'WHERE d.source_type = $3'
    params.push(sourceType)
  }

  const docsResult = await query<{
    id: string
    source_path: string
    source_type: string
    title: string | null
    created_at: Date
    indexed_at: Date | null
    chunk_count: string
  }>(
    `SELECT
       d.id, d.source_path, d.source_type, d.title, d.created_at, d.indexed_at,
       COUNT(c.id) as chunk_count
     FROM hirn_documents d
     LEFT JOIN hirn_chunks c ON c.document_id = d.id
     ${whereClause}
     GROUP BY d.id
     ORDER BY d.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  )

  const countParams = sourceType ? [sourceType] : []
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM hirn_documents ${sourceType ? 'WHERE source_type = $1' : ''}`,
    countParams
  )

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
    total: parseInt(countResult.rows[0]?.count || '0'),
  }
}

/**
 * Delete a document and its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  await query(`DELETE FROM hirn_documents WHERE id = $1`, [documentId])
  logger.info('Document deleted', { documentId })
}
