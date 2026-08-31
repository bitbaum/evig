/** Listing/article card — product rows, delivery method and tracking info. */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, MapPin, Package, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Heading from '@/components/ui/Heading';
import { DELIVERY_LABELS, formatCHF } from '@/config/marketplace';
import type { DeliveryOption } from '@/config/marketplace';
import { CARD_CLASS, SECTION_TITLE_CLASS } from './shared';
import type { NonNullOrder } from './shared';

/** One product row — links to the listing when it still exists. */
function ArticleRow({
  listingId,
  title,
  thumbnail,
  suffix,
  alt,
}: {
  listingId: string | null;
  title: string;
  thumbnail: string | null;
  suffix?: ReactNode;
  alt: string;
}) {
  const inner = (
    <div className="flex gap-3">
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-raised">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title || alt}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-text-muted" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <Heading level={3} className="font-medium text-text-primary">
          {title}
        </Heading>
        {suffix}
      </div>
    </div>
  );
  return listingId ? (
    <Link href={`/marketplace/${listingId}`} className="block hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function ListingInfoCard({ order }: { order: NonNullOrder }) {
  const t = useTranslations('dashboard.orders');
  const deliveryLabel =
    DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] || order.deliveryMethod;
  const isCart = order.items.length > 0;
  return (
    <div className={CARD_CLASS}>
      <Heading level={2} className={SECTION_TITLE_CLASS}>
        {isCart ? t('articlesSection', { count: order.items.length }) : t('articleSection')}
      </Heading>

      {isCart ? (
        <div className="space-y-3">
          {order.items.map((item) => (
            <ArticleRow
              key={item.id}
              listingId={item.listingId}
              title={item.title}
              thumbnail={item.thumbnail}
              alt={t('itemImage')}
              suffix={
                <p className="text-sm font-mono tabular-nums text-text-tertiary mt-1">
                  {formatCHF(Number(item.unitPriceChf))}
                </p>
              }
            />
          ))}
          <p className="text-sm text-text-tertiary flex items-center gap-1 pt-1 border-t border-subtle">
            <MapPin className="w-3.5 h-3.5" />
            {deliveryLabel}
          </p>
        </div>
      ) : (
        <ArticleRow
          listingId={order.listingId}
          title={order.listingTitle}
          thumbnail={order.thumbnail}
          alt={t('itemImage')}
          suffix={
            <p className="text-sm text-text-tertiary flex items-center gap-1 mt-1">
              {order.deliveryMethod === 'shipping' ? (
                <Truck className="w-3.5 h-3.5" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
              {deliveryLabel}
            </p>
          }
        />
      )}

      {order.shippingAddress?.tracking_number && (
        <div className="mt-4 p-3 bg-surface-raised rounded-lg">
          <p className="text-sm font-medium text-text-primary">
            {t('trackingNumber', { number: order.shippingAddress.tracking_number })}
          </p>
          {order.shippingAddress.tracking_url && (
            <a
              href={order.shippingAddress.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-action hover:text-action flex items-center gap-1 mt-1"
            >
              {t('trackShipment')} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
