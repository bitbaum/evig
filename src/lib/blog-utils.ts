/**
 * Blog utilities safe to import from client components
 * (no fs / server-only deps).
 */

const WORDS_PER_MINUTE = 200

/** Estimated reading time in minutes for a blog post body. */
export function getReadingTime(content: string): number {
  return Math.ceil(content.trim().split(/\s+/).length / WORDS_PER_MINUTE)
}

/**
 * Fallback slug for a category that only exists as a post frontmatter name
 * (no DB row). SSOT — the blog index and post-page category links must agree,
 * or the link from a post would filter on a slug the index never generates.
 */
export function slugifyCategory(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export interface BlogIndexPage<T> {
  heroPost: T | null
  featuredPosts: T[]
  latestPosts: T[]
  currentPage: number
  totalPages: number
  /** Total posts in the paginated "latest" section (after hero + featured). */
  latestTotal: number
}

/**
 * Slice the filtered post list into the index layout: page 1 shows
 * hero + up to 3 featured + the first `pageSize` latest posts; later pages
 * show only latest posts (no repeated hero/featured). Out-of-range pages
 * clamp to the valid range instead of rendering an empty page.
 */
export function paginateBlogIndex<T>(posts: T[], page: number, pageSize: number): BlogIndexPage<T> {
  const [hero, ...rest] = posts
  const featured = rest.slice(0, 3)
  const latest = rest.slice(3)
  const totalPages = Math.max(1, 1 + Math.ceil(Math.max(0, latest.length - pageSize) / pageSize))
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages)

  if (currentPage === 1) {
    return {
      heroPost: hero ?? null,
      featuredPosts: featured,
      latestPosts: latest.slice(0, pageSize),
      currentPage,
      totalPages,
      latestTotal: latest.length,
    }
  }
  const offset = pageSize + (currentPage - 2) * pageSize
  return {
    heroPost: null,
    featuredPosts: [],
    latestPosts: latest.slice(offset, offset + pageSize),
    currentPage,
    totalPages,
    latestTotal: latest.length,
  }
}
