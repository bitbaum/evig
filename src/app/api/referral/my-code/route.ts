import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth } from '@/lib/api/middleware'
import { getOrCreateReferralCode, getReferralStats, REFERRAL_INVITEE_CENTS, REFERRAL_REWARD_CENTS } from '@/lib/referral'

export const GET = withAuth(async (_request, session) => {
  try {
    const stats = await getReferralStats(session.user.id)
    return apiSuccess({
      ...stats,
      incentive: {
        inviteeCents: REFERRAL_INVITEE_CENTS,
        rewardCents: REFERRAL_REWARD_CENTS,
      },
    })
  } catch (error) {
    return apiError(error, 'Failed to load referral code', 500)
  }
})
