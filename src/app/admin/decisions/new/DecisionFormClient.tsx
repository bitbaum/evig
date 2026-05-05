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

export default function DecisionFormClient() {
  const [showMore, setShowMore] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const form = useDecisionForm();

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {form.error && (
        <div className="rounded-md bg-error-50 p-3 text-sm text-error-700">{form.error}</div>
      )}

      {/* AI Assistant */}
      <AIFormAssist
        formType="decision"
        placeholder="Beschreibe was entschieden werden soll – z.B. 'Wir möchten eine Solaranlage aufs Dach installieren lassen und brauchen eine Entscheidung ob wir das Budget von 8000 CHF dafür freigeben.' Die KI strukturiert den Vorschlag und empfiehlt die passende Abstimmungsmethode."
        defaultExpanded={false}
        onFieldsFilled={form.handleAIFieldsFilled}
        currentData={{ title: form.title, description: form.description, background: form.background, options: form.options }}
      />

      {/* Template Selector */}
      <div>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-sm text-info-600 hover:text-info-700 hover:underline"
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
        <div className="flex items-start justify-between gap-3 rounded-md border border-info-200 bg-info-50 px-4 py-3 text-sm text-info-700">
          <span><strong>KI-Empfehlung:</strong> {form.aiRecommendationReason}</span>
          <button
            type="button"
            onClick={() => form.setAiRecommendationReason('')}
            className="flex-shrink-0 text-info-400 hover:text-info-600"
          >
            ×
          </button>
        </div>
      )}

      <DecisionTypeSelector selected={form.decisionType} onChange={form.handleTypeChange} />

      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-neutral-700">Titel</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-info-500 focus:outline-none focus:ring-1 focus:ring-info-500"
          placeholder="Worum geht es?"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-neutral-700">
          Was wird entschieden?
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          required
          rows={3}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-info-500 focus:outline-none focus:ring-1 focus:ring-info-500"
          placeholder="Die konkrete Frage oder Entscheidung, über die abgestimmt wird."
        />
      </div>

      {/* Background / Rationale */}
      <div>
        <label htmlFor="background" className="mb-1 block text-sm font-medium text-neutral-700">
          Begründung & Hintergrund
          <span className="ml-1.5 font-normal text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="background"
          value={form.background}
          onChange={(e) => form.setBackground(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-info-500 focus:outline-none focus:ring-1 focus:ring-info-500"
          placeholder="Warum ist diese Entscheidung nötig? Welche Alternativen wurden erwogen? Welche Risiken oder Vorteile gibt es? Abstimmungsberechtigte sehen diesen Text vor dem Abstimmen."
        />
      </div>

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

              <div>
                <label htmlFor="decision-category" className="mb-1 block text-sm font-medium text-neutral-700">
                  Kategorie
                </label>
                <select
                  id="decision-category"
                  value={form.category}
                  onChange={(e) => form.setCategory(e.target.value as DecisionCategory)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  {Object.values(DECISION_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{DECISION_CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="discussion-deadline" className="mb-1 block text-sm font-medium text-neutral-700">
                    Diskussionsfrist
                  </label>
                  <input
                    id="discussion-deadline"
                    type="datetime-local"
                    value={form.discussionDeadline}
                    onChange={(e) => form.setDiscussionDeadline(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="voting-deadline" className="mb-1 block text-sm font-medium text-neutral-700">
                    Abstimmungsfrist
                  </label>
                  <input
                    id="voting-deadline"
                    type="datetime-local"
                    value={form.votingDeadline}
                    onChange={(e) => form.setVotingDeadline(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
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
                allowPublicVoting={form.allowPublicVoting}
                onAllowPublicVotingChange={form.setAllowPublicVoting}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus(DECISION_STATUS.DRAFT); }}
          className="rounded-lg bg-neutral-600 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          Als Entwurf speichern
        </button>
        <button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus(DECISION_STATUS.DISCUSSION); }}
          className="rounded-lg bg-info-600 px-4 py-2 text-sm font-medium text-white hover:bg-info-700 disabled:opacity-50"
        >
          Zur Diskussion freigeben
        </button>
        <button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus(DECISION_STATUS.VOTING); }}
          className="rounded-lg bg-warning-600 px-4 py-2 text-sm font-medium text-white hover:bg-warning-700 disabled:opacity-50"
        >
          Direkt zur Abstimmung
        </button>
      </div>
    </form>
  );
}
