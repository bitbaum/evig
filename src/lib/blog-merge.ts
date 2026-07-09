import { getAllPosts as getDbPosts } from '@/lib/blog-db'
import { getAllPosts as getFilePosts, type BlogPost } from '@/lib/blog'

/**
 * Unified blog read layer: git markdown files (`content/posts/*.md`, authored by
 * devs/agents) merged with DB posts (`blog_posts`, authored via the admin UI),
 * deduped by slug. On a slug collision the DB post wins (a staff edit in the UI
 * takes precedence over a same-named file). This is what makes an article show
 * up in BOTH the public blog and the admin list regardless of where it lives.
 */
export async function getMergedPosts(locale: string): Promise<BlogPost[]> {
  const dbPosts = await getDbPosts()
  const filePosts = getFilePosts(locale)
  const dbSlugs = new Set(dbPosts.map((p) => p.slug))
  const merged = [...dbPosts, ...filePosts.filter((p) => !dbSlugs.has(p.slug))]
  return merged.sort((a, b) => {
    const da = new Date(a.publishedAt || a.createdAt).getTime()
    const db = new Date(b.publishedAt || b.createdAt).getTime()
    return db - da
  })
}
