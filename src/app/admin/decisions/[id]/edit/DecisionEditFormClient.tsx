'use client';

import Link from 'next/link';
import { DecisionTypeSelector } from '../../new/DecisionTypeSelector';
import { DecisionOptionsEditor } from '../../new/DecisionOptionsEditor';
import { AdvancedSettings } from '../../new/AdvancedSettings';
import { useDecisionEditForm } from './useDecisionEditForm';

export default function DecisionEditFormClient({ decisionId }: { decisionId: string }) {
  const {
    loading, submitting, error,
    showAdvanced, setShowAdvanced,
    decisionType, setDecisionType,
    title, setTitle,
    description, setDescription,
    background, setBackground,
    votingMethod, setVotingMethod,
    options, showImageUrls, setShowImageUrls,
    blindVoting, setBlindVoting,
    allowPublicVoting, setAllowPublicVoting,
    dotCount, setDotCount,
    quorumType, setQuorumType,
    quorumValue, setQuorumValue,
    needsOptions,
    addOption, removeOption, updateOption,
    handleSubmit,
  } = useDecisionEditForm(decisionId);

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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <span className="text-xs">{showAdvanced ? '▼' : '▶'}</span>
          Erweiterte Einstellungen
        </button>
        {showAdvanced && (
          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-4">
            <AdvancedSettings
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
            />
            <label className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPublicVoting}
                onChange={(e) => setAllowPublicVoting(e.target.checked)}
                className="mt-0.5 rounded border-primary-400 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-primary-900">Mit Link teilen — kein Konto nötig</span>
                <p className="text-xs text-primary-700 mt-0.5">
                  Abstimmungslink kann per E-Mail oder Messenger geteilt werden. Jede Person mit dem Link kann abstimmen.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
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
