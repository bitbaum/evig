/**
 * What a signed-in person may do, derived from their `users` row. One rule for
 * both runtimes: the Auth.js jwt callback (src/auth.ts) and the AccountKit
 * session reader (src/lib/auth/shared/compat.ts).
 *
 * Email verification is not a login wall here. It gates only staff powers: an
 * unverified account signs in as a normal user and gains staff/super-admin the
 * moment its address is verified. The DB flag is the sole source of staff
 * status; an email domain grants nothing (src/lib/permissions.ts).
 */
import { ROLES, getInitialStaffPermissions, isSuperAdmin } from '@/lib/constants';

export type DashboardMode = 'coordinator' | 'lead' | 'volunteer';

export interface ClaimSource {
  email?: string | null;
  role?: string | null;
  emailVerified?: Date | string | boolean | null;
  is_staff?: boolean | null;
  staff_permissions?: string[] | null;
  is_super_admin?: boolean | null;
  dashboard_mode?: DashboardMode | null;
}

export interface Claims {
  role: string;
  emailVerified: boolean;
  isStaff: boolean;
  staffPermissions: string[];
  isSuperAdmin: boolean;
  dashboardMode: DashboardMode;
}

export function claimsFor(row: ClaimSource): Claims {
  const email = row.email ?? '';
  const emailVerified = Boolean(row.emailVerified);
  const isStaff = emailVerified ? Boolean(row.is_staff) : false;
  return {
    // Legacy role, kept for older readers: staff → revampit_admin, else customer.
    role: row.role || (isStaff ? ROLES.REVAMPIT_ADMIN : ROLES.CUSTOMER),
    emailVerified,
    isStaff,
    staffPermissions: row.staff_permissions?.length
      ? row.staff_permissions
      : isStaff
        ? getInitialStaffPermissions(email)
        : [],
    isSuperAdmin: emailVerified ? Boolean(row.is_super_admin) || isSuperAdmin(email) : false,
    dashboardMode: row.dashboard_mode ?? 'coordinator',
  };
}
