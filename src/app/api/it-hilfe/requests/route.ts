import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { sql, getTableName, SQL, and, eq } from 'drizzle-orm'
import { itHilfeRequests } from '@/db/schema/itHilfe'
import { userSkills } from '@/db/schema/itHilfe'
import { repairerProfiles } from '@/db/schema/services'
import { users, userProfiles } from '@/db/schema/auth'
import { apiError, apiSuccess, apiSuccessCached, apiBadRequest, parsePagination , hasMoreItems} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import {
  getCategoryIds,
  getSkillIds,
  URGENCY_LEVELS,
  URGENCY_DEFAULT,
  SERVICE_TYPES,
  SERVICE_TYPE_DEFAULT,
  REQUEST_STATUS,
  deriveBudgetType,
  CLAIM_TOKEN_TTL_MS,
  IT_HILFE_PAGINATION,
} from '@/config/it-hilfe'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { isE2ETestAccountEmail } from '@/config/e2e-test-accounts'
import { sanitizeInput } from '@/lib/security/sanitize'
import { itHilfeRequestSchema, validateAndRespond } from '@/lib/schemas/it-hilfe'
import { type RequestRow, mapRequestListRow } from '@/lib/it-hilfe/request-mapper'
import { sendRequestCreatedNotifications } from '@/lib/it-hilfe/notifications'
import { canAcceptDirectItHilfeRequest } from '@/lib/domain/technician-visibility'
import { findOrCreateAnonymousUser } from '@/lib/it-hilfe/find-or-create-anonymous-user'
import { createPasswordResetToken } from '@/lib/auth/db-verification'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeAnonymousRequestClaim } from '@/lib/email/templates/it-hilfe'
import { APP_URL } from '@/config/urls'

// Table name refs
const rTable = getTableName(itHilfeRequests)
const uTable = getTableName(users)

/**
 * GET /api/it-hilfe/requests
 * Browse IT-Hilfe requests with filters (public)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const category = searchParams.get('category')
    const canton = searchParams.get('canton')
    const urgency = searchParams.get('urgency')
    const budgetType = searchParams.get('budgetType')
    const serviceType = searchParams.get('serviceType')
    const skill = searchParams.get('skill')
    const matchMySkills = searchParams.get('matchMySkills') === 'true'
    const search = searchParams.get('search')
    const status = searchParams.get('status') || REQUEST_STATUS.OPEN
    const { limit, offset } = parsePagination(request, IT_HILFE_PAGINATION)

    // Map frontend sort values to DB columns
    const sortMap: Record<string, string> = {
      newest: 'r.created_at DESC',
      urgent: 'r.urgency DESC',
      budget_high: 'r.budget_amount_cents DESC',
      offers: 'r.offer_count DESC',
    }
    const sortParam = searchParams.get('sort') || searchParams.get('sortBy') || 'newest'
    const sortClause = sortMap[sortParam] || sortMap.newest

    // Build WHERE conditions
    const conditions: SQL[] = [
      sql`r.status = ${status}`,
      sql`r.expires_at > NOW()`,
    ]

    if (category && getCategoryIds().includes(category)) {
      conditions.push(sql`r.category_id = ${category}`)
    }

    if (canton) {
      conditions.push(sql`r.canton = ${canton}`)
    }

    if (urgency && URGENCY_LEVELS.some(u => u.id === urgency)) {
      conditions.push(sql`r.urgency = ${urgency}`)
    }

    // Budget filter: 'free' for null/0, 'paid' for amount > 0
    if (budgetType === 'free') {
      conditions.push(sql`(r.budget_amount_cents IS NULL OR r.budget_amount_cents = 0)`)
    } else if (budgetType === 'paid') {
      conditions.push(sql`r.budget_amount_cents > 0`)
    }

    if (serviceType && SERVICE_TYPES.some(s => s.id === serviceType)) {
      conditions.push(sql`r.service_type = ${serviceType}`)
    }

    if (skill && getSkillIds().includes(skill)) {
      conditions.push(sql`${skill} = ANY(r.skills_needed)`)
    }

    if (matchMySkills) {
      const session = await auth()
      if (!session?.user?.id) {
        conditions.push(sql`false`)
      } else {
        const skillRows = await db
          .select({ skillId: userSkills.skillId })
          .from(userSkills)
          .where(eq(userSkills.userId, session.user.id))
        const mySkills = skillRows.map((r) => r.skillId)
        if (mySkills.length === 0) {
          conditions.push(sql`false`)
        } else {
          conditions.push(sql`r.skills_needed IS NOT NULL AND r.skills_needed && ARRAY[${sql.join(
            mySkills.map((s) => sql`${s}`),
            sql`, `,
          )}]::text[]`)
        }
      }
    }

    // Text search across title, description, device brand/model
    if (search && search.trim().length >= 2) {
      const searchPattern = `%${search.trim()}%`
      conditions.push(sql`(r.title ILIKE ${searchPattern} OR r.description ILIKE ${searchPattern} OR r.device_brand ILIKE ${searchPattern} OR r.device_model ILIKE ${searchPattern})`)
    }

    const whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`

    // Query requests with requester name (single query with COUNT(*) OVER())
    const result = await db.execute(sql`
      SELECT
        COUNT(*) OVER() AS _total_count,
        r.*,
        u.name as requester_name
      FROM ${sql.raw(rTable)} r
      JOIN ${sql.raw(uTable)} u ON r.requester_id = u.id
      ${whereClause}
      ORDER BY ${sql.raw(sortClause)}
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Extract total from first row (0 if no rows returned)
    type RowWithCount = RequestRow & { _total_count: string }
    const rawRequests = result.rows as unknown as RowWithCount[]
    const total = rawRequests.length > 0
      ? parseInt(rawRequests[0]._total_count || '0', 10)
      : 0

    // Strip _total_count and map
    const requests = rawRequests.map(({ _total_count, ...rest }) =>
      mapRequestListRow(rest as unknown as RequestRow)
    )

    logger.info('Fetched IT-Hilfe requests', {
      status,
      category,
      canton,
      skill,
      serviceType,
      matchMySkills,
      count: requests.length,
      total,
    })

    // Public request browse — search results change quickly, cache 15s, stale 10s
    return apiSuccessCached({
      requests,
      total,
      pagination: {
        limit,
        offset,
        hasMore: hasMoreItems(offset, limit, total),
      },
    }, 15, 10)
  } catch (error) {
    logger.error('Error fetching IT-Hilfe requests', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

/**
 * POST /api/it-hilfe/requests
 * Create a new IT-Hilfe request.
 *
 * Auth is OPTIONAL — anonymous submission is supported as the conversion-
 * driver T1 from the roadmap (people in distress shouldn't have to make
 * an account before describing their broken laptop).
 *
 * Resolution:
 *   - session present → use session.user.id as requesterId (unchanged)
 *   - session absent  → require `submitterEmail` in body; findOrCreate-
 *     AnonymousUser provisions an account; if newly created, send a
 *     password-set claim email so the user can later access their request
 *
 * Rate limiting key: session.user.id when authed; client IP otherwise.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const sessionUserId = session?.user?.id ?? null
    const sessionEmail = session?.user?.email ?? null

    // SECURITY: Rate limiting — 5 requests per hour per identity (user or IP).
    // E2E prod accounts are exempt so dual-persona inventory can run back-to-back.
    const rateLimitKey = sessionUserId
      ? `${sessionUserId}:it-hilfe-create`
      : `${getClientIdentifier(request)}:it-hilfe-create-anon`
    if (
      !isE2ETestAccountEmail(sessionEmail) &&
      !rateLimiters.itHilfeCreate(rateLimitKey)
    ) {
      return apiBadRequest('Zu viele Anfragen. Bitte warte 1 Stunde.')
    }

    const body = await request.json()

    // SECURITY: Validate with Zod schema
    const validation = validateAndRespond(itHilfeRequestSchema, body)
    if (!validation.success) {
      logger.warn('IT-Hilfe validation failed', {
        userId: sessionUserId,
        errors: validation.errors,
      })
      return apiBadRequest(validation.errors.join('; '))
    }

    const validatedData = validation.data

    // Anonymous submissions MUST provide submitterEmail. Schema can't
    // enforce this (it doesn't see auth state); enforced here.
    if (!sessionUserId && !validatedData.submitterEmail) {
      return apiBadRequest('E-Mail-Adresse erforderlich, wenn du nicht angemeldet bist')
    }

    // SECURITY: Sanitize user inputs
    const sanitizedTitle = sanitizeInput(validatedData.title, { maxLength: 200 })
    const sanitizedDescription = validatedData.description
      ? sanitizeInput(validatedData.description, { allowHtml: true, maxLength: 5000 })
      : null

    const {
      categoryId = undefined,
      urgency = URGENCY_DEFAULT,
      maxBudgetCents,
      postalCode = null,
      city = null,
      canton = null,
      serviceType = SERVICE_TYPE_DEFAULT,
      skillsNeeded = [],
      budgetTier,
      submitterEmail,
      deviceBrand = null,
      deviceModel = null,
      imageUrls = [],
      aiDiagnosis = null,
      preferredTechnicianId = null,
    } = validatedData

    let preferredTechnicianUserId: string | null = null
    if (preferredTechnicianId) {
      const [preferred] = await db
        .select({
          userId: repairerProfiles.userId,
          isActive: repairerProfiles.isActive,
          profileTier: repairerProfiles.profileTier,
          isVerified: userProfiles.isVerified,
          status: repairerProfiles.status,
        })
        .from(repairerProfiles)
        .leftJoin(userProfiles, eq(userProfiles.userId, repairerProfiles.userId))
        .where(eq(repairerProfiles.id, preferredTechnicianId))
      if (!preferred || !canAcceptDirectItHilfeRequest(preferred)) {
        return apiBadRequest('Der gewählte Techniker ist nicht mehr verfügbar')
      }
      preferredTechnicianUserId = preferred.userId
    }

    // Resolve the requester: existing session OR find-or-create by email
    let requesterId: string
    let isNewAnonymousUser = false
    let requesterEmail: string
    let requesterName: string

    if (sessionUserId) {
      requesterId = sessionUserId
      requesterEmail = session?.user?.email || ''
      requesterName = session?.user?.name || 'Nutzer'
    } else {
      // submitterEmail is guaranteed non-null by the guard above
      const resolved = await findOrCreateAnonymousUser(submitterEmail!)
      requesterId = resolved.userId
      isNewAnonymousUser = resolved.wasCreated
      requesterEmail = submitterEmail!
      requesterName = 'Nutzer'
    }

    // Derive budget_type from maxBudgetCents for backwards compatibility
    const budgetType = deriveBudgetType(maxBudgetCents)
    const budgetAmountCents = (maxBudgetCents && maxBudgetCents > 0) ? maxBudgetCents : null

    // Insert the request with sanitized data
    const [insertedRow] = await db.insert(itHilfeRequests).values({
      requesterId,
      categoryId: categoryId ?? 'other',
      deviceBrand: deviceBrand || null,
      deviceModel: deviceModel || null,
      title: sanitizedTitle,
      description: sanitizedDescription ?? '',
      urgency: urgency ?? URGENCY_DEFAULT,
      budgetType,
      budgetAmountCents,
      budgetTier: budgetTier || null,
      postalCode: postalCode ?? '',
      city: city ?? '',
      canton: canton ?? '',
      serviceType: serviceType ?? 'flexible',
      skillsNeeded: skillsNeeded && skillsNeeded.length > 0 ? skillsNeeded : null,
      imageUrls: imageUrls.length > 0 ? imageUrls : null,
      aiDiagnosis: aiDiagnosis || null,
      preferredTechnicianId: preferredTechnicianId || null,
    }).returning({ id: itHilfeRequests.id })

    const requestId = insertedRow.id

    logger.info('Created IT-Hilfe request', {
      requestId,
      requesterId,
      categoryId,
      budgetType,
      canton,
      anonymous: !sessionUserId,
      newAccount: isNewAnonymousUser,
    })

    // For newly-provisioned anonymous accounts: send a claim email with a
    // password-reset token so the user can set a password and access their
    // request. callbackUrl propagates through reset-password → login so
    // the user lands directly on their just-submitted request after the
    // sign-in completes — closing the seam between "set password" and
    // "see what I posted." Fire-and-forget; failure shouldn't fail the
    // request creation (the user can still recover via /auth/forgot-password
    // with their email).
    //
    // sendCustomEmail RESOLVES with { success: false, error } on SMTP/
    // Listmonk failure rather than throwing. The bare .catch() therefore
    // only logs throws — silent SMTP failures slip through invisibly, even
    // though this is the SINGLE MOST CONSEQUENTIAL email in the codebase
    // (the only path a brand-new anonymous user has to ever set a password
    // and access their just-submitted request). Split into a .then() that
    // catches resolved-failure and a .catch() that catches throws, so ops
    // can grep logs for both modes.
    if (isNewAnonymousUser) {
      // CLAIM_TOKEN_TTL_MS (7 days) is set in @/config/it-hilfe — claim
      // links go to people who may not read email for hours or days.
      // Default password-reset TTL is 1 hour, which is appropriate for
      // forgot-password (user is actively recovering) but functionally
      // broken for this flow (user just walked away from a form).
      createPasswordResetToken(requesterEmail, CLAIM_TOKEN_TTL_MS)
        .then(token => {
          const callbackUrl = `/it-hilfe/${requestId}`
          const claimUrl =
            `${APP_URL}/auth/reset-password` +
            `?token=${encodeURIComponent(token)}` +
            `&callbackUrl=${encodeURIComponent(callbackUrl)}`
          return sendCustomEmail(
            requesterEmail,
            itHilfeAnonymousRequestClaim(sanitizedTitle, claimUrl)
          )
        })
        .then(result => {
          if (!result.success) {
            logger.warn('Anonymous-request claim email failed (resolved)', {
              error: result.error,
              requestId,
              email: requesterEmail,
            })
          }
        })
        .catch(err => logger.error('Anonymous-request claim email failed (rejected)', { err, requestId, email: requesterEmail }))
    }

    // Fire-and-forget: Send all notifications (confirmation, admin, matching helpers).
    // For brand-new anonymous accounts, the dedicated claim email above
    // replaces the standard requester confirmation — sending both would
    // give the user two emails, one with a working "Konto aktivieren" CTA
    // and one with a "view your request" link they can't follow until
    // they've claimed the account. Admin + matching-helper notifications
    // still fire.
    sendRequestCreatedNotifications({
      requestId,
      requesterId,
      requesterName,
      requesterEmail,
      title: sanitizedTitle,
      categoryId: categoryId ?? 'other',
      urgency: urgency ?? URGENCY_DEFAULT,
      canton: canton ?? '',
      serviceType: serviceType ?? 'flexible',
      skillsNeeded: skillsNeeded || [],
      aiDiagnosis: aiDiagnosis || null,
      preferredTechnicianUserId,
      includeRequesterConfirmation: !isNewAnonymousUser,
    })

    return apiSuccess({
      message: 'IT-Hilfe-Anfrage erfolgreich erstellt',
      requestId,
      newAccount: isNewAnonymousUser,
    }, 201)
  } catch (error) {
    logger.error('Error creating IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
