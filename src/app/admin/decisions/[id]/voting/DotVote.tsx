'use client';

import { OptionCard, type VotingOption } from './OptionCard';

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
      <p className="text-sm text-neutral-500">
        Verteile {maxDots} Punkte auf die Optionen ({maxDots - usedDots} verbleibend):
      </p>
      {isGalleryMode ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {options.map((opt) => (
            <OptionCard key={opt.id} opt={opt} selected={(allocations[opt.id] || 0) > 0}>
              <div className="mt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSet(opt.id, Math.max(0, (allocations[opt.id] || 0) - 1));
                  }}
                  disabled={(allocations[opt.id] || 0) <= 0}
                  className="h-7 w-7 rounded-full border bg-white text-sm font-bold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                >
                  -
                </button>
                <span className="w-5 text-center text-sm font-bold text-info-600">
                  {allocations[opt.id] || 0}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSet(opt.id, (allocations[opt.id] || 0) + 1);
                  }}
                  disabled={usedDots >= maxDots}
                  className="h-7 w-7 rounded-full border bg-white text-sm font-bold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </OptionCard>
          ))}
        </div>
      ) : (
        options.map((opt) => (
          <div
            key={opt.id}
            className="flex items-center gap-3 rounded-md border border-neutral-200 p-3"
          >
            <div className="flex-1">
              <span className="font-medium text-neutral-800">{opt.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSet(opt.id, Math.max(0, (allocations[opt.id] || 0) - 1))}
                disabled={(allocations[opt.id] || 0) <= 0}
                className="h-8 w-8 rounded-md border text-lg font-bold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
              >
                -
              </button>
              <span className="w-8 text-center text-lg font-bold">
                {allocations[opt.id] || 0}
              </span>
              <button
                type="button"
                onClick={() => onSet(opt.id, (allocations[opt.id] || 0) + 1)}
                disabled={usedDots >= maxDots}
                className="h-8 w-8 rounded-md border text-lg font-bold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
