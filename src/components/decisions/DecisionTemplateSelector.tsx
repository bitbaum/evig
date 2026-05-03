'use client';

import {
  DECISION_TEMPLATES,
  DECISION_TYPE_CONFIG,
  VOTING_METHOD_CONFIG,
  PARTICIPANT_SCOPE_CONFIG,
  DECISION_CATEGORY_LABELS,
  type DecisionTemplate,
} from '@/config/decisions';
import { adminSurface, adminType } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';

interface Props {
  onSelect: (template: DecisionTemplate) => void;
}

export default function DecisionTemplateSelector({ onSelect }: Props) {
  return (
    <div className="space-y-3">
      <p className={cn(adminType.meta, 'mb-1')}>
        Wähle eine Vorlage als Ausgangspunkt — alle Einstellungen können danach angepasst werden.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DECISION_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={cn(
              adminSurface.card,
              'p-4 text-left hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer w-full'
            )}
          >
            <p className={cn(adminType.sectionTitle, 'mb-1')}>{template.label}</p>
            <p className={cn(adminType.meta, 'mb-3 line-clamp-2')}>{template.description}</p>
            <div className="flex flex-wrap gap-1">
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                {DECISION_TYPE_CONFIG[template.decisionType]?.label}
              </span>
              <span className="rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-xs text-purple-700 dark:text-purple-300">
                {VOTING_METHOD_CONFIG[template.votingMethod]?.label}
              </span>
              <span className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                {PARTICIPANT_SCOPE_CONFIG[template.participantScope]?.label}
              </span>
              <span className="rounded-full bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                {DECISION_CATEGORY_LABELS[template.category]}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
