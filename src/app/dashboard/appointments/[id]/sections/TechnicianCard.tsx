/** Technician card: assigned repairer/business identity and phone contact. */

'use client'

import { Phone, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import type { AppointmentDetail } from '../useBookingDetail'
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared'

export function TechnicianCard({ appointment }: { appointment: AppointmentDetail }) {
  const td = useTranslations('dashboard.bookings.detail')
  if (!appointment.repairer_name && !appointment.business_name) return null
  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {td('sectionTechnician')}
      </Heading>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-text-tertiary" />
        </div>
        <div>
          <p className="font-medium text-text-primary">
            {appointment.business_name || appointment.repairer_name}
          </p>
          {appointment.business_name && appointment.repairer_name && (
            <p className="text-sm text-text-tertiary">{appointment.repairer_name}</p>
          )}
        </div>
      </div>
      {appointment.repairer_phone && (
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-text-muted shrink-0" />
          <a href={`tel:${appointment.repairer_phone}`} className="text-action hover:underline text-sm">
            {appointment.repairer_phone}
          </a>
        </div>
      )}
    </div>
  )
}
