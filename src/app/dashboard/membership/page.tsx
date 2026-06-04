import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { BadgeCheck, CheckCircle, AlertCircle, ArrowRight, CreditCard, Calendar } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { MEMBERSHIP, ORG } from '@/config/org'
import { MEMBERSHIP_TYPE_LABELS } from '@/config/membership-status'
import { formatDate } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'dashboard.meta' })
  return {
    title: `${t('membershipTitle')} | ${ORG.name} Dashboard`,
    description: t('membershipDesc'),
  }
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
        <Heading level={1} className="text-2xl font-bold text-text-primary">
          {t('pageTitle')}
        </Heading>
        <p className="text-sm text-text-tertiary mt-1">
          {t('pageSubtitle', { orgName: ORG.legalName })}
        </p>
      </div>

      {isMember ? (
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-surface-base rounded-xl border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-action-muted-muted flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6 text-action" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Heading level={2} className="text-lg font-semibold text-text-primary">
                    {membership?.member_type
                      ? (MEMBERSHIP_TYPE_LABELS[membership.member_type as keyof typeof MEMBERSHIP_TYPE_LABELS] ?? t('memberLabel'))
                      : t('memberLabel')}
                  </Heading>
                  {paid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-action-muted-muted text-action rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      {t('paidBadge')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                      {t('pendingBadge')}
                    </span>
                  )}
                </div>
                {membership?.member_since && (
                  <p className="text-sm text-text-tertiary mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('memberSince', { date: formatDate(membership.member_since) })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment details */}
          <div className="bg-surface-base rounded-xl border p-6">
            <Heading level={3} className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
              {t('annualFee')}
            </Heading>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-subtle">
                <span className="text-text-secondary">{t('amountLabel')}</span>
                <span className="font-semibold text-text-primary">
                  {t('amountValue', { currency: MEMBERSHIP.currency, fee })}
                </span>
              </div>
              {membership?.member_paid_until && (
                <div className="flex justify-between items-center py-2 border-b border-subtle">
                  <span className="text-text-secondary">{t('paidUntilLabel')}</span>
                  <span className={`font-medium ${paid ? 'text-action' : 'text-warning-700 dark:text-warning-400'}`}>
                    {formatDate(membership.member_paid_until)}
                  </span>
                </div>
              )}
            </div>
            {!paid && (
              <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                <p className="text-sm text-warning-800 dark:text-warning-300 mb-3">
                  {t('pendingNotice', { currency: MEMBERSHIP.currency, fee })}
                </p>
                <Link
                  href="/mitglied-werden"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-warning-700 dark:text-warning-400 hover:text-warning-600"
                >
                  {t('paymentDetails')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* What membership means */}
          <div className="bg-surface-raised rounded-xl p-6 border">
            <Heading level={3} className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
              {t('benefitsTitle')}
            </Heading>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
                {t('benefit1')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
                {t('benefit2')}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-action shrink-0 mt-0.5" aria-hidden="true" />
                {t('benefit3')}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BadgeCheck}
          iconBg="bg-action-muted-muted"
          iconColor="text-action"
          title={t('notMemberTitle')}
          description={t('notMemberDesc', { orgName: ORG.legalName, currency: MEMBERSHIP.currency, fee: MEMBERSHIP.fees.regular })}
          action={
            <Link href="/mitglied-werden" className={buttonClass({ variant: 'primary' })}>
              {t('becomeMember')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          }
        />
      )}
    </div>
  )
}
