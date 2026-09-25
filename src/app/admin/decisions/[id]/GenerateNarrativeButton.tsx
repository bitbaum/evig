'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

/**
 * The only way a Beschluss narrative is written: a staff member asks for it.
 * Closing a decision does not call the model (free-tier budget).
 */
export function GenerateNarrativeButton({
  decisionId,
  onGenerated,
}: {
  decisionId: string;
  onGenerated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setBusy(true);
    setError('');
    const result = await apiFetch<{ narrative: string }>(`/api/decisions/${decisionId}/narrative`, {
      method: 'POST',
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error || 'Fehler');
      return;
    }
    onGenerated();
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" onClick={() => void generate()} disabled={busy}>
        {busy ? 'Wird erstellt…' : 'Beschlusstext mit KI erstellen'}
      </Button>
      <span className="text-xs text-text-tertiary">
        Formuliert das Ergebnis als Protokoll-Satz (ein KI-Aufruf).
      </span>
      {error && <span className="text-xs text-error-600">{error}</span>}
    </div>
  );
}
