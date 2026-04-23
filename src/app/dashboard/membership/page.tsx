import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { BadgeCheck, CheckCircle, AlertCircle, ArrowRight, CreditCard, Calendar } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { MEMBERSHIP, ORG } from '@/config/org'
import { MEMBERSHIP_TYPE_LABELS } from '@/config/membership-status'
import { formatDate } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Mitgliedschaft | RevampIT Dashboard',
  description: 'Deine Vereinsmitgliedschaft bei Revamp-IT.',
}

interface MemberRow {
  is_member: boolean
  member_since: string | null
  member_type: string | null
  member_paid_until: string | null
}


async function getMembership(userId: string): Promise<MemberRow | null> {
  try {
    const result = await query<MemberRow>(
      `SELECT is_member, member_since, member_type, member_paid_until
       FROM ${TABLE_NAMES.USERS}
       WHERE id = $1`,
      [userId]
    )
    return result.rows[0] ?? null
  } catch (error) {
    logger.error('Failed to fetch membership status', { userId, error })
    return null
  }
}

function isPaid(paidUntil: string | null): boolean {
  if (!paidUntil) return false
  return new Date(paidUntil) > new Date()
}

export default async function MembershipPage() {
  const t = await getTranslations('dashboard.membership')
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard/membership')
  }

  const membership = await getMembership(session.user.id!)
  const isMember = membership?.is_member ?? false
  const paid = isPaid(membership?.member_paid_until ?? null)
  const fee = membership?.member_type === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular

  return (
    <div className="space-y-6">
      <div>
        <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('pageTitle')}
        </Heading>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('pageSubtitle', { orgName: ORG.legalName })}
        </p>
      </div>

      {isMember ? (
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white">
                    {membership?.member_type
                      ? (MEMBERSHIP_TYPE_LABELS[membership.member_type as keyof typeof MEMBERSHIP_TYPE_LABELS] ?? t('memberLabel'))
                      : t('memberLabel')}
                  </Heading>
                  {paid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      {t('paidBadge')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                      {t('pendingBadge')}
                    </span>
                  )}
                </div>
                {membership?.member_since && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('memberSince', { date: formatDate(membership.member_since) })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <Heading level={3} className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" aria-hidden="true" />
              {t('annualFee')}
            </Heading>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">{t('amountLabel')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t('amountValue', { currency: MEMBERSHIP.currency, fee })}
                </span>
              </div>
              {membership?.member_paid_until && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">{t('paidUntilLabel')}</span>
                  <span className={`font-medium ${paid ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {formatDate(membership.member_paid_until)}
                  </span>
                </div>
              )}
            </div>
            {!paid && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                  {t('pendingNotice', { currency: MEMBERSHIP.currency, fee })}
                </p>
                <Link
                  href="/mitglied-werden"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:text-orange-600"
                >
                  {t('paymentDetails')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* What membership means */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <Heading level={3} className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              {t('benefitsTitle')}
            </Heading>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {t('benefit1')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {t('benefit2')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {t('benefit3')}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BadgeCheck}
          iconBg="bg-green-50 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
          title={t('notMemberTitle')}
          description={t('notMemberDesc', { orgName: ORG.legalName, currency: MEMBERSHIP.currency, fee: MEMBERSHIP.fees.regular })}
          action={
            <Link
              href="/mitglied-werden"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {t('becomeMember')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          }
        />
      )}
    </div>
  )
}
