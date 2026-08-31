'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { adminInteractive } from '@/lib/admin-ui';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, AlertCircle, ArrowDownUp, QrCode } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import {
  INTAKE_TIERS,
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  QUICK_CAPTURE_LABEL,
  QUICK_CAPTURE_ICON,
} from '@/config/intake-checklist';
import type { IntakeTier } from '@/config/intake-checklist';
import { INTAKE_STATUS } from '@/config/intake-status';
import { LISTING_STATUS } from '@/config/marketplace';
import Heading from '@/components/admin/AdminHeading';
import type { DetailData } from '../types';

interface IntakeHeaderProps {
  detail: DetailData;
  onBack: () => void;
  onRefresh: () => void;
  setNewTier: (tier: IntakeTier) => void;
  setShowTierChange: (show: boolean) => void;
}

export function IntakeHeader({
  detail,
  onBack,
  onRefresh,
  setNewTier,
  setShowTierChange,
}: IntakeHeaderProps) {
  const t = useTranslations('admin.intake.detail');
  return (
    <div className="flex items-start justify-between">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-sm text-action hover:underline mb-2 flex items-center gap-1"
        >
          {t('backToPipeline')}
        </Button>
        <Heading level={2} className="text-lg font-semibold">
          {detail.brand} {detail.product_name}
        </Heading>
        <div className="flex items-center gap-3 text-sm text-text-tertiary mt-1">
          <span className="font-mono">{detail.item_uuid}</span>
          <span>
            {detail.intake_tier ? (
              <>
                {INTAKE_TIER_ICONS[detail.intake_tier]} {INTAKE_TIER_LABELS[detail.intake_tier]}
              </>
            ) : (
              <>
                {QUICK_CAPTURE_ICON} {QUICK_CAPTURE_LABEL}
              </>
            )}
          </span>
          {detail.source_donation_id && (
            <span className="text-action">
              {detail.donor_name
                ? t('donationWithName', { name: detail.donor_name })
                : t('donation')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <Link
          href={ROUTES.admin.intakeLabel(detail.id)}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg min-h-11 sm:min-h-0 ${adminInteractive.rowHover}`}
          title={t('printLabelTitle')}
        >
          <QrCode className="w-3.5 h-3.5" /> {t('printLabel')}
        </Link>
        {detail.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
          detail.listing_id && detail.listing_status === LISTING_STATUS.ACTIVE ? (
            <Link
              href={ROUTES.public.marketplaceListing(detail.listing_id)}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-action-muted text-action hover:underline"
            >
              <Check className="w-4 h-4" /> {t('inShop')}
            </Link>
          ) : detail.listing_status === LISTING_STATUS.SOLD ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-surface-overlay text-text-secondary">
              <Check className="w-4 h-4" /> {t('listingSold')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200">
              <AlertCircle className="w-4 h-4" /> {t('listingInactive')}
            </span>
          )
        ) : (
          <>
            {detail.intake_tier && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewTier(
                    detail.intake_tier === INTAKE_TIERS.REFURBISH
                      ? INTAKE_TIERS.PARTS
                      : INTAKE_TIERS.REFURBISH,
                  );
                  setShowTierChange(true);
                }}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg ${adminInteractive.rowHover}`}
                title={t('changeTier')}
              >
                <ArrowDownUp className="w-3.5 h-3.5" /> {t('changeTier')}
              </Button>
            )}
            <Button onClick={onRefresh} variant="ghost" size="icon" title={t('refresh')}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
