'use client';

import { VOTING_METHODS, VOTING_METHOD_CONFIG, DOT_VOTING_DEFAULTS, type VotingMethod } from '@/config/decisions';

interface Props {
  show: boolean;
  onToggle: () => void;
  votingMethod: VotingMethod;
  onMethodChange: (m: VotingMethod) => void;
  dotCount: number;
  onDotCountChange: (n: number) => void;
  quorumType: 'percentage' | 'absolute';
  onQuorumTypeChange: (t: 'percentage' | 'absolute') => void;
  quorumValue: number;
  onQuorumValueChange: (n: number) => void;
  blindVoting: boolean;
  onBlindVotingChange: (v: boolean) => void;
  allowPublicVoting: boolean;
  onAllowPublicVotingChange: (v: boolean) => void;
}

export function AdvancedSettings({
  show, onToggle,
  votingMethod, onMethodChange,
  dotCount, onDotCountChange,
  quorumType, onQuorumTypeChange,
  quorumValue, onQuorumValueChange,
  blindVoting, onBlindVotingChange,
  allowPublicVoting, onAllowPublicVotingChange,
}: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="text-sm text-neutral-500 hover:text-neutral-700"
      >
        {show ? '▼' : '▶'} Erweiterte Einstellungen
      </button>

      {show && (
        <div className="mt-3 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          {/* Voting Method */}
          <div>
            <label htmlFor="decision-voting-method" className="mb-1 block text-sm font-medium text-neutral-700">
              Abstimmungsmethode
            </label>
            <select
              id="decision-voting-method"
              value={votingMethod}
              onChange={(e) => onMethodChange(e.target.value as VotingMethod)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {VOTING_METHODS.map((m) => (
                <option key={m} value={m}>
                  {VOTING_METHOD_CONFIG[m].label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-500">
              {VOTING_METHOD_CONFIG[votingMethod].description}
            </p>
          </div>

          {/* Dot Count */}
          {votingMethod === 'dot' && (
            <div>
              <label htmlFor="decision-dot-count" className="mb-1 block text-sm font-medium text-neutral-700">
                Punkte pro Person
              </label>
              <input
                id="decision-dot-count"
                type="number"
                value={dotCount}
                onChange={(e) => onDotCountChange(Number(e.target.value))}
                min={DOT_VOTING_DEFAULTS.min}
                max={DOT_VOTING_DEFAULTS.max}
                className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Quorum */}
          <div className="flex gap-3">
            <div>
              <label htmlFor="decision-quorum-type" className="mb-1 block text-sm font-medium text-neutral-700">
                Quorum Typ
              </label>
              <select
                id="decision-quorum-type"
                value={quorumType}
                onChange={(e) => onQuorumTypeChange(e.target.value as 'percentage' | 'absolute')}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="percentage">Prozent</option>
                <option value="absolute">Absolut</option>
              </select>
            </div>
            <div>
              <label htmlFor="decision-quorum-value" className="mb-1 block text-sm font-medium text-neutral-700">
                Wert
              </label>
              <input
                id="decision-quorum-value"
                type="number"
                value={quorumValue}
                onChange={(e) => onQuorumValueChange(Number(e.target.value))}
                min={1}
                className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Blind Voting */}
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={blindVoting}
              onChange={(e) => onBlindVotingChange(e.target.checked)}
              className="rounded"
            />
            Geheime Abstimmung (Stimmen erst nach eigener Abgabe sichtbar)
          </label>

          {/* Public Voting */}
          <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-primary-900">
              <input
                type="checkbox"
                checked={allowPublicVoting}
                onChange={(e) => onAllowPublicVotingChange(e.target.checked)}
                className="rounded border-primary-400 text-primary-600 focus:ring-primary-500"
              />
              Öffentliche Abstimmung (Link teilbar — kein Konto nötig)
            </label>
            <p className="mt-1 text-xs text-primary-700 ml-5">
              Wenn aktiviert, kann jede Person mit dem Link über ihre E-Mail-Adresse abstimmen — auch ohne Konto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
