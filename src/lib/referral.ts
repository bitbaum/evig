import { db } from '@/db'
import { referralCodes, referralInvitations, coupons } from '@/db/schema/referral'
import { users } from '@/db/schema/auth'
import { eq, and, isNull, count } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { referralInvitation, referralCouponReceived } from '@/lib/email/templates/referral'
import { APP_URL } from '@/config/urls'

// CHF amounts as integer cents — single source of truth
export const REFERRAL_INVITEE_CENTS = 500   // CHF 5 for new member
export const REFERRAL_REWARD_CENTS  = 1000  // CHF 10 for inviter

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateCouponCode(prefix: string): string {
  const rand = Math.random().toString(36).toUpperCase().slice(2, 8)
  return `${prefix}-${rand}`
}

export async function getOrCreateReferralCode(userId: string) {
  const existing = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1)

  if (existing[0]) return existing[0]

  let code: string
  let attempts = 0
  do {
    code = generateCode()
    attempts++
    if (attempts > 10) throw new Error('Failed to generate unique referral code')
    const conflict = await db.select({ id: referralCodes.id }).from(referralCodes).where(eq(referralCodes.code, code)).limit(1)
    if (!conflict[0]) break
  } while (true)

  const [created] = await db
    .insert(referralCodes)
    .values({ userId, code: code! })
    .returning()

  return created
}

export function getReferralUrl(code: string): string {
  return `${APP_URL}/register?ref=${code}`
}

export async function sendReferralInvitation(
  inviterId: string,
  inviterName: string,
  inviterEmail: string,
  inviteeEmail: string,
): Promise<{ success: boolean; error?: string }> {
  if (inviteeEmail.toLowerCase() === inviterEmail.toLowerCase()) {
    return { success: false, error: 'cannot_self_invite' }
  }

  const refCode = await getOrCreateReferralCode(inviterId)

  // Prevent duplicate sends to same address
  const existing = await db
    .select({ id: referralInvitations.id })
    .from(referralInvitations)
    .where(and(
      eq(referralInvitations.referralCodeId, refCode.id),
      eq(referralInvitations.invitedEmail, inviteeEmail.toLowerCase()),
    ))
    .limit(1)

  if (existing[0]) {
    return { success: false, error: 'already_invited' }
  }

  const referralUrl = getReferralUrl(refCode.code)
  const template = referralInvitation(inviterName, referralUrl)

  const result = await sendCustomEmail(inviteeEmail, template)
  if (!result.success) {
    logger.error('Failed to send referral invitation', { inviterEmail, inviteeEmail, error: result.error })
    return { success: false, error: 'email_failed' }
  }

  await db.insert(referralInvitations).values({
    referralCodeId: refCode.id,
    invitedEmail: inviteeEmail.toLowerCase(),
  })

  return { success: true }
}

export async function redeemReferralCode(
  code: string,
  newUserId: string,
  newUserEmail: string,
  newUserName: string,
): Promise<void> {
  const [refCode] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.code, code.toUpperCase()))
    .limit(1)

  if (!refCode) return

  // Issue CHF 5 welcome coupon to the new user
  const couponCode = generateCouponCode('WELCOME')
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(coupons).values({
    userId: newUserId,
    code: couponCode,
    amountCents: REFERRAL_INVITEE_CENTS,
    source: 'referral_welcome',
    expiresAt,
  })

  // Increment uses and mark invitation as registered (if it was a tracked send)
  await db.update(referralCodes)
    .set({ uses: refCode.uses + 1 })
    .where(eq(referralCodes.id, refCode.id))

  await db.update(referralInvitations)
    .set({ registeredAt: new Date().toISOString() })
    .where(and(
      eq(referralInvitations.referralCodeId, refCode.id),
      eq(referralInvitations.invitedEmail, newUserEmail.toLowerCase()),
      isNull(referralInvitations.registeredAt),
    ))

  // Send coupon email to the new user
  const [inviter] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, refCode.userId)).limit(1)
  const template = referralCouponReceived(newUserName, couponCode, REFERRAL_INVITEE_CENTS / 100, 'welcome')
  await sendCustomEmail(newUserEmail, template)

  logger.info('Referral code redeemed', { code, newUserId, couponCode, inviterUserId: refCode.userId, inviterName: inviter?.name })
}

export async function getReferralStats(userId: string) {
  const refCode = await getOrCreateReferralCode(userId)
  const [{ total }] = await db.select({ total: count() }).from(referralInvitations).where(eq(referralInvitations.referralCodeId, refCode.id))

  return {
    code: refCode.code,
    url: getReferralUrl(refCode.code),
    totalInvites: total,
    registrations: refCode.uses,
  }
}
