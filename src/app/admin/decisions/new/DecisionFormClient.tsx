'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DECISION_TYPES,
  DECISION_TYPE_CONFIG,
  DECISION_TYPE_DEFAULTS,
  VOTING_METHODS,
  VOTING_METHOD_CONFIG,
  METHODS_REQUIRING_OPTIONS,
  DOT_VOTING_DEFAULTS,
  DECISION_CATEGORIES,
  DECISION_CATEGORY_LABELS,
  type DecisionType,
  type VotingMethod,
  type DecisionCategory,
} from '@/config/decisions';
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import Heading from '@/components/ui/Heading'

interface OptionItem {
  id: string;
  label: string;
  description: string;
  imageUrl: string;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
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
  const [category, setCategory] = useState<DecisionCategory>('operativ');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>(
    DECISION_TYPE_DEFAULTS.sense_check.votingMethod
  );
  const [options, setOptions] = useState<OptionItem[]>([
    { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
    { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
  ]);
  const [showImageUrls, setShowImageUrls] = useState(false);
  const [blindVoting, setBlindVoting] = useState(true);
  const [dotCount, setDotCount] = useState(DOT_VOTING_DEFAULTS.default);
  const [quorumType, setQuorumType] = useState<'percentage' | 'absolute'>(
    'percentage'
  );
  const [quorumValue, setQuorumValue] = useState(50);
  const initialStatusRef = useRef<'draft' | 'discussion' | 'voting'>('draft');

  // Deadlines
  const [discussionDeadline, setDiscussionDeadline] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');

  // Participants
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [participantSearch, setParticipantSearch] = useState('');

  useEffect(() => {
    // Fetch both team members (staff) and Verein members — both are potential voters.
    // Verein members are auto-selected (they have voting rights by default).
    Promise.all([
      fetch('/api/admin/team/profiles').then((res) => res.json()).catch(() => null),
      fetch('/api/admin/membership/members').then((res) => res.json()).catch(() => null),
    ]).then(([teamJson, memberJson]) => {
      const teamList: TeamMember[] = teamJson?.success && Array.isArray(teamJson.data)
        ? teamJson.data.map((m: { userId: string; name: string | null; email: string }) => ({
            id: m.userId,
            name: m.name,
            email: m.email,
          }))
        : []

      const memberList: TeamMember[] = memberJson?.success && Array.isArray(memberJson.data)
        ? memberJson.data.map((m: { id: string; name: string | null; email: string }) => ({
            id: m.id,
            name: m.name,
            email: m.email,
          }))
        : []

      // Merge, dedupe by id (staff member can also be Verein member)
      const byId = new Map<string, TeamMember>()
      for (const p of [...teamList, ...memberList]) byId.set(p.id, p)
      setTeamMembers(Array.from(byId.values()))

      // Auto-select Verein members — they have voting rights by default
      if (memberList.length > 0) {
        setSelectedParticipants((prev) => {
          const next = new Set(prev)
          for (const m of memberList) next.add(m.id)
          return next
        })
      }
    })
  }, []);

  const filteredMembers = teamMembers.filter((m) => {
    if (!participantSearch) return true;
    const q = participantSearch.toLowerCase();
    return (
      m.email.toLowerCase().includes(q) ||
      (m.name && m.name.toLowerCase().includes(q))
    );
  });

  function toggleParticipant(id: string) {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    if (data.title) setTitle(String(data.title))
    if (data.description) setDescription(String(data.description))
    if (Array.isArray(data.options)) {
      setOptions(data.options.map((opt: unknown) => {
        const o = opt as Record<string, string>
        return { id: crypto.randomUUID(), label: o.label || '', description: o.description || '', imageUrl: o.imageUrl || '' }
      }))
    }
  }

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
      category,
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
      invitedParticipants: Array.from(selectedParticipants),
      discussionDeadline: discussionDeadline
        ? new Date(discussionDeadline).toISOString()
        : null,
      votingDeadline: votingDeadline
        ? new Date(votingDeadline).toISOString()
        : null,
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

      {/* AI Assistant */}
      <AIFormAssist
        formType="decision"
        placeholder="Beschreibe den Vorschlag in 1-2 Sätzen..."
        defaultExpanded={true}
        onFieldsFilled={handleAIFieldsFilled}
        currentData={{ title, description, options }}
      />

      {/* Decision Type Selector */}
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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Optionen
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={showImageUrls}
                onChange={(e) => setShowImageUrls(e.target.checked)}
                className="rounded"
              />
              Bild-URLs hinzufügen (für visuelle Abstimmung)
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

      {/* Fristen & Kategorie */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <Heading level={3} className="text-sm font-medium text-gray-900">Fristen &amp; Kategorie</Heading>

        {/* Category */}
        <div>
          <label htmlFor="decision-category" className="mb-1 block text-sm font-medium text-gray-700">
            Kategorie
          </label>
          <select
            id="decision-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DecisionCategory)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.values(DECISION_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>
                {DECISION_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Discussion deadline */}
        <div>
          <label htmlFor="discussion-deadline" className="mb-1 block text-sm font-medium text-gray-700">
            Diskussionsfrist
          </label>
          <input
            id="discussion-deadline"
            type="datetime-local"
            value={discussionDeadline}
            onChange={(e) => setDiscussionDeadline(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Voting deadline */}
        <div>
          <label htmlFor="voting-deadline" className="mb-1 block text-sm font-medium text-gray-700">
            Abstimmungsfrist
          </label>
          <input
            id="voting-deadline"
            type="datetime-local"
            value={votingDeadline}
            onChange={(e) => setVotingDeadline(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <p className="text-xs text-gray-500">
          Entscheidungen werden automatisch geschlossen wenn die Abstimmungsfrist abläuft
        </p>
      </div>

      {/* Teilnehmer / Participant Selector */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div>
          <Heading level={3} className="text-sm font-medium text-gray-900">Abstimmungsberechtigt</Heading>
          <p className="mt-0.5 text-xs text-gray-500">
            Leer lassen = alle Teammitglieder können abstimmen
          </p>
        </div>

        <input
          type="text"
          value={participantSearch}
          onChange={(e) => setParticipantSearch(e.target.value)}
          placeholder="Teilnehmer suchen..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        {teamMembers.length === 0 ? (
          <p className="text-xs text-gray-400">Team wird geladen...</p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredMembers.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedParticipants.has(m.id)}
                  onChange={() => toggleParticipant(m.id)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  {m.name || m.email}
                </span>
                {m.name && (
                  <span className="text-xs text-gray-400">{m.email}</span>
                )}
              </label>
            ))}
          </div>
        )}

        {selectedParticipants.size > 0 && (
          <p className="text-xs text-gray-500">
            {selectedParticipants.size} Teilnehmer ausgewählt
          </p>
        )}
      </div>

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
              <label htmlFor="decision-voting-method" className="mb-1 block text-sm font-medium text-gray-700">
                Abstimmungsmethode
              </label>
              <select
                id="decision-voting-method"
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
                <label htmlFor="decision-dot-count" className="mb-1 block text-sm font-medium text-gray-700">
                  Punkte pro Person
                </label>
                <input
                  id="decision-dot-count"
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
                <label htmlFor="decision-quorum-type" className="mb-1 block text-sm font-medium text-gray-700">
                  Quorum Typ
                </label>
                <select
                  id="decision-quorum-type"
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
                <label htmlFor="decision-quorum-value" className="mb-1 block text-sm font-medium text-gray-700">
                  Wert
                </label>
                <input
                  id="decision-quorum-value"
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
