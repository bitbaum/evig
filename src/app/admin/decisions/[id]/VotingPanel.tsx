'use client';

import { useState } from 'react';
import {
  CONSENT_RESPONSE_CONFIG,
  SIMPLE_MAJORITY_RESPONSE_CONFIG,
  CONSENT_RESPONSES,
  SIMPLE_MAJORITY_RESPONSES,
  SCORE_RANGE,
  type VotingMethod,
  type ConsentResponse,
  type SimpleMajorityResponse,
} from '@/config/decisions';

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  decisionId: string;
  votingMethod: VotingMethod;
  options: Option[];
  dotCount: number | null;
  hasUserVoted: boolean;
  onVoted: () => void;
}

export default function VotingPanel({
  decisionId,
  votingMethod,
  options,
  dotCount,
  hasUserVoted,
  onVoted,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Consent state
  const [consentResponse, setConsentResponse] =
    useState<ConsentResponse>('agree');
  const [rationale, setRationale] = useState('');

  // Approval state
  const [approvedOptions, setApprovedOptions] = useState<Set<string>>(
    new Set()
  );

  // Dot state
  const maxDots = dotCount || 5;
  const [allocations, setAllocations] = useState<Record<string, number>>(
    Object.fromEntries(options.map((o) => [o.id, 0]))
  );
  const usedDots = Object.values(allocations).reduce((a, b) => a + b, 0);

  // Score state
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(options.map((o) => [o.id, 3]))
  );

  // Simple majority state
  const [majorityResponse, setMajorityResponse] =
    useState<SimpleMajorityResponse>('yes');

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    let voteData: unknown;

    switch (votingMethod) {
      case 'consent':
        voteData = {
          response: consentResponse,
          rationale: rationale || undefined,
        };
        break;
      case 'approval':
        voteData = { approved_options: Array.from(approvedOptions) };
        break;
      case 'dot':
        voteData = { allocations };
        break;
      case 'score':
        voteData = { scores };
        break;
      case 'simple_majority':
        voteData = { response: majorityResponse };
        break;
    }

    try {
      const res = await fetch(`/api/decisions/${decisionId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Fehler beim Abstimmen');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      onVoted();
    } catch {
      setError('Netzwerkfehler');
    }
    setSubmitting(false);
  }

  if (success || hasUserVoted) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center shadow-sm">
        <p className="font-medium text-green-700">
          Deine Stimme wurde abgegeben
        </p>
        <p className="mt-1 text-sm text-green-600">
          Du kannst deine Stimme ändern, solange die Abstimmung läuft.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Deine Stimme
      </h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Consent Voting */}
      {votingMethod === 'consent' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {CONSENT_RESPONSES.map((r) => {
              const conf = CONSENT_RESPONSE_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setConsentResponse(r)}
                  className={`rounded-md border-2 px-4 py-2 text-sm font-medium transition ${
                    consentResponse === r
                      ? `border-current ${conf.color}`
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder={
              consentResponse === 'block'
                ? 'Begründung (erforderlich bei Blockierung)'
                : 'Begründung (optional)'
            }
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* Approval Voting */}
      {votingMethod === 'approval' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Wähle alle Optionen, die du unterstützt:
          </p>
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={approvedOptions.has(opt.id)}
                onChange={(e) => {
                  const next = new Set(approvedOptions);
                  if (e.target.checked) next.add(opt.id);
                  else next.delete(opt.id);
                  setApprovedOptions(next);
                }}
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-800">{opt.label}</span>
                {opt.description && (
                  <span className="ml-2 text-sm text-gray-500">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Dot Voting */}
      {votingMethod === 'dot' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Verteile {maxDots} Punkte auf die Optionen ({maxDots - usedDots}{' '}
            verbleibend)
          </p>
          {options.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 p-3"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-800">{opt.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAllocations({
                      ...allocations,
                      [opt.id]: Math.max(0, (allocations[opt.id] || 0) - 1),
                    })
                  }
                  disabled={(allocations[opt.id] || 0) <= 0}
                  className="h-8 w-8 rounded-md border text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  -
                </button>
                <span className="w-8 text-center text-lg font-bold">
                  {allocations[opt.id] || 0}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAllocations({
                      ...allocations,
                      [opt.id]: (allocations[opt.id] || 0) + 1,
                    })
                  }
                  disabled={usedDots >= maxDots}
                  className="h-8 w-8 rounded-md border text-lg font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score Voting */}
      {votingMethod === 'score' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Bewerte jede Option von {SCORE_RANGE.min} bis {SCORE_RANGE.max}:
          </p>
          {options.map((opt) => (
            <div
              key={opt.id}
              className="flex items-center gap-3 rounded-md border border-gray-200 p-3"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-800">{opt.label}</span>
              </div>
              <div className="flex gap-1">
                {Array.from(
                  { length: SCORE_RANGE.max - SCORE_RANGE.min + 1 },
                  (_, i) => SCORE_RANGE.min + i
                ).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScores({ ...scores, [opt.id]: n })}
                    className={`h-9 w-9 rounded-md text-sm font-bold transition ${
                      (scores[opt.id] || 0) >= n
                        ? 'bg-amber-400 text-white'
                        : 'border border-gray-300 text-gray-400 hover:border-amber-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Majority */}
      {votingMethod === 'simple_majority' && (
        <div className="flex gap-3">
          {SIMPLE_MAJORITY_RESPONSES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMajorityResponse(r)}
              className={`flex-1 rounded-md border-2 px-4 py-3 text-sm font-medium transition ${
                majorityResponse === r
                  ? r === 'yes'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : r === 'no'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {SIMPLE_MAJORITY_RESPONSE_CONFIG[r].label}
            </button>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Wird gesendet...' : 'Stimme abgeben'}
      </button>
    </div>
  );
}
