/**
 * Content audience — access-control axis (SSOT), shared by blog posts and
 * presentation decks.
 *
 * Orthogonal to discoverability (`visibility` on blog posts; the noindex,
 * link-only nature of decks). `audience` decides WHO may load the content:
 *   public — anyone
 *   team   — logged-in staff (session.user.isStaff)
 *   author — the content's owner + super-admins
 *
 * App-validated (no SQL CHECK — migration-110 policy). Access is decided in one
 * place: `canAccessAudience` in `@/lib/content-access`.
 */

export const CONTENT_AUDIENCE = { PUBLIC: 'public', TEAM: 'team', AUTHOR: 'author' } as const
export type ContentAudience = (typeof CONTENT_AUDIENCE)[keyof typeof CONTENT_AUDIENCE]
export const CONTENT_AUDIENCE_VALUES = Object.values(CONTENT_AUDIENCE) as ContentAudience[]

/** Long labels for admin selects. */
export const CONTENT_AUDIENCE_LABELS: Record<ContentAudience, string> = {
  public: 'Öffentlich — für alle',
  team: 'Nur Team — angemeldete Mitarbeitende',
  author: 'Nur Autor — Autor und Super-Admins',
}

/** Short labels for badges/chips. */
export const CONTENT_AUDIENCE_SHORT: Record<ContentAudience, string> = {
  public: 'Öffentlich',
  team: 'Nur Team',
  author: 'Nur Autor',
}

export function parseContentAudience(v: unknown): ContentAudience {
  return CONTENT_AUDIENCE_VALUES.includes(v as ContentAudience) ? (v as ContentAudience) : 'public'
}
