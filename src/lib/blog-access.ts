/**
 * Blog access-control (domain layer — no JSX, no HTTP).
 *
 * SSOT for the `audience` axis: whether a given viewer may load a post at all.
 * Orthogonal to `visibility` (discoverability). Applied at EVERY read surface
 * (public index, post page, RSS, sitemap, comments) so access is decided in one
 * place. File posts have no `authorId`, so `author`-audience on a file post
 * safely falls through to super-admins only.
 */

import type { BlogPost } from '@/lib/blog'
import { canAccessAudience, type AudienceViewer } from '@/lib/content-access'

// A blog viewer is just an audience viewer — kept as a named alias so existing
// blog call sites can keep importing `BlogViewer`.
export type BlogViewer = AudienceViewer

export function canViewPost(post: BlogPost, viewer: BlogViewer | null): boolean {
  // Post access delegates to the shared audience rule (owner = the post author).
  return canAccessAudience(post.audience, viewer, post.authorId)
}

export function filterViewable(posts: BlogPost[], viewer: BlogViewer | null): BlogPost[] {
  return posts.filter((p) => canViewPost(p, viewer))
}
