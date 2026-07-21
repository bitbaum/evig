/**
 * Blog config (SSOT).
 */

/** Posts per page in the index "latest" section (hero + featured are extra on page 1). */
export const BLOG_PAGE_SIZE = 12

/** Posts per page in the admin blog list. */
export const ADMIN_BLOG_PAGE_SIZE = 50

// AUDIENCE — access-control axis. The SSOT lives in `@/config/content-audience`
// (shared with presentation decks). Re-exported here under the blog-specific
// names existing call sites already import.
export {
  CONTENT_AUDIENCE as BLOG_AUDIENCE,
  CONTENT_AUDIENCE_VALUES as BLOG_AUDIENCE_VALUES,
  CONTENT_AUDIENCE_LABELS as BLOG_AUDIENCE_LABELS,
  parseContentAudience as parseBlogAudience,
} from './content-audience'
export type { ContentAudience as BlogAudience } from './content-audience'
