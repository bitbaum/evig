/** Warning banner shown while an order is awaiting payment. */

'use client';

import Link from 'next/link';
import { Clock, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Heading from '@/components/ui/Heading';
import { ORDER_STATUS } from '@/config/marketplace';
import type { NonNullOrder } from './shared';

export function PendingPaymentBanner({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders');
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) return null;
  return (
    <div className="mb-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl p-4 flex items-start gap-3">
      <Clock className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <Heading level={3} className="font-medium text-warning-800 dark:text-warning-200">
          {t('pendingPaymentTitle')}
        </Heading>
        <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
          {order.role === 'buyer' ? t('pendingPaymentBuyer') : t('pendingPaymentSeller')}
        </p>
        {order.role === 'buyer' && (
          <Button
            as={Link}
            href={
              order.listingId ? `/marketplace/checkout/${order.listingId}` : '/marketplace/cart'
            }
            variant="warning"
            size="sm"
            className="gap-2 mt-3"
          >
            <Shield className="w-4 h-4" />
            {t('retryPayment')}
          </Button>
        )}
      </div>
    </div>
  );
}
