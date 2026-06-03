/**
 * Admin API for a single project need.
 *
 * PATCH  /api/admin/projects/[slug]/needs/[id]  — update fields/status
 * DELETE /api/admin/projects/[slug]/needs/[id]  — delete
 */

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects, projectNeeds } from '@/db/schema'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { NEED_TYPES, NEED_STATUSES } from '@/config/projects'
import { logger } from '@/lib/logger'

const NeedUpdateSchema = z.object({
  type: z.enum([
    NEED_TYPES.EXPERTISE,
    NEED_TYPES.HARDWARE,
    NEED_TYPES.PARTNER_INTRO,
    NEED_TYPES.FUNDING,
    NEED_TYPES.VOLUNTEER_TIME,
  ]).optional(),
  title: z.string().trim().min(2).max(300).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  targetQuantity: z.number().int().positive().optional().nullable(),
  targetUnit: z.string().trim().max(40).optional().nullable(),
  status: z.enum([
    NEED_STATUSES.OPEN,
    NEED_STATUSES.MATCHED,
    NEED_STATUSES.FULFILLED,
    NEED_STATUSES.ARCHIVED,
  ]).optional(),
  sortOrder: z.number().int().optional(),
})

async function findProjectAndNeed(slug: string, needId: string) {
  const [p] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug))
  if (!p) return null
  const [n] = await db
    .select()
    .from(projectNeeds)
    .where(and(eq(projectNeeds.id, needId), eq(projectNeeds.projectId, p.id)))
  if (!n) return null
  return { project: p, need: n }
}

export const PATCH = withAdmin<{ slug: string; id: string }>('projects', async (request, _session, ctx) => {
  try {
    const params = await Promise.resolve(ctx?.params)
    if (!params?.slug || !params?.id) return apiNotFound('Bedarf')

    const found = await findProjectAndNeed(params.slug, params.id)
    if (!found) return apiNotFound('Bedarf')

    const body = await request.json().catch(() => null)
    if (!body) return apiBadRequest('Ungültige Anfrage')

    const parsed = NeedUpdateSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)

    const [updated] = await db
      .update(projectNeeds)
      .set({ ...parsed.data, updatedAt: new Date().toISOString() })
      .where(eq(projectNeeds.id, params.id))
      .returning()

    return apiSuccess(updated)
  } catch (error) {
    logger.error('Admin need update failed', { error })
    return apiError(error, 'Fehler beim Speichern')
  }
})

export const DELETE = withAdmin<{ slug: string; id: string }>('projects', async (_request, _session, ctx) => {
  try {
    const params = await Promise.resolve(ctx?.params)
    if (!params?.slug || !params?.id) return apiNotFound('Bedarf')

    const found = await findProjectAndNeed(params.slug, params.id)
    if (!found) return apiNotFound('Bedarf')

    await db.delete(projectNeeds).where(eq(projectNeeds.id, params.id))
    return apiSuccess({ deleted: true })
  } catch (error) {
    logger.error('Admin need delete failed', { error })
    return apiError(error, 'Fehler beim Löschen')
  }
})
