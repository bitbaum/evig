import { describe, expect, it } from 'vitest';
import { claimsFor } from '../claims';

describe('claimsFor', () => {
  it('withholds staff and super-admin until the address is verified', () => {
    const row = { email: 'a@example.test', is_staff: true, is_super_admin: true };
    expect(claimsFor(row)).toMatchObject({
      emailVerified: false,
      isStaff: false,
      isSuperAdmin: false,
      staffPermissions: [],
      role: 'customer',
    });
    expect(claimsFor({ ...row, emailVerified: '2026-11-01T00:00:00Z' })).toMatchObject({
      emailVerified: true,
      isStaff: true,
      isSuperAdmin: true,
      role: 'revampit_admin',
    });
  });

  it('keeps explicit permissions, a stored role and the dashboard mode', () => {
    expect(
      claimsFor({
        email: 'b@example.test',
        emailVerified: new Date(),
        is_staff: true,
        staff_permissions: ['finance'],
        role: 'editor',
        dashboard_mode: 'lead',
      }),
    ).toMatchObject({ staffPermissions: ['finance'], role: 'editor', dashboardMode: 'lead' });
  });

  it('gives a plain account nothing and the coordinator dashboard', () => {
    expect(claimsFor({})).toEqual({
      role: 'customer',
      emailVerified: false,
      isStaff: false,
      staffPermissions: [],
      isSuperAdmin: false,
      dashboardMode: 'coordinator',
    });
  });
});
