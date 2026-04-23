'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Heart, Package, ArrowLeft, CheckCircle, Clock, Receipt, LogIn } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { getTextColor, getStatusColors } from '@/lib/design-system'
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
      try {
        const response = await fetch('/api/user/donations')
        if (cancelled) return
        if (response.ok) {
          const data = await response.json()
          setDonations(data.data || [])
        } else {
          setError(t('loadError'))
        }
      } catch {
        if (!cancelled) setError(t('networkError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
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
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-neutral-200">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-neutral-200 rounded w-full"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <EmptyState
            icon={LogIn}
            title={t('loginTitle')}
            description={t('loginDesc')}
            action={
              <Link
                href="/auth/login"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {t('loginButton')}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className={cn('inline-flex items-center mb-4', getTextColor('neutral', 'muted'), 'hover:text-primary-600')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </Link>
          <Heading level={1} className={cn('text-3xl font-bold mb-2', getTextColor('neutral', 'primary'))}>
            {t('pageTitle')}
          </Heading>
          <p className={cn('text-sm sm:text-base', getTextColor('neutral', 'muted'))}>
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={cn('rounded-lg p-4 mb-6 border-2', getStatusColors('error').bg, getStatusColors('error').border)}>
            <p className={cn('text-sm', getStatusColors('error').text)}>{error}</p>
          </div>
        )}

        {/* Donations List */}
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-neutral-200"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    donation.donation_type === DONATION_TYPES.MONETARY
                      ? 'bg-success-100 text-success-600'
                      : 'bg-info-100 text-info-600'
                  )}>
                    {getDonationIcon(donation.donation_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Heading level={3} className={cn('text-lg font-semibold', getTextColor('white', 'primary'))}>
                          {donation.donation_type === DONATION_TYPES.MONETARY
                            ? t('monetaryDonation')
                            : getDeviceTitle(donation)
                          }
                        </Heading>
                        <p className={cn('text-sm', getTextColor('white', 'muted'))}>
                          {getDonationTypeLabel(donation.donation_type)} • {formatDate(donation.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-lg font-semibold', getTextColor('white', 'primary'))}>
                          {getDonationValue(donation)}
                        </p>
                      </div>
                    </div>

                    {/* Device Description */}
                    {donation.donation_type === DONATION_TYPES.DEVICE && donation.device_description && (
                      <p className={cn('mt-2 text-sm', getTextColor('white', 'muted'))}>
                        {donation.device_description}
                      </p>
                    )}

                    {/* Status */}
                    <div className="mt-3 flex items-center gap-2">
                      {getStatusIcon(donation)}
                      <span className={cn('text-sm', getTextColor('white', 'muted'))}>
                        {getDonationStatusLabel(donation.status)}
                        {donation.receipt_requested && !donation.receipt_sent && ` • ${t('receiptRequested')}`}
                        {donation.receipt_sent && ` • ${t('receiptSent')}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            iconBg="bg-rose-50 dark:bg-rose-900/20"
            iconColor="text-rose-500 dark:text-rose-400"
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Link
                href="/get-involved/donate"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {t('donateNow')}
              </Link>
            }
          />
        )}

        {/* Info Box */}
        <div className="mt-8 bg-info-50 border border-info-200 rounded-lg p-4">
          <Heading level={4} className="font-medium mb-2 text-info-800">
            {t('receiptInfoTitle')}
          </Heading>
          <p className="text-sm text-info-700">
            {t('receiptInfoText')}{' '}
            <a href={`mailto:${CONTACT.email}`} className="underline text-info-800 hover:text-info-900">{CONTACT.email}</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
