/** Actions card — role/status-dependent order actions (ship, deliver, confirm, cancel). */

'use client';

import { CheckCircle, Loader2, Package, Truck, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Heading from '@/components/ui/Heading';
import { ORDER_STATUS } from '@/config/marketplace';
import type { OrderStatus } from '@/config/marketplace';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';
import type { NonNullOrder } from './shared';

interface ActionsProps {
  order: NonNullOrder;
  trackingNumber: string;
  setTrackingNumber: (v: string) => void;
  updatingStatus: boolean;
  confirmReceipt: () => void;
  updateStatus: (s: OrderStatus) => void;
  setConfirmCancel: (v: boolean) => void;
}

export function ActionsCard({
  order,
  trackingNumber,
  setTrackingNumber,
  updatingStatus,
  confirmReceipt,
  updateStatus,
  setConfirmCancel,
}: ActionsProps) {
  const t = useTranslations('dashboard.orders');
  const isCancelled =
    order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;
  const spinner = updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : null;

  return (
    <div className={`${CARD_CLASS} mt-6`}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {t('actionsSection')}
      </Heading>
      <div className="space-y-3">
        {/* Seller: paid → shipped */}
        {order.role === 'seller' && order.status === ORDER_STATUS.PAID && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('trackingOptional')}
              </label>
              <Input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="z.B. 99.12.345678.90123456"
              />
            </div>
            <Button
              onClick={() => updateStatus(ORDER_STATUS.SHIPPED)}
              disabled={updatingStatus}
              variant="primary"
              className="w-full"
            >
              {spinner ?? <Truck className="w-4 h-4" />}
              {t('markShipped')}
            </Button>
          </div>
        )}

        {/* Seller: shipped → delivered */}
        {order.role === 'seller' && order.status === ORDER_STATUS.SHIPPED && (
          <Button
            onClick={() => updateStatus(ORDER_STATUS.DELIVERED)}
            disabled={updatingStatus}
            variant="primary"
            className="w-full"
          >
            {spinner ?? <Package className="w-4 h-4" />}
            {t('markDelivered')}
          </Button>
        )}

        {/* Buyer: shipped or delivered → completed */}
        {order.role === 'buyer' &&
          (order.status === ORDER_STATUS.SHIPPED || order.status === ORDER_STATUS.DELIVERED) && (
            <Button
              onClick={confirmReceipt}
              disabled={updatingStatus}
              variant="primary"
              className="w-full"
            >
              {spinner ?? <CheckCircle className="w-4 h-4" />}
              {t('confirmReceipt')}
            </Button>
          )}

        {/* Cancel (buyer: pending_payment or paid) */}
        {order.role === 'buyer' &&
          (order.status === ORDER_STATUS.PENDING_PAYMENT || order.status === ORDER_STATUS.PAID) && (
            <Button
              variant="destructive-outline"
              onClick={() => setConfirmCancel(true)}
              disabled={updatingStatus}
              className="w-full gap-2"
            >
              {spinner ?? <XCircle className="w-4 h-4" />}
              {t('cancelButton')}
            </Button>
          )}

        {isCancelled && (
          <p className="text-sm text-text-tertiary text-center py-2">
            {order.status === ORDER_STATUS.CANCELLED ? t('cancelledNote') : t('refundedNote')}
          </p>
        )}

        {order.status === ORDER_STATUS.COMPLETED && (
          <p className="text-sm text-action text-center py-2 flex items-center justify-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            {t('completedNote')}
          </p>
        )}
      </div>
    </div>
  );
}
