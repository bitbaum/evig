import { TASK_LIST_FILTERS, TASK_LIST_DEFAULT_FILTER } from '@/config/tasks'
import { resolveTaskListStatus } from '@/app/admin/tasks/data'

describe('resolveTaskListStatus', () => {
  it('defaults bare landing to action_needed preset', () => {
    expect(resolveTaskListStatus(undefined)).toBe(TASK_LIST_DEFAULT_FILTER)
    expect(resolveTaskListStatus('')).toBe(TASK_LIST_DEFAULT_FILTER)
  })

  it('passes through explicit filters', () => {
    expect(resolveTaskListStatus(TASK_LIST_FILTERS.ALL)).toBe(TASK_LIST_FILTERS.ALL)
    expect(resolveTaskListStatus('needs_attention')).toBe('needs_attention')
    expect(resolveTaskListStatus('requested')).toBe('requested')
  })
})
