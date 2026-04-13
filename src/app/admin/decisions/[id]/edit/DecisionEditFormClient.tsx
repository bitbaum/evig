'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DECISION_TYPES,
  DECISION_TYPE_CONFIG,
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
  imageUrl: string;
}

interface DecisionData {
  id: string;
  title: string;
  description: string;
  decisionType: DecisionType;
  votingMethod: VotingMethod;
  options: OptionItem[];
  quorum: { type: 'percentage' | 'absolute'; value: number };
  blindVoting: boolean;
  dotCount: number | null;
  status: string;
}

export default function DecisionEditFormClient({
  decisionId,
}: {
  decisionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form state
  const [decisionType, setDecisionType] = useState<DecisionType>('sense_check');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>('simple_majority');
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [showImageUrls, setShowImageUrls] = useState(false);
  const [blindVoting, setBlindVoting] = useState(true);
  const [dotCount, setDotCount] = useState(DOT_VOTING_DEFAULTS.default);
  const [quorumType, setQuorumType] = useState<'percentage' | 'absolute'>('percentage');
  const [quorumValue, setQuorumValue] = useState(50);

  useEffect(() => {
    fetch(`/api/decisions/${decisionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const d: DecisionData = json.data;
          setDecisionType(d.decisionType);
          setTitle(d.title);
          setDescription(d.description);
          setVotingMethod(d.votingMethod);
          const loadedOptions = d.options.length > 0
            ? d.options.map((o: { id: string; label: string; description?: string; imageUrl?: string }) => ({
                id: o.id,
                label: o.label,
                description: o.description || '',
                imageUrl: o.imageUrl || '',
              }))
            : [
                { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
                { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
              ];
          setOptions(loadedOptions);
          if (loadedOptions.some((o: OptionItem) => o.imageUrl)) setShowImageUrls(true);
          setBlindVoting(d.blindVoting);
          setDotCount(d.dotCount || DOT_VOTING_DEFAULTS.default);
          setQuorumType(d.quorum.type);
          setQuorumValue(d.quorum.value);
        }
        setLoading(false);
      });
  }, [decisionId]);

  function addOption() {
    setOptions([
      ...options,
      { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
    ]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  }

  function updateOption(id: string, field: 'label' | 'description' | 'imageUrl', value: string) {
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
        ? options.filter((o) => o.label.trim()).map((o) => ({
            ...o,
            imageUrl: o.imageUrl.trim() || undefined,
          }))
        : [],
      quorum: { type: quorumType, value: quorumValue },
      blindVoting,
      dotCount: votingMethod === 'dot' ? dotCount : null,
    };

    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Fehler beim Speichern');
        setSubmitting(false);
        return;
      }

      router.push(`/admin/decisions/${decisionId}`);
    } catch {
      setError('Netzwerkfehler');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Laden...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Decision Type */}
      <div>
        <span className="mb-2 block text-sm font-medium text-gray-700">
          Entscheidungstyp
        </span>
        <div className="grid grid-cols-2 gap-3">
          {DECISION_TYPES.map((type) => {
            const conf = DECISION_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setDecisionType(type)}
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
        />
      </div>

      {/* Options */}
      {needsOptions && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Optionen</span>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={showImageUrls}
                onChange={(e) => setShowImageUrls(e.target.checked)}
                className="rounded"
              />
              Bild-URLs (für visuelle Abstimmung)
            </label>
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={opt.id} className="rounded-md border border-gray-200 p-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => updateOption(opt.id, 'label', e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={opt.description}
                    onChange={(e) => updateOption(opt.id, 'description', e.target.value)}
                    placeholder="Beschreibung (optional)"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    disabled={options.length <= 2}
                    className="rounded-md px-2 text-gray-500 hover:text-red-500 disabled:opacity-30"
                  >
                    &times;
                  </button>
                </div>
                {showImageUrls && (
                  <div className="mt-1.5 flex gap-2">
                    <input
                      type="url"
                      value={opt.imageUrl}
                      onChange={(e) => updateOption(opt.id, 'imageUrl', e.target.value)}
                      placeholder="Bild-URL (https://...)"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {opt.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.imageUrl}
                        alt=""
                        className="h-8 w-8 rounded object-contain border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                )}
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

      {/* Advanced */}
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
            <div>
              <label htmlFor="decision-edit-voting-method" className="mb-1 block text-sm font-medium text-gray-700">
                Abstimmungsmethode
              </label>
              <select
                id="decision-edit-voting-method"
                value={votingMethod}
                onChange={(e) =>
                  setVotingMethod(e.target.value as VotingMethod)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {VOTING_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {VOTING_METHOD_CONFIG[m].label}
                  </option>
                ))}
              </select>
            </div>

            {votingMethod === 'dot' && (
              <div>
                <label htmlFor="decision-edit-dot-count" className="mb-1 block text-sm font-medium text-gray-700">
                  Punkte pro Person
                </label>
                <input
                  id="decision-edit-dot-count"
                  type="number"
                  value={dotCount}
                  onChange={(e) => setDotCount(Number(e.target.value))}
                  min={DOT_VOTING_DEFAULTS.min}
                  max={DOT_VOTING_DEFAULTS.max}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex gap-3">
              <div>
                <label htmlFor="decision-edit-quorum-type" className="mb-1 block text-sm font-medium text-gray-700">
                  Quorum Typ
                </label>
                <select
                  id="decision-edit-quorum-type"
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
                <label htmlFor="decision-edit-quorum-value" className="mb-1 block text-sm font-medium text-gray-700">
                  Wert
                </label>
                <input
                  id="decision-edit-quorum-value"
                  type="number"
                  value={quorumValue}
                  onChange={(e) => setQuorumValue(Number(e.target.value))}
                  min={1}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={blindVoting}
                onChange={(e) => setBlindVoting(e.target.checked)}
                className="rounded"
              />
              Geheime Abstimmung
            </label>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
        </button>
        <Link
          href={`/admin/decisions/${decisionId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
