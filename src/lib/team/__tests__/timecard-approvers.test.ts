/**
 * getTimecardApproverIds — staff with timecards / timecard-approvals permission.
 */

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
}))

import { db } from '@/db'
import { getTimecardApproverIds } from '@/lib/team/timecard-approvers'

describe('getTimecardApproverIds', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns staff ids from the query', async () => {
    const where = jest.fn().mockResolvedValue([{ id: 'a1' }, { id: 'a2' }])
    const from = jest.fn().mockReturnValue({ where })
    ;(db.select as jest.Mock).mockReturnValue({ from })

    const ids = await getTimecardApproverIds('user-submitter')

    expect(ids).toEqual(['a1', 'a2'])
    expect(from).toHaveBeenCalled()
    expect(where).toHaveBeenCalled()
  })
})
