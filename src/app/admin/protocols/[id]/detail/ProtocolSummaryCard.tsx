/** Zusammenfassung slice — executive overview card. */

import type { StructuredNotes } from '@/lib/schemas/protocols'

interface ProtocolSummaryCardProps {
  notes: StructuredNotes
}

export function ProtocolSummaryCard({ notes }: ProtocolSummaryCardProps) {
  return (
    <div className="bg-surface-base rounded-lg border border-default p-5">
      <h2 className="text-base font-semibold text-text-primary mb-2">
        Zusammenfassung
      </h2>
      <p className="text-text-secondary leading-relaxed">
        {notes.summary}
      </p>
    </div>
  )
}
