'use client'

/** Finalize confirm dialog slice — names open prerequisites before abschliessen. */

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { pluralDe } from '@/lib/i18n/plural-de'

interface FinalizeBlockers {
  unlinkedTasks: number
  openDecisions: number
  closedDecisionsWithoutTask: number
  unresolvedAssignees: number
  hasAny: boolean
}

interface ProtocolFinalizeDialogProps {
  finalizeBlockers: FinalizeBlockers
  showFinalizeDialog: boolean
  setShowFinalizeDialog: (open: boolean) => void
  finalizing: boolean
  handleFinalize: () => void
}

export function ProtocolFinalizeDialog({
  finalizeBlockers,
  showFinalizeDialog,
  setShowFinalizeDialog,
  finalizing,
  handleFinalize,
}: ProtocolFinalizeDialogProps) {
  return (
    <ConfirmDialog
      isOpen={showFinalizeDialog}
      title="Protokoll abschliessen"
      message="Nach dem Abschliessen kann das Protokoll nicht mehr bearbeitet werden."
      details={finalizeBlockers.hasAny ? (
        <div className="rounded-lg border border-warning-300 bg-warning-50 dark:bg-warning-900/20 dark:border-warning-700/50 p-3 text-sm text-warning-800 dark:text-warning-200">
          <p className="font-medium mb-1.5">Offen vor dem Abschluss:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {finalizeBlockers.unlinkedTasks > 0 && (
              <li>{finalizeBlockers.unlinkedTasks} {pluralDe(finalizeBlockers.unlinkedTasks, 'Aktionspunkt', 'Aktionspunkte')} noch nicht in Aufgaben umgewandelt — nach Abschluss nicht mehr möglich.</li>
            )}
            {finalizeBlockers.openDecisions > 0 && (
              <li>{finalizeBlockers.openDecisions} {pluralDe(finalizeBlockers.openDecisions, 'Entscheidung', 'Entscheidungen')} offen — Abstimmung oder Abschluss fehlt.</li>
            )}
            {finalizeBlockers.closedDecisionsWithoutTask > 0 && (
              <li>{finalizeBlockers.closedDecisionsWithoutTask} {pluralDe(finalizeBlockers.closedDecisionsWithoutTask, 'angenommene Entscheidung', 'angenommene Entscheidungen')} ohne Folgeaufgabe im Aufgaben-System.</li>
            )}
            {finalizeBlockers.unresolvedAssignees > 0 && (
              <li>{finalizeBlockers.unresolvedAssignees} {pluralDe(finalizeBlockers.unresolvedAssignees, 'Personen-Zuordnung', 'Personen-Zuordnungen')} ungeklärt — Aufgaben werden ohne Team-Verknüpfung erstellt.</li>
            )}
          </ul>
        </div>
      ) : undefined}
      confirmLabel={finalizeBlockers.hasAny ? 'Trotzdem abschliessen' : 'Abschliessen'}
      cancelLabel="Abbrechen"
      variant="warning"
      isLoading={finalizing}
      onConfirm={handleFinalize}
      onClose={() => setShowFinalizeDialog(false)}
    />
  )
}
