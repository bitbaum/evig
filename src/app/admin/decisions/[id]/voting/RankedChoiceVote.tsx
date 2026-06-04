'use client';

import { type VotingOption } from './OptionCard';

interface Props {
  options: VotingOption[];
  ranking: string[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function RankedChoiceVote({ options, ranking, onMoveUp, onMoveDown }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-tertiary">
        Bringe die Kandidatinnen in deine bevorzugte Reihenfolge (1 = höchste Priorität):
      </p>
      <div className="space-y-2">
        {ranking.map((optId, index) => {
          const opt = options.find((o) => o.id === optId);
          if (!opt) return null;
          return (
            <div
              key={optId}
              className="flex items-center gap-3 rounded-md border border bg-surface-base px-3 py-2.5"
            >
              <span className="w-6 text-center text-sm font-bold text-action">
                {index + 1}.
              </span>
              <span className="flex-1 text-sm font-medium text-neutral-800">{opt.label}</span>
              {opt.description && (
                <span className="hidden text-xs text-text-muted sm:block">{opt.description}</span>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onMoveUp(index)}
                  disabled={index === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border text-text-tertiary hover:bg-neutral-100 disabled:opacity-30"
                  title="Höher"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(index)}
                  disabled={index === ranking.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border text-text-tertiary hover:bg-neutral-100 disabled:opacity-30"
                  title="Tiefer"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-text-muted">
        Punkte werden nach Borda-Methode berechnet: 1. Platz erhält die meisten Punkte.
      </p>
    </div>
  );
}
