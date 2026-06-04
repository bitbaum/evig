'use client';

import Link from 'next/link';
import { DecisionTypeSelector } from '../../new/DecisionTypeSelector';
import { DecisionOptionsEditor } from '../../new/DecisionOptionsEditor';
import { AdvancedSettings } from '../../new/AdvancedSettings';
import { useDecisionEditForm } from './useDecisionEditForm';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';

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
    return <div className="py-12 text-center text-text-tertiary">Laden...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-400">{error}</div>
      )}

      <DecisionTypeSelector selected={decisionType} onChange={setDecisionType} />

      <FormField htmlFor="edit-title" label="Titel" required>
        <Input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </FormField>

      <FormField htmlFor="edit-description" label="Was wird entschieden?" required>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
        />
      </FormField>

      <FormField
        htmlFor="edit-background"
        label={<>Begründung &amp; Hintergrund<span className="ml-1.5 font-normal text-text-muted">(optional)</span></>}
      >
        <Textarea
          id="edit-background"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          rows={4}
          placeholder="Begründung, Alternativen, Risiken — sichtbar für Abstimmungsberechtigte vor dem Abstimmen."
        />
      </FormField>

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
          className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <span className="text-xs">{showAdvanced ? '▼' : '▶'}</span>
          Erweiterte Einstellungen
        </button>
        {showAdvanced && (
          <div className="mt-3 rounded-lg border border bg-surface-raised p-4 space-y-4">
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
            <label className="flex items-start gap-3 rounded-lg border border-strong bg-action-muted px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPublicVoting}
                onChange={(e) => setAllowPublicVoting(e.target.checked)}
                className="mt-0.5 rounded-sm border-action text-action focus:ring-action"
              />
              <div>
                <span className="text-sm font-medium text-action">Mit Link teilen — kein Konto nötig</span>
                <p className="text-xs text-action mt-0.5">
                  Abstimmungslink kann per E-Mail oder Messenger geteilt werden. Jede Person mit dem Link kann abstimmen.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} variant="primary" size="sm">
          {submitting ? 'Wird gespeichert...' : 'Änderungen speichern'}
        </Button>
        <Link
          href={`/admin/decisions/${decisionId}`}
          className="rounded-lg border border-default dark:border-white/8 px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}
