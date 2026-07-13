/**
 * Public share endpoint (no login) — reachable at /api/public/share/[token].
 *
 * GET  - public-safe deliverable + feedback thread (no owner email / internal ids)
 * POST - external reviewer adds feedback (requires a display name); notifies the
 *        owner's in-app bell via the service.
 *
 * Under /api/public/* so CSRF is not enforced (see src/proxy.ts) — a public
 * comment form is intentionally open to anyone holding the unguessable link.
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiSuccess, apiError, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { createPublicFeedbackSchema } from '@/lib/schemas/deliverables'
import { getDeliverableByToken, getFeedback, addFeedback } from '@/lib/services/deliverables'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ token: string }> }

/** Strip internal-only fields before returning to an unauthenticated viewer. */
function publicProjection(d: NonNullable<Awaited<ReturnType<typeof getDeliverableByToken>>>) {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    type: d.type,
    status: d.status,
    url: d.url,
    current_version: d.current_version,
    files: d.files,
    owner_name: d.owner_name,
    created_at: d.created_at,
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { token } = await params
    const deliverable = await getDeliverableByToken(token)
    if (!deliverable) return apiNotFound('Freigabe')

    const feedback = (await getFeedback(deliverable.id)).map((f) => ({
      id: f.id,
      kind: f.kind,
      status: f.status,
      target: f.target,
      body: f.body,
      author_name: f.author_name,
      created_at: f.created_at,
    }))

    return apiSuccess({ deliverable: publicProjection(deliverable), feedback })
  } catch (error) {
    logger.error('Error loading shared deliverable', { error })
    return apiError(error, 'Fehler beim Laden der Freigabe')
  }
}

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { token } = await params
    const deliverable = await getDeliverableByToken(token)
    if (!deliverable) return apiNotFound('Freigabe')

    const body = await request.json()
    const result = createPublicFeedbackSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const row = await addFeedback(deliverable.id, {
      kind: result.data.kind,
      body: result.data.body,
      target: result.data.target,
      authorName: result.data.author_name,
    })
    return apiSuccess({ id: row.id }, 201)
  } catch (error) {
    logger.error('Error adding external feedback', { error })
    return apiError(error, 'Fehler beim Speichern des Feedbacks')
  }
}
