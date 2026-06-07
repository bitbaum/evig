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
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-text-secondary hover:text-action text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {td('backToBookings')}
      </Link>

      <BookingHeaderCard appointment={appointment} state={state} />
      <ServiceDetailsCard appointment={appointment} />
      <TechnicianCard appointment={appointment} />
      <DatesCard appointment={appointment} />
      <LocationCard appointment={appointment} />
      <RatingCard appointment={appointment} />
    </div>
  )
}
