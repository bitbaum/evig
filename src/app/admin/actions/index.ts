'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { db } from '@/db'
import { userContentSubmissions, listings, repairerApplications } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { logActivity } from '@/lib/activity'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Guard: require active admin session for all actions
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.isStaff && !session?.user?.isSuperAdmin) {
    throw new Error('Unauthorized')
  }
  return session.user
}

// ---------------------------------------------------------------------------
// Approve a blog/workshop content submission
// ---------------------------------------------------------------------------

export async function approveBlogSubmissionAction(submissionId: string) {
  const user = await requireAdmin()

  try {
    await db
      .update(userContentSubmissions)
      .set({
        status: APPROVAL_STATUS.APPROVED,
        reviewedBy: user.id,
        reviewedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(userContentSubmissions.id, submissionId))

    logActivity({
      actorId: user.id,
      action: 'approved_blog',
      subjectType: 'content_submission',
      subjectId: submissionId,
    })

    logger.info('Inline: content submission approved', { submissionId, actorId: user.id })
  } catch (error) {
    logger.error('Inline approveBlogSubmissionAction failed', { error, submissionId })
    throw error
  }

  revalidatePath('/admin')
}

// ---------------------------------------------------------------------------
// Verify a marketplace listing (set verified_at)
// ---------------------------------------------------------------------------

export async function verifyListingAction(listingId: string) {
  const user = await requireAdmin()

  try {
    await db
      .update(listings)
      .set({
        verifiedAt: sql`NOW()`,
        verifiedBy: user.id,
      })
      .where(eq(listings.id, listingId))

    logActivity({
      actorId: user.id,
      action: 'approved_listing',
      subjectType: 'listing',
      subjectId: listingId,
    })

    logger.info('Inline: listing verified', { listingId, actorId: user.id })
  } catch (error) {
    logger.error('Inline verifyListingAction failed', { error, listingId })
    throw error
  }

  revalidatePath('/admin')
}

// ---------------------------------------------------------------------------
// Approve a repairer application
// ---------------------------------------------------------------------------

export async function approveRepairerApplicationAction(applicationId: string) {
  const user = await requireAdmin()

  try {
    await db
      .update(repairerApplications)
      .set({
        status: 'approved',
        reviewedBy: user.id,
        reviewedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(repairerApplications.id, applicationId))

    logActivity({
      actorId: user.id,
      action: 'approved_repairer',
      subjectType: 'repairer_application',
      subjectId: applicationId,
    })

    logger.info('Inline: repairer application approved', { applicationId, actorId: user.id })
  } catch (error) {
    logger.error('Inline approveRepairerApplicationAction failed', { error, applicationId })
    throw error
  }

  revalidatePath('/admin')
}
