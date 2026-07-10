import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { blogComments } from '@/db/schema'
import { users } from '@/db/schema'
import { and, eq, asc } from 'drizzle-orm'
import { apiSuccess, apiError, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { COMMENT_BODY_MAX, COMMENT_BODY_MIN, COMMENT_STATUS } from '@/config/blog-comments'
import { getPostBySlug as getDbPost } from '@/lib/blog-db'
import { getPostBySlug as getFilePost } from '@/lib/blog'

interface RouteCtx {
  params: Promise<{ slug: string }>
}

/** Public: list visible comments for a post, newest last (reads like a thread). */
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { slug } = await params
    const rows = await db
      .select({
        id: blogComments.id,
        body: blogComments.body,
        createdAt: blogComments.createdAt,
        userId: blogComments.userId,
        authorName: users.name,
        authorImage: users.image,
      })
      .from(blogComments)
      .innerJoin(users, eq(users.id, blogComments.userId))
      .where(and(eq(blogComments.postSlug, slug), eq(blogComments.status, COMMENT_STATUS.VISIBLE)))
      .orderBy(asc(blogComments.createdAt))
    return apiSuccess({ comments: rows })
  } catch (error) {
    logger.error('Blog comments GET failed', { error })
    return apiError(null, 'Failed to load comments', 500)
  }
}

/** Auth-required: any logged-in user can comment. Visible immediately. */
export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { slug } = await params
    const session = await auth()
    if (!session?.user?.id) return apiUnauthorized('Bitte melde dich an, um zu kommentieren.')

    // The slug must belong to a real post (DB or git/file) — no comments on garbage.
    const exists = (await getDbPost(slug)) || getFilePost(slug, 'de')
    if (!exists) return apiNotFound('Beitrag nicht gefunden.')

    const json = (await req.json().catch(() => ({}))) as { body?: unknown }
    const body = String(json.body ?? '').trim()
    if (body.length < COMMENT_BODY_MIN || body.length > COMMENT_BODY_MAX) {
      return apiBadRequest(`Kommentar muss zwischen ${COMMENT_BODY_MIN} und ${COMMENT_BODY_MAX} Zeichen lang sein.`)
    }

    const [row] = await db
      .insert(blogComments)
      .values({ postSlug: slug, userId: session.user.id, body })
      .returning({ id: blogComments.id, body: blogComments.body, createdAt: blogComments.createdAt })

    return apiSuccess({
      comment: {
        ...row,
        userId: session.user.id,
        authorName: session.user.name ?? null,
        authorImage: session.user.image ?? null,
      },
    })
  } catch (error) {
    logger.error('Blog comment POST failed', { error })
    return apiError(null, 'Failed to post comment', 500)
  }
}
