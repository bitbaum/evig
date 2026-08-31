/** Service details card: service name, urgency badge, problem description, device/parts/outcome notes. */

'use client';

import { AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import { getUrgencyBadge } from '@/config/booking-status';
import type { AppointmentDetail } from '../useBookingDetail';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';

export function ServiceDetailsCard({ appointment }: { appointment: AppointmentDetail }) {
  const t = useTranslations('dashboard.bookings');
  const td = useTranslations('dashboard.bookings.detail');
  const urgencyBadge = getUrgencyBadge(appointment.urgency);
  return (
    <div className={`${CARD_CLASS} space-y-4`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {td('sectionService')}
      </Heading>

      <DetailRow
        icon={<Wrench className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />}
        label={td('service')}
        value={appointment.service_name || t('repairLabel')}
      >
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${urgencyBadge.color}`}
        >
          {urgencyBadge.label}
        </span>
      </DetailRow>

      <DetailRow
        icon={<AlertCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />}
        label={td('problem')}
        value={appointment.description}
        valueClass="text-sm leading-relaxed"
      />

      {appointment.device_info && (
        <DetailRow
          icon={<EmojiIcon char="💻" />}
          label={td('deviceInfo')}
          value={appointment.device_info}
        />
      )}
      {appointment.parts_needed && (
        <DetailRow
          icon={<EmojiIcon char="🔩" />}
          label={td('partsNeeded')}
          value={appointment.parts_needed}
        />
      )}
      {appointment.outcome_notes && (
        <DetailRow
          icon={<CheckCircle className="w-5 h-5 text-action shrink-0 mt-0.5" />}
          label={td('outcomeNotes')}
          value={appointment.outcome_notes}
        />
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClass = '',
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-secondary mb-0.5">{label}</p>
        <p className={`text-text-primary text-sm ${valueClass}`}>{value}</p>
      </div>
      {children}
    </div>
  );
}

function EmojiIcon({ char }: { char: string }) {
  return <div className="w-5 h-5 shrink-0 mt-0.5 text-center text-text-muted text-xs">{char}</div>;
}
