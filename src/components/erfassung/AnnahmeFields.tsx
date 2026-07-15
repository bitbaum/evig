'use client'

/**
 * AnnahmeFields — the Physische-Annahme extras on the one capture form:
 * Verarbeitungsstufe (value-cascade tier) + donation provenance.
 * Rendered by /admin/erfassung when ?annahme=1; the device is saved into
 * the checklist-gated pipeline instead of being directly publishable.
 */

import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Heading from '@/components/ui/Heading'
import { getIntakeTierOptions, type IntakeTier } from '@/config/intake-checklist'
import type { AnnahmeState } from './useErfassungForm'

interface AnnahmeFieldsProps {
  annahme: AnnahmeState
  onChange: (updater: (prev: AnnahmeState) => AnnahmeState) => void
}

export function AnnahmeFields({ annahme, onChange }: AnnahmeFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Verarbeitungsstufe */}
      <div className="bg-surface-base rounded-xl border border-subtle p-4 sm:p-6">
        <Heading level={2} className="text-base font-semibold text-text-primary mb-3">
          Verarbeitungsstufe
        </Heading>
        <div className="space-y-2">
          {getIntakeTierOptions().map((tier) => (
            <label
              key={tier.value}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors',
                annahme.tier === tier.value
                  ? 'border-action bg-action-muted'
                  : 'border-subtle hover:border-strong'
              )}
            >
              <input
                type="radio"
                name="verarbeitungsstufe"
                value={tier.value}
                checked={annahme.tier === tier.value}
                onChange={() => onChange(prev => ({ ...prev, tier: tier.value as IntakeTier }))}
                className="sr-only"
              />
              <span className="text-xl" aria-hidden="true">{tier.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-text-primary">{tier.label}</span>
                <span className="block text-xs text-text-tertiary">{tier.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Spende */}
      <div className="bg-surface-base rounded-xl border border-subtle p-4 sm:p-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={annahme.isDonation}
            onChange={(e) => onChange(prev => ({ ...prev, isDonation: e.target.checked }))}
            className="rounded border-strong text-action focus:ring-action"
          />
          <Heart className="h-4 w-4 text-action" aria-hidden="true" />
          <span className="text-sm font-medium text-text-primary">Dies ist eine Spende</span>
        </label>

        {annahme.existingDonationId && (
          <p className="mt-2 rounded-lg bg-action-muted px-3 py-2 text-xs text-action">
            Mit bestehender Spende verknüpft — es wird kein neuer Spenden-Eintrag erstellt.
          </p>
        )}

        {annahme.isDonation && !annahme.existingDonationId && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Name Spender:in</label>
              <Input
                type="text"
                value={annahme.donorName}
                onChange={(e) => onChange(prev => ({ ...prev, donorName: e.target.value }))}
                placeholder="Max Muster"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">E-Mail (optional)</label>
              <Input
                type="email"
                value={annahme.donorEmail}
                onChange={(e) => onChange(prev => ({ ...prev, donorEmail: e.target.value }))}
                placeholder="max@example.ch"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-secondary">Notizen (optional)</label>
              <Textarea
                value={annahme.donorNotes}
                onChange={(e) => onChange(prev => ({ ...prev, donorNotes: e.target.value }))}
                rows={2}
                placeholder="z.B. Abgabe am Schalter, mit Netzteil"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
