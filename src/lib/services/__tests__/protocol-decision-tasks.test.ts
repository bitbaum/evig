import {
  buildFollowUpTaskPayload,
  getDecisionOutcomePassed,
} from '../protocol-decision-tasks'

describe('getDecisionOutcomePassed', () => {
  it('returns true for passed thumbs votes', () => {
    expect(getDecisionOutcomePassed({ passed: true, method: 'thumbs_up_down' }, 'thumbs_up_down')).toBe(true)
  })

  it('returns false for rejected thumbs votes', () => {
    expect(getDecisionOutcomePassed({ passed: false, method: 'thumbs_up_down' }, 'thumbs_up_down')).toBe(false)
  })

  it('returns null when outcome is missing', () => {
    expect(getDecisionOutcomePassed(null, 'thumbs_up_down')).toBeNull()
  })
})

describe('buildFollowUpTaskPayload', () => {
  it('prefers action item description and includes protocol context', () => {
    const payload = buildFollowUpTaskPayload({
      decisionTitle: 'Budget freigeben',
      decisionDescription: 'Wir stimmen über das Budget ab.',
      outcomeSummary: 'Angenommen mit Mehrheit.',
      protocolTitle: 'Vorstandssitzung',
      meetingDate: '2026-06-01',
      actionItemDescription: 'Budget für Werkstatt freigeben',
    })

    expect(payload.title).toBe('Budget für Werkstatt freigeben')
    expect(payload.description).toContain('Angenommen mit Mehrheit.')
    expect(payload.description).toContain('Aus Protokoll: Vorstandssitzung')
    expect(payload.description).toContain('Aus Entscheid: Budget freigeben')
  })
})
