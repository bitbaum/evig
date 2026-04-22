'use client';

import { useState } from 'react';
import { DECISION_CATEGORIES, DECISION_CATEGORY_LABELS, type DecisionCategory } from '@/config/decisions';
import { AIFormAssist } from '@/components/ai/AIFormAssist';
import Heading from '@/components/admin/AdminHeading';
import DecisionTemplateSelector from '@/components/decisions/DecisionTemplateSelector';
import { useDecisionForm } from './useDecisionForm';
import { DecisionTypeSelector } from './DecisionTypeSelector';
import { DecisionOptionsEditor } from './DecisionOptionsEditor';
import { ParticipantSelector } from './ParticipantSelector';
import { AdvancedSettings } from './AdvancedSettings';

export default function DecisionFormClient() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const form = useDecisionForm();

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6">
      {form.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
      )}

      {/* Template Selector */}
      <div>
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          {showTemplates ? '▼' : '▶'} Vorlage wählen
        </button>
        {showTemplates && (
          <div className="mt-3">
            <DecisionTemplateSelector onSelect={(t) => { form.handleTemplateSelect(t); setShowTemplates(false); }} />
          </div>
        )}
      </div>

      {/* AI Assistant */}
      <AIFormAssist
        formType="decision"
        placeholder="Beschreibe den Vorschlag in 1-2 Sätzen..."
        defaultExpanded={true}
        onFieldsFilled={form.handleAIFieldsFilled}
        currentData={{ title: form.title, description: form.description, options: form.options }}
      />

      {/* AI Recommendation Banner */}
      {form.aiRecommendationReason && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span><strong>KI-Empfehlung:</strong> {form.aiRecommendationReason}</span>
          <button
            type="button"
            onClick={() => form.setAiRecommendationReason('')}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600"
          >
            ×
          </button>
        </div>
      )}

      <DecisionTypeSelector selected={form.decisionType} onChange={form.handleTypeChange} />

      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">Titel</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Worum geht es?"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Was wird entschieden?
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          required
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Die konkrete Frage oder Entscheidung, über die abgestimmt wird."
        />
      </div>

      {/* Background / Rationale */}
      <div>
        <label htmlFor="background" className="mb-1 block text-sm font-medium text-gray-700">
          Begründung & Hintergrund
          <span className="ml-1.5 font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="background"
          value={form.background}
          onChange={(e) => form.setBackground(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Fristen & Kategorie */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <Heading level={3} className="text-sm font-medium text-gray-900">Fristen &amp; Kategorie</Heading>

        <div>
          <label htmlFor="decision-category" className="mb-1 block text-sm font-medium text-gray-700">
            Kategorie
          </label>
          <select
            id="decision-category"
            value={form.category}
            onChange={(e) => form.setCategory(e.target.value as DecisionCategory)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {Object.values(DECISION_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>{DECISION_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="discussion-deadline" className="mb-1 block text-sm font-medium text-gray-700">
            Diskussionsfrist
          </label>
          <input
            id="discussion-deadline"
            type="datetime-local"
            value={form.discussionDeadline}
            onChange={(e) => form.setDiscussionDeadline(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="voting-deadline" className="mb-1 block text-sm font-medium text-gray-700">
            Abstimmungsfrist
          </label>
          <input
            id="voting-deadline"
            type="datetime-local"
            value={form.votingDeadline}
            onChange={(e) => form.setVotingDeadline(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <p className="text-xs text-gray-500">
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

      <AdvancedSettings
        show={showAdvanced}
        onToggle={() => setShowAdvanced((v) => !v)}
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

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus('draft'); }}
          className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Als Entwurf speichern
        </button>
        <button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus('discussion'); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Zur Diskussion freigeben
        </button>
        <button
          type="submit"
          disabled={form.submitting}
          onClick={() => { form.setInitialStatus('voting'); }}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Direkt zur Abstimmung
        </button>
      </div>
    </form>
  );
}
