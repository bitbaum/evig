'use client'

import { use } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { useBookingDetail } from './useBookingDetail'
import {
  BookingHeaderCard,
  ServiceDetailsCard,
  TechnicianCard,
  DatesCard,
  LocationCard,
  RatingCard,
} from './sections'

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const td = useTranslations('dashboard.bookings.detail')
  const state = useBookingDetail(id)
  const { appointment, sessionStatus, loading, error } = state

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl font-bold text-text-primary mb-2">
          {error || td('notFound')}
        </Heading>
        <Link
          href="/dashboard/bookings"
          className="text-action hover:text-action font-medium"
        >
          {td('backToBookings')}
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-text-secondary"
      >
        <ArrowLeft className="h-3 w-3" />
        {td('backToBookings')}
      </Link>

      <BookingHeaderCard appointment={appointment} state={state} />
      <ServiceDetailsCard appointment={appointment} />
      <TechnicianCard appointment={appointment} />
      <DatesCard appointment={appointment} />
      <LocationCard appointment={appointment} />
      <RatingCard appointment={appointment} />
    </article>
  )
}
