/**
 * Tests for lib/blog-access.ts — the `audience` access-control axis.
 *
 * Mission-relevant: `audience` decides WHO may load a post at all (public /
 * team / author). It is the single gate reused by every read surface (index,
 * post page, RSS, sitemap, comments). A regression here would either leak a
 * restricted post or hide a public one — both are silent, so the truth table
 * is locked below.
 *
 * Behaviors locked:
 *   public — everyone, including anonymous
 *   team   — logged-in staff only
 *   author — the author (matching authorId) + super admins only
 *   author post with no authorId (file post) — super admins only
 *   filterViewable strips exactly the non-viewable posts
 */

import { canViewPost, filterViewable, type BlogViewer } from '@/lib/blog-access'
import type { BlogPost } from '@/lib/blog'

// canViewPost only reads `audience` + `authorId`; the rest of BlogPost is irrelevant.
const post = (audience: BlogPost['audience'], authorId?: string) =>
  ({ audience, authorId } as unknown as BlogPost)

const anon = null
const regularUser: BlogViewer = { userId: 'u-reg', isStaff: false, email: 'r@example.ch' }
const staff: BlogViewer = { userId: 'u-staff', isStaff: true, email: 's@example.ch' }
const author: BlogViewer = { userId: 'u-author', isStaff: true, email: 'a@example.ch' }
const otherStaff: BlogViewer = { userId: 'u-other', isStaff: true, email: 'o@example.ch' }
const superAdmin: BlogViewer = { userId: 'u-super', isStaff: true, email: 'sa@example.ch', isSuperAdmin: true }

describe('canViewPost', () => {
  it('public: visible to everyone, including anonymous', () => {
    expect(canViewPost(post('public'), anon)).toBe(true)
    expect(canViewPost(post('public'), regularUser)).toBe(true)
    expect(canViewPost(post('public'), staff)).toBe(true)
  })

  it('team: visible to staff only', () => {
    expect(canViewPost(post('team'), anon)).toBe(false)
    expect(canViewPost(post('team'), regularUser)).toBe(false)
    expect(canViewPost(post('team'), staff)).toBe(true)
  })

  it('author: visible to the author and super-admins only', () => {
    const p = post('author', 'u-author')
    expect(canViewPost(p, anon)).toBe(false)
    expect(canViewPost(p, author)).toBe(true)
    expect(canViewPost(p, otherStaff)).toBe(false)
    expect(canViewPost(p, superAdmin)).toBe(true)
  })

  it('author post with no authorId (file post): super-admins only', () => {
    const p = post('author')
    expect(canViewPost(p, author)).toBe(false)
    expect(canViewPost(p, superAdmin)).toBe(true)
  })
})

describe('filterViewable', () => {
  const posts = [post('public'), post('team'), post('author', 'u-author')]

  it('anonymous sees public only', () => {
    expect(filterViewable(posts, anon)).toHaveLength(1)
  })

  it('a staff member who is not the author sees public + team', () => {
    expect(filterViewable(posts, staff)).toHaveLength(2)
  })

  it('the author sees all three (public + team + own author post)', () => {
    expect(filterViewable(posts, author)).toHaveLength(3)
  })
})
