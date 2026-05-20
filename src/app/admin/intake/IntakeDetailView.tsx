'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Check, RefreshCw, ExternalLink,
  AlertCircle, ArrowDownUp, Clock, CheckCheck, ClipboardList,
} from 'lucide-react'
import {
  INTAKE_TIERS,
  INTAKE_TIER_LABELS,
  INTAKE_TIER_ICONS,
  getIntakeTierOptions,
} from '@/config/intake-checklist'
import type { IntakeTier } from '@/config/intake-checklist'
import { INTAKE_STATUS } from '@/config/intake-status'
import type { IntakeEventType } from '@/lib/intake/timeline-types'
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from '@/lib/intake/timeline-types'
import { ChecklistGroup } from './ChecklistGroup'
import { Stepper } from '@/components/ui/Stepper'
import type { DetailData } from './types'
import Heading from '@/components/admin/AdminHeading'

const INTAKE_PIPELINE_STEPS = [
  { label: 'Geräte-Eingang', description: 'Checkliste & Spende' },
  { label: 'Erfassung', description: 'Produktdaten eingeben' },
  { label: 'Im Shop', description: 'Veröffentlichen' },
]

interface IntakeDetailViewProps {
  detail: DetailData | null
  detailLoading: boolean
  publishPrice: number
  setPublishPrice: (price: number) => void
  publishing: boolean
  showTierChange: boolean
  setShowTierChange: (show: boolean) => void
  newTier: IntakeTier
  setNewTier: (tier: IntakeTier) => void
  tierChangeReason: string
  setTierChangeReason: (reason: string) => void
  tierChanging: boolean
  onBack: () => void
  onRefresh: () => void
  onToggleChecklist: (itemId: string, completed: boolean, notes?: string) => void
  onMarkAllRequired: () => void
  onPublish: () => void
  onTierChange: () => void
}

export function IntakeDetailView({
  detail,
  detailLoading,
  publishPrice,
  setPublishPrice,
  publishing,
  showTierChange,
  setShowTierChange,
  newTier,
  setNewTier,
  tierChangeReason,
  setTierChangeReason,
  tierChanging,
  onBack,
  onRefresh,
  onToggleChecklist,
  onMarkAllRequired,
  onPublish,
  onTierChange,
}: IntakeDetailViewProps) {
  if (detailLoading || !detail) {
    return <div className="text-center py-8 text-neutral-500">Laden...</div>
  }

  const progress = detail.checklist_progress

  // Pipeline step: 0 = checklist in progress, 1 = ready for erfassung, 2 = published
  const pipelineStep =
    detail.marketplace_status === INTAKE_STATUS.PUBLISHED ? 2
    : detail.checklist_complete ? 1
    : 0

  return (
    <div className="space-y-6">
      {/* Pipeline progress — shown for refurbish-tier items */}
      {detail.intake_tier === INTAKE_TIERS.REFURBISH && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.06] rounded-lg px-4 py-3">
          <Stepper steps={INTAKE_PIPELINE_STEPS} currentStep={pipelineStep} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-sm text-primary-600 hover:underline mb-2 flex items-center gap-1"
          >
            ← Zurück zur Pipeline
          </button>
          <Heading level={2} className="text-lg font-semibold">{detail.brand} {detail.product_name}</Heading>
          <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
            <span className="font-mono">{detail.item_uuid}</span>
            <span>{INTAKE_TIER_ICONS[detail.intake_tier]} {INTAKE_TIER_LABELS[detail.intake_tier]}</span>
            {detail.source_donation_id && (
              <span className="text-primary-600">Spende{detail.donor_name ? `: ${detail.donor_name}` : ''}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detail.marketplace_status === INTAKE_STATUS.PUBLISHED ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300">
              <Check className="w-4 h-4" /> Im Shop
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setNewTier(detail.intake_tier === INTAKE_TIERS.REFURBISH ? INTAKE_TIERS.PARTS : INTAKE_TIERS.REFURBISH); setShowTierChange(true) }}
                className="flex items-center gap-1 px-2 py-1.5 text-xs border rounded-lg hover:bg-neutral-50"
                title="Stufe ändern"
              >
                <ArrowDownUp className="w-3.5 h-3.5" /> Stufe ändern
              </button>
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-neutral-100 rounded-lg"
                title="Aktualisieren"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Fortschritt: {progress.requiredCompleted}/{progress.requiredTotal} Pflichtpunkte
          </span>
          <div className="flex items-center gap-3">
            {progress.percentage < 100 && (
              <button
                type="button"
                onClick={onMarkAllRequired}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                title="Alle Pflichtpunkte auf 'erledigt' setzen"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Alles in Ordnung
              </button>
            )}
            <span className={`text-sm font-bold ${
              progress.percentage === 100 ? 'text-primary-600' : 'text-neutral-600'
            }`}>
              {progress.percentage}%
            </span>
          </div>
        </div>
        <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progress.percentage === 100 ? 'bg-primary-500' :
              progress.percentage > 50 ? 'bg-warning-500' : 'bg-error-400'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Groups */}
      <div className="space-y-4">
        {detail.checklist_grouped.map((group) => (
          <ChecklistGroup
            key={group.category}
            group={group}
            onToggle={onToggleChecklist}
          />
        ))}
      </div>

      {/* Publish Section */}
      {detail.intake_tier === INTAKE_TIERS.REFURBISH && detail.marketplace_status !== INTAKE_STATUS.PUBLISHED && (
        <div className={`border-2 rounded-lg p-4 ${
          detail.checklist_complete
            ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-200 bg-neutral-50'
        }`}>
          <Heading level={3} className="font-medium mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Im Shop veröffentlichen
          </Heading>

          {!detail.checklist_complete && (
            <div className="flex items-start gap-2 mb-3 text-sm text-warning-700 dark:text-warning-200 bg-warning-50 dark:bg-warning-900/20 p-2 rounded">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Alle Pflichtpunkte der Checkliste müssen abgehakt sein, bevor das Gerät publiziert werden kann.</span>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Verkaufspreis (CHF)</label>
              <input
                type="number"
                value={publishPrice || ''}
                onChange={(e) => setPublishPrice(Number(e.target.value))}
                min={0}
                className="border rounded-lg px-3 py-2 text-sm w-32"
                disabled={!detail.checklist_complete}
              />
            </div>
            <Button
              onClick={onPublish}
              disabled={!detail.checklist_complete || publishing || publishPrice <= 0}
              variant="primary"
              size="sm"
            >
              {publishing ? 'Publizieren...' : 'Jetzt publizieren'}
            </Button>
            {detail.checklist_complete && (
              <Link
                href={`/admin/erfassung?edit=${detail.id}&returnTo=${encodeURIComponent(`/admin/intake?detail=${detail.id}`)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 text-sm font-medium"
                title="Produkt in Erfassung öffnen um Details zu ergänzen"
              >
                <ClipboardList className="w-4 h-4" />
                Vollständig erfassen
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Published confirmation */}
      {detail.marketplace_status === INTAKE_STATUS.PUBLISHED && (
        <div className="border-2 border-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 text-center">
          <Check className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="font-medium text-primary-800 dark:text-primary-300">Dieses Gerät ist im Shop veröffentlicht</p>
          {detail.selling_price_chf && (
            <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">Preis: CHF {detail.selling_price_chf.toFixed(2)}</p>
          )}
        </div>
      )}

      {/* Tier Change Dialog */}
      {showTierChange && (
        <div className="border-2 border-warning-300 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-4 space-y-3">
          <Heading level={3} className="font-medium flex items-center gap-2 text-warning-800 dark:text-warning-200">
            <ArrowDownUp className="w-4 h-4" /> Stufe ändern
          </Heading>
          <div className="flex items-start gap-2 text-sm text-warning-700 dark:text-warning-200 bg-warning-100 dark:bg-warning-900/30 p-2 rounded">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Alle Checklisten-Fortschritte werden zurückgesetzt.</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Neue Stufe</label>
            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as IntakeTier)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {getIntakeTierOptions().filter(o => o.value !== detail.intake_tier).map(o => (
                <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Begründung *</label>
            <input
              type="text"
              value={tierChangeReason}
              onChange={(e) => setTierChangeReason(e.target.value)}
              placeholder="z.B. Gerät ist nicht reparierbar"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onTierChange}
              disabled={tierChanging || !tierChangeReason.trim()}
              className="px-3 py-1.5 bg-warning-600 text-white rounded-lg hover:bg-warning-700 disabled:opacity-50 text-sm"
            >
              {tierChanging ? 'Ändern...' : 'Stufe ändern'}
            </button>
            <button
              type="button"
              onClick={() => setShowTierChange(false)}
              className="px-3 py-1.5 border rounded-lg hover:bg-neutral-50 text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {detail.intake_events && detail.intake_events.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 p-3 bg-neutral-50 border-b">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium">Verlauf</span>
            <span className="text-xs text-neutral-500">({detail.intake_events.length})</span>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {[...detail.intake_events].reverse().map((event, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2 text-xs">
                <span className="mt-0.5 text-base leading-none">{EVENT_TYPE_ICONS[event.type as IntakeEventType] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{EVENT_TYPE_LABELS[event.type as IntakeEventType] || event.type}</span>
                  <span className="text-neutral-500 ml-1.5">{event.description}</span>
                  <div className="text-neutral-400 mt-0.5">
                    {event.userEmail && <span>{event.userEmail}</span>}
                    {event.timestamp && (
                      <span className="ml-2">{new Date(event.timestamp).toLocaleString('de-CH')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
