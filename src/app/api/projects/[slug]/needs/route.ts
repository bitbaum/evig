/**
 * GET /api/projects/[slug]/needs — Public list of open needs for a project.
 *
 * Used by the project detail page (e.g. /projects/upcycling) to render the
 * "what we need" section with per-need "I can help" CTAs.
 */

import { NextRequest } from 'next/server'
import { db } from '@/db'
import { projects, projectNeeds } from '@/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { NEED_STATUSES } from '@/config/projects'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params
    if (!slug) return apiNotFound('Projekt')

    const [project] = await db
      .select({ id: projects.id, isActive: projects.isActive })
      .from(projects)
      .where(eq(projects.slug, slug))

    if (!project || !project.isActive) return apiNotFound('Projekt')

    const needs = await db
      .select({
        id: projectNeeds.id,
        type: projectNeeds.type,
        title: projectNeeds.title,
        description: projectNeeds.description,
        targetQuantity: projectNeeds.targetQuantity,
        targetUnit: projectNeeds.targetUnit,
        status: projectNeeds.status,
      })
      .from(projectNeeds)
      .where(and(
        eq(projectNeeds.projectId, project.id),
        eq(projectNeeds.status, NEED_STATUSES.OPEN),
      ))
      .orderBy(asc(projectNeeds.sortOrder))

    return apiSuccess(needs)
  } catch (error) {
    logger.error('Failed to fetch project needs', { error })
    return apiError(error, 'Fehler beim Laden der Projekt-Bedarfe')
  }
}
