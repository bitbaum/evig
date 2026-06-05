'use client';

import { Button } from '@/components/ui/button';
import { DECISION_TYPES, DECISION_TYPE_CONFIG, type DecisionType } from '@/config/decisions';

interface Props {
  selected: DecisionType;
  onChange: (type: DecisionType) => void;
}

export function DecisionTypeSelector({ selected, onChange }: Props) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-text-secondary">Entscheidungstyp</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DECISION_TYPES.map((type) => {
          const conf = DECISION_TYPE_CONFIG[type];
          const isSelected = selected === type;
          return (
            <Button
              key={type}
              type="button"
              variant="outline"
              onClick={() => onChange(type)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                isSelected
                  ? 'border-action bg-action-muted ring-1 ring-action/20'
                  : 'border hover:border-strong hover:bg-surface-raised'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold ${
                  isSelected ? 'bg-action text-white' : 'bg-surface-raised text-text-tertiary'
                }`}>
                  {conf.icon}
                </span>
                <span className="font-medium text-text-primary">{conf.label}</span>
              </div>
              <p className="mt-1.5 text-xs text-text-tertiary">{conf.description}</p>
              {isSelected && (
                <p className="mt-1.5 rounded-sm bg-action-muted px-2 py-1 text-xs text-action">
                  {conf.mechanic}
                </p>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
