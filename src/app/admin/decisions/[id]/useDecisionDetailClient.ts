'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { type DecisionStatus } from '@/config/decisions';
import type { DecisionDetail } from './types';

export function useDecisionDetailClient(decisionId: string) {
  const router = useRouter();
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const fetchDecision = useCallback(async () => {
    const result = await apiFetch<DecisionDetail>(`/api/decisions/${decisionId}`);
    if (result.success && result.data) setDecision(result.data);
    setLoading(false);
  }, [decisionId]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchDecision();
    });
  }, [fetchDecision]);

  async function handleTransition(
    newStatus: DecisionStatus,
    extra?: { cancelReason?: string; outcomeSummary?: string }
  ) {
    setActionError('');
    const result = await apiFetch<void>(`/api/decisions/${decisionId}/transition`, {
      method: 'POST',
      body: { status: newStatus, ...extra },
    });
    if (!result.success) {
      setActionError(result.error || 'Fehler');
      return;
    }
    void fetchDecision();
  }

  return {
    decision,
    loading,
    actionError,
    setActionError,
    fetchDecision,
    handleTransition,
    router,
  };
}
