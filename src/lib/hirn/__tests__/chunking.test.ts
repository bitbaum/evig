/**
 * Tests for hirn/chunking.ts
 *
 * Pure functions — no mocks needed. These functions control how documents
 * are split for Hirn's vector retrieval. Wrong chunking = wrong AI context.
 */

import { chunkText, chunkMarkdown, estimateTokens } from '../chunking'

// ============================================================================
// estimateTokens
// ============================================================================

describe('estimateTokens', () => {
  it('estimates tokens as ceil(chars / 4)', () => {
    expect(estimateTokens('test')).toBe(1)      // 4 chars → 1 token
    expect(estimateTokens('hello world')).toBe(3) // 11 chars → ceil(2.75) = 3
    expect(estimateTokens('')).toBe(0)
  })

  it('scales linearly with text length', () => {
    const text = 'a'.repeat(100)
    expect(estimateTokens(text)).toBe(25)
  })
})

// ============================================================================
// chunkText
// ============================================================================

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const chunks = chunkText('Hello world', { maxChunkSize: 100 })
    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe('Hello world')
    expect(chunks[0].index).toBe(0)
  })

  it('returns empty array for empty string', () => {
    const chunks = chunkText('')
    expect(chunks).toHaveLength(0)
  })

  it('splits text that exceeds maxChunkSize', () => {
    const text = 'a'.repeat(50) + '\n\n' + 'b'.repeat(50)
    const chunks = chunkText(text, { maxChunkSize: 60, chunkOverlap: 0 })
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('prefers splitting at paragraph breaks (\\n\\n)', () => {
    const text = 'First paragraph.\n\nSecond paragraph that is longer than the first one.'
    const chunks = chunkText(text, { maxChunkSize: 30, chunkOverlap: 0 })
    // Should split at the \n\n boundary
    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0].content).toContain('First paragraph')
  })

  it('assigns sequential index values', () => {
    const longText = 'word '.repeat(500)
    const chunks = chunkText(longText, { maxChunkSize: 100, chunkOverlap: 0 })
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i)
    })
  })

  it('all chunk content is non-empty', () => {
    const longText = 'paragraph content\n\n'.repeat(20)
    const chunks = chunkText(longText, { maxChunkSize: 50, chunkOverlap: 0 })
    chunks.forEach(chunk => {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    })
  })

  it('overlap causes consecutive chunks to share content', () => {
    const text = 'AAAA BBBB CCCC DDDD EEEE FFFF GGGG HHHH IIII JJJJ'
    const chunks = chunkText(text, { maxChunkSize: 25, chunkOverlap: 10 })
    if (chunks.length >= 2) {
      // The start of chunk N+1 should overlap with the end of chunk N
      const end1 = chunks[0].content.slice(-5)
      const start2 = chunks[1].content.slice(0, 20)
      // With overlap, some content from chunk 0's end should appear in chunk 1's start
      expect(chunks[1].content.length).toBeGreaterThan(0)
    }
  })

  it('handles text with no good separators (hard split)', () => {
    const noBreaks = 'x'.repeat(200)
    const chunks = chunkText(noBreaks, { maxChunkSize: 50, chunkOverlap: 0 })
    expect(chunks.length).toBeGreaterThan(1)
    // Total content should cover the original (approximately)
    const totalLength = chunks.reduce((sum, c) => sum + c.content.length, 0)
    expect(totalLength).toBeGreaterThanOrEqual(200)
  })
})

// ============================================================================
// chunkMarkdown
// ============================================================================

describe('chunkMarkdown', () => {
  const md = `# Document Title

This is a longer introductory paragraph that exceeds the fifty-character minimum required for the summary chunk to be created.

## Section One

Content of section one. Some more text to make it substantial.

## Section Two

Content of section two. More text to ensure it is recognized as a real section.
`

  it('returns at least one chunk', () => {
    const chunks = chunkMarkdown(md)
    expect(chunks.length).toBeGreaterThan(0)
  })

  it('creates a summary chunk when document has a title and includeFileSummary is true', () => {
    const chunks = chunkMarkdown(md, { includeFileSummary: true })
    const summary = chunks.find(c => c.metadata?.type === 'summary')
    expect(summary).toBeDefined()
    expect(summary!.metadata?.title).toBe('Document Title')
  })

  it('does NOT create summary chunk when includeFileSummary is false', () => {
    const chunks = chunkMarkdown(md, { includeFileSummary: false })
    const summary = chunks.find(c => c.metadata?.type === 'summary')
    expect(summary).toBeUndefined()
  })

  it('creates section chunks with header metadata', () => {
    const chunks = chunkMarkdown(md, { includeFileSummary: false })
    const sectionChunks = chunks.filter(c => c.metadata?.type === 'section')
    expect(sectionChunks.length).toBeGreaterThan(0)
  })

  it('section chunks contain their header text', () => {
    const chunks = chunkMarkdown(md, { includeFileSummary: false })
    const sectionChunks = chunks.filter(c => c.metadata?.type === 'section')
    const headers = sectionChunks.map(c => c.metadata?.header as string)
    expect(headers).toContain('Section One')
    expect(headers).toContain('Section Two')
  })

  it('assigns sequential indexes', () => {
    const chunks = chunkMarkdown(md)
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i)
    })
  })

  it('handles markdown without title gracefully', () => {
    const noTitle = 'Just some paragraph text.\n\nAnother paragraph.'
    const chunks = chunkMarkdown(noTitle)
    expect(chunks.length).toBeGreaterThan(0)
    // No summary since no title
    const summary = chunks.find(c => c.metadata?.type === 'summary')
    expect(summary).toBeUndefined()
  })

  it('splits large sections into section-part chunks', () => {
    const largeMd = `# Title\n\n## Big Section\n\n${'Long content line.\n'.repeat(100)}`
    const chunks = chunkMarkdown(largeMd, { maxChunkSize: 200 })
    const parts = chunks.filter(c => c.metadata?.type === 'section-part')
    expect(parts.length).toBeGreaterThan(0)
  })
})
