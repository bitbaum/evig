'use client';

import {
  CONSENT_RESPONSE_CONFIG,
  SIMPLE_MAJORITY_RESPONSE_CONFIG,
  type VotingMethod,
  type ConsentResponse,
  type SimpleMajorityResponse,
} from '@/config/decisions';
import Heading from '@/components/ui/Heading';

/** Covers all voting method outcome shapes (consent, approval, dot, score, simple_majority) */
interface OutcomeData {
  passed?: boolean;
  totalVotes?: number;
  counts?: Record<string, number>;
  ranked?: Array<{ id: string; label: string; votes?: number; dots?: number; averageScore?: number; voteCount?: number }>;
  blocks?: Array<{ rationale?: string }>;
}

interface Props {
  outcome: unknown;
  outcomeSummary: string | null;
  votingMethod: VotingMethod;
}

// Generic bar component
function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-gray-700">{label}</span>
      <div className="flex-1">
        <div className="h-6 overflow-hidden rounded-md bg-gray-100">
          <div
            className={`h-full rounded-md ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-gray-700">
        {value}
      </span>
    </div>
  );
}

export default function ResultsPanel({
  outcome,
  outcomeSummary,
  votingMethod,
}: Props) {
  // Outcome shape varies by voting method — typed per-branch below
  const data = outcome as OutcomeData | null;
  if (!data) return null;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <Heading level={2} className="mb-4 text-lg font-semibold text-gray-900">Ergebnis</Heading>

      {/* Passed/Failed badge */}
      {'passed' in data && (
        <div className="mb-4">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              data.passed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {data.passed ? 'Angenommen' : 'Abgelehnt'}
          </span>
          <span className="ml-2 text-sm text-gray-500">
            {data.totalVotes} Stimmen
          </span>
        </div>
      )}

      {/* Consent results */}
      {votingMethod === 'consent' && data.counts && (
        <div className="space-y-2">
          {(
            Object.entries(data.counts) as [ConsentResponse, number][]
          ).map(([key, count]) => (
            <Bar
              key={key}
              label={CONSENT_RESPONSE_CONFIG[key]?.label || key}
              value={count}
              max={data.totalVotes || 0}
              color={
                key === 'agree'
                  ? 'bg-green-400'
                  : key === 'block'
                    ? 'bg-red-400'
                    : key === 'disagree'
                      ? 'bg-orange-400'
                      : 'bg-gray-300'
              }
            />
          ))}
          {data.blocks && data.blocks.length > 0 && (
            <div className="mt-3 rounded-md bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">
                Blockierungen:
              </p>
              {data.blocks.map(
                (b, i) => (
                  <p key={i} className="mt-1 text-sm text-red-600">
                    &bull; {b.rationale || '(Keine Begründung)'}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Approval results */}
      {votingMethod === 'approval' && data.ranked && (
        <div className="space-y-2">
          {data.ranked.map(
            (opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                {i === 0 && (
                  <span className="text-sm font-bold text-amber-500">
                    &#9733;
                  </span>
                )}
                <div className="flex-1">
                  <Bar
                    label={opt.label}
                    value={opt.votes || 0}
                    max={data.totalVotes || 0}
                    color={i === 0 ? 'bg-blue-500' : 'bg-blue-300'}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Dot results */}
      {votingMethod === 'dot' && data.ranked && (
        <div className="space-y-2">
          {data.ranked.map(
            (opt, i) => (
              <Bar
                key={opt.id}
                label={`${i === 0 ? '★ ' : ''}${opt.label}`}
                value={opt.dots || 0}
                max={data.ranked?.[0]?.dots || 1}
                color={i === 0 ? 'bg-purple-500' : 'bg-purple-300'}
              />
            )
          )}
        </div>
      )}

      {/* Score results */}
      {votingMethod === 'score' && data.ranked && (
        <div className="space-y-2">
          {data.ranked.map(
            (opt, i) => (
              <Bar
                key={opt.id}
                label={`${i === 0 ? '★ ' : ''}${opt.label} (Ø ${opt.averageScore || 0})`}
                value={(opt.averageScore || 0) * 20} // scale to percentage
                max={100}
                color={i === 0 ? 'bg-amber-500' : 'bg-amber-300'}
              />
            )
          )}
        </div>
      )}

      {/* Simple majority results */}
      {votingMethod === 'simple_majority' && data.counts && (
        <div className="space-y-2">
          {(
            Object.entries(data.counts) as [SimpleMajorityResponse, number][]
          ).map(([key, count]) => (
            <Bar
              key={key}
              label={SIMPLE_MAJORITY_RESPONSE_CONFIG[key]?.label || key}
              value={count}
              max={data.totalVotes || 0}
              color={
                key === 'yes'
                  ? 'bg-green-400'
                  : key === 'no'
                    ? 'bg-red-400'
                    : 'bg-gray-300'
              }
            />
          ))}
        </div>
      )}

      {/* Outcome Summary */}
      {outcomeSummary && (
        <div className="mt-4 rounded-md bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-700">Zusammenfassung</p>
          <p className="mt-1 text-sm text-blue-600">{outcomeSummary}</p>
        </div>
      )}
    </div>
  );
}
