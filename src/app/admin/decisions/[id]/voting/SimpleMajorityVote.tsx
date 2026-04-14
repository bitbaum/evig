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
                ? 'border-green-500 bg-green-50 text-green-700'
                : r === 'no'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-500 bg-gray-50 text-gray-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {SIMPLE_MAJORITY_RESPONSE_CONFIG[r].label}
        </button>
      ))}
    </div>
  );
}
