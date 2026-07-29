'use client'

// Three-step capture progress indicator (steps config + render extracted verbatim from page.tsx).
import { Check } from 'lucide-react'
import type { useErfassungForm } from '@/components/erfassung/useErfassungForm'

const CAPTURE_STEPS = [
  { number: 1, label: 'Daten eingeben' },
  { number: 2, label: 'KI-Daten prüfen' },
  { number: 3, label: 'Nächsten Schritt wählen' },
] as const

export function CaptureSteps({ form }: { form: ReturnType<typeof useErfassungForm> }) {
  return (
    <ol className="grid grid-cols-3 overflow-hidden rounded-lg border border-default bg-surface-base" aria-label="Erfassungsschritte">
      {CAPTURE_STEPS.map((step, index) => {
        const hasInput = Boolean(form.formData.hersteller || form.formData.produktname)
        const hasRequiredData = Boolean(
          form.formData.hersteller.trim() && form.formData.produktname.trim(),
        )
        const complete = index === 0 ? hasInput : index === 1 ? hasRequiredData : false
        const active = index === 0
          ? !hasInput
          : index === 1
            ? hasInput && !hasRequiredData
            : hasRequiredData
        return (
          <li key={step.number} className={`flex min-w-0 items-center gap-2 border-r border-subtle px-2 py-2.5 text-xs last:border-r-0 sm:px-4 sm:text-sm ${active ? 'bg-action-muted text-action' : 'text-text-secondary'}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active || complete ? 'bg-action text-action-text' : 'bg-surface-overlay text-text-secondary'}`}>
              {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : step.number}
            </span>
            <span className="truncate">{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
