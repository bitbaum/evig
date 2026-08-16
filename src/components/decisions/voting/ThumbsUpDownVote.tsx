'use client';

import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  THUMBS_UP_DOWN_CHOICES,
  THUMBS_UP_DOWN_CHOICE_CONFIG,
  type ThumbsUpDownChoice,
} from '@/config/decisions';

interface Props {
  choice: ThumbsUpDownChoice | null;
  onChange: (c: ThumbsUpDownChoice) => void;
}

const ICONS = { up: ThumbsUp, down: ThumbsDown } as const;

export function ThumbsUpDownVote({ choice, onChange }: Props) {
  return (
    <div className="flex gap-3">
      {THUMBS_UP_DOWN_CHOICES.map((c) => {
        const Icon = ICONS[c];
        const selected = choice === c;
        return (
          <Button
            key={c}
            type="button"
            variant="outline"
            aria-pressed={selected}
            onClick={() => onChange(c)}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md border-2 px-4 py-3 text-sm font-medium transition ${
              selected
                ? c === 'up'
                  ? 'border-action bg-action-muted text-action'
                  : 'border-error-500 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300'
                : 'border text-text-secondary hover:border-strong'
            }`}
          >
            <Icon className="h-4 w-4" />
            {THUMBS_UP_DOWN_CHOICE_CONFIG[c].label}
          </Button>
        );
      })}
    </div>
  );
}
