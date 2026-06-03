/**
 * Admin API for project needs CRUD.
 *
 * GET   /api/admin/projects/[slug]/needs       — list all needs (any status)
 * POST  /api/admin/projects/[slug]/needs       — create new need
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { projects, projectNeeds } from '@/db/schema'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { NEED_TYPES, NEED_STATUSES } from '@/config/projects'
import { logger } from '@/lib/logger'

const NeedCreateSchema = z.object({
  type: z.enum([
    NEED_TYPES.EXPERTISE,
    NEED_TYPES.HARDWARE,
    NEED_TYPES.PARTNER_INTRO,
    NEED_TYPES.FUNDING,
    NEED_TYPES.VOLUNTEER_TIME,
  ]),
  title: z.string().trim().min(2).max(300),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  targetQuantity: z.number().int().positive().optional().nullable(),
  targetUnit: z.string().trim().max(40).optional().or(z.literal('')),
  status: z.enum([
    NEED_STATUSES.OPEN,
    NEED_STATUSES.MATCHED,
    NEED_STATUSES.FULFILLED,
    NEED_STATUSES.ARCHIVED,
  ]).optional().default(NEED_STATUSES.OPEN),
  sortOrder: z.number().int().optional().default(0),
})

async function findProject(slug: string) {
  const [p] = await db.select({ id: projects.id }).from(projects).where(eq(projects.slug, slug))
  return p
}

export const GET = withAdmin<{ slug: string }>('projects', async (_request, _session, ctx) => {
  try {
    const params = await Promise.resolve(ctx?.params)
    const slug = params?.slug
    if (!slug) return apiNotFound('Projekt')

    const project = await findProject(slug)
    if (!project) return apiNotFound('Projekt')

    const items = await db
      .select()
      .from(projectNeeds)
      .where(eq(projectNeeds.projectId, project.id))
      .orderBy(asc(projectNeeds.sortOrder))

    return apiSuccess(items)
  } catch (error) {
    logger.error('Admin needs list failed', { error })
    return apiError(error, 'Fehler beim Laden')
  }
})

export const POST = withAdmin<{ slug: string }>('projects', async (request, _session, ctx) => {
  try {
    const params = await Promise.resolve(ctx?.params)
    const slug = params?.slug
    if (!slug) return apiNotFound('Projekt')

    const project = await findProject(slug)
    if (!project) return apiNotFound('Projekt')

    const body = await request.json().catch(() => null)
    if (!body) return apiBadRequest('Ungültige Anfrage')

    const parsed = NeedCreateSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)
    const d = parsed.data

    const [inserted] = await db
      .insert(projectNeeds)
      .values({
        projectId: project.id,
        type: d.type,
        title: d.title,
        description: d.description || null,
        targetQuantity: d.targetQuantity ?? null,
        targetUnit: d.targetUnit || null,
        status: d.status,
        sortOrder: d.sortOrder,
      })
      .returning()

    return apiSuccess(inserted, 201)
  } catch (error) {
    logger.error('Admin needs create failed', { error })
    return apiError(error, 'Fehler beim Erstellen')
  }
})
