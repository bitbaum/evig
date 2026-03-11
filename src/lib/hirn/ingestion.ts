/**
 * Hirn Document Ingestion Pipeline
 *
 * Handles ingesting documents into the RAG system:
 * 1. Parse and extract content
 * 2. Generate content hash for change detection
 * 3. Chunk the content
 * 4. Generate embeddings
 * 5. Store in database
 */

import * as crypto from 'crypto'
import * as fs from 'fs/promises'
import * as path from 'path'
import { db } from '@/db'
import { hirnDocuments, hirnChunks } from '@/db/schema'
import { eq, sql, count, max } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { chunkText, chunkMarkdown, chunkCode, type Chunk } from './chunking'
import { generateEmbeddings } from './providers'

export interface DocumentInput {
  sourcePath: string
  sourceType: 'markdown' | 'code' | 'text' | 'json'
  title?: string
  content: string
  metadata?: Record<string, unknown>
}

export interface IngestResult {
  documentId: string
  chunksCreated: number
  wasUpdated: boolean
}

/**
 * Generate SHA256 hash of content
 */
function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Ingest a single document
 */
export async function ingestDocument(input: DocumentInput): Promise<IngestResult> {
  const contentHash = hashContent(input.content)

  // Check if document exists and if content changed
  const existing = await db
    .select({ id: hirnDocuments.id, contentHash: hirnDocuments.contentHash })
    .from(hirnDocuments)
    .where(eq(hirnDocuments.sourcePath, input.sourcePath))

  let documentId: string
  let wasUpdated = false

  if (existing.length > 0) {
    const doc = existing[0]

    // If content hasn't changed, skip re-indexing
    if (doc.contentHash === contentHash) {
      logger.debug('Document unchanged, skipping', { sourcePath: input.sourcePath })
      return {
        documentId: doc.id,
        chunksCreated: 0,
        wasUpdated: false,
      }
    }

    // Content changed - update document and delete old chunks
    documentId = doc.id
    wasUpdated = true

    await db
      .update(hirnDocuments)
      .set({
        content: input.content,
        contentHash,
        title: input.title,
        metadata: input.metadata || {},
        updatedAt: sql`NOW()`,
        indexedAt: null,
      })
      .where(eq(hirnDocuments.id, documentId))

    // Delete old chunks
    await db.delete(hirnChunks).where(eq(hirnChunks.documentId, documentId))
  } else {
    // Create new document
    const [result] = await db
      .insert(hirnDocuments)
      .values({
        sourcePath: input.sourcePath,
        sourceType: input.sourceType,
        title: input.title,
        content: input.content,
        contentHash,
        metadata: input.metadata || {},
      })
      .returning({ id: hirnDocuments.id })

    documentId = result.id
  }

  // Chunk the content based on type
  let chunks: Chunk[]
  switch (input.sourceType) {
    case 'markdown':
      chunks = chunkMarkdown(input.content)
      break
    case 'code':
      const ext = path.extname(input.sourcePath).slice(1)
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        py: 'python',
        sql: 'sql',
      }
      chunks = chunkCode(input.content, langMap[ext] || 'text')
      break
    default:
      chunks = chunkText(input.content)
  }

  // Generate embeddings and store chunks
  if (chunks.length > 0) {
    const texts = chunks.map(c => c.content)

    // Generate embeddings in batches to avoid overwhelming the API
    const BATCH_SIZE = 10
    const allEmbeddings: number[][] = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)
      const response = await generateEmbeddings({ input: batch })
      allEmbeddings.push(...response.embeddings)
    }

    // Insert chunks with embeddings (use raw SQL for vector column)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = allEmbeddings[i]

      await db.execute(sql`
        INSERT INTO ${hirnChunks} (document_id, content, chunk_index, embedding, metadata)
        VALUES (${documentId}, ${chunk.content}, ${chunk.index}, ${`[${embedding.join(',')}]`}::vector, ${JSON.stringify(chunk.metadata || {})}::jsonb)
      `)
    }

    // Mark document as indexed
    await db
      .update(hirnDocuments)
      .set({ indexedAt: sql`NOW()` })
      .where(eq(hirnDocuments.id, documentId))
  }

  logger.info('Document ingested', {
    sourcePath: input.sourcePath,
    documentId,
    chunksCreated: chunks.length,
    wasUpdated,
  })

  return {
    documentId,
    chunksCreated: chunks.length,
    wasUpdated,
  }
}

/**
 * Ingest a file from disk
 */
export async function ingestFile(filePath: string): Promise<IngestResult> {
  const content = await fs.readFile(filePath, 'utf-8')
  const ext = path.extname(filePath).toLowerCase()
  const basename = path.basename(filePath, ext)

  // Determine source type from extension
  const typeMap: Record<string, DocumentInput['sourceType']> = {
    '.md': 'markdown',
    '.mdx': 'markdown',
    '.ts': 'code',
    '.tsx': 'code',
    '.js': 'code',
    '.jsx': 'code',
    '.py': 'code',
    '.sql': 'code',
    '.json': 'json',
    '.txt': 'text',
  }

  const sourceType = typeMap[ext] || 'text'

  // Extract title from markdown frontmatter or first heading
  let title = basename
  if (sourceType === 'markdown') {
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      title = titleMatch[1]
    }
  }

  return ingestDocument({
    sourcePath: filePath,
    sourceType,
    title,
    content,
    metadata: {
      extension: ext,
      basename,
    },
  })
}

/**
 * Ingest all files in a directory recursively
 */
export async function ingestDirectory(
  dirPath: string,
  options: {
    extensions?: string[]
    exclude?: string[]
    recursive?: boolean
  } = {}
): Promise<{ total: number; ingested: number; skipped: number; errors: string[] }> {
  const {
    extensions = ['.md', '.mdx', '.ts', '.tsx', '.js', '.jsx', '.py', '.sql', '.txt'],
    exclude = ['node_modules', '.git', 'dist', 'build', '.next'],
    recursive = true,
  } = options

  const results = {
    total: 0,
    ingested: 0,
    skipped: 0,
    errors: [] as string[],
  }

  async function processDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      // Skip excluded directories
      if (exclude.includes(entry.name)) {
        continue
      }

      if (entry.isDirectory() && recursive) {
        await processDir(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (!extensions.includes(ext)) {
          continue
        }

        results.total++

        try {
          const result = await ingestFile(fullPath)
          if (result.chunksCreated > 0 || result.wasUpdated) {
            results.ingested++
          } else {
            results.skipped++
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error)
          results.errors.push(`${fullPath}: ${errorMsg}`)
          logger.error('Failed to ingest file', { path: fullPath, error })
        }
      }
    }
  }

  await processDir(dirPath)

  logger.info('Directory ingestion complete', {
    dirPath,
    ...results,
  })

  return results
}

/**
 * Get ingestion stats
 */
export async function getIngestionStats(): Promise<{
  totalDocuments: number
  totalChunks: number
  lastIndexed: string | null
  byType: Record<string, number>
}> {
  const [docsCount] = await db.select({ count: count() }).from(hirnDocuments)
  const [chunksCount] = await db.select({ count: count() }).from(hirnChunks)
  const [lastIndexed] = await db.select({ max: max(hirnDocuments.indexedAt) }).from(hirnDocuments)

  const byTypeRows = await db
    .select({ sourceType: hirnDocuments.sourceType, count: count() })
    .from(hirnDocuments)
    .groupBy(hirnDocuments.sourceType)

  return {
    totalDocuments: docsCount?.count ?? 0,
    totalChunks: chunksCount?.count ?? 0,
    lastIndexed: lastIndexed?.max || null,
    byType: Object.fromEntries(
      byTypeRows.map(r => [r.sourceType, r.count])
    ),
  }
}
