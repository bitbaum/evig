'use client';

import { SIMPLE_MAJORITY_RESPONSE_CONFIG, SIMPLE_MAJORITY_RESPONSES, type SimpleMajorityResponse } from '@/config/decisions';

interface Props {
  response: SimpleMajorityResponse;
  onChange: (r: SimpleMajorityResponse) => void;
}

export function SimpleMajorityVote({ response, onChange }: Props) {
  return (
    <div className="flex gap-3">
      {SIMPLE_MAJORITY_RESPONSES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={`flex-1 rounded-md border-2 px-4 py-3 text-sm font-medium transition ${
            response === r
              ? r === 'yes'
                ? 'border-action bg-action-muted-muted text-action'
                : r === 'no'
                  ? 'border-error-500 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300'
                  : 'border-strong bg-surface-raised text-text-secondary'
              : 'border text-text-secondary hover:border-strong'
          }`}
        >
          {SIMPLE_MAJORITY_RESPONSE_CONFIG[r].label}
        </button>
      ))}
    </div>
  );
}
