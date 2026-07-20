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
import { isSuperAdmin } from '@/lib/permissions'

export interface BlogViewer {
  userId?: string | null
  isStaff?: boolean
  email?: string | null
  isSuperAdmin?: boolean
}

export function canViewPost(post: BlogPost, viewer: BlogViewer | null): boolean {
  switch (post.audience) {
    case 'team':
      return Boolean(viewer?.isStaff)
    case 'author':
      return Boolean(
        viewer &&
          ((post.authorId && viewer.userId === post.authorId) ||
            isSuperAdmin(viewer.email, viewer.isSuperAdmin)),
      )
    default:
      return true
  }
}

export function filterViewable(posts: BlogPost[], viewer: BlogViewer | null): BlogPost[] {
  return posts.filter((p) => canViewPost(p, viewer))
}
