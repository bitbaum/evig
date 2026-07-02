'use client';

import { Button } from '@/components/ui/button';
import { OptionCard, type VotingOption } from './OptionCard';
import { adminInteractive } from '@/lib/admin-ui'

interface Props {
  options: VotingOption[];
  allocations: Record<string, number>;
  maxDots: number;
  usedDots: number;
  isGalleryMode: boolean;
  onSet: (optId: string, value: number) => void;
}

export function DotVote({ options, allocations, maxDots, usedDots, isGalleryMode, onSet }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-tertiary">
        Verteile {maxDots} Punkte auf die Optionen ({maxDots - usedDots} verbleibend):
      </p>
      {isGalleryMode ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {options.map((opt) => (
            <OptionCard key={opt.id} opt={opt} selected={(allocations[opt.id] || 0) > 0}>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSet(opt.id, Math.max(0, (allocations[opt.id] || 0) - 1));
                  }}
                  disabled={(allocations[opt.id] || 0) <= 0}
                  className={`h-7 w-7 rounded-full border bg-surface-base text-sm font-bold text-text-secondary ${adminInteractive.rowHover} disabled:opacity-30`}
                >
                  -
                </Button>
                <span className="w-5 text-center text-sm font-bold text-action">
                  {allocations[opt.id] || 0}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSet(opt.id, (allocations[opt.id] || 0) + 1);
                  }}
                  disabled={usedDots >= maxDots}
                  className={`h-7 w-7 rounded-full border bg-surface-base text-sm font-bold text-text-secondary ${adminInteractive.rowHover} disabled:opacity-30`}
                >
                  +
                </Button>
              </div>
            </OptionCard>
          ))}
        </div>
      ) : (
        options.map((opt) => (
          <div
            key={opt.id}
            className="flex items-center gap-3 rounded-md border border p-3"
          >
            <div className="flex-1">
              <span className="font-medium text-text-primary">{opt.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onSet(opt.id, Math.max(0, (allocations[opt.id] || 0) - 1))}
                disabled={(allocations[opt.id] || 0) <= 0}
                className={`h-8 w-8 rounded-md border text-lg font-bold text-text-secondary ${adminInteractive.rowHover} disabled:opacity-30`}
              >
                -
              </Button>
              <span className="w-8 text-center text-lg font-bold">
                {allocations[opt.id] || 0}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onSet(opt.id, (allocations[opt.id] || 0) + 1)}
                disabled={usedDots >= maxDots}
                className={`h-8 w-8 rounded-md border text-lg font-bold text-text-secondary ${adminInteractive.rowHover} disabled:opacity-30`}
              >
                +
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
