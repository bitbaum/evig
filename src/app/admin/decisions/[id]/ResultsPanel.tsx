'use client';

import Image from 'next/image';
import {
  CONSENT_RESPONSE_CONFIG,
  SIMPLE_MAJORITY_RESPONSE_CONFIG,
  type VotingMethod,
  type ConsentResponse,
  type SimpleMajorityResponse,
} from '@/config/decisions';
import Heading from '@/components/admin/AdminHeading';

interface RankedOption {
  id: string;
  label: string;
  imageUrl?: string;
  votes?: number;
  dots?: number;
  averageScore?: number;
  voteCount?: number;
}

/** Covers all voting method outcome shapes */
interface OutcomeData {
  passed?: boolean;
  totalVotes?: number;
  counts?: Record<string, number>;
  ranked?: RankedOption[];
  blocks?: Array<{ rationale?: string }>;
  bordaPoints?: Record<string, number>;
  maxPossiblePoints?: number;
}

interface Props {
  outcome: unknown;
  outcomeSummary: string | null;
  votingMethod: VotingMethod;
  aiOutcomeNarrative?: string | null;
}

function Bar({
  label,
  value,
  max,
  color,
  imageUrl,
  isWinner,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  imageUrl?: string;
  isWinner?: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {imageUrl ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border bg-surface-base">
          <Image src={imageUrl} alt={label} fill className="object-contain p-0.5" unoptimized />
        </div>
      ) : (
        isWinner !== undefined && (
          <span className={`text-sm ${isWinner ? 'font-bold text-warning-500' : 'text-transparent'}`}>★</span>
        )
      )}
      <span className="w-28 truncate text-sm text-text-secondary">{label}</span>
      <div className="flex-1">
        <div className="h-6 overflow-hidden rounded-md bg-surface-raised">
          <div className={`h-full rounded-md ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-text-secondary">{value}</span>
    </div>
  );
}

function WinnerCard({ opt, metric }: { opt: RankedOption; metric: string }) {
  return (
    <div className="mb-4 flex items-center gap-4 rounded-xl border-2 border-warning-400 bg-warning-50 dark:bg-warning-900/20 p-4">
      {opt.imageUrl ? (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-warning-200 bg-surface-base shadow-sm">
          <Image src={opt.imageUrl} alt={opt.label} fill className="object-contain p-1" unoptimized />
        </div>
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-warning-100 dark:bg-warning-900/30 text-3xl font-bold text-warning-600 dark:text-warning-400">
          {opt.label.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-warning-600">Gewinner</div>
        <div className="text-lg font-bold text-text-primary">{opt.label}</div>
        <div className="text-sm text-text-secondary">{metric}</div>
      </div>
      <span className="ml-auto text-3xl">★</span>
    </div>
  );
}

export default function ResultsPanel({ outcome, outcomeSummary, votingMethod, aiOutcomeNarrative }: Props) {
  const data = outcome as OutcomeData | null;
  if (!data) return null;

  return (
    <div className="rounded-lg bg-surface-base p-6 shadow-xs">
      <Heading level={2} className="mb-4 text-lg font-semibold text-text-primary">Ergebnis</Heading>

      {/* AI Outcome Narrative — Beschluss hero */}
      {aiOutcomeNarrative && (
        <div className="mb-6 rounded-lg border-2 border-strong bg-action-muted p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-action">
            Beschluss
          </p>
          <p className="text-sm font-medium leading-relaxed text-text-primary">
            {aiOutcomeNarrative}
          </p>
        </div>
      )}

      {/* Passed/Failed badge */}
      {'passed' in data && (
        <div className="mb-4">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              data.passed ? 'bg-action-muted text-action' : 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-300'
            }`}
          >
            {data.passed ? 'Angenommen' : 'Abgelehnt'}
          </span>
          <span className="ml-2 text-sm text-text-tertiary">{data.totalVotes} Stimmen</span>
        </div>
      )}

      {/* Consent results */}
      {votingMethod === 'consent' && data.counts && (
        <div className="space-y-2">
          {(Object.entries(data.counts) as [ConsentResponse, number][]).map(([key, count]) => (
            <Bar
              key={key}
              label={CONSENT_RESPONSE_CONFIG[key]?.label || key}
              value={count}
              max={data.totalVotes || 0}
              color={
                key === 'agree' ? 'bg-action'
                  : key === 'block' ? 'bg-error-400'
                  : key === 'disagree' ? 'bg-warning-400'
                  : 'bg-surface-overlay'
              }
            />
          ))}
          {data.blocks && data.blocks.length > 0 && (
            <div className="mt-3 rounded-md bg-error-50 dark:bg-error-900/20 p-3">
              <p className="text-sm font-medium text-error-700 dark:text-error-300">Blockierungen:</p>
              {data.blocks.map((b, i) => (
                <p key={i} className="mt-1 text-sm text-error-600 dark:text-error-400">
                  &bull; {b.rationale || '(Keine Begründung)'}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval results */}
      {votingMethod === 'approval' && data.ranked && (
        <div className="space-y-2">
          {data.ranked[0] && (
            <WinnerCard
              opt={data.ranked[0]}
              metric={`${data.ranked[0].votes || 0} Stimmen`}
            />
          )}
          {data.ranked.map((opt, i) => (
            <Bar
              key={opt.id}
              label={opt.label}
              value={opt.votes || 0}
              max={data.totalVotes || 0}
              color={i === 0 ? 'bg-action' : 'bg-action'}
              imageUrl={opt.imageUrl}
              isWinner={i === 0}
            />
          ))}
        </div>
      )}

      {/* Dot results */}
      {votingMethod === 'dot' && data.ranked && (
        <div className="space-y-2">
          {data.ranked[0] && (
            <WinnerCard
              opt={data.ranked[0]}
              metric={`${data.ranked[0].dots || 0} Punkte`}
            />
          )}
          {data.ranked.map((opt, i) => (
            <Bar
              key={opt.id}
              label={opt.label}
              value={opt.dots || 0}
              max={data.ranked?.[0]?.dots || 1}
              color={i === 0 ? 'bg-action' : 'bg-action'}
              imageUrl={opt.imageUrl}
              isWinner={i === 0}
            />
          ))}
        </div>
      )}

      {/* Score results */}
      {votingMethod === 'score' && data.ranked && (
        <div className="space-y-2">
          {data.ranked[0] && (
            <WinnerCard
              opt={data.ranked[0]}
              metric={`Ø ${data.ranked[0].averageScore || 0} Sterne`}
            />
          )}
          {data.ranked.map((opt, i) => (
            <Bar
              key={opt.id}
              label={`${opt.label} (Ø ${opt.averageScore || 0})`}
              value={(opt.averageScore || 0) * 20}
              max={100}
              color={i === 0 ? 'bg-warning-500' : 'bg-warning-300'}
              imageUrl={opt.imageUrl}
              isWinner={i === 0}
            />
          ))}
        </div>
      )}

      {/* Simple majority results */}
      {votingMethod === 'simple_majority' && data.counts && (
        <div className="space-y-2">
          {(Object.entries(data.counts) as [SimpleMajorityResponse, number][]).map(([key, count]) => (
            <Bar
              key={key}
              label={SIMPLE_MAJORITY_RESPONSE_CONFIG[key]?.label || key}
              value={count}
              max={data.totalVotes || 0}
              color={key === 'yes' ? 'bg-action' : key === 'no' ? 'bg-error-400' : 'bg-surface-overlay'}
            />
          ))}
        </div>
      )}

      {/* Ranked Choice (Borda Count) results */}
      {votingMethod === 'ranked_choice' && data.ranked && (
        <div className="space-y-2">
          {data.ranked[0] && (
            <WinnerCard
              opt={data.ranked[0]}
              metric={`${(data.ranked[0] as RankedOption & { bordaPoints?: number }).bordaPoints ?? 0} Borda-Punkte`}
            />
          )}
          {data.ranked.map((opt, i) => {
            const bp = (opt as RankedOption & { bordaPoints?: number; scorePercent?: number }).bordaPoints ?? 0;
            const sp = (opt as RankedOption & { scorePercent?: number }).scorePercent ?? 0;
            const maxBp = (data.ranked?.[0] as (RankedOption & { bordaPoints?: number }) | undefined)?.bordaPoints ?? 1;
            return (
              <Bar
                key={opt.id}
                label={`${opt.label} — ${bp} Punkte (${sp}%)`}
                value={bp}
                max={maxBp > 0 ? maxBp : 1}
                color={i === 0 ? 'bg-info-500' : 'bg-info-300'}
                imageUrl={opt.imageUrl}
                isWinner={i === 0}
              />
            );
          })}
          <p className="text-xs text-text-tertiary">
            Borda-Methode: {data.totalVotes} Stimmen · max. {data.maxPossiblePoints} mögliche Punkte
          </p>
        </div>
      )}

      {/* Outcome Summary */}
      {outcomeSummary && (
        <div className="mt-4 rounded-md bg-action-muted p-3">
          <p className="text-sm font-medium text-action">Zusammenfassung</p>
          <p className="mt-1 text-sm text-action">{outcomeSummary}</p>
        </div>
      )}
    </div>
  );
}
