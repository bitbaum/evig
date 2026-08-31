/** Shipping address card — shown only for shipping orders with an address. */

'use client';

import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';
import type { NonNullOrder } from './shared';

export function ShippingAddressCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders');
  if (order.deliveryMethod !== 'shipping' || !order.shippingAddress) return null;
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {t('shippingAddress')}
      </Heading>
      <div className="text-sm text-text-secondary space-y-1">
        {order.shippingAddress.name && <p className="font-medium">{order.shippingAddress.name}</p>}
        {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
        {(order.shippingAddress.postal_code || order.shippingAddress.city) && (
          <p>
            {order.shippingAddress.postal_code} {order.shippingAddress.city}
          </p>
        )}
      </div>
    </div>
  );
}
