'use client';

import { PARTICIPANT_SCOPES, PARTICIPANT_SCOPE_CONFIG, PARTICIPANT_SCOPE, type ParticipantScope } from '@/config/decisions';
import Heading from '@/components/admin/AdminHeading';
import { Input } from '@/components/ui/input';
import { type TeamMember } from './useDecisionForm';

interface Props {
  participantScope: ParticipantScope;
  onScopeChange: (scope: ParticipantScope) => void;
  teamMembers: TeamMember[];
  selectedParticipants: Set<string>;
  onToggle: (id: string) => void;
  participantSearch: string;
  onSearchChange: (v: string) => void;
  filteredMembers: TeamMember[];
}

export function ParticipantSelector({
  participantScope, onScopeChange,
  teamMembers, selectedParticipants, onToggle,
  participantSearch, onSearchChange, filteredMembers,
}: Props) {
  return (
    <div className="rounded-lg border border bg-surface-raised p-4 space-y-3">
      <div>
        <Heading level={3} className="text-sm font-medium text-text-primary">Abstimmungsberechtigt</Heading>
        <p className="mt-0.5 text-xs text-text-tertiary">Wer darf an dieser Abstimmung teilnehmen?</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PARTICIPANT_SCOPES.map((scope) => {
          const conf = PARTICIPANT_SCOPE_CONFIG[scope];
          return (
            <button
              key={scope}
              type="button"
              onClick={() => onScopeChange(scope)}
              className={`rounded-lg border-2 p-2.5 text-left transition ${
                participantScope === scope
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border hover:border-neutral-300 bg-surface-base'
              }`}
            >
              <div className="text-xs font-medium text-text-primary">{conf.label}</div>
              <div className="mt-0.5 text-xs text-text-muted leading-tight">{conf.description}</div>
            </button>
          );
        })}
      </div>

      {participantScope === PARTICIPANT_SCOPE.INVITED && (
        <div className="space-y-2 pt-1">
          <Input
            type="text"
            value={participantSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Teilnehmer suchen..."
          />
          {teamMembers.length === 0 ? (
            <p className="text-xs text-text-muted">Team wird geladen...</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredMembers.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has(m.id)}
                    onChange={() => onToggle(m.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-text-secondary">{m.name || m.email}</span>
                  {m.name && <span className="text-xs text-text-muted">{m.email}</span>}
                </label>
              ))}
            </div>
          )}
          {selectedParticipants.size > 0 && (
            <p className="text-xs text-text-tertiary">{selectedParticipants.size} Personen eingeladen</p>
          )}
        </div>
      )}
    </div>
  );
}
