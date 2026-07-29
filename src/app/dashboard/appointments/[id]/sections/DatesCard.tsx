/** Dates card: requested/preferred/confirmed/completed timeline rows. */

'use client'

import { Calendar, CheckCircle, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { formatDateShort, formatDateTime } from '@/lib/date-formats'
import type { AppointmentDetail } from '../useBookingDetail'
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared'

export function DatesCard({ appointment }: { appointment: AppointmentDetail }) {
  const td = useTranslations('dashboard.bookings.detail')
  return (
    <div className={`${CARD_CLASS} space-y-3`}>
      <Heading level={2} className={`${SECTION_TITLE_CLASS} mb-4`}>
        {td('sectionDates')}
      </Heading>
      <DateRow icon={<Clock className="w-4 h-4 text-text-muted shrink-0" />} label={td('requestedOn')} value={formatDateTime(appointment.created_at)} />
      {appointment.preferred_date && (
        <DateRow icon={<Calendar className="w-4 h-4 text-text-muted shrink-0" />} label={td('preferredDate')} value={formatDateTime(appointment.preferred_date)} />
      )}
      {appointment.confirmed_date && (
        <DateRow icon={<CheckCircle className="w-4 h-4 text-action shrink-0" />} label={td('confirmedDate')} value={formatDateTime(appointment.confirmed_date)} />
      )}
      {appointment.completed_at && (
        <DateRow icon={<CheckCircle className="w-4 h-4 text-action shrink-0" />} label={td('completedAt')} value={formatDateShort(appointment.completed_at)} />
      )}
    </div>
  )
}

function DateRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon}
      <span className="text-text-tertiary w-36 shrink-0">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  )
}
