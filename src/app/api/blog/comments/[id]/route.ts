import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { blogComments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiError, apiUnauthorized, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

interface RouteCtx {
  params: Promise<{ id: string }>
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
