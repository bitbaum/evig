import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getDbUserId } from '@/lib/api/task-helpers'
import { createDeliverableSchema } from '@/lib/schemas/deliverables'
import { listDeliverables, createDeliverable, getDeliverable } from '@/lib/services/deliverables'
import { ingestDeliverable } from '@/lib/deliverables/ai'
import { logger } from '@/lib/logger'

export const GET = withAdmin('deliverables', async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const rows = await listDeliverables({
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      ownerUserId: searchParams.get('owner') ?? undefined,
    })
    return apiSuccess(rows)
  } catch (error) {
    logger.error('Error listing deliverables', { error, userId: session.user.id })
    return apiError(error, 'Fehler beim Laden der Liefergegenstände')
  }
})

export const POST = withAdmin('deliverables', async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const result = createDeliverableSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const userLookup = await getDbUserId(session)
    if ('error' in userLookup) return userLookup.error

    const row = await createDeliverable(userLookup.dbUserId, result.data)

    // Best-effort: index into the Hirn RAG store (never blocks the response).
    getDeliverable(row.id)
      .then((d) => (d ? ingestDeliverable(d) : undefined))
      .catch((error) => logger.warn('Deliverable ingest-on-create failed', { error, id: row.id }))

    return apiSuccess(row, 201)
  } catch (error) {
    logger.error('Error creating deliverable', { error, email: session.user.email })
    return apiError(error, 'Fehler beim Erstellen des Liefergegenstands')
  }
})
