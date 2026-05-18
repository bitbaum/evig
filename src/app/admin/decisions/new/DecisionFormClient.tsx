'use client';

import { useState } from 'react';
import { DECISION_CATEGORIES, DECISION_CATEGORY_LABELS, DECISION_STATUS, type DecisionCategory } from '@/config/decisions';
import { AIFormAssist } from '@/components/ai/AIFormAssist';
import Heading from '@/components/admin/AdminHeading';
import DecisionTemplateSelector from '@/components/decisions/DecisionTemplateSelector';
import { useDecisionForm } from './useDecisionForm';
import { DecisionTypeSelector } from './DecisionTypeSelector';
import { DecisionOptionsEditor } from './DecisionOptionsEditor';
import { ParticipantSelector } from './ParticipantSelector';
import { AdvancedSettings } from './AdvancedSettings';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';

export default function DecisionFormClient() {
  const [showMore, setShowMore] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const form = useDecisionForm();

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {form.error && (
        <div className="rounded-md bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-700 dark:text-error-300">{form.error}</div>
      )}

      {/* AI Assistant — open by default, reduces blank-page anxiety */}
      <AIFormAssist
        formType="decision"
        placeholder="Beschreibe was entschieden werden soll – z.B. 'Wir möchten eine Solaranlage aufs Dach installieren lassen und brauchen eine Entscheidung ob wir das Budget von 8000 CHF dafür freigeben.' Die KI strukturiert den Vorschlag und empfiehlt die passende Abstimmungsmethode."
        defaultExpanded={true}
        onFieldsFilled={form.handleAIFieldsFilled}
        currentData={{ title: form.title, description: form.description, background: form.background, options: form.options }}
      />

      {/* Template Selector */}
      <div>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
        >
          {showTemplates ? '▼' : '▶'} Vorlage wählen
        </button>
        {showTemplates && (
          <div className="mt-3">
            <DecisionTemplateSelector onSelect={(t) => { form.handleTemplateSelect(t); setShowTemplates(false); }} />
          </div>
        )}
      </div>

      {/* AI Recommendation Banner */}
      {form.aiRecommendationReason && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-primary-200 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-sm text-primary-700 dark:text-primary-300">
          <span><strong>KI-Empfehlung:</strong> {form.aiRecommendationReason}</span>
          <button
            type="button"
            onClick={() => form.setAiRecommendationReason('')}
            className="flex-shrink-0 text-neutral-400 hover:text-primary-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Title */}
      <FormField htmlFor="title" label="Titel" required>
        <Input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="Worum geht es?"
        />
      </FormField>

      {/* Description */}
      <FormField htmlFor="description" label="Was wird entschieden?" required>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          required
          rows={3}
          placeholder="Die konkrete Frage oder Entscheidung, über die abgestimmt wird."
        />
      </FormField>

      {/* Background / Rationale */}
      <FormField
        htmlFor="background"
        label={<>Begründung &amp; Hintergrund <span className="ml-1 font-normal text-neutral-400">(optional)</span></>}
      >
        <Textarea
          id="background"
          value={form.background}
          onChange={(e) => form.setBackground(e.target.value)}
          rows={4}
          placeholder="Warum ist diese Entscheidung nötig? Welche Alternativen wurden erwogen? Welche Risiken oder Vorteile gibt es? Abstimmungsberechtigte sehen diesen Text vor dem Abstimmen."
        />
      </FormField>

      {form.needsOptions && (
        <DecisionOptionsEditor
          options={form.options}
          showImageUrls={form.showImageUrls}
          onShowImageUrlsChange={form.setShowImageUrls}
          onAdd={form.addOption}
          onRemove={form.removeOption}
          onUpdate={form.updateOption}
        />
      )}

      {/* Decision Type — shown after user has context from title/description/options */}
      <DecisionTypeSelector selected={form.decisionType} onChange={form.handleTypeChange} />

      {/* Weitere Einstellungen (Fristen, Abstimmungsberechtigt, Methode) */}
      <div>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <span className="text-xs">{showMore ? '▼' : '▶'}</span>
          Weitere Einstellungen
          <span className="text-xs text-neutral-400">(Fristen, Kategorie, Abstimmungsmethode…)</span>
        </button>

        {showMore && (
          <div className="mt-4 space-y-6">
            {/* Fristen & Kategorie */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-4">
              <Heading level={3} className="text-sm font-medium text-neutral-900">Fristen &amp; Kategorie</Heading>

              <FormField htmlFor="decision-category" label="Kategorie">
                <Select
                  id="decision-category"
                  value={form.category}
                  onChange={(e) => form.setCategory(e.target.value as DecisionCategory)}
                >
                  {Object.values(DECISION_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{DECISION_CATEGORY_LABELS[cat]}</option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField htmlFor="discussion-deadline" label="Diskussionsfrist">
                  <Input
                    id="discussion-deadline"
                    type="datetime-local"
                    value={form.discussionDeadline}
                    onChange={(e) => form.setDiscussionDeadline(e.target.value)}
                  />
                </FormField>
                <FormField htmlFor="voting-deadline" label="Abstimmungsfrist">
                  <Input
                    id="voting-deadline"
                    type="datetime-local"
                    value={form.votingDeadline}
                    onChange={(e) => form.setVotingDeadline(e.target.value)}
                  />
                </FormField>
              </div>

              <p className="text-xs text-neutral-500">
                Entscheidungen werden automatisch geschlossen wenn die Abstimmungsfrist abläuft
              </p>
            </div>

            <ParticipantSelector
              participantScope={form.participantScope}
              onScopeChange={form.setParticipantScope}
              teamMembers={form.teamMembers}
              selectedParticipants={form.selectedParticipants}
              onToggle={form.toggleParticipant}
              participantSearch={form.participantSearch}
              onSearchChange={form.setParticipantSearch}
              filteredMembers={form.filteredMembers}
            />

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <Heading level={3} className="text-sm font-medium text-neutral-900 mb-4">Abstimmungseinstellungen</Heading>
              <AdvancedSettings
                votingMethod={form.votingMethod}
                onMethodChange={form.setVotingMethod}
                dotCount={form.dotCount}
                onDotCountChange={form.setDotCount}
                quorumType={form.quorumType}
                onQuorumTypeChange={form.setQuorumType}
                quorumValue={form.quorumValue}
                onQuorumValueChange={form.setQuorumValue}
                blindVoting={form.blindVoting}
                onBlindVotingChange={form.setBlindVoting}
              />
            </div>
          </div>
        )}
      </div>

      {/* Public voting — surfaced prominently so sharing is easy */}
      <label className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.allowPublicVoting}
          onChange={(e) => form.setAllowPublicVoting(e.target.checked)}
          className="mt-0.5 rounded border-primary-400 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <span className="text-sm font-medium text-primary-900 dark:text-primary-200">Mit Link teilen — kein Konto nötig</span>
          <p className="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
            Abstimmungslink kann per E-Mail oder Messenger geteilt werden. Jede Person mit dem Link kann abstimmen.
          </p>
        </div>
      </label>

      {/* Submit */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus(DECISION_STATUS.VOTING); }}
          variant="primary"
        >
          {form.submitting ? 'Wird erstellt…' : 'Abstimmung starten →'}
        </Button>
        <Button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus(DECISION_STATUS.DRAFT); }}
          variant="ghost"
          size="sm"
        >
          Als Entwurf speichern
        </Button>
      </div>
    </form>
  );
}
