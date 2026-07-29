'use client';

// Owns the metadata badge row: status/type/method/category pills, creator line, protocol link.

import Link from 'next/link';
import { FileText } from 'lucide-react';
import {
  DECISION_STATUS_CONFIG,
  DECISION_TYPE_CONFIG,
  VOTING_METHOD_CONFIG,
  DECISION_CATEGORY_LABELS,
} from '@/config/decisions';
import { adminType } from '@/lib/admin-ui';
import { formatDateShort } from '@/lib/date-formats';
import type { DecisionDetail } from '../types';

interface Props {
  decision: DecisionDetail;
}

export function HeaderMetaRow({ decision }: Props) {
  const statusConf = DECISION_STATUS_CONFIG[decision.status];
  const typeConf = DECISION_TYPE_CONFIG[decision.decisionType];
  const methodConf = VOTING_METHOD_CONFIG[decision.votingMethod];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConf.color}`}>
        {statusConf.label}
      </span>
      <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-text-secondary">
        {typeConf.label}
      </span>
      <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-text-secondary">
        {methodConf.label}
      </span>
      <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-text-secondary">
        {DECISION_CATEGORY_LABELS[decision.category] || decision.category}
      </span>
      <span className={adminType.meta}>
        {decision.creator.email} · {formatDateShort(decision.createdAt)}
      </span>
      {decision.protocolId && (
        <Link
          href={`/admin/protocols/${decision.protocolId}`}
          className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-action hover:text-action-hover"
        >
          <FileText className="h-3 w-3" />
          Aus Protokoll
        </Link>
      )}
    </div>
  );
}
