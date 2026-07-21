/**
 * Content access-control (domain layer — no JSX, no HTTP).
 *
 * SSOT decision for the `audience` axis (blog posts + presentation decks):
 * whether a given viewer may load a piece of content at all. Reused at every
 * read/serve surface so access is decided in exactly one place.
 *
 * `ownerId` is the content's owner (blog post `created_by`, or a deck owner).
 * Content with no owner (file posts, config-defined decks) treats `author`
 * audience as super-admins only.
 */

import type { ContentAudience } from '@/config/content-audience'
import { isSuperAdmin } from '@/lib/permissions'

export interface AudienceViewer {
  userId?: string | null
  isStaff?: boolean
  email?: string | null
  isSuperAdmin?: boolean
}

export function canAccessAudience(
  audience: ContentAudience,
  viewer: AudienceViewer | null,
  ownerId?: string | null,
): boolean {
  switch (audience) {
    case 'team':
      return Boolean(viewer?.isStaff)
    case 'author':
      return Boolean(
        viewer &&
          ((ownerId && viewer.userId === ownerId) ||
            isSuperAdmin(viewer.email, viewer.isSuperAdmin)),
      )
    default:
      return true
  }
}
