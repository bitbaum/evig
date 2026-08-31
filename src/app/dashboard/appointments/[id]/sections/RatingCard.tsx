/** Rating display card: submitted customer stars + optional review text. */

'use client';

import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import type { AppointmentDetail } from '../useBookingDetail';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';
import { StarDisplay } from './StarDisplay';

export function RatingCard({ appointment }: { appointment: AppointmentDetail }) {
  const td = useTranslations('dashboard.bookings.detail');
  if (!appointment.customer_rating) return null;
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={`${SECTION_TITLE_CLASS} mb-4`}>
        {td('yourRating')}
      </Heading>
      <StarDisplay rating={appointment.customer_rating} />
      {appointment.customer_review && (
        <p className="text-text-secondary text-sm mt-2">{appointment.customer_review}</p>
      )}
    </div>
  );
}
