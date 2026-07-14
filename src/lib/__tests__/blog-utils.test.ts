/**
 * Tests for lib/blog-utils.ts — reading time estimation.
 *
 * Mission-relevant: reading time appears on blog posts. If getReadingTime
 * returns 0 for a non-empty post, the UI shows "0 min read". If it
 * returns 1 for an empty string, the estimate is misleading.
 *
 * Behaviors locked:
 *   getReadingTime
 *   - returns 1 for very short content (less than 200 words)
 *   - returns correct ceil for content exceeding one minute
 *   - treats leading/trailing whitespace as empty for word splitting
 *   - returns 1 for a single word
 */

import { getReadingTime, paginateBlogIndex, slugifyCategory } from '../blog-utils'

describe('getReadingTime', () => {
  it('returns 1 for a single word', () => {
    expect(getReadingTime('Hello')).toBe(1)
  })

  it('returns 1 for content under 200 words', () => {
    // 100-word content → Math.ceil(100/200) = 1
    const words = Array(100).fill('word').join(' ')
    expect(getReadingTime(words)).toBe(1)
  })

  it('returns 1 for exactly 200 words', () => {
    const words = Array(200).fill('word').join(' ')
    expect(getReadingTime(words)).toBe(1)
  })

  it('returns 2 for 201 words', () => {
    const words = Array(201).fill('word').join(' ')
    expect(getReadingTime(words)).toBe(2)
  })

  it('returns 5 for a 1000-word article', () => {
    const words = Array(1000).fill('word').join(' ')
    expect(getReadingTime(words)).toBe(5)
  })

  it('returns correct ceiling for non-even multiples', () => {
    // 450 words → Math.ceil(450/200) = Math.ceil(2.25) = 3
    const words = Array(450).fill('word').join(' ')
    expect(getReadingTime(words)).toBe(3)
  })

  it('ignores surrounding whitespace', () => {
    // Content with leading/trailing spaces should not produce extra empty tokens
    const words = '  ' + Array(199).fill('word').join(' ') + '  '
    expect(getReadingTime(words)).toBe(1)
  })
})

const posts = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`)

describe('paginateBlogIndex', () => {
  it('page 1: hero + up to 3 featured + first pageSize latest', () => {
    const r = paginateBlogIndex(posts(20), 1, 5)
    expect(r.heroPost).toBe('p0')
    expect(r.featuredPosts).toEqual(['p1', 'p2', 'p3'])
    expect(r.latestPosts).toEqual(['p4', 'p5', 'p6', 'p7', 'p8'])
    expect(r.latestTotal).toBe(16)
    // 16 latest, 5 on page 1 → 11 remaining → 3 more pages
    expect(r.totalPages).toBe(4)
  })

  it('page 2 continues after page 1 slice with no hero/featured', () => {
    const r = paginateBlogIndex(posts(20), 2, 5)
    expect(r.heroPost).toBeNull()
    expect(r.featuredPosts).toEqual([])
    expect(r.latestPosts).toEqual(['p9', 'p10', 'p11', 'p12', 'p13'])
  })

  it('last page holds the remainder', () => {
    const r = paginateBlogIndex(posts(20), 4, 5)
    expect(r.latestPosts).toEqual(['p19'])
  })

  it('no post renders twice and nothing is dropped across pages', () => {
    const all = [1, 2, 3, 4].flatMap((p) => paginateBlogIndex(posts(20), p, 5).latestPosts)
    expect(all).toEqual(posts(20).slice(4))
  })

  it('clamps out-of-range and invalid pages', () => {
    expect(paginateBlogIndex(posts(20), 99, 5).currentPage).toBe(4)
    expect(paginateBlogIndex(posts(20), 0, 5).currentPage).toBe(1)
    expect(paginateBlogIndex(posts(20), NaN, 5).currentPage).toBe(1)
  })

  it('few posts → single page, no crash', () => {
    const r = paginateBlogIndex(posts(2), 1, 5)
    expect(r.heroPost).toBe('p0')
    expect(r.featuredPosts).toEqual(['p1'])
    expect(r.latestPosts).toEqual([])
    expect(r.totalPages).toBe(1)
  })

  it('empty list → empty page', () => {
    const r = paginateBlogIndex([], 1, 5)
    expect(r.heroPost).toBeNull()
    expect(r.totalPages).toBe(1)
  })
})

describe('slugifyCategory', () => {
  it('matches the index page fallback slugification', () => {
    expect(slugifyCategory('Open Source')).toBe('open-source')
    expect(slugifyCategory('Nachhaltigkeit')).toBe('nachhaltigkeit')
  })
})
