import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { blogComments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiError, apiUnauthorized, apiNotFound, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { COMMENT_STATUS, type CommentStatus } from '@/config/blog-comments'

interface RouteCtx {
  params: Promise<{ id: string }>
}

/**
 * Moderate a comment — staff-only. Sets status to hidden/visible so a comment
 * can be pulled from public view without hard-deleting it (reversible). The
 * public thread already filters to status = visible.
 */
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return apiUnauthorized('Nicht angemeldet.')
    if (!session.user.isStaff) return apiForbidden('Nur das Team kann Kommentare moderieren.')

    const json = (await req.json().catch(() => ({}))) as { status?: unknown }
    const status = String(json.status ?? '') as CommentStatus
    if (status !== COMMENT_STATUS.VISIBLE && status !== COMMENT_STATUS.HIDDEN) {
      return apiBadRequest('Ungültiger Status.')
    }

    const [updated] = await db
      .update(blogComments)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(blogComments.id, id))
      .returning({ id: blogComments.id, status: blogComments.status })
    if (!updated) return apiNotFound('Kommentar nicht gefunden.')

    logger.info('Blog comment moderated', { id, status, by: session.user.id })
    return apiSuccess({ comment: updated })
  } catch (error) {
    logger.error('Blog comment PATCH failed', { error })
    return apiError(null, 'Failed to moderate comment', 500)
  }
}

/** Delete a comment — allowed for its author or any staff member (moderation). */
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) return apiUnauthorized('Nicht angemeldet.')

    const [comment] = await db
      .select({ userId: blogComments.userId })
      .from(blogComments)
      .where(eq(blogComments.id, id))
    if (!comment) return apiNotFound('Kommentar nicht gefunden.')

    const isAuthor = comment.userId === session.user.id
    if (!isAuthor && !session.user.isStaff) {
      return apiForbidden('Nur der Autor oder das Team kann diesen Kommentar löschen.')
    }

    await db.delete(blogComments).where(eq(blogComments.id, id))
    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Blog comment DELETE failed', { error })
    return apiError(null, 'Failed to delete comment', 500)
  }
}
