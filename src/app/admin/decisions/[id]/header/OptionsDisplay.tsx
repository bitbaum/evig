'use client';

// Owns the decision options display: image grid when any option has an image, compact list otherwise.

import Image from 'next/image';
import { adminType } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import type { DecisionDetail } from '../types';

interface Props {
  decision: DecisionDetail;
}

export function OptionsDisplay({ decision }: Props) {
  if (decision.options.length === 0) return null;

  return (
    <div className="mt-4">
      <p className={cn(adminType.subTitle, 'mb-2')}>Optionen ({decision.options.length})</p>
      {decision.options.some((o) => o.imageUrl) ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {decision.options.map((opt) => (
            <div
              key={opt.id}
              className="rounded-lg border border bg-surface-raised overflow-hidden"
            >
              {opt.imageUrl ? (
                <div className="relative aspect-square w-full bg-surface-base">
                  <Image src={opt.imageUrl} alt={opt.label} fill className="object-contain p-2" />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-surface-raised text-3xl font-bold text-text-muted">
                  {opt.label.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="p-2">
                <p className={cn('truncate text-xs font-medium', adminType.body)}>{opt.label}</p>
                {opt.description && (
                  <p className={cn('truncate', adminType.meta)}>{opt.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {decision.options.map((opt) => (
            <div key={opt.id} className="rounded-md border border px-3 py-2">
              <span className={cn('font-medium', adminType.body)}>{opt.label}</span>
              {opt.description && (
                <span className={cn('ml-2', adminType.meta)}>– {opt.description}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
