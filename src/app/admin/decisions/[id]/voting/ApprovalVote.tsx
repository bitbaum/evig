'use client';

import { OptionCard, type VotingOption } from './OptionCard';

interface Props {
  options: VotingOption[];
  approvedOptions: Set<string>;
  isGalleryMode: boolean;
  onToggle: (optId: string) => void;
}

export function ApprovalVote({ options, approvedOptions, isGalleryMode, onToggle }: Props) {
  return (
    <div className="space-y-3">
      {isGalleryMode ? (
        <>
          <p className="text-sm text-text-tertiary">
            Wähle alle Optionen, die du unterstützt ({approvedOptions.size} ausgewählt):
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {options.map((opt) => (
              <OptionCard
                key={opt.id}
                opt={opt}
                selected={approvedOptions.has(opt.id)}
                onClick={() => onToggle(opt.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-text-tertiary">Wähle alle Optionen, die du unterstützt:</p>
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 rounded-md border border p-3 hover:bg-neutral-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={approvedOptions.has(opt.id)}
                onChange={(e) => {
                  onToggle(opt.id);
                  void e; // consumed by onToggle
                }}
                className="rounded"
              />
              <div>
                <span className="font-medium text-neutral-800">{opt.label}</span>
                {opt.description && (
                  <span className="ml-2 text-sm text-text-tertiary">{opt.description}</span>
                )}
              </div>
            </label>
          ))}
        </>
      )}
    </div>
  );
}
