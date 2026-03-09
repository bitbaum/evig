import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { locations } from '@/db/schema'
import { eq, and, ilike, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { LOCATION_STATUS } from '@/config/location-status'
import { validateBody, CreateLocationSchema } from '@/lib/schemas'

// GET /api/locations - List locations with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const city = searchParams.get('city')
    const status = searchParams.get('status') || LOCATION_STATUS.APPROVED
    const { limit, offset } = parsePagination(request)

    // Build conditions — DB uses is_approved boolean, map status param
    const conditions = []
    if (status === LOCATION_STATUS.APPROVED) {
      conditions.push(eq(locations.isApproved, true))
    } else if (status === LOCATION_STATUS.PENDING) {
      conditions.push(eq(locations.isApproved, false))
    }

    if (type) {
      conditions.push(eq(locations.type, type))
    }

    if (city) {
      conditions.push(ilike(locations.city, `%${city}%`))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select()
      .from(locations)
      .where(where)
      .orderBy(desc(locations.createdAt))
      .limit(limit)
      .offset(offset)

    const [countRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(locations)
      .where(where)

    const totalCount = Number(countRow?.total ?? 0)

    return apiSuccess({
      locations: rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    const validation = validateBody(CreateLocationSchema, body)
    if (!validation.success) return validation.error
    const {
      name,
      type,
      description,
      address_line1,
      address_line2,
      postal_code,
      city,
      canton,
      country,
      latitude,
      longitude,
      max_capacity,
      facilities,
      contact_name,
      contact_phone,
      contact_email
    } = validation.data

    // Check for duplicate locations in same area
    const [existingLocation] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(
        eq(locations.city, city),
        postal_code ? eq(locations.postalCode, postal_code) : sql`${locations.postalCode} IS NULL`,
        ilike(locations.name, name)
      ))

    if (existingLocation) {
      return apiBadRequest('Ein ähnlicher Ort existiert bereits in dieser Gegend')
    }

    // Create location
    const [newLocation] = await db
      .insert(locations)
      .values({
        name,
        type,
        description: description || undefined,
        addressLine1: address_line1 || undefined,
        addressLine2: address_line2 || undefined,
        postalCode: postal_code || undefined,
        city,
        canton: canton || undefined,
        country: country || undefined,
        latitude: latitude?.toString() || undefined,
        longitude: longitude?.toString() || undefined,
        maxCapacity: max_capacity || undefined,
        facilities: facilities || undefined,
        contactName: contact_name || undefined,
        contactPhone: contact_phone || undefined,
        contactEmail: contact_email || undefined,
      })
      .returning()

    return apiSuccess({
      location: newLocation,
      message: 'Ort erfolgreich erstellt und zur Genehmigung eingereicht'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
