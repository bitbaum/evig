/**
 * getTimecardApproverIds — staff with timecards / timecard-approvals permission.
 */

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

import type { Mock } from 'vitest';
import { db } from '@/db';
import { getTimecardApproverIds } from '@/lib/team/timecard-approvers';

describe('getTimecardApproverIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns staff ids from the query', async () => {
    const where = vi.fn().mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    const from = vi.fn().mockReturnValue({ where });
    (db.select as Mock).mockReturnValue({ from });

    const ids = await getTimecardApproverIds('user-submitter');

    expect(ids).toEqual(['a1', 'a2']);
    expect(from).toHaveBeenCalled();
    expect(where).toHaveBeenCalled();
  });
});
