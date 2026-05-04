'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  METHODS_REQUIRING_OPTIONS,
  DOT_VOTING_DEFAULTS,
  type DecisionType,
  type VotingMethod,
} from '@/config/decisions';
import { type OptionItem } from '../../new/useDecisionForm';
import { DecisionTypeSelector } from '../../new/DecisionTypeSelector';
import { DecisionOptionsEditor } from '../../new/DecisionOptionsEditor';
import { AdvancedSettings } from '../../new/AdvancedSettings';

interface DecisionData {
  id: string;
  title: string;
  description: string;
  background: string | null;
  decisionType: DecisionType;
  votingMethod: VotingMethod;
  options: OptionItem[];
  quorum: { type: 'percentage' | 'absolute'; value: number };
  blindVoting: boolean;
  dotCount: number | null;
  allowPublicVoting: boolean;
  status: string;
}

export default function DecisionEditFormClient({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [decisionType, setDecisionType] = useState<DecisionType>('sense_check');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [background, setBackground] = useState('');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>('simple_majority');
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [showImageUrls, setShowImageUrls] = useState(false);
  const [blindVoting, setBlindVoting] = useState(true);
  const [allowPublicVoting, setAllowPublicVoting] = useState(false);
  const [dotCount, setDotCount] = useState(DOT_VOTING_DEFAULTS.default);
  const [quorumType, setQuorumType] = useState<'percentage' | 'absolute'>('percentage');
  const [quorumValue, setQuorumValue] = useState(50);

  useEffect(() => {
    apiFetch<DecisionData>(`/api/decisions/${decisionId}`).then((result) => {
      if (result.success && result.data) {
        const d = result.data;
        setDecisionType(d.decisionType);
        setTitle(d.title);
        setDescription(d.description);
        setBackground(d.background ?? '');
        setVotingMethod(d.votingMethod);
        const loadedOptions: OptionItem[] = d.options.length > 0
          ? d.options.map((o) => ({ id: o.id, label: o.label, description: o.description || '', imageUrl: o.imageUrl || '' }))
          : [
              { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
              { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
            ];
        setOptions(loadedOptions);
        if (loadedOptions.some((o) => o.imageUrl)) setShowImageUrls(true);
        setBlindVoting(d.blindVoting);
        setAllowPublicVoting(d.allowPublicVoting ?? false);
        setDotCount(d.dotCount || DOT_VOTING_DEFAULTS.default);
        setQuorumType(d.quorum.type);
        setQuorumValue(d.quorum.value);
      }
      setLoading(false);
    });
  }, [decisionId]);

  function addOption() {
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' }]);
  }
  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }
  function updateOption(id: string, field: 'label' | 'description' | 'imageUrl', value: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  }

  const needsOptions = METHODS_REQUIRING_OPTIONS.includes(votingMethod);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await apiFetch<unknown>(`/api/decisions/${decisionId}`, {
      method: 'PATCH',
      body: {
        title, description,
        background: background.trim() || null,
        decisionType, votingMethod,
        options: needsOptions
          ? options.filter((o) => o.label.trim()).map((o) => ({ ...o, imageUrl: o.imageUrl.trim() || undefined }))
          : [],
        quorum: { type: quorumType, value: quorumValue },
        blindVoting, allowPublicVoting,
        dotCount: votingMethod === 'dot' ? dotCount : null,
      },
    });

    if (!result.success) {
      setError((result as { error?: string }).error || 'Fehler beim Speichern');
      setSubmitting(false);
      return;
    }

    router.push(`/admin/decisions/${decisionId}`);
  }

  if (loading) {
    return <div className="py-12 text-center text-neutral-500">Laden...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-error-50 p-3 text-sm text-error-700">{error}</div>
      )}

      <DecisionTypeSelector selected={decisionType} onChange={setDecisionType} />

      <div>
        <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-neutral-700">
          Titel
        </label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-info-500 focus:outline-none focus:ring-1 focus:ring-info-500"
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="mb-1 block text-sm font-medium text-neutral-700">
          Was wird entschieden?
        </label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-info-500 focus:outline-none focus:ring-1 focus:ring-info-500"
        />
      </div>

      <div>
        <label htmlFor="edit-background" className="mb-1 block text-sm font-medium text-neutral-700">
          Begründung & Hintergrund
          <span className="ml-1.5 font-normal text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="edit-background"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-info-500 focus:outline-none focus:ring-1 focus:ring-info-500"
          placeholder="Begründung, Alternativen, Risiken — sichtbar für Abstimmungsberechtigte vor dem Abstimmen."
        />
      </div>

      {needsOptions && (
        <DecisionOptionsEditor
          options={options}
          showImageUrls={showImageUrls}
          onShowImageUrlsChange={setShowImageUrls}
          onAdd={addOption}
          onRemove={removeOption}
          onUpdate={updateOption}
        />
      )}

      <AdvancedSettings
        show={showAdvanced}
        onToggle={() => setShowAdvanced(!showAdvanced)}
        votingMethod={votingMethod}
        onMethodChange={setVotingMethod}
        dotCount={dotCount}
        onDotCountChange={setDotCount}
        quorumType={quorumType}
        onQuorumTypeChange={setQuorumType}
        quorumValue={quorumValue}
        onQuorumValueChange={setQuorumValue}
        blindVoting={blindVoting}
        onBlindVotingChange={setBlindVoting}
        allowPublicVoting={allowPublicVoting}
        onAllowPublicVotingChange={setAllowPublicVoting}
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-info-600 px-4 py-2 text-sm font-medium text-white hover:bg-info-700 disabled:opacity-50"
        >
          {submitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
        </button>
        <Link
          href={`/admin/decisions/${decisionId}`}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
