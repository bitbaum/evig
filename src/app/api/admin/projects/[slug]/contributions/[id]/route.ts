/**
 * Admin API: PATCH a contribution's triage status / notes.
 */

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects, projectContributions } from '@/db/schema'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { CONTRIBUTION_STATUSES } from '@/config/projects'
import { logger } from '@/lib/logger'

const PatchSchema = z.object({
  status: z.enum([
    CONTRIBUTION_STATUSES.NEW,
    CONTRIBUTION_STATUSES.CONTACTED,
    CONTRIBUTION_STATUSES.ACCEPTED,
    CONTRIBUTION_STATUSES.DECLINED,
  ]).optional(),
  internalNotes: z.string().trim().max(4000).optional().nullable(),
})

export const PATCH = withAdmin<{ slug: string; id: string }>('projects', async (request, session, ctx) => {
  try {
    const params = await Promise.resolve(ctx?.params)
    if (!params?.slug || !params?.id) return apiNotFound('Beitrag')

    const [project] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, params.slug))
    if (!project) return apiNotFound('Projekt')

    const [existing] = await db
      .select({ id: projectContributions.id })
      .from(projectContributions)
      .where(and(
        eq(projectContributions.id, params.id),
        eq(projectContributions.projectId, project.id),
      ))
    if (!existing) return apiNotFound('Beitrag')

    const body = await request.json().catch(() => null)
    if (!body) return apiBadRequest('Ungültige Anfrage')

    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)

    const update: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    }
    // Stamp responder when status moves off 'new' for the first time.
    if (parsed.data.status && parsed.data.status !== CONTRIBUTION_STATUSES.NEW) {
      update.respondedBy = session.user.id
      update.respondedAt = new Date().toISOString()
    }

    const [updated] = await db
      .update(projectContributions)
      .set(update)
      .where(eq(projectContributions.id, params.id))
      .returning()

    return apiSuccess(updated)
  } catch (error) {
    logger.error('Admin contribution patch failed', { error })
    return apiError(error, 'Fehler beim Speichern')
  }
})
