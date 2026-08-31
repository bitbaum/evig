/** Location card: home-visit address block (renders only for home visits). */

'use client';

import { Home, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import type { AppointmentDetail } from '../useBookingDetail';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';

export function LocationCard({ appointment }: { appointment: AppointmentDetail }) {
  const t = useTranslations('dashboard.bookings');
  const td = useTranslations('dashboard.bookings.detail');
  if (!appointment.is_home_visit || !appointment.visit_address) return null;
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={`${SECTION_TITLE_CLASS} mb-4`}>
        {td('sectionLocation')}
      </Heading>
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-tertiary">{t('homeVisit')}</span>
          </div>
          <p className="text-text-primary text-sm">{appointment.visit_address}</p>
          {(appointment.visit_postal_code || appointment.visit_city) && (
            <p className="text-text-secondary text-sm">
              {[appointment.visit_postal_code, appointment.visit_city].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
