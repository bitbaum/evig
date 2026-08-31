'use client';

import { useTranslations } from 'next-intl';
import { adminInteractive } from '@/lib/admin-ui';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowDownUp } from 'lucide-react';
import { getIntakeTierOptions } from '@/config/intake-checklist';
import type { IntakeTier } from '@/config/intake-checklist';
import Heading from '@/components/admin/AdminHeading';
import type { DetailData } from '../types';

interface IntakeTierChangeDialogProps {
  showTierChange: boolean;
  detail: DetailData;
  newTier: IntakeTier;
  setNewTier: (tier: IntakeTier) => void;
  tierChangeReason: string;
  setTierChangeReason: (reason: string) => void;
  tierChanging: boolean;
  onTierChange: () => void;
  setShowTierChange: (show: boolean) => void;
}

export function IntakeTierChangeDialog({
  showTierChange,
  detail,
  newTier,
  setNewTier,
  tierChangeReason,
  setTierChangeReason,
  tierChanging,
  onTierChange,
  setShowTierChange,
}: IntakeTierChangeDialogProps) {
  const t = useTranslations('admin.intake.detail');
  const tForms = useTranslations('admin.forms');

  if (!showTierChange) return null;

  return (
    <div className="border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 space-y-3">
      <Heading
        level={3}
        className="font-medium flex items-center gap-2 text-warning-800 dark:text-warning-200"
      >
        <ArrowDownUp className="w-4 h-4" /> {t('tierChange.heading')}
      </Heading>
      <div className="flex items-start gap-2 text-sm text-warning-700 dark:text-warning-200 bg-warning-100 dark:bg-warning-900/30 p-2 rounded-sm">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{t('tierChange.warning')}</span>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('tierChange.newTierLabel')}</label>
        <Select
          value={newTier}
          onChange={(e) => setNewTier(e.target.value as IntakeTier)}
          className="w-auto"
        >
          {getIntakeTierOptions()
            .filter((o) => o.value !== detail.intake_tier)
            .map((o) => (
              <option key={o.value} value={o.value}>
                {o.icon} {o.label}
              </option>
            ))}
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('tierChange.reasonLabel')}</label>
        <Input
          type="text"
          value={tierChangeReason}
          onChange={(e) => setTierChangeReason(e.target.value)}
          placeholder={t('tierChange.reasonPlaceholder')}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onTierChange}
          disabled={tierChanging || !tierChangeReason.trim()}
          variant="warning"
          size="sm"
        >
          {tierChanging ? t('tierChange.applying') : t('tierChange.apply')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTierChange(false)}
          className={`px-3 py-1.5 border rounded-lg ${adminInteractive.rowHover} text-sm`}
        >
          {tForms('cancel')}
        </Button>
      </div>
    </div>
  );
}
