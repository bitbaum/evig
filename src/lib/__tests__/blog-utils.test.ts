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

import { getReadingTime } from '../blog-utils'

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
