/** Quelle · Rohtranskript slice — collapsible source transcript view. */

import { FileText } from 'lucide-react'
import type { ProtocolDetail, StructuredNotes } from '@/lib/schemas/protocols'

interface ProtocolTranscriptSourceProps {
  protocol: ProtocolDetail
  notes: StructuredNotes | null
}

export function ProtocolTranscriptSource({ protocol, notes }: ProtocolTranscriptSourceProps) {
  // Parent only renders this when a transcript exists; the guard narrows the type.
  if (!protocol.raw_transcript) return null
  return (
    <details
      className="card-shell"
      open={!notes}
    >
      <summary className="flex items-center gap-2 p-4 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary select-none">
        <FileText className="w-4 h-4 text-text-muted" />
        Quelle · Rohtranskript ({protocol.raw_transcript.length.toLocaleString()} Zeichen)
      </summary>
      <div className="px-4 pb-4">
        <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-96 overflow-y-auto bg-surface-raised rounded-lg p-3 leading-relaxed">
          {protocol.raw_transcript}
        </pre>
      </div>
    </details>
  )
}
