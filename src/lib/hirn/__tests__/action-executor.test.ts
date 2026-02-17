import { isRiskyAction, validateExecuteActionInput } from '../action-executor-contracts'

describe('hirn action executor contracts', () => {
  it('validates supported action payload envelope', () => {
    const parsed = validateExecuteActionInput({
      actionId: 'a1',
      actionType: 'create_task',
      payload: { title: 'Inbox leeren' },
      dryRun: false,
    })

    expect(parsed.success).toBe(true)
  })

  it('blocks unknown action type', () => {
    const parsed = validateExecuteActionInput({
      actionId: 'a1',
      actionType: 'do_magic',
      payload: {},
      dryRun: false,
    })

    expect(parsed.success).toBe(false)
  })

  it('marks product draft as risky', () => {
    expect(isRiskyAction('create_product_draft')).toBe(true)
    expect(isRiskyAction('create_task')).toBe(false)
  })
})
