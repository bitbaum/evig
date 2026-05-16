'use client';

import { CONSENT_RESPONSE_CONFIG, CONSENT_RESPONSES, type ConsentResponse } from '@/config/decisions';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  response: ConsentResponse;
  rationale: string;
  onResponseChange: (r: ConsentResponse) => void;
  onRationaleChange: (v: string) => void;
}

export function ConsentVote({ response, rationale, onResponseChange, onRationaleChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CONSENT_RESPONSES.map((r) => {
          const conf = CONSENT_RESPONSE_CONFIG[r];
          return (
            <button
              key={r}
              type="button"
              onClick={() => onResponseChange(r)}
              className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition min-h-[44px] touch-manipulation ${
                response === r
                  ? `border-current ${conf.color}`
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {conf.label}
            </button>
          );
        })}
      </div>
      <Textarea
        value={rationale}
        onChange={(e) => onRationaleChange(e.target.value)}
        placeholder={
          response === 'block'
            ? 'Begründung (erforderlich bei Blockierung)'
            : 'Begründung (optional)'
        }
        rows={3}
      />
    </div>
  );
}
