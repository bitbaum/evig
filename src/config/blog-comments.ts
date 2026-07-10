/**
 * Blog comments config (SSOT). Status lives here + zod at the write boundary,
 * not in a SQL CHECK (migration-110 policy).
 */
export const COMMENT_BODY_MAX = 2000
export const COMMENT_BODY_MIN = 2

export const COMMENT_STATUS = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
} as const

export type CommentStatus = (typeof COMMENT_STATUS)[keyof typeof COMMENT_STATUS]
