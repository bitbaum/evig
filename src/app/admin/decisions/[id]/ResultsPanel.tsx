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
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
          <Image src={imageUrl} alt={label} fill className="object-contain p-0.5" unoptimized />
        </div>
      ) : (
        isWinner !== undefined && (
          <span className={`text-sm ${isWinner ? 'font-bold text-amber-500' : 'text-transparent'}`}>★</span>
        )
      )}
      <span className="w-28 truncate text-sm text-neutral-700">{label}</span>
      <div className="flex-1">
        <div className="h-6 overflow-hidden rounded-md bg-neutral-100">
          <div className={`h-full rounded-md ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-10 text-right text-sm font-medium text-neutral-700">{value}</span>
    </div>
  );
}

function WinnerCard({ opt, metric }: { opt: RankedOption; metric: string }) {
  return (
    <div className="mb-4 flex items-center gap-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
      {opt.imageUrl ? (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-amber-200 bg-white shadow">
          <Image src={opt.imageUrl} alt={opt.label} fill className="object-contain p-1" unoptimized />
        </div>
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-3xl font-bold text-amber-600">
          {opt.label.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-amber-600">Gewinner</div>
        <div className="text-lg font-bold text-neutral-900">{opt.label}</div>
        <div className="text-sm text-neutral-600">{metric}</div>
      </div>
      <span className="ml-auto text-3xl">★</span>
    </div>
  );
}

export default function ResultsPanel({ outcome, outcomeSummary, votingMethod, aiOutcomeNarrative }: Props) {
  const data = outcome as OutcomeData | null;
  if (!data) return null;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <Heading level={2} className="mb-4 text-lg font-semibold text-neutral-900">Ergebnis</Heading>

      {/* AI Outcome Narrative — Beschluss hero */}
      {aiOutcomeNarrative && (
        <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Beschluss
          </p>
          <p className="text-sm font-medium leading-relaxed text-neutral-900 dark:text-white">
            {aiOutcomeNarrative}
          </p>
        </div>
      )}

      {/* Passed/Failed badge */}
      {'passed' in data && (
        <div className="mb-4">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              data.passed ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {data.passed ? 'Angenommen' : 'Abgelehnt'}
          </span>
          <span className="ml-2 text-sm text-neutral-500">{data.totalVotes} Stimmen</span>
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
                key === 'agree' ? 'bg-primary-400'
                  : key === 'block' ? 'bg-red-400'
                  : key === 'disagree' ? 'bg-orange-400'
                  : 'bg-neutral-300'
              }
            />
          ))}
          {data.blocks && data.blocks.length > 0 && (
            <div className="mt-3 rounded-md bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">Blockierungen:</p>
              {data.blocks.map((b, i) => (
                <p key={i} className="mt-1 text-sm text-red-600">
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
              color={i === 0 ? 'bg-blue-500' : 'bg-blue-300'}
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
              color={i === 0 ? 'bg-purple-500' : 'bg-purple-300'}
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
              color={i === 0 ? 'bg-amber-500' : 'bg-amber-300'}
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
              color={key === 'yes' ? 'bg-primary-400' : key === 'no' ? 'bg-red-400' : 'bg-neutral-300'}
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
                color={i === 0 ? 'bg-indigo-500' : 'bg-indigo-300'}
                imageUrl={opt.imageUrl}
                isWinner={i === 0}
              />
            );
          })}
          <p className="text-xs text-neutral-500">
            Borda-Methode: {data.totalVotes} Stimmen · max. {data.maxPossiblePoints} mögliche Punkte
          </p>
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
