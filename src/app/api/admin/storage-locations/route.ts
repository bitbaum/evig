/**
 * Storage Locations API
 *
 * GET  /api/admin/storage-locations  → active locations (for the erfassung picker)
 * POST /api/admin/storage-locations  → add a new location (inline "＋ Standort")
 *
 * Access: staff with the `products` section (same as erfassung, which owns the
 * picker). `kind` is validated against STORAGE_LOCATION_KINDS (config SSOT).
 */

import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { db } from '@/db'
import { storageLocations, users } from '@/db/schema'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { STORAGE_LOCATION_KIND_OPTIONS } from '@/config/erfassung/storage-locations'

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name ist erforderlich').max(120),
  kind: z.enum(STORAGE_LOCATION_KIND_OPTIONS as [string, ...string[]]),
  holder_user_id: z.string().uuid().optional().nullable(),
})

export const GET = withAdmin('products', async () => {
  try {
    const rows = await db
      .select({
        id: storageLocations.id,
        name: storageLocations.name,
        kind: storageLocations.kind,
        holder_user_id: storageLocations.holderUserId,
        holder_name: users.name,
      })
      .from(storageLocations)
      .leftJoin(users, eq(users.id, storageLocations.holderUserId))
      .where(eq(storageLocations.isActive, true))
      .orderBy(asc(storageLocations.kind), asc(storageLocations.name))

    return apiSuccess({ locations: rows })
  } catch (error) {
    return apiError(error, 'Standorte konnten nicht geladen werden')
  }
})

export const POST = withAdmin('products', async (request, session) => {
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)
    }
    const { name, kind, holder_user_id } = parsed.data

    // member_possession locations should name a holder; others should not.
    const holderId = kind === 'member_possession' ? (holder_user_id ?? null) : null

    const [created] = await db
      .insert(storageLocations)
      .values({ name, kind, holderUserId: holderId, createdBy: session.user.id })
      .returning({
        id: storageLocations.id,
        name: storageLocations.name,
        kind: storageLocations.kind,
        holder_user_id: storageLocations.holderUserId,
      })

    return apiSuccess({ location: created }, 201)
  } catch (error) {
    return apiError(error, 'Standort konnte nicht erstellt werden')
  }
})
