import { PROTOCOL_WORKFLOW_STEPS, type ProtocolWorkflowStepId } from '@/lib/protocols/workflow'
import Heading from '@/components/ui/Heading'

interface Props {
  currentStepIndex: number
  workflowProgress: {
    nextStepId?: ProtocolWorkflowStepId | null
    ctaHint?: string | null
    ctaLabel?: string | null
  }
  onScrollToStep: (stepId: ProtocolWorkflowStepId) => void
}

export function ProtocolWorkflowStepper({ currentStepIndex, workflowProgress, onScrollToStep }: Props) {
  return (
    <div className="bg-white rounded-lg border p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2} className="text-sm text-gray-900">Workflow</Heading>
        <span className="text-xs text-gray-500">
          Schritt {currentStepIndex + 1} von {PROTOCOL_WORKFLOW_STEPS.length}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {PROTOCOL_WORKFLOW_STEPS.map((step, index) => {
          const isDone = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onScrollToStep(step.id)}
              className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${
                isCurrent
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : isDone
                  ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <p className="font-semibold">{index + 1}. {step.label}</p>
              <p className="text-[11px] opacity-80 mt-1">Zum Schritt springen</p>
            </button>
          )
        })}
      </div>
      {workflowProgress.nextStepId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">Nächster Schritt: {PROTOCOL_WORKFLOW_STEPS.find((step) => step.id === workflowProgress.nextStepId)?.label}</p>
          {workflowProgress.ctaHint && <p className="text-amber-800">{workflowProgress.ctaHint}</p>}
          {workflowProgress.ctaLabel && <p className="text-amber-800">Aktion: {workflowProgress.ctaLabel}</p>}
        </div>
      )}
    </div>
  )
}
