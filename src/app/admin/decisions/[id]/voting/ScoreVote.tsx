'use client';

import { SCORE_RANGE } from '@/config/decisions';
import { OptionCard, type VotingOption } from './OptionCard';

interface Props {
  options: VotingOption[];
  scores: Record<string, number>;
  isGalleryMode: boolean;
  onSet: (optId: string, score: number) => void;
}

export function ScoreVote({ options, scores, isGalleryMode, onSet }: Props) {
  return (
    <div className="space-y-3">
      {isGalleryMode ? (
        <>
          <p className="text-sm text-text-tertiary">
            Bewerte jede Option von {SCORE_RANGE.min} bis {SCORE_RANGE.max} Sternen:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {options.map((opt) => (
              <OptionCard key={opt.id} opt={opt} selected={(scores[opt.id] || 0) > 3}>
                <div className="mt-2 flex justify-center gap-0.5">
                  {Array.from({ length: SCORE_RANGE.max }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSet(opt.id, n);
                      }}
                      className={`text-lg transition ${
                        (scores[opt.id] || 0) >= n ? 'text-warning-400' : 'text-text-muted hover:text-warning-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {(scores[opt.id] || 0) > 0 && (
                  <p className="mt-0.5 text-center text-xs text-text-tertiary">
                    {scores[opt.id]}/{SCORE_RANGE.max}
                  </p>
                )}
              </OptionCard>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text-tertiary">
            Bewerte jede Option von {SCORE_RANGE.min} bis {SCORE_RANGE.max}:
          </p>
          {options.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center gap-3 rounded-md border border p-3"
            >
              <div className="flex-1">
                <span className="font-medium text-text-primary">{opt.label}</span>
              </div>
              <div className="flex gap-1">
                {Array.from(
                  { length: SCORE_RANGE.max - SCORE_RANGE.min + 1 },
                  (_, i) => SCORE_RANGE.min + i
                ).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onSet(opt.id, n)}
                    className={`h-9 w-9 rounded-md text-sm font-bold transition ${
                      (scores[opt.id] || 0) >= n
                        ? 'bg-warning-400 text-white'
                        : 'border border-default text-text-tertiary hover:border-warning-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
