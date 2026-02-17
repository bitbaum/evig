import { getProtocolWorkflowStep, getProtocolWorkflowProgress } from '../workflow'

describe('protocol workflow mapping', () => {
  it('maps statuses to workflow steps for list rendering', () => {
    expect(getProtocolWorkflowStep('draft')).toBe('input')
    expect(getProtocolWorkflowStep('processing')).toBe('ai')
    expect(getProtocolWorkflowStep('review')).toBe('review')
    expect(getProtocolWorkflowStep('finalized')).toBe('done')
  })

  it('returns task-oriented CTA during review with unlinked tasks', () => {
    const progress = getProtocolWorkflowProgress({
      status: 'review',
      hasStructuredNotes: true,
      unlinkedTaskCount: 2,
    })

    expect(progress.currentStepId).toBe('review')
    expect(progress.nextStepId).toBe('tasks')
    expect(progress.ctaLabel).toBe('Aufgaben erstellen')
    expect(progress.ctaHint).toContain('2 Aufgabe')
  })

  it('returns done step without next action for finalized protocols', () => {
    const progress = getProtocolWorkflowProgress({
      status: 'finalized',
      hasStructuredNotes: true,
      unlinkedTaskCount: 0,
    })

    expect(progress.currentStepId).toBe('done')
    expect(progress.nextStepId).toBeNull()
    expect(progress.ctaLabel).toBeNull()
  })
})
