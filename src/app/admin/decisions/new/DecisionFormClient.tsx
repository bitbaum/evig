'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DECISION_TYPES,
  DECISION_TYPE_CONFIG,
  DECISION_TYPE_DEFAULTS,
  VOTING_METHODS,
  VOTING_METHOD_CONFIG,
  METHODS_REQUIRING_OPTIONS,
  DOT_VOTING_DEFAULTS,
  type DecisionType,
  type VotingMethod,
} from '@/config/decisions';

interface OptionItem {
  id: string;
  label: string;
  description: string;
}

export default function DecisionFormClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form state
  const [decisionType, setDecisionType] = useState<DecisionType>('sense_check');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>(
    DECISION_TYPE_DEFAULTS.sense_check.votingMethod
  );
  const [options, setOptions] = useState<OptionItem[]>([
    { id: crypto.randomUUID(), label: '', description: '' },
    { id: crypto.randomUUID(), label: '', description: '' },
  ]);
  const [blindVoting, setBlindVoting] = useState(true);
  const [dotCount, setDotCount] = useState(DOT_VOTING_DEFAULTS.default);
  const [quorumType, setQuorumType] = useState<'percentage' | 'absolute'>(
    'percentage'
  );
  const [quorumValue, setQuorumValue] = useState(50);
  const initialStatusRef = useRef<'draft' | 'discussion' | 'voting'>('draft');

  function handleTypeChange(type: DecisionType) {
    setDecisionType(type);
    const defaults = DECISION_TYPE_DEFAULTS[type];
    setVotingMethod(defaults.votingMethod);
    setBlindVoting(defaults.blindVoting);
    setQuorumType(defaults.quorum.type);
    setQuorumValue(defaults.quorum.value);
  }

  function addOption() {
    setOptions([
      ...options,
      { id: crypto.randomUUID(), label: '', description: '' },
    ]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  }

  function updateOption(id: string, field: 'label' | 'description', value: string) {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  }

  const needsOptions = METHODS_REQUIRING_OPTIONS.includes(votingMethod);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      title,
      description,
      decisionType,
      votingMethod,
      options: needsOptions
        ? options.filter((o) => o.label.trim())
        : [],
      quorum: { type: quorumType, value: quorumValue },
      blindVoting,
      dotCount: votingMethod === 'dot' ? dotCount : null,
      invitedParticipants: [],
      initialStatus: initialStatusRef.current,
    };

    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Fehler beim Erstellen');
        setSubmitting(false);
        return;
      }

      router.push(`/admin/decisions/${json.data.id}`);
    } catch {
      setError('Netzwerkfehler');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Decision Type Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Entscheidungstyp
        </label>
        <div className="grid grid-cols-2 gap-3">
          {DECISION_TYPES.map((type) => {
            const conf = DECISION_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`rounded-lg border-2 p-3 text-left transition ${
                  decisionType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{conf.label}</div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {conf.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Titel
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Worum geht es?"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Beschreibung
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Kontext, Hintergrund, was zur Entscheidung steht..."
        />
      </div>

      {/* Options (if needed) */}
      {needsOptions && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Optionen
          </label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={opt.id} className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, 'label', e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={opt.description}
                  onChange={(e) =>
                    updateOption(opt.id, 'description', e.target.value)
                  }
                  placeholder="Beschreibung (optional)"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  disabled={options.length <= 2}
                  className="rounded-md px-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Option hinzufügen
          </button>
        </div>
      )}

      {/* Advanced Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showAdvanced ? '▼' : '▶'} Erweiterte Einstellungen
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            {/* Voting Method */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Abstimmungsmethode
              </label>
              <select
                value={votingMethod}
                onChange={(e) => setVotingMethod(e.target.value as VotingMethod)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {VOTING_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {VOTING_METHOD_CONFIG[m].label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {VOTING_METHOD_CONFIG[votingMethod].description}
              </p>
            </div>

            {/* Dot Count */}
            {votingMethod === 'dot' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Punkte pro Person
                </label>
                <input
                  type="number"
                  value={dotCount}
                  onChange={(e) => setDotCount(Number(e.target.value))}
                  min={DOT_VOTING_DEFAULTS.min}
                  max={DOT_VOTING_DEFAULTS.max}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* Quorum */}
            <div className="flex gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Quorum Typ
                </label>
                <select
                  value={quorumType}
                  onChange={(e) =>
                    setQuorumType(e.target.value as 'percentage' | 'absolute')
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="percentage">Prozent</option>
                  <option value="absolute">Absolut</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Wert
                </label>
                <input
                  type="number"
                  value={quorumValue}
                  onChange={(e) => setQuorumValue(Number(e.target.value))}
                  min={1}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Blind Voting */}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={blindVoting}
                onChange={(e) => setBlindVoting(e.target.checked)}
                className="rounded"
              />
              Geheime Abstimmung (Stimmen erst nach eigener Abgabe sichtbar)
            </label>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          onClick={() => { initialStatusRef.current = 'draft'; }}
          className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Als Entwurf speichern
        </button>
        <button
          type="submit"
          disabled={submitting}
          onClick={() => { initialStatusRef.current = 'discussion'; }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Zur Diskussion freigeben
        </button>
        <button
          type="submit"
          disabled={submitting}
          onClick={() => { initialStatusRef.current = 'voting'; }}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Direkt zur Abstimmung
        </button>
      </div>
    </form>
  );
}
