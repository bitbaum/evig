'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, Package, ArrowLeft, CheckCircle, Clock, Receipt, LogIn } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-formats'
import { CONTACT } from '@/config/org'
import {
  getDonationTypeLabel,
  getDeviceCategoryLabel,
  getDonationStatusLabel,
  formatAmountCHF,
  DONATION_TYPES,
} from '@/config/donations'
import { DeviceJourney, type JourneyItem } from '@/components/dashboard/DeviceJourney'

interface Donation {
  id: string
  donation_type: 'monetary' | 'device'
  // Monetary
  amount_cents: number | null
  currency: string
  payment_method: string | null
  // Device
  device_category: string | null
  device_description: string | null
  device_brand: string | null
  device_model: string | null
  device_condition: string | null
  estimated_value_cents: number | null
  // Status
  status: string
  receipt_requested: boolean
  receipt_sent: boolean
  // Dates
  created_at: string
  // Journey (device donations only)
  journey?: {
    total_items: number
    items: JourneyItem[]
  }
}

export default function DonationsDashboard() {
  const t = useTranslations('dashboard.donations')
  const { data: session, status } = useSession()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!session?.user) return
    let cancelled = false
    async function fetchDonations() {
      const result = await apiFetch<Donation[]>('/api/user/donations')
      if (cancelled) return
      if (result.success && result.data) {
        setDonations(result.data)
      } else {
        setError(result.error || t('loadError'))
      }
      setLoading(false)
    }
    fetchDonations()
    return () => { cancelled = true }
  }, [session, t])


  const getStatusIcon = (donation: Donation) => {
    if (donation.receipt_sent) {
      return <Receipt className="w-5 h-5 text-success-500" />
    }
    if (donation.status === 'thanked') {
      return <CheckCircle className="w-5 h-5 text-success-500" />
    }
    return <Clock className="w-5 h-5 text-warning-500" />
  }

  const getDonationIcon = (type: string) => {
    if (type === DONATION_TYPES.DEVICE) {
      return <Package className="w-6 h-6" />
    }
    return <Heart className="w-6 h-6" />
  }

  const getDonationValue = (donation: Donation): string => {
    if (donation.donation_type === DONATION_TYPES.MONETARY) {
      return formatAmountCHF(donation.amount_cents)
    }
    if (donation.estimated_value_cents) {
      return `~${formatAmountCHF(donation.estimated_value_cents)}`
    }
    return '-'
  }

  const getDeviceTitle = (donation: Donation): string => {
    const parts: string[] = []
    if (donation.device_brand) parts.push(donation.device_brand)
    if (donation.device_model) parts.push(donation.device_model)
    if (parts.length > 0) return parts.join(' ')
    if (donation.device_category) return getDeviceCategoryLabel(donation.device_category)
    return t('deviceFallback')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8 border-2 border-neutral-200 dark:border-white/[0.06]">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            icon={LogIn}
            title={t('loginTitle')}
            description={t('loginDesc')}
            action={
              <Button as={Link} href="/auth/login" variant="primary">
                {t('loginButton')}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center mb-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <Heading level={1} className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">
            {t('pageTitle')}
          </Heading>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg p-4 mb-6 border-2 bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/30">
            <p className="text-sm text-error-800 dark:text-error-400">{error}</p>
          </div>
        )}

        {/* Donations List */}
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg dark:shadow-black/30 p-4 sm:p-6 border-2 border-neutral-200 dark:border-white/[0.06]"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    donation.donation_type === DONATION_TYPES.MONETARY
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  )}>
                    {getDonationIcon(donation.donation_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Heading level={3} className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {donation.donation_type === DONATION_TYPES.MONETARY
                            ? t('monetaryDonation')
                            : getDeviceTitle(donation)
                          }
                        </Heading>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {getDonationTypeLabel(donation.donation_type)} • {formatDate(donation.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                          {getDonationValue(donation)}
                        </p>
                      </div>
                    </div>

                    {/* Device Description */}
                    {donation.donation_type === DONATION_TYPES.DEVICE && donation.device_description && (
                      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {donation.device_description}
                      </p>
                    )}

                    {/* Status */}
                    <div className="mt-3 flex items-center gap-2">
                      {getStatusIcon(donation)}
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {getDonationStatusLabel(donation.status)}
                        {donation.receipt_requested && !donation.receipt_sent && ` • ${t('receiptRequested')}`}
                        {donation.receipt_sent && ` • ${t('receiptSent')}`}
                      </span>
                    </div>

                    {/* Device journey */}
                    {donation.donation_type === DONATION_TYPES.DEVICE && donation.journey && (
                      <DeviceJourney
                        totalItems={donation.journey.total_items}
                        items={donation.journey.items}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            iconBg="bg-error-50 dark:bg-error-900/20"
            iconColor="text-error-500 dark:text-error-400"
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Button as={Link} href="/get-involved/donate" variant="primary">
                {t('donateNow')}
              </Button>
            }
          />
        )}

        {/* Info Box */}
        <div className="mt-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <Heading level={4} className="font-medium mb-2 text-neutral-800 dark:text-neutral-200">
            {t('receiptInfoTitle')}
          </Heading>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('receiptInfoText')}{' '}
            <a href={`mailto:${CONTACT.email}`} className="underline text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white">{CONTACT.email}</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
