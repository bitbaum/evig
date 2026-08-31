'use client';

/**
 * TimecardApprovalsClient
 *
 * Multi-select approval queue. The hot path: HR opens this on Monday
 * morning, scans 18 submitted weekly timecards, ticks them all, hits
 * approve. One round-trip. Edge cases (a row that needs a custom
 * note, or a row that should be rejected) keep their per-row affordances.
 *
 * Density choices:
 *   - One row per timecard, table-style. Avatar + name + dept + period +
 *     hours + status badge. Click a name → opens person profile in a
 *     new tab (so the queue position isn't lost).
 *   - Sticky action bar at the top once anything is selected.
 *   - Filter strip: status tab (open / approved — approving a card must
 *     NOT make it vanish; it moves to the approved tab where it stays
 *     inspectable and editable), period_type (week / month / both).
 *
 * State + data flow live here; render slices live in ./approvals/*.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api/client';
import { TimecardReviewDrawer } from './TimecardReviewDrawer';
import { TIMECARD_STATUSES } from '@/config/timecards';
import { ApprovalsBanners } from './approvals/ApprovalsBanners';
import { ApprovalsBulkBar } from './approvals/ApprovalsBulkBar';
import { ApprovalsFilterBar } from './approvals/ApprovalsFilterBar';
import { ApprovalsQueue } from './approvals/ApprovalsQueue';
import type { ApprovalRow, PeriodFilter, StatusFilter } from './approvals/types';

interface ListResponse {
  items: ApprovalRow[];
  limit: number;
  offset: number;
}

interface BulkResultResponse {
  total: number;
  approved: number;
  rejected: number;
  failed: number;
  results: Array<{ id: string; ok: boolean; error?: string }>;
}

// Server error codes → translation key for the partial-failure banner.
const BULK_FAILURE_KEYS: Record<string, string> = {
  timecard_self_review: 'failureSelfReview',
  timecard_not_submitted: 'failureNotSubmitted',
  timecard_not_found: 'failureNotFound',
  timecard_payroll_locked: 'failurePayrollLocked',
};

export function TimecardApprovalsClient({
  currentUserId,
  allowSelfReview = false,
}: {
  currentUserId: string;
  /** Super-admins may approve their own cards — in a small org they're often
   *  the only approver. The server enforces the same rule; this just avoids
   *  offering a doomed click to everyone else. */
  allowSelfReview?: boolean;
}) {
  const t = useTranslations('admin.timecards');
  const [items, setItems] = useState<ApprovalRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sharedNote, setSharedNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(TIMECARD_STATUSES.SUBMITTED);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bulk approve/reject only makes sense on the open (submitted) tab.
  const bulkEnabled = statusFilter === TIMECARD_STATUSES.SUBMITTED;

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({
      status: statusFilter,
      limit: '100',
    });
    if (periodFilter !== 'all') params.set('period_type', periodFilter);

    const result = await apiFetch<ListResponse>(`/api/admin/timecards?${params}`);
    if (result.success && result.data) {
      setItems(result.data.items);
      // Drop any selected ids that no longer match.
      setSelected((prev) => {
        const stillThere = new Set<string>();
        for (const r of result.data!.items) if (prev.has(r.id)) stillThere.add(r.id);
        return stillThere;
      });
    } else {
      setError(result.error || t('queueLoadError'));
    }
    setIsLoading(false);
  }, [periodFilter, statusFilter, t]);

  // Reload whenever a filter changes. setState inside the effect
  // is the right pattern here — we kick off an async fetch that calls
  // setItems / setError when it lands — so the lint rule is suppressed.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Own cards are normally not selectable — the server enforces the four-eyes
  // rule (timecard_self_review), so don't offer the doomed click. Super-admins
  // are exempt (allowSelfReview) since they're often the sole approver.
  const selectableItems = useMemo(
    () => (allowSelfReview ? items : items.filter((i) => i.user_id !== currentUserId)),
    [items, currentUserId, allowSelfReview],
  );
  const allSelected = selectableItems.length > 0 && selected.size === selectableItems.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableItems.map((i) => i.id)));
  };

  const runBulk = async (status: 'approved' | 'rejected') => {
    if (selected.size === 0) return;
    // A rejection reason is optional — it's sent when provided so the submitter
    // knows what to change, but isn't required.
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await apiFetch<BulkResultResponse>('/api/admin/timecards/bulk-review', {
      method: 'POST',
      body: {
        ids: Array.from(selected),
        status,
        review_notes: sharedNote.trim() || null,
      },
    });
    setBusy(false);
    if (!result.success || !result.data) {
      setError(result.error || t('queueBulkError'));
      return;
    }
    const okCount = result.data.approved + result.data.rejected;
    const okPart =
      status === 'approved'
        ? t('bulkApprovedResult', { count: okCount })
        : t('bulkRejectedResult', { count: okCount });
    // Surface WHY rows failed — a bare failure count without a reason left the
    // approver guessing (self-review, race, payroll lock all looked identical).
    const failureReasons = Array.from(
      new Set(
        result.data.results
          .filter((r) => !r.ok)
          .map((r) => {
            const key = BULK_FAILURE_KEYS[r.error ?? ''];
            return key ? t(key as never) : (r.error ?? t('failureUnknown'));
          }),
      ),
    );
    setMessage(
      okPart +
        (result.data.failed > 0
          ? ` · ${t('bulkFailedResult', { count: result.data.failed, reasons: failureReasons.join(', ') })}`
          : ''),
    );
    setSelected(new Set());
    setSharedNote('');
    await loadQueue();
  };

  const totalSelectedMinutes = useMemo(() => {
    return items
      .filter((i) => selected.has(i.id))
      .reduce((sum, i) => sum + (Number(i.total_minutes) || 0), 0);
  }, [items, selected]);

  return (
    <div className="space-y-4">
      {/* Filter strip */}
      <ApprovalsFilterBar
        statusFilter={statusFilter}
        periodFilter={periodFilter}
        isLoading={isLoading}
        onStatusFilterChange={(opt) => {
          setStatusFilter(opt);
          setSelected(new Set());
        }}
        onPeriodFilterChange={setPeriodFilter}
        onRefresh={loadQueue}
      />

      {/* Sticky action bar — only when something is selected */}
      {bulkEnabled && selected.size > 0 && (
        <ApprovalsBulkBar
          selectedCount={selected.size}
          totalSelectedMinutes={totalSelectedMinutes}
          sharedNote={sharedNote}
          busy={busy}
          onSharedNoteChange={setSharedNote}
          onApprove={() => runBulk('approved')}
          onReject={() => runBulk('rejected')}
        />
      )}

      {/* Status banners */}
      <ApprovalsBanners message={message} error={error} />

      {/* Queue */}
      <ApprovalsQueue
        items={items}
        isLoading={isLoading}
        bulkEnabled={bulkEnabled}
        selected={selected}
        allSelected={allSelected}
        currentUserId={currentUserId}
        allowSelfReview={allowSelfReview}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onReview={setOpenCardId}
      />

      {openCardId && (
        <TimecardReviewDrawer
          cardId={openCardId}
          currentUserId={currentUserId}
          allowSelfReview={allowSelfReview}
          onClose={() => setOpenCardId(null)}
          onChanged={loadQueue}
        />
      )}
    </div>
  );
}
