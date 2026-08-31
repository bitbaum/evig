/** Counterparty card — the other party (seller or buyer) with profile link. */

'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';
import type { NonNullOrder } from './shared';

export function CounterpartyCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders');
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {order.role === 'buyer' ? t('counterpartySeller') : t('counterpartyBuyer')}
      </Heading>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-text-tertiary" />
        </div>
        <div>
          <p className="font-medium text-text-primary">{order.counterpartyName}</p>
          {order.role === 'buyer' && (
            <Link
              href={`/sellers/${order.sellerId}`}
              className="text-sm text-action hover:text-action"
            >
              {t('viewProfile')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
