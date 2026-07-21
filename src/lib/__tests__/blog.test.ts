/**
 * @jest-environment node
 */

/**
 * Tests for the blog file-system loader (lib/blog.ts) and reading-time
 * helper (lib/blog-utils.ts).
 *
 * lib/blog.ts reads markdown files from content/posts/ and parses them
 * with neutral-matter. Two exports:
 *   getAllPosts() — directory scan, .md filter, frontmatter parse,
 *     published-only filter, date-sort newest-first, defaults for
 *     missing fields, dir-not-exist guard
 *   getPostBySlug(slug) — single-file read, returns null on any error
 *
 * lib/blog-utils.ts is the SSOT for reading-time:
 *   getReadingTime(content) — Math.ceil(words / 200)
 */

const mockExistsSync = jest.fn()
const mockReadFileSync = jest.fn()
const mockReaddirSync = jest.fn()
const mockStatSync = jest.fn()

jest.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync.apply(null, args),
  readFileSync: (...args: unknown[]) => mockReadFileSync.apply(null, args),
  readdirSync: (...args: unknown[]) => mockReaddirSync.apply(null, args),
  statSync: (...args: unknown[]) => mockStatSync.apply(null, args),
}))

import { getAllPosts, getPostBySlug } from '../blog'
import { getReadingTime } from '../blog-utils'
import { DEFAULT_BLOG_AUTHOR } from '@/config/org'

beforeEach(() => {
  mockExistsSync.mockReset()
  mockReadFileSync.mockReset()
  mockReaddirSync.mockReset()
  mockStatSync.mockReset()
})

// Helpers --------------------------------------------------------------------

function makeMd(frontmatter: Record<string, unknown>, body = 'Body text'): string {
  const lines = ['---']
  for (const [k, v] of Object.entries(frontmatter)) {
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map(item => `"${item}"`).join(', ')}]`)
    } else if (typeof v === 'string') {
      lines.push(`${k}: "${v}"`)
    } else {
      lines.push(`${k}: ${v}`)
    }
  }
  lines.push('---')
  lines.push(body)
  return lines.join('\n')
}

function makeStat(birthtime: Date) {
  return { birthtime }
}

// ============================================================================
// getReadingTime
// ============================================================================

describe('getReadingTime', () => {
  it('returns 1 for a single word (Math.ceil rounds up)', () => {
    expect(getReadingTime('hello')).toBe(1)
  })

  it('returns 1 for short text under 200 words', () => {
    const text = Array(50).fill('word').join(' ')
    expect(getReadingTime(text)).toBe(1)
  })

  it('returns 1 for exactly 200 words (200/200 = 1)', () => {
    const text = Array(200).fill('word').join(' ')
    expect(getReadingTime(text)).toBe(1)
  })

  it('returns 2 for 201 words (Math.ceil)', () => {
    const text = Array(201).fill('word').join(' ')
    expect(getReadingTime(text)).toBe(2)
  })

  it('returns 5 for ~1000 words', () => {
    const text = Array(1000).fill('word').join(' ')
    expect(getReadingTime(text)).toBe(5)
  })

  it('treats consecutive whitespace as a single delimiter', () => {
    // Three "words" separated by tabs/newlines/multiple spaces
    expect(getReadingTime('hello\t\tworld\n  there')).toBe(1)
  })

  it('trims leading/trailing whitespace before counting', () => {
    expect(getReadingTime('   word   ')).toBe(1)
  })

  it('empty string still returns 1 (split yields [""], length 1, ceil(1/200)=1)', () => {
    // This documents current behavior — empty input doesn't crash
    expect(getReadingTime('')).toBe(1)
  })
})

// ============================================================================
// getAllPosts — guards
// ============================================================================

describe('getAllPosts — guards', () => {
  it('returns [] when content/posts directory does not exist', () => {
    mockExistsSync.mockReturnValue(false)
    expect(getAllPosts()).toEqual([])
    expect(mockReaddirSync).not.toHaveBeenCalled()
  })

  it('returns [] when directory is empty', () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue([])
    expect(getAllPosts()).toEqual([])
  })

  it('ignores non-.md files in the posts directory', () => {
    mockExistsSync.mockReturnValue(true)
    mockReaddirSync.mockReturnValue(['post.md', 'README.txt', '.DS_Store', 'image.png'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'Post', published: true }))
    mockStatSync.mockReturnValue(makeStat(new Date('2025-01-01')))

    const posts = getAllPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0].slug).toBe('post')
  })
})

// ============================================================================
// getAllPosts — frontmatter parsing
// ============================================================================

describe('getAllPosts — frontmatter parsing', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue(makeStat(new Date('2025-01-15')))
  })

  it('uses slug from filename (without .md extension)', () => {
    mockReaddirSync.mockReturnValue(['my-first-post.md'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'Hi' }))
    expect(getAllPosts()[0].slug).toBe('my-first-post')
  })

  it('parses every documented frontmatter field', () => {
    mockReaddirSync.mockReturnValue(['p.md'])
    mockReadFileSync.mockReturnValue(makeMd({
      title: 'My Post',
      excerpt: 'Short summary',
      featuredImage: '/images/post.jpg',
      author: 'Anna',
      category: 'tech',
      tags: ['linux', 'open-source'],
      publishedAt: '2025-06-01',
    }, '# Heading\n\nParagraph'))

    const post = getAllPosts()[0]
    expect(post).toMatchObject({
      slug: 'p',
      title: 'My Post',
      excerpt: 'Short summary',
      featuredImage: '/images/post.jpg',
      author: 'Anna',
      category: 'tech',
      tags: ['linux', 'open-source'],
      publishedAt: '2025-06-01',
      published: true,
      body: expect.stringContaining('Heading'),
    })
  })

  it('defaults title to "Untitled" when missing', () => {
    mockReaddirSync.mockReturnValue(['p.md'])
    mockReadFileSync.mockReturnValue(makeMd({}))
    expect(getAllPosts()[0].title).toBe('Untitled')
  })

  it('defaults author to the SSOT default author when missing', () => {
    mockReaddirSync.mockReturnValue(['p.md'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'Anon' }))
    expect(getAllPosts()[0].author).toBe(DEFAULT_BLOG_AUTHOR)
  })

  it('defaults tags to [] when missing', () => {
    mockReaddirSync.mockReturnValue(['p.md'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'No tags' }))
    expect(getAllPosts()[0].tags).toEqual([])
  })

  it('defaults published to true when not specified (opt-out, not opt-in)', () => {
    mockReaddirSync.mockReturnValue(['p.md'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'Implicit publish' }))
    expect(getAllPosts()[0].published).toBe(true)
  })

  it('captures createdAt from file birthtime', () => {
    mockReaddirSync.mockReturnValue(['p.md'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'X' }))
    mockStatSync.mockReturnValue(makeStat(new Date('2024-03-15T10:00:00Z')))

    expect(getAllPosts()[0].createdAt).toBe('2024-03-15T10:00:00.000Z')
  })
})

// ============================================================================
// getAllPosts — published filter (mission-critical: drafts must NOT appear)
// ============================================================================

describe('getAllPosts — published filter', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockReturnValue(makeStat(new Date('2025-01-15')))
  })

  it('drops posts with published: false from the public list', () => {
    mockReaddirSync.mockReturnValue(['draft.md', 'live.md'])
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('draft.md')) return makeMd({ title: 'Draft', published: false })
      return makeMd({ title: 'Live', published: true })
    })

    const posts = getAllPosts()
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('Live')
  })

  it('keeps posts that omit "published" (defaults to true)', () => {
    mockReaddirSync.mockReturnValue(['post.md'])
    mockReadFileSync.mockReturnValue(makeMd({ title: 'Implicit' }))
    expect(getAllPosts()).toHaveLength(1)
  })
})

// ============================================================================
// getAllPosts — sort order
// ============================================================================

describe('getAllPosts — sort order', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(true)
  })

  it('sorts by publishedAt descending (newest first)', () => {
    mockReaddirSync.mockReturnValue(['old.md', 'new.md', 'mid.md'])
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('old.md')) return makeMd({ title: 'Old', publishedAt: '2024-01-01' })
      if (p.endsWith('mid.md')) return makeMd({ title: 'Mid', publishedAt: '2024-06-01' })
      return makeMd({ title: 'New', publishedAt: '2025-01-01' })
    })
    mockStatSync.mockReturnValue(makeStat(new Date('2025-12-01')))

    const titles = getAllPosts().map(p => p.title)
    expect(titles).toEqual(['New', 'Mid', 'Old'])
  })

  it('falls back to createdAt when publishedAt is missing', () => {
    mockReaddirSync.mockReturnValue(['a.md', 'b.md'])
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('a.md')) return makeMd({ title: 'A' }) // no publishedAt
      return makeMd({ title: 'B' })
    })
    mockStatSync.mockImplementation((p: string) => {
      if (p.endsWith('a.md')) return makeStat(new Date('2024-01-01'))
      return makeStat(new Date('2025-01-01'))
    })

    expect(getAllPosts().map(p => p.title)).toEqual(['B', 'A'])
  })
})

// ============================================================================
// getPostBySlug
// ============================================================================

describe('getPostBySlug', () => {
  it('returns the post when the file exists', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(makeMd({
      title: 'My Post',
      excerpt: 'Summary',
      author: 'Anna',
    }, '# Body'))
    mockStatSync.mockReturnValue(makeStat(new Date('2025-01-15')))

    const post = getPostBySlug('my-post')
    expect(post).not.toBeNull()
    expect(post!.slug).toBe('my-post')
    expect(post!.title).toBe('My Post')
    expect(post!.excerpt).toBe('Summary')
    expect(post!.author).toBe('Anna')
  })

  it('returns null when fs.readFileSync throws (file not found)', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(getPostBySlug('missing')).toBeNull()
  })

  it('returns null when fs.statSync throws', () => {
    mockReadFileSync.mockReturnValue(makeMd({ title: 'X' }))
    mockStatSync.mockImplementation(() => {
      throw new Error('EACCES')
    })
    expect(getPostBySlug('x')).toBeNull()
  })

  it('applies same defaults as getAllPosts (Untitled, default author, [], published=true)', () => {
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(makeMd({}, 'body'))
    mockStatSync.mockReturnValue(makeStat(new Date('2025-01-15')))

    const post = getPostBySlug('p')!
    expect(post.title).toBe('Untitled')
    expect(post.author).toBe(DEFAULT_BLOG_AUTHOR)
    expect(post.tags).toEqual([])
    expect(post.published).toBe(true)
  })

  it('exposes drafts (published=false) when fetched by slug — getPostBySlug does NOT filter', () => {
    // Critical: getAllPosts filters drafts out for the public listing,
    // but getPostBySlug must return them so the admin preview works
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(makeMd({ title: 'Draft', published: false }))
    mockStatSync.mockReturnValue(makeStat(new Date('2025-01-15')))

    const post = getPostBySlug('draft')!
    expect(post.published).toBe(false)
  })
})
