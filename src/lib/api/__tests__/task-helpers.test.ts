import { query } from '@/lib/auth/db'

jest.mock('@/lib/api/helpers', () => ({
  apiBadRequest: jest.fn(),
  apiNotFound: jest.fn(),
}))

jest.mock('@/lib/auth/db', () => ({
  query: jest.fn(),
}))

import { createInAppNotifications } from '@/lib/api/task-helpers'

describe('createInAppNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does nothing when recipient list is empty', async () => {
    await createInAppNotifications({
      recipientIds: [],
      title: 'Titel',
      content: 'Inhalt',
      relatedType: 'task',
      relatedId: 'abc',
    })

    expect(query).not.toHaveBeenCalled()
  })

  it('deduplicates recipient ids and inserts notifications', async () => {
    ;(query as jest.Mock).mockResolvedValue({ rows: [] })

    await createInAppNotifications({
      recipientIds: ['u1', 'u2', 'u1'],
      title: 'Aufgabe',
      content: 'Bitte übernehmen',
      relatedType: 'task',
      relatedId: 'task-1',
    })

    expect(query).toHaveBeenCalledTimes(1)
    const [sql, params] = (query as jest.Mock).mock.calls[0]

    expect(sql).toContain('INSERT INTO')
    expect(sql).toContain('notifications')
    expect(params[0]).toBe('Aufgabe')
    expect(params[1]).toBe('Bitte übernehmen')
    expect(params[2]).toBe('task')
    expect(params[3]).toBe('task-1')
    expect(params[4]).toEqual(['u1', 'u2'])
  })
})
