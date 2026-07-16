/**
 * Tests for team invitation schemas (invite-by-email + claim-link minting).
 * These guard the write boundary of team onboarding: roles must come from
 * config, addresses must be real emails, names must be present.
 */

import { inviteByEmailSchema, claimInviteSchema } from '../teams'
import { TEAM_ROLES } from '@/config/teams'

describe('inviteByEmailSchema', () => {
  const valid = { name: 'Freddie Mercury', email: 'freddie@revamp-it.ch' }

  it('accepts a valid invite and defaults the role to member', () => {
    const r = inviteByEmailSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.role).toBe(TEAM_ROLES.MEMBER)
  })

  it('accepts every configured role', () => {
    for (const role of Object.values(TEAM_ROLES)) {
      expect(inviteByEmailSchema.safeParse({ ...valid, role }).success).toBe(true)
    }
  })

  it('rejects roles outside the config enum', () => {
    expect(inviteByEmailSchema.safeParse({ ...valid, role: 'ceo' }).success).toBe(false)
  })

  it('rejects invalid email addresses', () => {
    expect(inviteByEmailSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects a missing / too-short name', () => {
    expect(inviteByEmailSchema.safeParse({ email: valid.email }).success).toBe(false)
    expect(inviteByEmailSchema.safeParse({ ...valid, name: 'X' }).success).toBe(false)
  })
})

describe('claimInviteSchema', () => {
  const userId = '4c7c11d1-58a4-4f7a-b4a5-04b6a3f6e9a1'

  it('accepts user_id alone (link-only minting)', () => {
    expect(claimInviteSchema.safeParse({ user_id: userId }).success).toBe(true)
  })

  it('accepts user_id + delivery email', () => {
    expect(claimInviteSchema.safeParse({ user_id: userId, email: 'a@b.ch' }).success).toBe(true)
  })

  it('rejects a non-UUID user_id and a malformed email', () => {
    expect(claimInviteSchema.safeParse({ user_id: 'nope' }).success).toBe(false)
    expect(claimInviteSchema.safeParse({ user_id: userId, email: 'nope' }).success).toBe(false)
  })
})
