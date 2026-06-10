/**
 * EditHistoryView Component
 *
 * Displays edit history for workshop proposals and blog submissions.
 * Shows who edited what, when, and allows viewing before/after values.
 *
 * Usage:
 *   <EditHistoryView
 *     history={proposal.edit_history}
 *     fieldLabels={WORKSHOP_PROPOSAL_FIELD_LABELS}
 *   />
 */

'use client';

import { useTranslations } from 'next-intl';
import { formatDateTime } from '@/lib/date-formats';
import { EditHistoryEntry } from '@/lib/admin/edit-utils';

type EditHistoryTranslator = ReturnType<typeof useTranslations>;

interface EditHistoryViewProps {
  /** Edit history entries from database */
  history: EditHistoryEntry[] | null | undefined;
  /** Map of field names to display labels (e.g., {title: 'Titel', description: 'Beschreibung'}) */
  fieldLabels: Record<string, string>;
  /** Optional CSS classes */
  className?: string;
}

/**
 * EditHistoryView - Display admin edit history
 *
 * Ground Truth #1 (Serve Humans): Makes edit history transparent and auditable.
 */
export function EditHistoryView({
  history,
  fieldLabels,
  className = '',
}: EditHistoryViewProps) {
  const t = useTranslations('admin.editHistory');

  // Handle empty or null history
  if (!history || !Array.isArray(history) || history.length === 0) {
    return (
      <div className={`text-sm text-text-tertiary italic ${className}`}>
        {t('empty')}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {history.map((entry, index) => (
        <EditHistoryEntryView
          key={index}
          entry={entry}
          fieldLabels={fieldLabels}
          t={t}
        />
      ))}
    </div>
  );
}

/**
 * Single edit history entry component
 */
function EditHistoryEntryView({
  entry,
  fieldLabels,
  t,
}: {
  entry: EditHistoryEntry;
  fieldLabels: Record<string, string>;
  t: EditHistoryTranslator;
}) {
  const fieldsChangedLabels = entry.fields_changed.map(
    (field) => fieldLabels[field] || field
  );

  return (
    <div className="border-l-2 border-action pl-4 py-2 bg-action-muted/30-muted">
      {/* Header: Editor name and timestamp */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-text-primary">{entry.editor_name}</span>
        <span className="text-xs text-text-tertiary">
          {formatDateTime(entry.timestamp)}
        </span>
      </div>

      {/* Changed fields summary */}
      <div className="text-sm text-text-secondary mb-2">
        <strong>{t('changedFields')}</strong>{' '}
        <span>{fieldsChangedLabels.join(', ')}</span>
      </div>

      {/* Expandable details showing before/after values */}
      <details className="mt-2">
        <summary className="text-xs text-action cursor-pointer hover:text-action">
          {t('showChanges')}
        </summary>
        <div className="mt-2 text-xs bg-surface-base p-3 rounded-sm border border">
          {entry.fields_changed.length === 0 ? (
            <p className="text-text-tertiary italic">{t('noChanges')}</p>
          ) : (
            <div className="space-y-3">
              {entry.fields_changed.map((field) => (
                <FieldChange
                  key={field}
                  field={field}
                  label={fieldLabels[field] || field}
                  previousValue={entry.snapshot[field]}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Display a single field change (before value)
 */
function FieldChange({
  field,
  label,
  previousValue,
  t,
}: {
  field: string;
  label: string;
  previousValue: unknown;
  t: EditHistoryTranslator;
}) {
  const formattedValue = formatValue(previousValue, t);

  return (
    <div className="pb-2 border-b border-subtle last:border-0">
      <div className="font-semibold text-text-secondary mb-1">{label}:</div>
      <div className="text-text-secondary pl-2">
        <div className="text-xs text-text-tertiary">{t('previousValue')}</div>
        <div className="mt-1">{formattedValue}</div>
      </div>
    </div>
  );
}

/**
 * Format a value for display (handles arrays, objects, null, etc.)
 */
function formatValue(value: unknown, t: EditHistoryTranslator): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="italic text-text-tertiary">{t('valueEmpty')}</span>;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : t('valueEmptyList');
  }

  if (typeof value === 'object') {
    return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }

  const strValue = String(value);

  // Truncate long values
  if (strValue.length > 300) {
    return (
      <>
        {strValue.substring(0, 300)}
        <span className="text-text-tertiary italic">{t('valueTruncated')}</span>
      </>
    );
  }

  return strValue || <span className="italic text-text-tertiary">{t('valueEmpty')}</span>;
}
