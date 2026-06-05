'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CONSENT_RESPONSE_CONFIG, CONSENT_RESPONSES, type ConsentResponse } from '@/config/decisions';

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
            <Button
              key={r}
              type="button"
              variant="outline"
              onClick={() => onResponseChange(r)}
              className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition min-h-touch touch-manipulation ${
                response === r
                  ? `border-current ${conf.color}` : 'border text-text-secondary hover:border-strong' }`}
            >
              {conf.label}
            </Button>
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
