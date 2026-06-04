'use client';

import { VOTING_METHODS, VOTING_METHOD_CONFIG, DOT_VOTING_DEFAULTS, type VotingMethod } from '@/config/decisions';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';

interface Props {
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
}

export function AdvancedSettings({
  votingMethod, onMethodChange,
  dotCount, onDotCountChange,
  quorumType, onQuorumTypeChange,
  quorumValue, onQuorumValueChange,
  blindVoting, onBlindVotingChange,
}: Props) {
  return (
    <div className="space-y-4">
      <FormField
        htmlFor="decision-voting-method"
        label={<>Abstimmungsmethode<span className="ml-1.5 font-normal text-text-muted">(wird durch Entscheidungstyp gesetzt)</span></>}
        hint={VOTING_METHOD_CONFIG[votingMethod].description}
      >
        <Select
          id="decision-voting-method"
          value={votingMethod}
          onChange={(e) => onMethodChange(e.target.value as VotingMethod)}
        >
          {VOTING_METHODS.map((m) => (
            <option key={m} value={m}>
              {VOTING_METHOD_CONFIG[m].label}
            </option>
          ))}
        </Select>
      </FormField>

      {votingMethod === 'dot' && (
        <FormField htmlFor="decision-dot-count" label="Punkte pro Person">
          <Input
            id="decision-dot-count"
            type="number"
            value={dotCount}
            onChange={(e) => onDotCountChange(Number(e.target.value))}
            min={DOT_VOTING_DEFAULTS.min}
            max={DOT_VOTING_DEFAULTS.max}
            className="w-24"
          />
        </FormField>
      )}

      <div className="flex gap-3">
        <FormField htmlFor="decision-quorum-type" label="Quorum Typ">
          <Select
            id="decision-quorum-type"
            value={quorumType}
            onChange={(e) => onQuorumTypeChange(e.target.value as 'percentage' | 'absolute')}
          >
            <option value="percentage">Prozent</option>
            <option value="absolute">Absolut</option>
          </Select>
        </FormField>
        <FormField htmlFor="decision-quorum-value" label="Wert">
          <Input
            id="decision-quorum-value"
            type="number"
            value={quorumValue}
            onChange={(e) => onQuorumValueChange(Number(e.target.value))}
            min={1}
            className="w-24"
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={blindVoting}
          onChange={(e) => onBlindVotingChange(e.target.checked)}
          className="rounded"
        />
        Geheime Abstimmung (Stimmen erst nach eigener Abgabe sichtbar)
      </label>
    </div>
  );
}
