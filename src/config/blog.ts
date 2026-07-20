/**
 * Blog config (SSOT).
 */

/** Posts per page in the index "latest" section (hero + featured are extra on page 1). */
export const BLOG_PAGE_SIZE = 12

/** Posts per page in the admin blog list. */
export const ADMIN_BLOG_PAGE_SIZE = 50

// =============================================================================
// AUDIENCE — access-control axis (SSOT). Orthogonal to `visibility`
// (discoverability). `audience` decides WHO may load a post at all:
//   public — anyone · team — logged-in staff · author — author + super-admins.
// App-validated (no SQL CHECK — migration-110 policy).
// =============================================================================

export const BLOG_AUDIENCE = { PUBLIC: 'public', TEAM: 'team', AUTHOR: 'author' } as const
export type BlogAudience = (typeof BLOG_AUDIENCE)[keyof typeof BLOG_AUDIENCE]
export const BLOG_AUDIENCE_VALUES = Object.values(BLOG_AUDIENCE) as BlogAudience[]
export const BLOG_AUDIENCE_LABELS: Record<BlogAudience, string> = {
  public: 'Öffentlich — für alle',
  team: 'Nur Team — angemeldete Mitarbeitende',
  author: 'Nur Autor — Autor und Super-Admins',
}
export function parseBlogAudience(v: unknown): BlogAudience {
  return BLOG_AUDIENCE_VALUES.includes(v as BlogAudience) ? (v as BlogAudience) : 'public'
}
